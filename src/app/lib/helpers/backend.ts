import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseApiKey = process.env.SUPABASE_SECRET_API_KEY!;
if (!supabaseUrl || !supabaseApiKey) {
    throw new Error('SUPABASE_URL and SUPABASE_API_KEY must be defined in the environment variables.');
}
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseApiKey);

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib')

// Generation Model and Embeddings Model
const openai_api_key = process.env.OPENAI_API_KEY!
const database_history_table = process.env.DATABASE_CHAT_HISTORY!
const database_embeddings_table = process.env.DATABASE_EMBEDDINGS_TABLE!
const database_embeds_files_table = process.env.DATABASE_EMBEDDINGS_FILES_TABLE!

import OpenAI from "openai";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers"
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { messagePayload } from "../payloadsInterfaces/payload";
import { connectToDatabase } from "../database/supabase";
import { RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { log } from "console";


const openai = new OpenAI({ apiKey: openai_api_key });
const embeddings = new OpenAIEmbeddings({ apiKey: openai_api_key, model: 'text-embedding-3-small' });

const checkEmbeddingPayload = async (fileName: string): Promise<Boolean> => {
    try {
        const res = await supabase.from(database_embeddings_table).select('*').eq('file_name', fileName)
        if (res.count === 0) {
            return true
        }
        return false
    } catch (error) {
        console.error("Error in extracting checkPayload")
        return false
    }
}

export const sendMessagePayload = async (session_id: string, payload: messagePayload): Promise<void> => {
    await supabase.from(database_history_table).insert([{ session_id, title: payload.title, payload: payload.content }])
}

export const extractInformation = async (): Promise<void> => {
    try {
        //All those files whose embeddings are required should be placed inside the public/assets folder
        const assetsFolder = path.resolve('./public/assets');
        const files: string[] = fs.readdirSync(assetsFolder);
        console.log(files)

        let response: string = "";
        let responseArray: string[] = [];


        //Now reading information from each file
        for (let file in files) {
                const filePath: string = path.join(assetsFolder, files[file]);
                // const fpath = JSON.stringify({ filePath });
                console.log("FilePath,,", filePath)

                //Api call to extract information from the file
                response = await fetch('http://localhost:3000/api/extract', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({filePath}),
                }).then(response => {
                    if (response.ok) {
                        return response.json().then(items => items.data)
                    } else return ""
                })

                if (!response || response.length === 0) throw new Error(`Error in extractInformation method`);

                responseArray.push(response)
        }

        console.log("RESPONSE_ARRAY: ", responseArray)

        {
            // From here since we got our required response string, now using langchain tools for text splitting and uploading to supabase vector store
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 600,
                separators: ['\n\n', '\n', ' ', ''],
                chunkOverlap: 120
            })
            const output = await splitter.createDocuments(responseArray)

            await SupabaseVectorStore.fromDocuments(
                output,
                new OpenAIEmbeddings({ openAIApiKey: openai_api_key , model: 'text-embedding-3-small'}),
                {
                    client: await connectToDatabase(),
                    tableName: database_embeddings_table
                }
            )

            console.log("OUTPUT:  ",output);
        }

    } catch (error) {
        throw new Error(`Error in extractInformation method: ${error}`);
    }
}


const llm = new ChatOpenAI();

export const openAIPromptGen = async (message: string, sessionId: string): Promise<string> => {
    try {
        const vectorStore = new SupabaseVectorStore(embeddings, {
            client: await connectToDatabase(),
            tableName: database_embeddings_table,
            queryName: 'match_documents'
        })


        const retriever = vectorStore.asRetriever()

        const standalonequestionTemplate =
        `Given some conversation history (if any) and a question, convert the question to a standalone question.
        conversation history: {conv_history}
        question: {message}
        standalone question:`

        const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standalonequestionTemplate)

        const answerTemplate: string = `
        You are an enthusiastic and helpful bot who can answer a given question about the User Guide based on the context provided adn the conversation history.
        If the answer is not given in the context, try to find the answer in the conversation history if possible. 
        If you really don't know the answer, say "I'm sorry, I don't know the answer to that question." and direct the questioner to email ${company}. 
        Don't try to make an answer. Always speak as if you were chatting to a friend.
        conversation history: {conv_history}
        context: {context}
        question: {question}
        answer:`

        const answerPrompt = PromptTemplate.fromTemplate(answerTemplate)

        const standaloneQuestionChain = standaloneQuestionPrompt.pipe(llm).pipe(new StringOutputParser())
        const retrieverChain = RunnableSequence.from([
            prevResult => prevResult.standalone_question,
            retriever,
            combineDocs
        ]);

        const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser())

        const chain = RunnableSequence.from([
            {
                standalone_question: standaloneQuestionChain,
                original_input: new RunnablePassthrough()
            },
            async ({ standalone_question, original_input }) => {
                console.log("Standalone Question:", standalone_question);
                return { standalone_question, original_input };
            },
            {
                context: retrieverChain,
                question: ({ original_input }) => original_input.message,
                conv_history: ({ original_input }) => original_input.conv_history
            },
            async ({ context, question, conv_history }) => {
                console.log("\nContext from Retriever:", context);
                console.log("\nQuestion:", question);
                console.log("\nConversation History:", conv_history);
                return { context, question, conv_history };
            },
            answerChain,
            async (response) => {
                console.log("\nAnswer Chain Response:", response);
                return response;
            }
        ]);


        const response = await chain.invoke({ message, conv_history: await formatCoversationHistory(await retrieveChatHistory(sessionId)) })

        return response;
    } catch (error) {
        console.error("Error in OpenAIPromptGen method: ", error)
        return ""
    }
}

const combineDocs = (docs: any[]) => {
    return docs.map((doc) => doc.pageContent).join('\n\n');
}

const company = process.env.COMPANY!

async function formatCoversationHistory(messages: any[]) {
    return messages.map((message, index) => {
        if (message.title === 'Query') {
            return `Human: ${message.payload}`
        } else return `AI: ${message}`
    }).join('\n');
}

async function retrieveChatHistory(sessionId: string) {
    const response = await supabase.from(database_history_table).select('*').eq('session_id', sessionId)
    if (!response.data) {
        return []
    }
    return response.data
}



import { NextRequest, NextResponse } from 'next/server';
import { extractInformation, openAIPromptGen, sendMessagePayload } from '@/app/lib/helpers/backend';
import { generateToken, verifyToken } from "../../lib/jwtMiddleware";
import { NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { createEmbeddingsTableIfNotExists } from '@/app/lib/database/models/embeddings.model';
import { createSessionTableIfNotExists } from '@/app/lib/database/models/session.model';

export async function POST(req: NextRequest, res: NextApiResponse) {
    try {
        const body = await req.text();
        const { message, userId, sessionid } = JSON.parse(body)

        if (!message) return NextResponse.json({ status: 400, message: "No message from user is obtained" });

        {/*
            await createSessionTableIfNotExists()
            await createEmbeddingsTableIfNotExists()
        */}

        console.log("\nTag1\n")

        {   // Information Extraction from files in public/assets folder and Embeddings creation and storage, in case we got new files
            //await extractInformation();
        }

        console.log("\nTag2\n")

        let sessionId: string = ''
        let response:string = ''

        if (!userId) {
            //This case is simply for those users who are authenticated from the frontend
            sessionId = await generateToken(Date.now().toString())
        } else {
            sessionId = await generateToken(userId)
        }

        console.log("\nTag3\n")
        console.log("Session Id", sessionId)

        {   // User Response Handling
            await sendMessagePayload(sessionId, { title: 'Query', content: message });
        }

        console.log("\nTag4\n")

        {   // Prompt Handler and Standalone question generator
            response = await openAIPromptGen(message, sessionId)
        }

        console.log("\nTag5\n")

        {   //GPT Response Handling
            await sendMessagePayload(sessionId, {title: 'GPT', content: response})
        }

        console.log("\nTag6\n")

        return NextResponse.json({ status: 200, message: sessionId });
    } catch (error) {
        console.error("Error in POST handler:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
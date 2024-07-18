import { connectToDatabase } from "../supabase";

const embeddings_data = process.env.DATABASE_EMBEDDINGS_TABLE!;

export const createEmbeddingsTableIfNotExists = async() => {
    const sql = `
        -- Enable the pgvector extension to work with embedding vectors
        create extension vector;

        -- Create a table to store your documents
        create table if not exists ${embeddings_data} (
        id bigserial primary key,
        content text, -- corresponds to Document.pageContent
        metadata jsonb, -- corresponds to Document.metadata
        embedding vector(1536) -- 1536 works for OpenAI embeddings, change if needed
        );

        -- Create a function to search for documents
        create function match_documents (
        query_embedding vector(1536),
        match_count int DEFAULT null,
        filter jsonb DEFAULT '{}'
        ) returns table (
        id bigint,
        content text,
        metadata jsonb,
        embedding jsonb,
        similarity float
        )
        language plpgsql
        as $$
        #variable_conflict use_column
        begin
        return query
        select
            id,
            content,
            metadata,
            (embedding::text)::jsonb as embedding,
            1 - (documents.embedding <=> query_embedding) as similarity
        from ${embeddings_data}
        where metadata @> filter
        order by documents.embedding <=> query_embedding
        limit match_count;
        end;
        $$;`

    const supabase = connectToDatabase();

    const { error } = await (await supabase).rpc('execute_sql',{sql});

    if (error) {
        console.error('Error creating table:', error);
    } else {
        console.log('Table created or already exists');
    }
}

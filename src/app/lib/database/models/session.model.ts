import { connectToDatabase } from "../supabase";

const rag_history = process.env.DATABASE_CHAT_HISTORY!;

export const createSessionTableIfNotExists = async() => {
    const sql = `
    CREATE TABLE IF NOT EXISTS ${rag_history} (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        title TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_movies_images_updated_at
        BEFORE UPDATE ON ${rag_history}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    const supabase = connectToDatabase();

    const { error } = await (await supabase).rpc('execute_sql',{sql});

    if (error) {
        console.error('Error creating table:', error);
    } else {
        console.log('Table created or already exists');
    }
}

import { connectToDatabase } from "@/app/lib/database/supabase";
import { verifyToken } from "@/app/lib/jwtMiddleware";
import { SupabaseClient } from "@supabase/supabase-js";
import { NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
const database_history_table = process.env.DATABASE_CHAT_HISTORY!

export async function DELETE(req: NextRequest, res: NextApiResponse) {
    try {
        const supabase: SupabaseClient = await connectToDatabase();
        const body = await req.text();
        const {sessionId} = JSON.parse(body)
        const token = sessionId
        if (token) {
            console.log("Token", token)
            const payload = await verifyToken(token.toString())
            console.log("Payload", payload);

            if (payload) {
                const { data, error } = await supabase
                    .from(database_history_table)
                    .delete()
                    .eq('sessionId', payload.sessionId);

                if (error) {
                    throw error;
                }

                return NextResponse.json({ status: 201, message: "Deleted Successfully" })
            }
            return NextResponse.json({ status: 202, message: "Token not verfied" })
        }
        return NextResponse.json({ status: 203, message: "No token found" })
    } catch (error) {
        console.error("Error in POST handler:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
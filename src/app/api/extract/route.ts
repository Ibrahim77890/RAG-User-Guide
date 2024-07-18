import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export async function POST(req: NextRequest, res: NextApiResponse) {
    try {
        const body = await req.text();
        console.log("Body::",req.body)
        const { filePath } = JSON.parse(body); // Assuming body contains the file path

        console.log("File Path: ", filePath);

        if (!filePath) {
            return NextResponse.json({ status: 400, message: 'File Path is required' });
        }

        // Check if the file path is valid
        if (!fs.existsSync(filePath)) {
            console.error("File does not exist:", filePath);
            return NextResponse.json({ status: 400, message: 'File does not exist' });
        }

        const loader = new PDFLoader(filePath, { splitPages: false, parsedItemSeparator: "" });
        const docs = await loader.load();

        console.log("DOCS: ", docs)

        return NextResponse.json({status: 200, data: docs[0].pageContent})

    } catch (error) {
        console.error("Error in POST handler:", error);
        return NextResponse.json({ status: 500, message: 'Internal Server Error' });
    }
}

import { NextRequest, NextResponse } from "next/server";
// import Poppler from "pdf-images";
// import { exportImages, exportImagesEvents, Image } from 'pdf-export-images'
// import {pdfjs} from "react-pdf"

// pdfjs.GlobalWorkerOptions.workerSrc="/pdf.worker.mjs"

export async function POST(req:NextRequest, res:NextResponse) {
    try {
        const body = await req.text();
        const { filePath } = JSON.parse(body);

        if(!filePath) return NextResponse.json({status: 400})

            // const result = Poppler.convert(filePath, 'public/images', 'Nig');
            // console.log("Result: ", result)
        // exportImages(filePath, 'public/images')
        //     .then((images) => console.log('Exported', images.length, 'images'))
        //     .catch(console.error)


        return NextResponse.json({status: 200})

    } catch (error) {
        return NextResponse.json({status: 500})
    }
}
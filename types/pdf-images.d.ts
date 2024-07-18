declare module 'pdf-images' {
    interface InfoObject {
        pdfPath: string;
        outputImagesDirectory?: string;
        images?: string[];
        success?: boolean;
        error?: Error;
    }

    class Poppler {
        /**
         * Extracts all the images from a PDF and writes them to a directory.
         * @param pdfPath - Path of the PDF to extract images from.
         * @param outputImgDir - The output image directory.
         * @param outputImgName - The prefix image name of all the images extracted.
         * @param outputImgExtension - The extension of the output images (default is 'png').
         * @returns {InfoObject} - An object containing the output image directory and an array of image paths, or an error object if extraction failed.
         */
        static convert(
            pdfPath: string,
            outputImgDir: string,
            outputImgName: string,
            outputImgExtension?: string
        ): InfoObject;
    }

    export default Poppler;
}

declare module 'pdf-image-extractor' {
    interface ImageData {
      blob: Blob;
      url: string;
      type: string;
      imageType: string;
    }
  
    interface ExtractImagesOptions {
      pdf: Blob;
      fileType: 'url' | 'blob';
    }
  
    function ExtractImages(options: ExtractImagesOptions): Promise<ImageData[]>;
  
    export { ExtractImages, ImageData, ExtractImagesOptions };
  }
  
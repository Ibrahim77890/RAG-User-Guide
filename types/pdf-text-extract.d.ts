// pdf-text-extract.d.ts
declare module 'pdf-text-extract' {
    interface Options {
      firstPage?: number;
      lastPage?: number;
      resolution?: number;
      crop?: {
        x: number;
        y: number;
        w: number;
        h: number;
      };
      layout?: 'layout' | 'raw' | 'htmlmeta';
      encoding?: 'UCS-2' | 'ASCII7' | 'Latin1' | 'UTF-8' | 'ZapfDingbats' | 'Symbol';
      eol?: 'unix' | 'dos' | 'mac';
      ownerPassword?: string;
      userPassword?: string;
      splitPages?: boolean;
    }
  
    interface ExtractResult {
      pages: string[];
    }
  
    interface PdfTextExtract {
      (filePath: string, options: Options, cb: (err: Error | null, pages: string[]) => void): void;
      prototype: {
        then(resolve: (value: any) => void, reject?: (reason?: any) => void): Promise<any>;
      };
    }
  
    const pdfTextExtract: PdfTextExtract;
    export = pdfTextExtract;
  }
  
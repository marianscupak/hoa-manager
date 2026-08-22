export interface DocumentStoragePort {
  isConfigured(): boolean;
  presignPut(
    objectKey: string,
    contentType: string,
    sizeBytes: number,
  ): Promise<string>;
  presignGet(objectKey: string, fileName: string): Promise<string>;
  head(objectKey: string): Promise<{ sizeBytes: number } | null>;
  delete(objectKey: string): Promise<void>;
}

export const DOCUMENT_STORAGE = Symbol('DOCUMENT_STORAGE');

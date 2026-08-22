import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

import { ConfigService } from '@/infrastructure/config/config.service';
import { DocumentStorageNotConfiguredException } from '@/shared/application/exceptions/vote.exceptions';

import { type DocumentStoragePort } from '../../application/ports/document-storage.port';

const UPLOAD_URL_TTL_SECONDS = 600;
const DOWNLOAD_URL_TTL_SECONDS = 120;

@Injectable()
export class R2DocumentStorageService implements DocumentStoragePort {
  private readonly client: S3Client | null;
  private readonly bucket: string | null;

  constructor(config: ConfigService) {
    const endpoint = config.get('R2_UPLOADS_ENDPOINT');
    const bucket = config.get('R2_UPLOADS_BUCKET');
    const accessKeyId = config.get('R2_UPLOADS_ACCESS_KEY_ID');
    const secretAccessKey = config.get('R2_UPLOADS_SECRET_ACCESS_KEY');

    if (endpoint && bucket && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
      });
      this.bucket = bucket;
    } else {
      this.client = null;
      this.bucket = null;
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async presignPut(
    objectKey: string,
    contentType: string,
    sizeBytes: number,
  ): Promise<string> {
    const { client, bucket } = this.require();
    return getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ContentType: contentType,
        ContentLength: sizeBytes,
      }),
      {
        expiresIn: UPLOAD_URL_TTL_SECONDS,
        signableHeaders: new Set(['content-type', 'content-length']),
      },
    );
  }

  async presignGet(objectKey: string, fileName: string): Promise<string> {
    const { client, bucket } = this.require();
    return getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ResponseContentDisposition: buildContentDisposition(fileName),
      }),
      { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
    );
  }

  async head(objectKey: string): Promise<{ sizeBytes: number } | null> {
    const { client, bucket } = this.require();
    try {
      const result = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: objectKey }),
      );
      return { sizeBytes: result.ContentLength ?? 0 };
    } catch (error: unknown) {
      if (isNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  async delete(objectKey: string): Promise<void> {
    const { client, bucket } = this.require();
    await client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }),
    );
  }

  private require(): { client: S3Client; bucket: string } {
    if (!this.client || !this.bucket) {
      throw new DocumentStorageNotConfiguredException();
    }
    return { client: this.client, bucket: this.bucket };
  }
}

function isNotFound(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const named = error as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };
  return named.name === 'NotFound' || named.$metadata?.httpStatusCode === 404;
}

/**
 * ASCII fallback in `filename` plus RFC 5987 `filename*` for the original
 * (possibly Czech) name. Quotes stripped from the fallback to keep the
 * header well-formed.
 */
function buildContentDisposition(fileName: string): string {
  const fallback = fileName.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, "'");
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

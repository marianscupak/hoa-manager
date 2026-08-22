import { ConfigService } from '@/infrastructure/config/config.service';
import { DocumentStorageNotConfiguredException } from '@/shared/application/exceptions/vote.exceptions';

import { R2DocumentStorageService } from './r2-document-storage.service';

function fakeConfig(values: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

const CONFIGURED = {
  R2_UPLOADS_ENDPOINT: 'https://account.eu.r2.cloudflarestorage.com',
  R2_UPLOADS_BUCKET: 'hoa-manager-uploads',
  R2_UPLOADS_ACCESS_KEY_ID: 'test-key',
  R2_UPLOADS_SECRET_ACCESS_KEY: 'test-secret',
};

describe('R2DocumentStorageService', () => {
  it('reports unconfigured and throws from presign when env group is absent', async () => {
    const service = new R2DocumentStorageService(fakeConfig({}));
    expect(service.isConfigured()).toBe(false);
    await expect(
      service.presignPut('k', 'application/pdf', 10),
    ).rejects.toThrow(DocumentStorageNotConfiguredException);
  });

  it('presigns a PUT URL containing the object key and signature', async () => {
    const service = new R2DocumentStorageService(fakeConfig(CONFIGURED));
    const url = await service.presignPut(
      'tenants/t1/votes/v1/d1',
      'application/pdf',
      1024,
    );
    expect(url).toContain('tenants/t1/votes/v1/d1');
    expect(url).toContain('X-Amz-Signature=');
    expect(url).toContain('hoa-manager-uploads');
  });

  it('presigns a GET URL with attachment content disposition', async () => {
    const service = new R2DocumentStorageService(fakeConfig(CONFIGURED));
    const url = await service.presignGet(
      'tenants/t1/votes/v1/d1',
      'budget 2026.pdf',
    );
    expect(url).toContain('response-content-disposition=');
    expect(url).toContain('X-Amz-Signature=');
  });
});

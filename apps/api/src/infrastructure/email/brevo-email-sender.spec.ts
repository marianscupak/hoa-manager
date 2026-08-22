import { ConfigService } from '@/infrastructure/config/config.service';
import { BrevoEmailSender } from '@/infrastructure/email/brevo-email-sender';

function fakeConfig(values: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

const CONFIGURED = {
  BREVO_API_KEY: 'xkeysib-test',
  EMAIL_FROM: 'noreply@example.cz',
  EMAIL_FROM_NAME: 'Portál SVJ',
};

function okResponse(): Response {
  return { ok: true, status: 201 } as Response;
}

describe('BrevoEmailSender', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue(okResponse());
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('posts the invite email to the Brevo API with the api key header', async () => {
    const sender = new BrevoEmailSender(fakeConfig(CONFIGURED));
    await sender.sendOwnerInvite(
      'owner@example.cz',
      'https://hoa.example.cz/invites/owner?token=abc',
      'SVJ Květná 12',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'api-key': 'xkeysib-test',
      'content-type': 'application/json',
    });

    const body = JSON.parse(init.body as string);
    expect(body.sender).toEqual({
      name: 'Portál SVJ',
      email: 'noreply@example.cz',
    });
    expect(body.to).toEqual([{ email: 'owner@example.cz' }]);
    expect(body.subject).toContain('SVJ Květná 12');
    expect(body.htmlContent).toContain(
      'https://hoa.example.cz/invites/owner?token=abc',
    );
    expect(body.textContent).toContain(
      'https://hoa.example.cz/invites/owner?token=abc',
    );
  });

  it('falls back to the default sender name when EMAIL_FROM_NAME is unset', async () => {
    const sender = new BrevoEmailSender(
      fakeConfig({ ...CONFIGURED, EMAIL_FROM_NAME: undefined }),
    );
    await sender.sendOwnerInvite('owner@example.cz', 'https://x.cz/i', 'SVJ');

    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.sender).toEqual({
      name: 'HOA Manager',
      email: 'noreply@example.cz',
    });
  });

  it('throws with status and response body when Brevo rejects the request', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('{"message":"Key not found"}'),
    } as unknown as Response);

    const sender = new BrevoEmailSender(fakeConfig(CONFIGURED));
    await expect(
      sender.sendOwnerInvite('owner@example.cz', 'https://x.cz/i', 'SVJ'),
    ).rejects.toThrow(/401.*Key not found/);
  });
});

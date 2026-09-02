import { ConfigService } from '@/infrastructure/config/config.service';
import { BrevoEmailSender } from '@/infrastructure/email/brevo-email-sender';
import type { OutgoingEmail } from '@/infrastructure/email/email-sender.port';

function fakeConfig(values: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

const CONFIGURED = {
  BREVO_API_KEY: 'xkeysib-test',
  EMAIL_FROM: 'noreply@example.cz',
  EMAIL_FROM_NAME: 'Portál SVJ',
};

const MESSAGE: OutgoingEmail = {
  to: 'owner@example.cz',
  subject: 'Pozvánka do portálu SVJ Květná 12',
  html: '<p><a href="https://hoa.example.cz/invites/owner?token=abc">Přijmout</a></p>',
  text: 'Odkaz: https://hoa.example.cz/invites/owner?token=abc',
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

  it('posts the message to the Brevo API with the api key header', async () => {
    const sender = new BrevoEmailSender(fakeConfig(CONFIGURED));
    await sender.send(MESSAGE);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'api-key': 'xkeysib-test',
      'content-type': 'application/json',
    });

    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      sender: { name: 'Portál SVJ', email: 'noreply@example.cz' },
      to: [{ email: 'owner@example.cz' }],
      subject: MESSAGE.subject,
      htmlContent: MESSAGE.html,
      textContent: MESSAGE.text,
    });
  });

  it('falls back to the default sender name when EMAIL_FROM_NAME is unset', async () => {
    const sender = new BrevoEmailSender(
      fakeConfig({ ...CONFIGURED, EMAIL_FROM_NAME: undefined }),
    );
    await sender.send(MESSAGE);

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
    await expect(sender.send(MESSAGE)).rejects.toThrow(/401.*Key not found/);
  });
});

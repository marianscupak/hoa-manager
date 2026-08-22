import { buildOwnerInviteEmail } from '@/infrastructure/email/owner-invite-email';

const LINK = 'https://hoa.example.cz/invites/owner?token=abc123';
const TENANT = 'SVJ Květná 12';

describe('buildOwnerInviteEmail', () => {
  it('puts the tenant name in the subject', () => {
    const email = buildOwnerInviteEmail(LINK, TENANT);
    expect(email.subject).toContain(TENANT);
  });

  it('links the invite URL in the HTML body', () => {
    const email = buildOwnerInviteEmail(LINK, TENANT);
    expect(email.html).toContain(`href="${LINK}"`);
    expect(email.html).toContain(TENANT);
  });

  it('includes the invite URL and expiry in the plain-text body', () => {
    const email = buildOwnerInviteEmail(LINK, TENANT);
    expect(email.text).toContain(LINK);
    expect(email.text).toContain('72 hodin');
  });

  it('escapes HTML in the tenant name', () => {
    const email = buildOwnerInviteEmail(LINK, 'A & B <script>');
    expect(email.html).toContain('A &amp; B &lt;script&gt;');
    expect(email.html).not.toContain('<script>');
  });
});

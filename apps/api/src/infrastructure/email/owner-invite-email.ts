export interface OwnerInviteEmail {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildOwnerInviteEmail(
  inviteLink: string,
  tenantName: string,
): OwnerInviteEmail {
  const safeTenantName = escapeHtml(tenantName);

  const subject = `Pozvánka do portálu ${tenantName}`;

  const html = `<div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
  <h2 style="font-size: 20px;">Pozvánka do portálu ${safeTenantName}</h2>
  <p>Dobrý den,</p>
  <p>byli jste pozváni do portálu společenství <strong>${safeTenantName}</strong>. Kliknutím na tlačítko níže dokončíte registraci svého účtu.</p>
  <p style="margin: 24px 0;">
    <a href="${inviteLink}" style="background-color: #1a56db; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Přijmout pozvánku</a>
  </p>
  <p>Pokud tlačítko nefunguje, zkopírujte do prohlížeče tento odkaz:<br>
  <a href="${inviteLink}">${inviteLink}</a></p>
  <p style="color: #6b7280; font-size: 14px;">Platnost odkazu vyprší za 72 hodin. Pokud jste pozvánku neočekávali, tento e-mail můžete ignorovat.</p>
</div>`;

  const text = `Dobrý den,

byli jste pozváni do portálu společenství ${tenantName}. Registraci svého účtu dokončíte na tomto odkazu:

${inviteLink}

Platnost odkazu vyprší za 72 hodin. Pokud jste pozvánku neočekávali, tento e-mail můžete ignorovat.`;

  return { subject, html, text };
}

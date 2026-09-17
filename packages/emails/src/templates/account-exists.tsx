import { EmailButton } from "../components/email-button";
import { EmailHeading } from "../components/email-heading";
import { EmailLayout } from "../components/email-layout";
import { EmailText } from "../components/email-text";
import { LinkFallback } from "../components/link-fallback";

export interface AccountExistsEmailProps {
    loginLink: string;
}

export const accountExistsSubject = (): string =>
    "Účet s touto adresou už existuje";

export default function AccountExistsEmail(p: AccountExistsEmailProps) {
    return (
        <EmailLayout
            preview="Na tuto adresu už účet existuje"
            footerNote="Tento e-mail jste obdrželi, protože se někdo pokusil zaregistrovat s touto adresou. Pokud jste to nebyli vy, nemusíte nic dělat — váš účet zůstal beze změny."
        >
            <EmailHeading>Účet s touto adresou už existuje</EmailHeading>
            <EmailText>Dobrý den,</EmailText>
            <EmailText>
                někdo se právě pokusil zaregistrovat s vaší e-mailovou adresou.
                Účet na ni už máte, takže jsme žádný nový nezakládali.
            </EmailText>
            <EmailText>
                Pokud jste to byli vy, přihlaste se svým heslem nebo přes
                Google.
            </EmailText>
            <EmailButton href={p.loginLink}>Přejít k přihlášení</EmailButton>
            <LinkFallback url={p.loginLink} />
        </EmailLayout>
    );
}

/** Sample data for `pnpm --filter @hoa-mngr/emails preview`. Not used at runtime. */
AccountExistsEmail.PreviewProps = {
    loginLink: "https://hoa.example.cz/login",
} satisfies AccountExistsEmailProps;

import { EmailHeading } from "../components/email-heading";
import { EmailLayout } from "../components/email-layout";
import { EmailText } from "../components/email-text";

export interface VerificationCodeEmailProps {
    code: string;
    expiresInMinutes: number;
}

export const verificationCodeSubject = (
    p: VerificationCodeEmailProps,
): string => `Ověřovací kód ${p.code}`;

export default function VerificationCodeEmail(p: VerificationCodeEmailProps) {
    return (
        <EmailLayout
            preview={`Váš ověřovací kód je ${p.code}`}
            footerNote="Tento e-mail jste obdrželi, protože se někdo pokusil zaregistrovat s touto adresou. Pokud jste to nebyli vy, můžete ho ignorovat — bez kódu se účet nezaloží."
        >
            <EmailHeading>Potvrďte svou e-mailovou adresu</EmailHeading>
            <EmailText>Dobrý den,</EmailText>
            <EmailText>
                pro dokončení registrace zadejte v portálu tento kód:
            </EmailText>
            <EmailText
                style={{
                    fontSize: "32px",
                    fontWeight: 700,
                    letterSpacing: "8px",
                    textAlign: "center",
                    margin: "24px 0",
                }}
            >
                {p.code}
            </EmailText>
            <EmailText variant="muted" style={{ margin: 0 }}>
                Platnost kódu vyprší za {p.expiresInMinutes} minut.
            </EmailText>
        </EmailLayout>
    );
}

/** Sample data for `pnpm --filter @hoa-mngr/emails preview`. Not used at runtime. */
VerificationCodeEmail.PreviewProps = {
    code: "042137",
    expiresInMinutes: 15,
} satisfies VerificationCodeEmailProps;

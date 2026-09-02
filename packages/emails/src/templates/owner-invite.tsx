import { EmailButton } from "../components/email-button";
import { EmailHeading } from "../components/email-heading";
import { EmailLayout } from "../components/email-layout";
import { EmailText } from "../components/email-text";
import { LinkFallback } from "../components/link-fallback";

export interface OwnerInviteEmailProps {
    tenantName: string;
    inviteLink: string;
    expiresInHours: number;
}

export const ownerInviteSubject = (p: OwnerInviteEmailProps): string =>
    `Pozvánka do portálu ${p.tenantName}`;

export default function OwnerInviteEmail(p: OwnerInviteEmailProps) {
    return (
        <EmailLayout
            preview={`Dokončete registraci do portálu ${p.tenantName}`}
            footerNote="Tento e-mail jste obdrželi, protože vás správce společenství pozval do portálu. Pokud jste pozvánku neočekávali, můžete ho ignorovat."
        >
            <EmailHeading>Pozvánka do portálu {p.tenantName}</EmailHeading>
            <EmailText>Dobrý den,</EmailText>
            <EmailText>
                byli jste pozváni do portálu společenství{" "}
                <strong>{p.tenantName}</strong>. Kliknutím na tlačítko níže
                dokončíte registraci svého účtu.
            </EmailText>
            <EmailButton href={p.inviteLink}>Přijmout pozvánku</EmailButton>
            <LinkFallback url={p.inviteLink} />
            <EmailText variant="muted" style={{ margin: 0 }}>
                Platnost odkazu vyprší za {p.expiresInHours} hodin.
            </EmailText>
        </EmailLayout>
    );
}

/** Sample data for `pnpm --filter @hoa-mngr/emails preview`. Not used at runtime. */
OwnerInviteEmail.PreviewProps = {
    tenantName: "SVJ Květná 12",
    inviteLink: "https://hoa.example.cz/invites/owner?token=preview-token",
    expiresInHours: 72,
} satisfies OwnerInviteEmailProps;

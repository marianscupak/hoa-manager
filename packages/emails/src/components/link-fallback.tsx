import { Link } from "@react-email/components";

import { colors } from "../theme";
import { EmailText } from "./email-text";

export interface LinkFallbackProps {
    url: string;
}

export function LinkFallback({ url }: LinkFallbackProps) {
    return (
        <EmailText variant="muted" style={{ margin: "0 0 16px" }}>
            Pokud tlačítko nefunguje, zkopírujte do prohlížeče tento odkaz:
            <br />
            <Link
                href={url}
                style={{ color: colors.primary, wordBreak: "break-all" }}
            >
                {url}
            </Link>
        </EmailText>
    );
}

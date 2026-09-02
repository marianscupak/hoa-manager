import {
    Body,
    Column,
    Container,
    Head,
    Html,
    Preview,
    Row,
    Section,
    Text,
} from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

import { colors, fonts, layout, PRODUCT_NAME, radii } from "../theme";

export interface EmailLayoutProps {
    /** Preheader shown next to the subject in inbox lists; excluded from plain text. */
    preview: string;
    /** "Why you received this" line in the footer. */
    footerNote?: string;
    children: ReactNode;
}

/** Google Fonts static file for Nunito 700 (latin). Clients without web-font support fall back. */
const NUNITO_700_WOFF2 =
    "https://fonts.gstatic.com/s/nunito/v32/XRXI3I6Li01BKofiOc5wtlZ2di8HDFwmdTQ3j6zbXWjgeg.woff2";

const styles = {
    body: {
        margin: 0,
        padding: "32px 16px",
        backgroundColor: colors.background,
        fontFamily: fonts.sans,
    },
    container: {
        maxWidth: layout.maxWidth,
        margin: "0 auto",
    },
    wordmark: {
        margin: "0 0 16px",
        fontFamily: fonts.display,
        fontWeight: 700,
        fontSize: 18,
        lineHeight: "24px",
        color: colors.primary,
    },
    card: {
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.card,
    },
    cardCell: {
        padding: layout.cardPadding,
    },
    footer: {
        margin: "16px 0 0",
        fontFamily: fonts.sans,
        fontSize: 13,
        lineHeight: "20px",
        color: colors.mutedForeground,
    },
} satisfies Record<string, CSSProperties>;

export function EmailLayout({
    preview,
    footerNote,
    children,
}: EmailLayoutProps) {
    return (
        <Html lang="cs">
            <Head>
                <meta name="color-scheme" content="light" />
                <meta name="supported-color-schemes" content="light" />
                <style>{`@font-face { font-family: 'Nunito'; font-style: normal; font-weight: 700; mso-font-alt: 'Helvetica'; src: url(${NUNITO_700_WOFF2}) format('woff2'); }`}</style>
            </Head>
            <Body style={styles.body}>
                <Preview>{preview}</Preview>
                <Container style={styles.container}>
                    <Text style={styles.wordmark}>{PRODUCT_NAME}</Text>
                    <Section style={styles.card}>
                        <Row>
                            <Column style={styles.cardCell}>{children}</Column>
                        </Row>
                    </Section>
                    {footerNote ? (
                        <Text style={styles.footer}>{footerNote}</Text>
                    ) : null}
                    <Text style={styles.footer}>{PRODUCT_NAME}</Text>
                </Container>
            </Body>
        </Html>
    );
}

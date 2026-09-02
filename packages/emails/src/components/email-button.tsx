import { Button, Text } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

import { colors, fonts, radii } from "../theme";

const base: CSSProperties = {
    display: "inline-block",
    padding: "12px 24px",
    backgroundColor: colors.primary,
    color: "#ffffff",
    borderRadius: radii.button,
    fontFamily: fonts.sans,
    fontWeight: 600,
    fontSize: 15,
    lineHeight: "20px",
    textDecoration: "none",
};

export interface EmailButtonProps {
    href: string;
    children: ReactNode;
    style?: CSSProperties;
}

export function EmailButton({ href, children, style }: EmailButtonProps) {
    return (
        <Text style={{ margin: "24px 0" }}>
            <Button href={href} style={{ ...base, ...style }}>
                {children}
            </Button>
        </Text>
    );
}

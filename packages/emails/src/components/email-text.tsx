import { Text } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

import { colors, fonts } from "../theme";

const variants = {
    body: {
        margin: "0 0 16px",
        fontFamily: fonts.sans,
        fontSize: 15,
        lineHeight: "24px",
        color: colors.secondaryForeground,
    },
    muted: {
        margin: "0 0 12px",
        fontFamily: fonts.sans,
        fontSize: 13,
        lineHeight: "20px",
        color: colors.mutedForeground,
    },
} satisfies Record<string, CSSProperties>;

export interface EmailTextProps {
    variant?: keyof typeof variants;
    children: ReactNode;
    style?: CSSProperties;
}

export function EmailText({
    variant = "body",
    children,
    style,
}: EmailTextProps) {
    return <Text style={{ ...variants[variant], ...style }}>{children}</Text>;
}

import { Heading } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

import { colors, fonts } from "../theme";

const base: CSSProperties = {
    margin: "0 0 16px",
    fontFamily: fonts.display,
    fontWeight: 700,
    fontSize: 22,
    lineHeight: "28px",
    color: colors.foreground,
};

export interface EmailHeadingProps {
    children: ReactNode;
    style?: CSSProperties;
}

export function EmailHeading({ children, style }: EmailHeadingProps) {
    return (
        <Heading as="h1" style={{ ...base, ...style }}>
            {children}
        </Heading>
    );
}

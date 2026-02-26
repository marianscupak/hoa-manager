export interface JwtPayload {
    sub: string;
    tid?: string;
    mid?: string;
    roles?: string[];
    email?: string;
    [key: string]: unknown;
}

export function parseJwt(token: string): JwtPayload | null {
    try {
        const base64Url = token.split(".")[1];
        if (!base64Url) return null;

        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map(
                    (c) =>
                        "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
                )
                .join(""),
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.warn("Failed to parse JWT", e);
        return null;
    }
}

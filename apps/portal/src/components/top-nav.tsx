import { Link } from "react-router";

import { useNavigation } from "./use-navigation";

export function TopNav() {
    const { links } = useNavigation();

    return (
        <nav className="ml-6 hidden space-x-6 sm:flex">
            {links.map((link) => (
                <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                        link.active
                            ? "border-primary text-foreground"
                            : "text-muted-foreground hover:border-border hover:text-foreground border-transparent"
                    }`}
                >
                    {link.name}
                </Link>
            ))}
        </nav>
    );
}

import { ChevronRightIcon } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@hoa-mngr/ui";

/**
 * The row link every register table opens a detail with — people and units
 * alike, so the same action reads the same wherever it appears.
 */
export function TableDetailLink({ to, label }: { to: string; label: string }) {
    return (
        <Button variant="tableAction" size="tableText" asChild>
            <Link to={to}>
                {label}
                <ChevronRightIcon />
            </Link>
        </Button>
    );
}

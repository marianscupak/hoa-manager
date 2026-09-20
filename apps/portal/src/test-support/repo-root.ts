import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Walks up from a directory to the monorepo root, marked by
 * pnpm-workspace.yaml. Tests that assert the portal stays in step with a
 * file on the API side use this so the descent into the API's folders is
 * the only path that can go stale, not the traversal to the root.
 *
 * apps/portal and apps/api are separate deployable apps, so those tests
 * read the API's source as data rather than importing from it.
 */
export function findRepoRoot(dir: string): string {
    let current = dir;
    while (!existsSync(join(current, "pnpm-workspace.yaml"))) {
        const parent = dirname(current);
        if (parent === current) {
            throw new Error(
                "could not find the repo root (no pnpm-workspace.yaml above " +
                    dir +
                    ")",
            );
        }
        current = parent;
    }
    return current;
}

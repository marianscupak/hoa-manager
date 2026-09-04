#!/usr/bin/env node
/**
 * Builds the participant-facing documents for one usability session out of the
 * Czech materials in docs/user-testing/materialy, and prints them to PDF with
 * the Chrome that Puppeteer has already cached on this machine.
 *
 *   pnpm study:pack --participant P1 --email jan@example.com \
 *       --password Svj-abcd-efgh --moderator-email schranka@example.com
 *   pnpm study:pack --appendix
 *
 * The values come from the output of the study seed (scripts/study-seed.sh).
 * Links to the online questionnaires are content of the materials
 * themselves (00 for the intake form, 03 for SUS), not run parameters.
 * Nothing is written if a placeholder is left unfilled.
 */
import { execFileSync } from "node:child_process";
import { readdir, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { marked } from "marked";
import puppeteer from "puppeteer-core";

import {
    extractFencedBlock,
    extractSection,
    normalizeParticipantId,
    parseCard,
    personaEmail,
    substitute,
} from "./study-pack.lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");
const MATERIALS = path.join(REPO, "docs", "user-testing", "materialy");
const PACK_ROOT = path.join(REPO, "docs", "user-testing", "pack");

const USAGE = `Usage:
  study-pack --participant <Pn> --email <participant email>
             --password <persona password> --moderator-email <mailbox for task A4>
             [--contact-email <author email>] [--out <dir>] [--html-only]
      Writes the invitation pack (what to expect + informed consent) and the
      participant card for one session.

  study-pack --appendix [--html-only]
      Writes the thesis appendix with both questionnaires as participants saw
      them. Takes no participant data.

  study-pack --help`;

const MARGIN = { top: "18mm", bottom: "20mm", left: "18mm", right: "18mm" };
const CREDENTIAL_LABELS = new Set(["Přihlášení", "Heslo"]);

marked.setOptions({ gfm: true, breaks: false });

const escapeHtml = (value) =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const readMaterial = (file) => readFile(path.join(MATERIALS, file), "utf8");

/** The "Verze: … · Datum: … · Autor: …" line every material carries. */
const metaLineOf = (markdown) => (markdown.match(/^Verze:.*$/m) ?? [""])[0];

/** Styles the meta line, unbullets the consent checkboxes and unboxes e-mails. */
const polish = (html) =>
    html
        .replace(/<p>(Verze:[^<]*)<\/p>/, '<p class="meta">$1</p>')
        .replace(/<li>☐/g, '<li class="check">☐')
        // An e-mail inside a material's backticks is prose, not code: the code
        // box would leave a gap before the punctuation that follows it.
        .replace(
            /<code>([^<@\s]+@[^<\s]+?)<\/code>/g,
            '<a href="mailto:$1">$1</a>',
        );

/** Wraps each `h2` and its body in a section, marking those that must not split. */
function wrapSections(html, keepPattern) {
    return html
        .split(/(?=<h2)/)
        .map((chunk) => {
            if (!chunk.startsWith("<h2")) {
                return chunk;
            }
            const heading = (chunk.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) ?? [
                "",
                "",
            ])[1].replace(/<[^>]+>/g, "");
            const keep = keepPattern?.test(heading) ? ' class="keep"' : "";
            return `<section${keep}>${chunk}</section>`;
        })
        .join("");
}

function documentHtml({ title, bodyHtml, css }) {
    return `<!doctype html>
<html lang="cs">
    <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
${css}
        </style>
    </head>
    <body>
${bodyHtml}
    </body>
</html>
`;
}

function footerTemplate(title) {
    return `<div style="width:100%;padding:0 18mm;font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:8pt;color:#5b6570;display:flex;justify-content:space-between;">
<span>${escapeHtml(title)}</span>
<span>Strana <span class="pageNumber"></span> / <span class="totalPages"></span></span>
</div>`;
}

/** Renders one material file into a page of a pack. */
async function materialPart(file, substitutions, keepPattern = null) {
    const raw = await readMaterial(file);
    const { text, unresolved } = substitute(raw, substitutions);
    const html = wrapSections(polish(marked.parse(text)), keepPattern);
    return { html: `<section class="doc-part">${html}</section>`, unresolved };
}

async function buildInvitation(participantId, substitutions) {
    const parts = [
        await materialPart("00-co-vas-ceka.md", substitutions),
        // Section 7 holds the checkboxes and the signature line: keep it whole.
        await materialPart(
            "01-informovany-souhlas.md",
            substitutions,
            /\bSouhlas\b/,
        ),
    ];
    return {
        slug: `${participantId}-pozvanka-a-souhlas`,
        title: `Pozvánka a informovaný souhlas · ${participantId}`,
        bodyHtml: parts.map((part) => part.html).join("\n"),
        unresolved: parts.flatMap((part) => part.unresolved),
    };
}

async function buildCard(participantId, substitutions) {
    const raw = await readMaterial("03-scenar-moderatora.md");
    const { text, unresolved } = substitute(
        extractFencedBlock(raw, "## 9."),
        substitutions,
    );
    const card = parseCard(text);

    const sections = card.sections
        .map((section) => {
            const heading = section.heading
                ? `<h2>${escapeHtml(section.heading)}</h2>`
                : "";
            const rows = section.rows
                .map((row) => {
                    const cred = CREDENTIAL_LABELS.has(row.label)
                        ? ' class="cred"'
                        : "";
                    return `<dt>${escapeHtml(row.label)}</dt><dd${cred}>${escapeHtml(row.value)}</dd>`;
                })
                .join("\n");
            const notes = section.notes
                .map((note) => `<p class="note">${escapeHtml(note)}</p>`)
                .join("\n");
            return `<section class="card-section">${heading}<dl class="card-rows">${rows}</dl>${notes}</section>`;
        })
        .join("\n");

    const bodyHtml = `<h1>${escapeHtml(card.title)}</h1>
<p class="lede">Údaje, které budete během sezení potřebovat. Nic si nemusíte pamatovat — kartu mějte klidně otevřenou po celou dobu.</p>
${sections}
<p class="note foot">Přihlašovací údaje platí pouze pro zkušební prostředí s vymyšlenými daty a po sezení budou smazány.</p>`;

    return {
        slug: `${participantId}-karta`,
        title: `Karta účastníka ${participantId}`,
        bodyHtml,
        unresolved,
    };
}

async function buildAppendix() {
    const intake = await materialPart("02-vstupni-dotaznik.md", {
        "ID účastníka": "_______",
    });

    const susSource = await readMaterial("05-seq-a-sus.md");
    const susMarkdown = [
        "# Dotazníky SEQ a SUS",
        "",
        "Znění otázek tak, jak je dostali účastníci testování.",
        "",
        metaLineOf(susSource),
        "",
        extractSection(susSource, "## 1. SEQ", "## 3. Skórování"),
    ].join("\n");
    const sus = polish(marked.parse(susMarkdown));

    return {
        slug: "prilohy-dotazniky",
        title: "Přílohy: dotazníky",
        bodyHtml: `${intake.html}\n<section class="doc-part">${sus}</section>`,
        unresolved: intake.unresolved,
    };
}

const SYSTEM_BROWSERS = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
];

async function findExecutable(dir, names, depth) {
    if (depth === 0) {
        return null;
    }
    let entries;
    try {
        entries = await readdir(dir, { withFileTypes: true });
    } catch {
        return null;
    }
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isFile() && names.includes(entry.name)) {
            return full;
        }
        if (entry.isDirectory()) {
            const nested = await findExecutable(full, names, depth - 1);
            if (nested) {
                return nested;
            }
        }
    }
    return null;
}

/**
 * Full Chrome is preferred over chrome-headless-shell because Puppeteer drives
 * the two with different `headless` values.
 */
async function resolveBrowser() {
    if (process.env.CHROME_PATH) {
        return { path: process.env.CHROME_PATH, headless: true };
    }

    const cache = path.join(homedir(), ".cache", "puppeteer");
    const flavours = [
        {
            dir: "chrome",
            names: ["Google Chrome for Testing", "chrome"],
            headless: true,
        },
        {
            dir: "chrome-headless-shell",
            names: ["chrome-headless-shell"],
            headless: "shell",
        },
    ];
    for (const flavour of flavours) {
        let versions;
        try {
            versions = await readdir(path.join(cache, flavour.dir));
        } catch {
            continue;
        }
        for (const version of versions.sort().reverse()) {
            const found = await findExecutable(
                path.join(cache, flavour.dir, version),
                flavour.names,
                6,
            );
            if (found) {
                return { path: found, headless: flavour.headless };
            }
        }
    }

    for (const candidate of SYSTEM_BROWSERS) {
        if (
            await findExecutable(
                path.dirname(candidate),
                [path.basename(candidate)],
                1,
            )
        ) {
            return { path: candidate, headless: true };
        }
    }
    return null;
}

async function printPdfs(browser, documents, outDir) {
    const instance = await puppeteer.launch({
        executablePath: browser.path,
        headless: browser.headless,
    });
    try {
        for (const document of documents) {
            const page = await instance.newPage();
            await page.goto(
                `file://${path.join(outDir, `${document.slug}.html`)}`,
                {
                    waitUntil: "load",
                },
            );
            await page.pdf({
                path: path.join(outDir, `${document.slug}.pdf`),
                format: "A4",
                printBackground: true,
                displayHeaderFooter: true,
                headerTemplate: "<div></div>",
                footerTemplate: footerTemplate(document.title),
                margin: MARGIN,
            });
            await page.close();
        }
    } finally {
        await instance.close();
    }
}

function gitEmail() {
    try {
        return execFileSync("git", ["config", "user.email"], {
            encoding: "utf8",
        }).trim();
    } catch {
        return "";
    }
}

function parseInput(argv) {
    const { values } = parseArgs({
        args: argv[0] === "--" ? argv.slice(1) : argv,
        strict: true,
        options: {
            "participant": { type: "string" },
            "email": { type: "string" },
            "password": { type: "string" },
            "moderator-email": { type: "string" },
            "contact-email": { type: "string" },
            "out": { type: "string" },
            "appendix": { type: "boolean", default: false },
            "html-only": { type: "boolean", default: false },
            "help": { type: "boolean", default: false },
        },
    });
    return values;
}

async function main() {
    const values = parseInput(process.argv.slice(2));
    if (values.help) {
        console.log(USAGE);
        return;
    }

    const htmlOnly = values["html-only"];
    let documents;
    let outDir;

    if (values.appendix) {
        documents = [await buildAppendix()];
        outDir = values.out ? path.resolve(values.out) : PACK_ROOT;
    } else {
        if (!values.participant) {
            throw new Error(
                `Pass --participant <Pn> or --appendix.\n\n${USAGE}`,
            );
        }
        const participantId = normalizeParticipantId(values.participant);
        const contactEmail = values["contact-email"] || gitEmail();

        const required = {
            "--email": values.email,
            "--password": values.password,
            "--moderator-email": values["moderator-email"],
            "--contact-email": contactEmail,
        };
        const missing = Object.entries(required)
            .filter(([, value]) => !value)
            .map(([flag]) => flag);
        if (missing.length > 0) {
            throw new Error(
                `Missing required value(s): ${missing.join(", ")}\n\n${USAGE}`,
            );
        }

        const substitutions = {
            "ID účastníka": participantId,
            "e-mail účastníka": values.email,
            "persona e-mail": personaEmail(participantId),
            "heslo": values.password,
            "e-mail schránky moderátora": values["moderator-email"],
            "e-mail": contactEmail,
        };

        documents = [
            await buildInvitation(participantId, substitutions),
            await buildCard(participantId, substitutions),
        ];
        outDir = values.out
            ? path.resolve(values.out)
            : path.join(PACK_ROOT, participantId);
    }

    const unfilled = documents
        .filter((document) => document.unresolved.length > 0)
        .map(
            (document) =>
                `  ${document.slug}: ${[...new Set(document.unresolved)].join(", ")}`,
        );
    if (unfilled.length > 0) {
        throw new Error(
            `Refusing to write: placeholders left unfilled.\n${unfilled.join("\n")}\n\nPass the matching flag, or fix the material.`,
        );
    }

    const css = await readFile(path.join(HERE, "study-pack.css"), "utf8");
    await mkdir(outDir, { recursive: true });
    await mkdir(PACK_ROOT, { recursive: true });
    await writeFile(
        path.join(PACK_ROOT, ".gitignore"),
        "# Generated packs carry a participant e-mail and a login password.\n# They are never committed.\n*\n",
    );

    for (const document of documents) {
        await writeFile(
            path.join(outDir, `${document.slug}.html`),
            documentHtml({
                title: document.title,
                bodyHtml: document.bodyHtml,
                css,
            }),
        );
    }

    if (htmlOnly) {
        console.log(`Wrote HTML only (--html-only) to ${outDir}`);
    } else {
        const browser = await resolveBrowser();
        if (browser) {
            await printPdfs(browser, documents, outDir);
        } else {
            console.warn(
                "No Chrome found (set CHROME_PATH). Wrote HTML only — open it and print to PDF from the browser.",
            );
        }
    }

    console.log(`\nStudy pack in ${path.relative(REPO, outDir)}/`);
    for (const document of documents) {
        console.log(`  ${document.slug}.html`);
        console.log(`  ${document.slug}.pdf`);
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});

import assert from "node:assert/strict";
import { test } from "node:test";

import {
    extractFencedBlock,
    extractSection,
    normalizeParticipantId,
    parseCard,
    personaEmail,
    substitute,
} from "./study-pack.lib.mjs";

test("normalizeParticipantId upper-cases and validates", () => {
    assert.equal(normalizeParticipantId("p3"), "P3");
    assert.equal(normalizeParticipantId(" P12 "), "P12");
    for (const bad of ["P", "P123", "X3", "3", ""]) {
        assert.throws(() => normalizeParticipantId(bad), /participant id/i);
    }
});

test("personaEmail mirrors the seed naming rule", () => {
    assert.equal(personaEmail("P3"), "p3.vybor@study.hoa.local");
    assert.equal(personaEmail("P10"), "p10.vybor@study.hoa.local");
});

test("substitute replaces known placeholders and reports the rest", () => {
    const source = "Kód <<ID účastníka>>, e-mail <<e-mail>>, chybí <<heslo>>.";
    const { text, unresolved } = substitute(source, {
        "ID účastníka": "P3",
        "e-mail": "a@b.cz",
    });
    assert.equal(text, "Kód P3, e-mail a@b.cz, chybí <<heslo>>.");
    assert.deepEqual(unresolved, ["heslo"]);
});

test("substitute reports each unresolved placeholder once, sorted", () => {
    const { unresolved } = substitute("<<b>> <<a>> <<b>>", {});
    assert.deepEqual(unresolved, ["a", "b"]);
});

test("extractSection keeps the opening heading and drops the next one", () => {
    const md = ["# T", "", "## 1. A", "first", "", "## 2. B", "second"].join(
        "\n",
    );
    const out = extractSection(md, "## 1.", "## 2.");
    assert.match(out, /## 1\. A/);
    assert.match(out, /first/);
    assert.doesNotMatch(out, /second/);
    assert.throws(() => extractSection(md, "## 9.", "## 2."), /not found/i);
});

test("extractSection can slice the participant-safe part of the SUS material", () => {
    const md = [
        "## 1. SEQ (Single Ease Question)",
        "Otázka: text",
        "## 2. SUS (System Usability Scale)",
        "### Položky",
        "| 1 | Myslím |",
        "## 3. Skórování",
        "Liché položky",
        "## 4. Interpretace",
    ].join("\n");
    const out = extractSection(md, "## 1. SEQ", "## 3. Skórování");
    assert.match(out, /Položky/);
    assert.doesNotMatch(out, /Skórování/);
    assert.doesNotMatch(out, /Interpretace/);
});

test("extractFencedBlock returns the block that follows a heading", () => {
    const md = [
        "## 9. Karta",
        "intro",
        "",
        "```",
        "line one",
        "line two",
        "```",
        "",
        "## 10. Next",
    ].join("\n");
    assert.equal(extractFencedBlock(md, "## 9."), "line one\nline two");
    assert.throws(() => extractFencedBlock(md, "## 10."), /no fenced block/i);
});

test("parseCard splits the card into a title, sections, rows and notes", () => {
    const block = [
        "Karta účastníka P3",
        "",
        "ČÁST 1 — jste Karel Malý, předseda výboru",
        "Přihlášení:   p3.vybor@study.hoa.local",
        "Heslo:        Svj-abcd-efgh",
        "",
        "Jednotka 1:  podíl 3200/10000  — manželé Jana a Petr",
        "Volná poznámka bez dvojtecky",
        "",
        "ČÁST 2 — jste sám/sama sebou",
        "Váš e-mail:  jan@example.com",
    ].join("\n");
    const card = parseCard(block);

    assert.equal(card.title, "Karta účastníka P3");
    assert.equal(card.sections.length, 2);

    const [first, second] = card.sections;
    assert.equal(first.heading, "ČÁST 1 — jste Karel Malý, předseda výboru");
    assert.deepEqual(first.rows.slice(0, 2), [
        { label: "Přihlášení", value: "p3.vybor@study.hoa.local" },
        { label: "Heslo", value: "Svj-abcd-efgh" },
    ]);
    assert.deepEqual(first.rows[2], {
        label: "Jednotka 1",
        value: "podíl 3200/10000 — manželé Jana a Petr",
    });
    assert.deepEqual(first.notes, ["Volná poznámka bez dvojtecky"]);
    assert.equal(second.heading, "ČÁST 2 — jste sám/sama sebou");
    assert.deepEqual(second.rows, [
        { label: "Váš e-mail", value: "jan@example.com" },
    ]);
});

test("parseCard keeps rows that appear before the first section", () => {
    const card = parseCard("Karta\n\nKlíč:  hodnota\n\nČÁST 1 — x\nA:  b");
    assert.equal(card.sections.length, 2);
    assert.equal(card.sections[0].heading, null);
    assert.deepEqual(card.sections[0].rows, [
        { label: "Klíč", value: "hodnota" },
    ]);
});

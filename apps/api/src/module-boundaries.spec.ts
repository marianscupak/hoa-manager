import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

/**
 * Keeps the module dependency graph one-directional: voting depends on the
 * core, and inside the core specific modules depend on general ones. No two
 * modules may depend on each other, directly or through a longer loop, and
 * shared code sits below every module.
 *
 * Reads the sources as data. A module is `modules/core/<name>` or
 * `modules/voting`; an edge is any import from one into another, through the
 * `@/` alias or a relative path. Spec files are left out, since a test may
 * reach across modules to build its fixtures.
 */

const SRC = __dirname;

type Graph = Map<string, Set<string>>;

const IMPORT_SPECIFIER =
  /(?:\bimport|\bexport)\s[^'"]*?\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(?\s*['"]([^'"]+)['"]/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(join(SRC, dir), { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'))
    .map((file) => join(dir, file));
}

/** Import targets of a file, as paths relative to `src`. */
function importsOf(file: string): string[] {
  const source = readFileSync(join(SRC, file), 'utf8');
  const targets: string[] = [];
  for (const match of source.matchAll(IMPORT_SPECIFIER)) {
    const specifier = match[1] ?? match[2];
    if (specifier.startsWith('@/')) {
      targets.push(specifier.slice(2));
    } else if (specifier.startsWith('.')) {
      targets.push(relative(SRC, resolve(SRC, dirname(file), specifier)));
    }
  }
  return targets;
}

/** `tenancy` for `modules/core/tenancy/...`, `voting` for `modules/voting/...`. */
export function moduleOf(path: string): string | null {
  const parts = path.split(/[\\/]/);
  if (parts[0] !== 'modules') return null;
  if (parts[1] === 'core') return parts[2] ?? null;
  return parts[1] ?? null;
}

function buildModuleGraph(): Graph {
  const graph: Graph = new Map();
  for (const file of sourceFiles('modules')) {
    const from = moduleOf(file)!;
    if (!graph.has(from)) graph.set(from, new Set());
    for (const target of importsOf(file)) {
      const to = moduleOf(target);
      if (to && to !== from) graph.get(from)!.add(to);
    }
  }
  return graph;
}

/**
 * One loop per group of modules that reach each other, written out as
 * `a → b → a`. Groups are strongly connected components (Tarjan); within
 * each, the shortest path from its first module back to itself.
 */
export function findCycles(graph: Graph): string[] {
  const index = new Map<string, number>();
  const lowLink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const components: string[][] = [];
  let counter = 0;

  const visit = (node: string): void => {
    index.set(node, counter);
    lowLink.set(node, counter);
    counter++;
    stack.push(node);
    onStack.add(node);
    for (const next of graph.get(node) ?? []) {
      if (!index.has(next)) {
        visit(next);
        lowLink.set(node, Math.min(lowLink.get(node)!, lowLink.get(next)!));
      } else if (onStack.has(next)) {
        lowLink.set(node, Math.min(lowLink.get(node)!, index.get(next)!));
      }
    }
    if (lowLink.get(node) === index.get(node)) {
      const component: string[] = [];
      let member: string;
      do {
        member = stack.pop()!;
        onStack.delete(member);
        component.push(member);
      } while (member !== node);
      if (component.length > 1) components.push(component.sort());
    }
  };

  for (const node of [...graph.keys()].sort()) {
    if (!index.has(node)) visit(node);
  }

  return components.map((component) => {
    const members = new Set(component);
    const start = component[0];
    const previous = new Map<string, string>();
    const queue = [start];
    while (queue.length > 0) {
      const node = queue.shift()!;
      const nexts = [...(graph.get(node) ?? [])]
        .filter((n) => members.has(n))
        .sort();
      if (nexts.includes(start)) {
        const path = [node];
        while (path[0] !== start) path.unshift(previous.get(path[0])!);
        return [...path, start].join(' → ');
      }
      for (const next of nexts) {
        if (!previous.has(next) && next !== start) {
          previous.set(next, node);
          queue.push(next);
        }
      }
    }
    return component.join(' ↔ ');
  });
}

describe('module boundaries', () => {
  it('sees the dependencies it guards', () => {
    const graph = buildModuleGraph();

    expect([...graph.keys()].sort()).toEqual([
      'audit',
      'audit-projections',
      'auth',
      'identity',
      'property',
      'tenancy',
      'voting',
    ]);
    expect([...graph.get('property')!]).toContain('tenancy');
    expect([...graph.get('voting')!]).toContain('audit');
  });

  it('has no dependency cycle between modules', () => {
    expect(findCycles(buildModuleGraph())).toEqual([]);
  });

  it('keeps shared code independent of every module', () => {
    const offenders = sourceFiles('shared').flatMap((file) =>
      importsOf(file)
        .filter((target) => moduleOf(target) !== null)
        .map((target) => `${file} → ${target}`),
    );

    expect(offenders).toEqual([]);
  });

  describe('findCycles', () => {
    const graphOf = (edges: Record<string, string[]>): Graph =>
      new Map(Object.entries(edges).map(([from, to]) => [from, new Set(to)]));

    it('accepts a graph that only points one way', () => {
      expect(
        findCycles(
          graphOf({
            voting: ['tenancy', 'audit'],
            tenancy: ['identity', 'audit'],
            identity: [],
            audit: [],
          }),
        ),
      ).toEqual([]);
    });

    it('names a direct cycle', () => {
      expect(
        findCycles(graphOf({ property: ['tenancy'], tenancy: ['property'] })),
      ).toEqual(['property → tenancy → property']);
    });

    it('names a cycle through several modules', () => {
      expect(
        findCycles(
          graphOf({
            audit: ['tenancy'],
            tenancy: ['identity'],
            identity: ['audit'],
          }),
        ),
      ).toEqual(['audit → tenancy → identity → audit']);
    });
  });

  describe('moduleOf', () => {
    it.each([
      ['modules/core/tenancy/tenancy.module', 'tenancy'],
      ['modules/core/audit-projections/core-event-types', 'audit-projections'],
      ['modules/voting/api/votes.controller', 'voting'],
      ['shared/domain/membership', null],
      ['infrastructure/token/token.module', null],
    ])('maps %s to %s', (path, module) => {
      expect(moduleOf(path)).toBe(module);
    });
  });
});

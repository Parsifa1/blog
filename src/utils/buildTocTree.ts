export type TocItem = {
  depth: number;
  slug: string;
  text: string;
  children: TocItem[];
};

type Heading = { depth: number; slug: string; text: string };

export function buildTocTree(headings: Heading[], maxDepth = 3): TocItem[] {
  const root: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const { depth, slug, text } of headings) {
    if (depth < 2 || depth > maxDepth) continue;
    const item: TocItem = { depth, slug, text, children: [] };
    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
    (stack[stack.length - 1]?.children ?? root).push(item);
    stack.push(item);
  }

  return root;
}

export function hasToc(headings: Heading[], maxDepth = 3) {
  return headings.filter(h => h.depth >= 2 && h.depth <= maxDepth).length >= 2;
}

const URL_RE = /https?:\/\/[^\s`<>"']+/gi;

export function extractLinks(text: string): string[] {
  const matches = text.match(URL_RE);
  if (!matches) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of matches) {
    const url = raw.replace(/[)\].,;:!?]+$/, "");
    if (!seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

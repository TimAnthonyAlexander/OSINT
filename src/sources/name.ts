import type { Source, SourceResult, Query } from "../types.js";
import { checkPlatforms } from "./username.js";

function getUsernameCandidates(fullName: string): string[] {
  const parts = fullName.toLowerCase().split(/\s+/);
  const seen = new Set<string>();

  const add = (s: string) => {
    const clean = s.replace(/[^a-z0-9._-]/g, "");
    if (clean.length >= 2 && clean.length <= 39) seen.add(clean);
  };

  if (parts.length >= 2) {
    // firstlast
    add(`${parts[0]}${parts[parts.length - 1]}`);
    // first.last
    add(`${parts[0]}.${parts[parts.length - 1]}`);
    // first name only
    add(parts[0]!);
  }

  if (parts.length >= 3) {
    // first+middle (+last, full squashed)
    add(parts.join(""));
    // first.middle
    add(`${parts[0]}.${parts[1]}`);
  }

  return [...seen].slice(0, 5);
}

export const nameSource: Source = {
  id: "name",
  label: "Name search",
  category: "person",
  async run(query: Query): Promise<SourceResult[]> {
    if (query.target !== "person" || !query.name) return [];

    const rawName = query.name;
    const name = encodeURIComponent(`"${rawName}"`);

    const searches = [
      { label: "Google search", url: `https://www.google.com/search?q=${name}` },
      {
        label: "LinkedIn profiles",
        url: `https://www.google.com/search?q=${name}+site%3Alinkedin.com%2Fin`,
      },
      { label: "Twitter mentions", url: `https://www.google.com/search?q=${name}+site%3Ax.com` },
      {
        label: "GitHub profiles",
        url: `https://www.google.com/search?q=${name}+site%3Agithub.com`,
      },
      { label: "News mentions", url: `https://www.google.com/search?q=${name}&tbm=nws` },
      { label: "PDF documents", url: `https://www.google.com/search?q=${name}+filetype%3Apdf` },
      {
        label: "Reddit mentions",
        url: `https://www.google.com/search?q=${name}+site%3Areddit.com`,
      },
      { label: "Instagram", url: `https://www.google.com/search?q=${name}+site%3Ainstagram.com` },
    ];

    const results: SourceResult[] = searches.map((s) => ({
      source: "name",
      label: s.label,
      found: true,
      url: s.url,
      detail: "open in browser",
    }));

    // Derive username candidates from the name and check platforms
    const candidates = getUsernameCandidates(rawName);
    if (candidates.length > 0) {
      process.stderr.write(`  checking ${candidates.length} username candidates... `);
    }
    for (let ci = 0; ci < candidates.length; ci++) {
      const candidate = candidates[ci]!;
      process.stderr.write(".");
      const platformResults = await checkPlatforms(candidate, "name");
      for (const r of platformResults) {
        if (r.found) {
          results.push({ ...r, label: `${r.label} (as ${candidate})` });
        }
      }
    }
    if (candidates.length > 0) {
      process.stderr.write("\n");
    }

    return results;
  },
};

import type { SourceResult } from "./types.js";

export function printResults(results: SourceResult[]): void {
  if (results.length === 0) {
    console.log("No results.");
    return;
  }

  const found = results.filter((r) => r.found);
  const notFound = results.filter((r) => !r.found);

  if (found.length > 0) {
    console.log(`Found (${found.length}):`);
    for (const r of found) {
      const url = r.url ? ` — ${r.url}` : "";
      const detail = r.detail ? ` — ${r.detail}` : "";
      console.log(`  [✓] ${r.label}${url}${detail}`);
    }
  }

  if (notFound.length > 0) {
    if (found.length > 0) console.log();
    console.log(`Not found (${notFound.length}):`);
    for (const r of notFound) {
      console.log(`  [ ] ${r.label}`);
    }
  }
}

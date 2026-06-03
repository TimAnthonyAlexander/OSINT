import type { Source } from "../types.js";

const sources: Source[] = [];

export function register(source: Source): void {
  sources.push(source);
}

export function getSources(category?: "person" | "company"): Source[] {
  if (!category) return sources;
  return sources.filter((s) => s.category === category);
}

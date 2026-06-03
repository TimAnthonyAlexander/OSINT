import type { Source, SourceResult, Query } from "../types.js";

export const nameSource: Source = {
  id: "name",
  label: "Name search",
  category: "person",
  async run(query: Query): Promise<SourceResult[]> {
    if (query.target !== "person" || !query.name) return [];

    const name = encodeURIComponent(`"${query.name}"`);

    const searches = [
      { label: "Google search", url: `https://www.google.com/search?q=${name}` },
      {
        label: "LinkedIn profiles",
        url: `https://www.google.com/search?q=${name}+site%3Alinkedin.com%2Fin`,
      },
      {
        label: "Twitter mentions",
        url: `https://www.google.com/search?q=${name}+site%3Ax.com`,
      },
      {
        label: "GitHub profiles",
        url: `https://www.google.com/search?q=${name}+site%3Agithub.com`,
      },
      {
        label: "News mentions",
        url: `https://www.google.com/search?q=${name}&tbm=nws`,
      },
      {
        label: "PDF documents",
        url: `https://www.google.com/search?q=${name}+filetype%3Apdf`,
      },
      {
        label: "Reddit mentions",
        url: `https://www.google.com/search?q=${name}+site%3Areddit.com`,
      },
      {
        label: "Instagram",
        url: `https://www.google.com/search?q=${name}+site%3Ainstagram.com`,
      },
    ];

    return searches.map((s) => ({
      source: "name",
      label: s.label,
      found: true,
      url: s.url,
      detail: "open in browser",
    }));
  },
};

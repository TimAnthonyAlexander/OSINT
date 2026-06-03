import type { Source, SourceResult, Query } from "../types.js";

export const companyNameSource: Source = {
  id: "company-name",
  label: "Company name search",
  category: "company",
  async run(query: Query): Promise<SourceResult[]> {
    if (query.target !== "company" || !query.name) return [];

    const name = encodeURIComponent(`"${query.name}"`);

    const searches = [
      {
        label: "Google search",
        url: `https://www.google.com/search?q=${name}`,
      },
      {
        label: "LinkedIn company page",
        url: `https://www.google.com/search?q=${name}+site%3Alinkedin.com%2Fcompany`,
      },
      {
        label: "Crunchbase profile",
        url: `https://www.google.com/search?q=${name}+site%3Acrunchbase.com`,
      },
      {
        label: "Glassdoor reviews",
        url: `https://www.google.com/search?q=${name}+site%3Aglassdoor.com`,
      },
      {
        label: "Trustpilot reviews",
        url: `https://www.google.com/search?q=${name}+site%3Atrustpilot.com`,
      },
      {
        label: "News mentions",
        url: `https://www.google.com/search?q=${name}&tbm=nws`,
      },
      {
        label: "OpenCorporates",
        url: `https://opencorporates.com/companies?q=${encodeURIComponent(query.name!)}`,
      },
      {
        label: "SEC filings (US)",
        url: `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(query.name!)}`,
      },
      {
        label: "Twitter / X search",
        url: `https://x.com/search?q=${encodeURIComponent(query.name!)}`,
      },
      {
        label: "Reddit mentions",
        url: `https://www.google.com/search?q=${name}+site%3Areddit.com`,
      },
    ];

    return searches.map((s) => ({
      source: "company-name",
      label: s.label,
      found: true,
      url: s.url,
      detail: "open in browser",
    }));
  },
};

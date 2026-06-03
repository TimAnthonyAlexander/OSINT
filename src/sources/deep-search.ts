import type { Source, SourceResult, Query } from "../types.js";
import { fetchAndParse } from "../openrouter.js";

export const deepSearchSource: Source = {
  id: "deep-search",
  label: "Deep search (LLM)",
  category: "person",
  async run(query: Query): Promise<SourceResult[]> {
    if (!query.deep) return [];

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return [
        {
          source: "deep-search",
          label: "Deep search",
          found: false,
          detail: "set OPENROUTER_API_KEY to enable deep search",
        },
      ];
    }

    try {
      if (query.target === "person" && query.name) {
        return await deepPersonSearch(query.name);
      }
      if (query.target === "company" && query.name) {
        return await deepCompanySearch(query.name);
      }
      if (query.target === "company" && query.domain) {
        return await deepDomainSearch(query.domain);
      }
    } catch (err) {
      return [
        {
          source: "deep-search",
          label: "Deep search",
          found: false,
          detail: err instanceof Error ? err.message : "request failed",
        },
      ];
    }

    return [];
  },
};

type PersonProfile = {
  name?: string;
  aliases?: string[];
  location?: string;
  bio?: string;
  occupation?: string;
  employer?: string;
  socials?: Array<{ platform: string; url: string }>;
  websites?: string[];
  github?: string;
  linkedin?: string;
  notable?: string[];
};

async function deepPersonSearch(name: string): Promise<SourceResult[]> {
  const parts = name.toLowerCase().split(/\s+/);

  // Try specific profile pages instead of Google (which blocks headless browsers)
  const candidates: Array<{ label: string; url: string }> = [];

  if (parts.length >= 2) {
    const firstlast = `${parts[0]}${parts[parts.length - 1]}`;
    const squashed = parts.join("");

    candidates.push(
      { label: "GitHub", url: `https://github.com/${squashed}` },
      { label: "GitHub", url: `https://github.com/${firstlast}` },
      { label: "Keybase", url: `https://keybase.io/${firstlast}` },
      { label: "HackTheBox", url: `https://app.hackthebox.com/profile/${firstlast}` },
    );
  }

  const results: SourceResult[] = [];

  for (const { label, url } of candidates) {
    const raw = await fetchAndParse(url, "person identity, bio, location, occupation, links", {
      name: "string | null",
      aliases: "string[] | null",
      location: "string | null",
      bio: "string | null",
      occupation: "string | null",
      employer: "string | null",
      socials: "{ platform: string; url: string }[] | null",
      websites: "string[] | null",
      github: "string | null",
      linkedin: "string | null",
      notable: "string[] | null",
    });

    const profile = tryParse<PersonProfile>(raw);

    if (profile.name) {
      results.push({
        source: "deep-search",
        label: `Name (${label})`,
        found: true,
        detail: profile.name,
      });
    }
    if (profile.location) {
      results.push({
        source: "deep-search",
        label: `Location (${label})`,
        found: true,
        detail: profile.location,
      });
    }
    if (profile.occupation) {
      results.push({
        source: "deep-search",
        label: `Occupation (${label})`,
        found: true,
        detail: profile.occupation,
      });
    }
    if (profile.employer) {
      results.push({
        source: "deep-search",
        label: `Employer (${label})`,
        found: true,
        detail: profile.employer,
      });
    }
    if (profile.bio) {
      results.push({
        source: "deep-search",
        label: `Bio (${label})`,
        found: true,
        detail: profile.bio,
      });
    }
    if (profile.github) {
      results.push({ source: "deep-search", label: "GitHub", found: true, url: profile.github });
    }
    if (profile.linkedin) {
      results.push({
        source: "deep-search",
        label: "LinkedIn",
        found: true,
        url: profile.linkedin,
      });
    }
    if (profile.socials) {
      for (const s of profile.socials) {
        results.push({
          source: "deep-search",
          label: `Social: ${s.platform}`,
          found: true,
          url: s.url,
        });
      }
    }
    if (profile.websites) {
      for (const w of profile.websites) {
        results.push({ source: "deep-search", label: "Website", found: true, url: w });
      }
    }
    if (profile.notable) {
      for (const n of profile.notable) {
        results.push({ source: "deep-search", label: "Notable", found: true, detail: n });
      }
    }

    // Stop after first profile with real content
    if (results.length >= 2) break;
  }

  if (results.length === 0) {
    results.push({
      source: "deep-search",
      label: "Deep search",
      found: false,
      detail: "nothing extracted",
    });
  }

  return results;
}

type CompanyProfile = {
  name?: string;
  description?: string;
  industry?: string;
  founded?: string;
  headquarters?: string;
  website?: string;
  employees?: string;
  revenue?: string;
  linkedin?: string;
  crunchbase?: string;
  twitter?: string;
  leadership?: Array<{ name: string; role: string }>;
  news?: string[];
};

async function deepCompanySearch(name: string): Promise<SourceResult[]> {
  const encoded = encodeURIComponent(name);

  // Try multiple URLs and merge results
  const urls = [
    `https://opencorporates.com/companies?q=${encoded}`,
    `https://${name.toLowerCase().replace(/\s+/g, "")}.com`,
  ];

  const results: SourceResult[] = [];

  for (const url of urls) {
    const raw = await fetchAndParse(url, "company details, size, industry, leadership", {
      name: "string | null",
      description: "string | null",
      industry: "string | null",
      founded: "string | null",
      headquarters: "string | null",
      website: "string | null",
      employees: "string | null",
      revenue: "string | null",
      linkedin: "string | null",
      crunchbase: "string | null",
      twitter: "string | null",
      leadership: "{ name: string; role: string }[] | null",
      news: "string[] | null",
    });

    const profile = tryParse<CompanyProfile>(raw);

    if (profile.name) {
      results.push({ source: "deep-search", label: "Name", found: true, detail: profile.name });
    }
    if (profile.description) {
      results.push({
        source: "deep-search",
        label: "Description",
        found: true,
        detail: profile.description,
      });
    }
    if (profile.industry) {
      results.push({
        source: "deep-search",
        label: "Industry",
        found: true,
        detail: profile.industry,
      });
    }
    if (profile.founded) {
      results.push({
        source: "deep-search",
        label: "Founded",
        found: true,
        detail: profile.founded,
      });
    }
    if (profile.headquarters) {
      results.push({
        source: "deep-search",
        label: "Headquarters",
        found: true,
        detail: profile.headquarters,
      });
    }
    if (profile.website) {
      results.push({ source: "deep-search", label: "Website", found: true, url: profile.website });
    }
    if (profile.employees) {
      results.push({
        source: "deep-search",
        label: "Employees",
        found: true,
        detail: profile.employees,
      });
    }
    if (profile.revenue) {
      results.push({
        source: "deep-search",
        label: "Revenue",
        found: true,
        detail: profile.revenue,
      });
    }
    if (profile.linkedin) {
      results.push({
        source: "deep-search",
        label: "LinkedIn",
        found: true,
        url: profile.linkedin,
      });
    }
    if (profile.crunchbase) {
      results.push({
        source: "deep-search",
        label: "Crunchbase",
        found: true,
        url: profile.crunchbase,
      });
    }
    if (profile.twitter) {
      results.push({ source: "deep-search", label: "Twitter", found: true, url: profile.twitter });
    }
    if (profile.leadership) {
      for (const l of profile.leadership) {
        results.push({
          source: "deep-search",
          label: `Leadership: ${l.name}`,
          found: true,
          detail: l.role,
        });
      }
    }
    if (profile.news) {
      for (const n of profile.news) {
        results.push({ source: "deep-search", label: "News", found: true, detail: n });
      }
    }

    // Got good results from this URL, stop
    if (results.length > 0) break;
  }

  if (results.length === 0) {
    results.push({
      source: "deep-search",
      label: "Deep search",
      found: false,
      detail: "nothing extracted",
    });
  }

  return results;
}

async function deepDomainSearch(domain: string): Promise<SourceResult[]> {
  const url = `https://${domain}`;

  const raw = await fetchAndParse(url, "what this website does, company behind it", {
    siteName: "string | null",
    description: "string | null",
    companyName: "string | null",
    purpose: "string | null",
    contactEmail: "string | null",
    socialLinks: "string[] | null",
  });

  const parsed = tryParse<{
    siteName?: string | null;
    description?: string | null;
    companyName?: string | null;
    purpose?: string | null;
    contactEmail?: string | null;
    socialLinks?: string[] | null;
  }>(raw);

  const results: SourceResult[] = [];

  if (parsed.siteName) {
    results.push({
      source: "deep-search",
      label: "Site name",
      found: true,
      detail: parsed.siteName,
    });
  }
  if (parsed.companyName) {
    results.push({
      source: "deep-search",
      label: "Company",
      found: true,
      detail: parsed.companyName,
    });
  }
  if (parsed.description) {
    results.push({
      source: "deep-search",
      label: "Description",
      found: true,
      detail: parsed.description,
    });
  }
  if (parsed.purpose) {
    results.push({ source: "deep-search", label: "Purpose", found: true, detail: parsed.purpose });
  }
  if (parsed.contactEmail) {
    results.push({
      source: "deep-search",
      label: "Contact email",
      found: true,
      detail: parsed.contactEmail,
    });
  }
  if (parsed.socialLinks) {
    for (const l of parsed.socialLinks) {
      results.push({ source: "deep-search", label: "Social link", found: true, url: l });
    }
  }

  if (results.length === 0) {
    results.push({
      source: "deep-search",
      label: "Website analysis",
      found: false,
      detail: "nothing extracted",
    });
  }

  return results;
}

function tryParse<T>(raw: string): T {
  // LLM might wrap in markdown code fences or add text around the JSON
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {} as T;
  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return {} as T;
  }
}

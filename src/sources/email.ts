import type { Source, SourceResult, Query } from "../types.js";
import { createHash } from "node:crypto";
import { promises as dns } from "node:dns";

export const emailSource: Source = {
  id: "email",
  label: "Email checks",
  category: "person",
  async run(query: Query): Promise<SourceResult[]> {
    if (query.target !== "person" || !query.email) return [];

    const email = query.email;
    const domain = email.split("@")[1];
    const results: SourceResult[] = [];

    // MX record check
    if (domain) {
      try {
        const records = await dns.resolveMx(domain);
        results.push({
          source: "email",
          label: "MX records",
          found: true,
          detail: records.map((r) => `${r.exchange} (prio ${r.priority})`).join(", "),
        });
      } catch {
        results.push({
          source: "email",
          label: "MX records",
          found: false,
          detail: "no mail servers found",
        });
      }
    }

    // Gravatar lookup
    try {
      const hash = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
      const res = await fetch(`https://gravatar.com/${hash}.json`, {
        headers: { "User-Agent": "osint-cli/0.1" },
      });
      if (res.ok) {
        const data = (await res.json()) as { entry?: Array<{ displayName?: string }> };
        const entry = data.entry?.[0];
        results.push({
          source: "email",
          label: "Gravatar",
          found: true,
          detail: entry?.displayName ?? "profile exists",
          url: `https://gravatar.com/${hash}`,
        });
      } else {
        results.push({ source: "email", label: "Gravatar", found: false });
      }
    } catch {
      results.push({ source: "email", label: "Gravatar", found: false });
    }

    // HIBP breach check (requires API key)
    const apiKey = process.env.HIBP_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch(
          `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`,
          {
            headers: {
              "hibp-api-key": apiKey,
              "User-Agent": "osint-cli/0.1",
            },
          },
        );

        if (res.status === 404) {
          results.push({
            source: "email",
            label: "Have I Been Pwned",
            found: false,
            detail: "no breaches found",
          });
        } else if (res.ok) {
          const breaches = (await res.json()) as { Name: string; BreachDate: string }[];
          for (const b of breaches) {
            results.push({
              source: "email",
              label: "Have I Been Pwned",
              found: true,
              detail: `${b.Name} (${b.BreachDate})`,
            });
          }
        } else {
          results.push({
            source: "email",
            label: "Have I Been Pwned",
            found: false,
            detail: `API error ${res.status}`,
          });
        }
      } catch {
        results.push({
          source: "email",
          label: "Have I Been Pwned",
          found: false,
          detail: "request failed",
        });
      }
    }

    return results;
  },
};

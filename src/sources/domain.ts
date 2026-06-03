import type { Source, SourceResult, Query } from "../types.js";

type RdapDomain = {
  ldhName: string;
  status?: string[];
  events?: { eventAction: string; eventDate: string }[];
  nameservers?: { ldhName: string }[];
  entities?: {
    objectClassName: string;
    roles: string[];
    vcardArray: unknown[];
  }[];
};

export const domainSource: Source = {
  id: "domain",
  label: "Domain registration",
  category: "company",
  async run(query: Query): Promise<SourceResult[]> {
    if (query.target !== "company" || !query.domain) return [];
    const domain = query.domain;
    const results: SourceResult[] = [];

    // RDAP lookup
    try {
      const tld = domain.includes(".") ? "" : ".com";
      const full = domain.includes(".") ? domain : domain + tld;
      const res = await fetch(`https://rdap.verisign.com/com/v1/domain/${full}`, {
        headers: { Accept: "application/rdap+json" },
      });
      if (res.ok) {
        const data = (await res.json()) as RdapDomain;

        const regDate = data.events?.find((e) => e.eventAction === "registration");
        const expDate = data.events?.find((e) => e.eventAction === "expiration");
        const registrar = data.entities?.find((e) => e.roles.includes("registrar"));
        // vcardArray is [version, [...properties]], each property is [name, params, type, value]
        const vcardProps = (registrar?.vcardArray as unknown[])?.[1] as unknown[] | undefined;
        const fnProp = vcardProps?.find((p) => Array.isArray(p) && p[0] === "fn") as
          | unknown[]
          | undefined;
        const registrarName = (fnProp?.[3] as string) ?? "unknown";

        const parts: string[] = [];
        if (regDate) parts.push(`registered ${regDate.eventDate.slice(0, 10)}`);
        if (expDate) parts.push(`expires ${expDate.eventDate.slice(0, 10)}`);
        parts.push(`registrar: ${registrarName}`);
        if (data.nameservers?.length) {
          parts.push(`NS: ${data.nameservers.map((n) => n.ldhName).join(", ")}`);
        }

        results.push({
          source: "domain",
          label: "WHOIS (RDAP)",
          found: true,
          detail: parts.join(" | "),
        });
      } else {
        results.push({
          source: "domain",
          label: "WHOIS (RDAP)",
          found: false,
          detail: `response ${res.status}`,
        });
      }
    } catch {
      results.push({
        source: "domain",
        label: "WHOIS (RDAP)",
        found: false,
        detail: "request failed",
      });
    }

    // DNS records via Bun
    try {
      const addrs = await Bun.dns.lookup(domain);
      results.push({
        source: "domain",
        label: "DNS (A record)",
        found: addrs.length > 0,
        detail: addrs.map((a) => a.address).join(", "),
      });
    } catch {
      results.push({ source: "domain", label: "DNS (A record)", found: false });
    }

    return results;
  },
};

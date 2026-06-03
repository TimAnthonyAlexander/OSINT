# osint

CLI tool for gathering open-source intelligence on people and companies.

## Install

Requires [Bun](https://bun.sh).

```sh
bun install
```

## Person lookup

Accepts a name, username, or email. Multiple flags can be combined. Add `--deep` to fetch and parse profile pages with an LLM (requires `OPENROUTER_API_KEY`).

```
bun run src/index.ts -- person --name "John Doe"
bun run src/index.ts -- person --username jdoe
bun run src/index.ts -- person --email jdoe@example.com
bun run src/index.ts -- person --name "John Doe" --deep
```

When a name is given, the tool derives likely username candidates (e.g. `johndoe`, `john.doe`) and checks them across 25 social platforms automatically. Minimum candidate length is 4 characters.

**Name sources** (Google dork links, open in browser):
LinkedIn profiles, Twitter mentions, GitHub profiles, news mentions, PDF documents, Reddit mentions, Instagram, plus a general Google search.

**Username sources** (live HTTP checks, 25 platforms):
GitHub, Twitter / X, Instagram, Reddit, TikTok, YouTube, Twitch, Pinterest, Medium, Dev.to, HackerNews, Keybase, Patreon, Spotify, Steam, Vimeo, SoundCloud, Flickr, Telegram, GitLab, Bitbucket, HackTheBox, TryHackMe, Mastodon, Roblox.

**Email sources:**
MX record check for the domain, Gravatar profile lookup, and Have I Been Pwned breach search. HIBP requires an API key — set `HIBP_API_KEY` in the environment to enable it.

## Company lookup

Accepts a domain or company name. Add `--deep` for LLM-powered page analysis.

```
bun run src/index.ts -- company --domain stripe.com
bun run src/index.ts -- company --name "Stripe"
bun run src/index.ts -- company --domain stripe.com --deep
```

**Domain sources:**
RDAP WHOIS lookup (registration date, expiry, registrar, nameservers) and DNS A record resolution.

**Company name sources** (Google dork and direct links, open in browser):
Google search, LinkedIn company page, Crunchbase, Glassdoor, Trustpilot, news, OpenCorporates, SEC EDGAR, Twitter / X, Reddit.

## Deep search

When `--deep` is passed, the tool uses OpenRouter's headless browser to fetch target pages and an LLM to extract structured data. Requires `OPENROUTER_API_KEY` in the environment. Get a key at https://openrouter.ai/keys.

**Person deep search:** fetches GitHub, Keybase, and HackTheBox profiles derived from the name and extracts name, bio, location, occupation, employer, website, and social links.

**Company deep search:** fetches OpenCorporates and the company website, extracting industry, size, leadership, funding, and news.

**Domain deep search:** fetches the website at the domain and extracts site name, purpose, company info, and social links.

## Output

Hits are listed with a checkmark, label, URL, and detail summary. Misses are listed separately at the end.

## Extend

Add a new data source by dropping a file in `src/sources/`. Implement the `Source` interface (`id`, `label`, `category`, `run(query)`) and register it in `src/index.ts`.

```ts
import type { Source, SourceResult, Query } from "../types.js";

export const mySource: Source = {
  id: "my-source",
  label: "My data source",
  category: "person",
  async run(query: Query): Promise<SourceResult[]> {
    // ...
  },
};
```

## Test

```sh
bun run typecheck
```

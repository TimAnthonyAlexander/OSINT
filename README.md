# osint

CLI tool for gathering open-source intelligence on people and companies.

## Install

Requires [Bun](https://bun.sh).

```sh
bun install
```

## Person lookup

Accepts a name, username, or email. Multiple flags can be combined.

```
bun run src/index.ts -- person --name "John Doe"
bun run src/index.ts -- person --username jdoe
bun run src/index.ts -- person --email jdoe@example.com
```

When a name is given, the tool derives likely username candidates (e.g. `johndoe`, `john.doe`) and checks them across 25 social platforms automatically. Minimum candidate length is 4 characters.

**Name sources** (Google dork links, open in browser):
LinkedIn profiles, Twitter mentions, GitHub profiles, news mentions, PDF documents, Reddit mentions, Instagram, plus a general Google search.

**Username sources** (live HTTP checks, 25 platforms):
GitHub, Twitter / X, Instagram, Reddit, TikTok, YouTube, Twitch, Pinterest, Medium, Dev.to, HackerNews, Keybase, Patreon, Spotify, Steam, Vimeo, SoundCloud, Flickr, Telegram, GitLab, Bitbucket, HackTheBox, TryHackMe, Mastodon, Roblox.

**Email sources:**
MX record check for the domain, Gravatar profile lookup, and Have I Been Pwned breach search. HIBP requires an API key — set `HIBP_API_KEY` in the environment to enable it.

## Company lookup

Accepts a domain or company name.

```
bun run src/index.ts -- company --domain stripe.com
bun run src/index.ts -- company --name "Stripe"
```

**Domain sources:**
RDAP WHOIS lookup (registration date, expiry, registrar, nameservers) and DNS A record resolution.

**Company name sources** (Google dork and direct links, open in browser):
Google search, LinkedIn company page, Crunchbase, Glassdoor, Trustpilot, news, OpenCorporates, SEC EDGAR, Twitter / X, Reddit.

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

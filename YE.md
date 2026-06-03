# osint

## Stack

- Bun runtime, TypeScript, no framework
- `bun run src/index.ts` — CLI entry, runs directly (no build step)

## Conventions

- Double quotes, semicolons, trailing commas (Prettier, 100 print width)
- 2-space indentation, LF line endings (`.editorconfig`)
- Strict TS: `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`
- ES modules (`"type": "module"` in package.json, `.js` extensions in imports)
- No comments unless the WHY is non-obvious

## Architecture

- Plug-in source system: each data source implements the `Source` interface (`id`, `label`, `category`, `run(query)`) in `src/types.ts`
- Sources register themselves via `register()` in `src/sources/registry.ts`; `getSources(category)` filters by target
- Entry point `src/index.ts` registers all sources at import time, parses args, dispatches to matching sources, prints results
- `src/cli.ts` — manual arg parsing (no library), supports boolean flags (`--deep`), returns `Query | string` (string = help or error)
- `src/output.ts` — prints found/not-found with checkmarks, shows detail even for not-found items
- `src/openrouter.ts` — OpenRouter API client. Calls `https://openrouter.ai/api/v1/chat/completions` with Bearer auth, uses `openrouter:web_fetch` builtin tool for headless browser fetches, then a second call with `temperature: 0` extracts structured JSON. Default model `google/gemini-2.5-flash`

## Sources

- `src/sources/username.ts` — checks 25 platforms via batched HTTP (5 concurrent, 8s timeout, 500ms inter-batch delay). Exports `checkPlatforms(username, sourceLabel)` for reuse by name source
- `src/sources/name.ts` — generates Google dork URLs + derives up to 5 username candidates from the full name (`firstlast`, `first.last`, first-only, full-squashed, `first.middle`). Min candidate length 4. Calls `checkPlatforms` for each candidate
- `src/sources/email.ts` — MX check (`node:dns`), Gravatar (SHA-256 hash), HIPB breach lookup (requires `HIBP_API_KEY` env var)
- `src/sources/domain.ts` — RDAP WHOIS (Verisign, free, no key) + DNS A record via `Bun.dns.lookup`
- `src/sources/company-name.ts` — Google dork and direct links (LinkedIn, Crunchbase, OpenCorporates, SEC EDGAR, etc.)
- `src/sources/deep-search.ts` — activated by `--deep` flag. Uses OpenRouter headless browser + LLM to fetch profile/site pages and extract structured data. Person: GitHub, Keybase, HackTheBox profiles. Company: OpenCorporates + company website. Domain: the website itself

## Build & test

```
bun run typecheck   # tsc --noEmit
bun run format      # prettier --write .
bun run lint        # eslint src/
```

No test suite yet.

## Git

- Remote: `git@github.com:TimAnthonyAlexander/OSINT.git`
- Branch: `main`

## Notes

- RDAP only covers `.com` currently (hardcoded Verisign endpoint)
- The name source writes progress dots to stderr during candidate checks
- HIBP is silent when `HIBP_API_KEY` is not set (no error, just omitted)
- Deep search requires `OPENROUTER_API_KEY` — silent skip when not set
- Deep search uses two API calls per URL (fetch + parse); person search stops after the first profile with data
- Google search blocks headless browsers, so deep search targets specific profile pages directly rather than search results

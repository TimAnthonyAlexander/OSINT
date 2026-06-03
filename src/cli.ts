import type { Query, Target } from "./types.js";

export function parseArgs(argv: string[]): Query | string {
  const args = argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return help();
  }

  const target = args[0] as Target;
  if (target !== "person" && target !== "company") {
    return `Unknown target "${target}". Use "person" or "company".`;
  }

  const flags: Record<string, string | boolean> = {};
  for (let i = 1; i < args.length; i++) {
    const arg = args[i]!;
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }

  const deep = flags.deep === true;

  if (target === "person") {
    const { username, email, name } = flags as Record<string, string>;
    if (!username && !email && !name) {
      return "Provide at least one of --username, --email, or --name.";
    }
    return { target: "person", username, email, name, deep };
  }

  const { domain, name } = flags as Record<string, string>;
  if (!domain && !name) {
    return "Provide at least one of --domain or --name.";
  }
  return { target: "company", domain, name, deep };
}

function help(): string {
  return `osint — open-source intelligence CLI

  bun run src/index.ts -- person [flags]
  bun run src/index.ts -- company [flags]

Person flags:
  --username <name>   Check username across social platforms
  --email <address>   Check email in breach databases
  --name <full name>  Search name via public sources

Company flags:
  --domain <domain>   Look up domain registration and infrastructure
  --name <name>       Search company registrations and web presence

Shared flags:
  --deep              Use headless browser + LLM to fetch and parse pages (requires OPENROUTER_API_KEY)`;
}

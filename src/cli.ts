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

  const flags: Record<string, string> = {};
  for (let i = 1; i < args.length; i++) {
    const arg = args[i]!;
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      }
    }
  }

  if (target === "person") {
    const { username, email, name } = flags;
    if (!username && !email && !name) {
      return "Provide at least one of --username, --email, or --name.";
    }
    return { target: "person", username, email, name };
  }

  const { domain, name } = flags;
  if (!domain && !name) {
    return "Provide at least one of --domain or --name.";
  }
  return { target: "company", domain, name };
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
  --name <name>       Search company registrations and web presence`;
}

import { parseArgs } from "./cli.js";
import { printResults } from "./output.js";
import type { Query } from "./types.js";
import { getSources, register } from "./sources/registry.js";
import { usernameSource } from "./sources/username.js";
import { emailSource } from "./sources/email.js";
import { nameSource } from "./sources/name.js";
import { domainSource } from "./sources/domain.js";
import { companyNameSource } from "./sources/company-name.js";
import { deepSearchSource } from "./sources/deep-search.js";

register(usernameSource);
register(emailSource);
register(nameSource);
register(domainSource);
register(companyNameSource);

function getQuery(): Query {
  const result = parseArgs(process.argv);
  if (typeof result === "string") {
    console.log(result);
    process.exit(result.startsWith("Unknown") ? 1 : 0);
  }
  return result;
}

async function main() {
  const query = getQuery();

  console.log(`osint ${query.target} query\n`);

  const sources = getSources(query.target);
  if (sources.length === 0) {
    console.log(`No sources registered for "${query.target}".`);
    process.exit(1);
  }

  const allResults = (await Promise.all(sources.map((s) => s.run(query)))).flat();

  // Deep search runs for any target when --deep is passed
  if (query.deep) {
    const deepResults = await deepSearchSource.run(query);
    if (deepResults.length > 0) {
      console.log();
    }
    allResults.push(...deepResults);
  }

  printResults(allResults);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

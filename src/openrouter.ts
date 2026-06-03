const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

type Message = {
  role: "user" | "assistant" | "system" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
};

type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type ToolDefinition = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

type BuiltinTool = {
  type: "openrouter:web_fetch";
  max_content_tokens?: number;
  allowed_domains?: string[];
  blocked_domains?: string[];
};

function apiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set. Get a key at https://openrouter.ai/keys");
  return key;
}

async function callModel(opts: {
  model?: string;
  messages: Message[];
  tools?: (ToolDefinition | BuiltinTool)[];
  responseFormat?: { type: "json_object" };
  maxTokens?: number;
  temperature?: number;
}): Promise<{
  content: string;
  toolCalls?: ToolCall[];
  usage?: { input: number; output: number };
}> {
  const body: Record<string, unknown> = {
    model: opts.model ?? DEFAULT_MODEL,
    messages: opts.messages,
    stream: false,
  };
  if (opts.tools) body.tools = opts.tools;
  if (opts.responseFormat) body.response_format = opts.responseFormat;
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  if (opts.temperature !== undefined) body.temperature = opts.temperature;

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices: Array<{
      message: {
        content: string | null;
        tool_calls?: ToolCall[];
      };
      finish_reason: string;
    }>;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
    };
  };

  const choice = data.choices?.[0];
  if (!choice) throw new Error("OpenRouter: no choices in response");

  return {
    content: choice.message.content ?? "",
    toolCalls: choice.message.tool_calls,
    usage: data.usage
      ? { input: data.usage.prompt_tokens, output: data.usage.completion_tokens }
      : undefined,
  };
}

// If the model used a tool, we need to send the tool result back and get the final answer.
// This handles single-turn tool call loops.
async function callWithBuiltinWebFetch(prompt: string, url: string): Promise<string> {
  const messages: Message[] = [{ role: "user", content: prompt }];

  process.stderr.write(`  fetching ${url}... `);
  const result1 = await callModel({
    messages,
    tools: [{ type: "openrouter:web_fetch", max_content_tokens: 6000 }],
    maxTokens: 1024,
  });

  if (result1.content && result1.content.length >= 20) {
    process.stderr.write(`${result1.content.length} chars\n`);
    return result1.content;
  }

  if (!result1.toolCalls || result1.toolCalls.length === 0) {
    process.stderr.write("empty response\n");
    return "";
  }

  // Model used web_fetch tool — send tool results back for final answer
  process.stderr.write("tool call... ");
  messages.push({
    role: "assistant",
    content: null,
    tool_calls: result1.toolCalls,
  });

  for (const tc of result1.toolCalls) {
    messages.push({
      role: "tool",
      content: "Tool result: page fetched successfully. See your previous response for details.",
      tool_call_id: tc.id,
    });
  }

  const result2 = await callModel({
    messages,
    tools: [{ type: "openrouter:web_fetch", max_content_tokens: 6000 }],
    maxTokens: 2048,
  });

  const content = result2.content || result1.content;
  process.stderr.write(`${content.length} chars\n`);
  return content;
}

export async function fetchAndParse(
  url: string,
  extractionPrompt: string,
  responseFormat?: Record<string, unknown>,
): Promise<string> {
  const fetchPrompt = `Fetch this URL: ${url}

Return the full page content. Focus on text content — names, bios, profiles, company details, dates, locations, links, and any structured data. Strip navigation, ads, and boilerplate.`;
  const content = await callWithBuiltinWebFetch(fetchPrompt, url);
  if (!content || content.length < 20) {
    process.stderr.write("  skipping parse (no content)\n");
    return "";
  }

  process.stderr.write("  parsing... ");

  const schemaDesc = responseFormat
    ? `\n\nRespond ONLY with a JSON object matching this TypeScript type:\n${JSON.stringify(responseFormat, null, 2)}`
    : "";

  const parsePrompt = `Extract structured information from the following web page content. Focus on ${extractionPrompt}.${schemaDesc}\n\nPAGE CONTENT:\n${content.slice(0, 8000)}`;

  const result = await callModel({
    messages: [{ role: "user", content: parsePrompt }],
    maxTokens: 2048,
    temperature: 0,
    ...(responseFormat ? { responseFormat: { type: "json_object" } } : {}),
  });

  process.stderr.write(`${result.content.length} chars\n`);
  return result.content;
}

export { callModel };

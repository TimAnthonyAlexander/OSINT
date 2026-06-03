import type { Source, SourceResult, Query } from "../types.js";

type Platform = {
  label: string;
  url(username: string): string;
  found(response: Response, body: string): boolean;
};

const platforms: Platform[] = [
  {
    label: "GitHub",
    url: (u) => `https://github.com/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Twitter / X",
    url: (u) => `https://x.com/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Instagram",
    url: (u) => `https://instagram.com/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Reddit",
    url: (u) => `https://reddit.com/user/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "TikTok",
    url: (u) => `https://tiktok.com/@${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "YouTube",
    url: (u) => `https://youtube.com/@${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Twitch",
    url: (u) => `https://twitch.tv/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Pinterest",
    url: (u) => `https://pinterest.com/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Medium",
    url: (u) => `https://medium.com/@${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Dev.to",
    url: (u) => `https://dev.to/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "HackerNews",
    url: (u) => `https://news.ycombinator.com/user?id=${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Keybase",
    url: (u) => `https://keybase.io/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Patreon",
    url: (u) => `https://patreon.com/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Spotify",
    url: (u) => `https://open.spotify.com/user/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Steam",
    url: (u) => `https://steamcommunity.com/id/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Vimeo",
    url: (u) => `https://vimeo.com/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "SoundCloud",
    url: (u) => `https://soundcloud.com/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Flickr",
    url: (u) => `https://flickr.com/people/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Telegram",
    url: (u) => `https://t.me/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "GitLab",
    url: (u) => `https://gitlab.com/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Bitbucket",
    url: (u) => `https://bitbucket.org/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "HackTheBox",
    url: (u) => `https://app.hackthebox.com/profile/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "TryHackMe",
    url: (u) => `https://tryhackme.com/p/${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Mastodon",
    url: (u) => `https://mastodon.social/@${u}`,
    found: (r) => r.status === 200,
  },
  {
    label: "Roblox",
    url: (u) => `https://www.roblox.com/user.aspx?username=${u}`,
    found: (r) => r.status === 200,
  },
];

export const usernameSource: Source = {
  id: "username",
  label: "Username scan",
  category: "person",
  async run(query: Query): Promise<SourceResult[]> {
    if (query.target !== "person" || !query.username) return [];
    const username = query.username;
    const results: SourceResult[] = [];

    // Fire requests with a small concurrency cap to avoid rate limiting
    const batch = 5;
    for (let i = 0; i < platforms.length; i += batch) {
      const chunk = platforms.slice(i, i + batch);
      const chunkResults = await Promise.all(
        chunk.map(async (p): Promise<SourceResult> => {
          const url = p.url(username);
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(url, {
              signal: controller.signal,
              headers: { "User-Agent": "osint-cli/0.1" },
            });
            clearTimeout(timeout);
            const body = await res.text().catch(() => "");
            return {
              source: "username",
              label: p.label,
              found: p.found(res, body),
              url,
            };
          } catch {
            return {
              source: "username",
              label: p.label,
              found: false,
              url,
              detail: "request failed",
            };
          }
        }),
      );
      results.push(...chunkResults);
      // Small delay between batches
      if (i + batch < platforms.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return results;
  },
};

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  WEBHOOK_SECRET?: string;
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  NOTION_TOKEN?: string;
  NOTION_DATABASE_ID?: string;
}

interface CloudflareExecutionContext {
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
}

interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

interface CloudflareCacheStorage {
  default: Cache;
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

function applySecurityHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!newHeaders.has(key)) {
      newHeaders.set(key, value);
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

async function triggerGitHubDispatch(env: Env): Promise<Response> {
  const repo = env.GITHUB_REPO;
  const token = env.GITHUB_TOKEN;

  if (!repo || !token) {
    return new Response(
      JSON.stringify({ error: "Missing GITHUB_REPO or GITHUB_TOKEN environment variable" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const ghUrl = `https://api.github.com/repos/${repo}/actions/workflows/astro.yml/dispatches`;
  const res = await fetch(ghUrl, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "Cloudflare-Worker-Notion-CMS",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: "master" }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    return new Response(
      JSON.stringify({ error: `GitHub API error: ${res.status}`, details: errorText }),
      { status: res.status, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: "GitHub Actions build triggered successfully" }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

async function checkAndSyncNotion(env: Env, _ctx: CloudflareExecutionContext): Promise<void> {
  const token = env.NOTION_TOKEN;
  const dbId = env.NOTION_DATABASE_ID;
  const repo = env.GITHUB_REPO;
  const ghToken = env.GITHUB_TOKEN;
  if (!token || !dbId || !repo || !ghToken) return;

  let lastBuildCompletedTime = 0;
  try {
    const ghRunsRes = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/astro.yml/runs?status=completed&conclusion=success&per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${ghToken}`,
          "User-Agent": "Cloudflare-Worker-Notion-CMS",
        },
      },
    );
    if (ghRunsRes.ok) {
      const runsData = (await ghRunsRes.json()) as {
        workflow_runs?: Array<{ updated_at: string }>;
      };
      const lastRun = runsData.workflow_runs?.[0];
      if (lastRun?.updated_at) {
        lastBuildCompletedTime = new Date(lastRun.updated_at).getTime();
      }
    }
  } catch {
  }

  const cleanDbId = dbId.replace(/-/g, "");
  const formattedDbId = cleanDbId.length === 32
    ? `${cleanDbId.slice(0, 8)}-${cleanDbId.slice(8, 12)}-${cleanDbId.slice(12, 16)}-${cleanDbId.slice(16, 20)}-${
      cleanDbId.slice(20)
    }`
    : dbId;

  const notionRes = await fetch(`https://api.notion.com/v1/databases/${formattedDbId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      page_size: 5,
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
    }),
  });

  if (!notionRes.ok) return;

  const data = (await notionRes.json()) as { results?: Array<{ last_edited_time: string }> };
  if (!data.results || data.results.length === 0) return;

  const latestTime = data.results[0].last_edited_time;
  if (!latestTime) return;

  const notionLatestTime = new Date(latestTime).getTime();

  if (lastBuildCompletedTime > 0 && notionLatestTime <= lastBuildCompletedTime) {
    return;
  }

  await triggerGitHubDispatch(env);
}
function getDefaultCache(): Cache | undefined {
  if (typeof caches !== "undefined" && "default" in caches) {
    const cacheStorage = caches as unknown as CloudflareCacheStorage;
    return cacheStorage.default;
  }
  return undefined;
}

async function handleImageProxy(request: Request, ctx: CloudflareExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get("url");

  if (!imageUrl) {
    return new Response("Missing url query parameter", { status: 400 });
  }

  const defaultCache = getDefaultCache();
  const cacheKey = new Request(url.toString(), request);

  if (defaultCache) {
    const cachedResponse = await defaultCache.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  const originResponse = await fetch(imageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!originResponse.ok) {
    return new Response(`Failed to fetch image: ${originResponse.status}`, {
      status: originResponse.status,
    });
  }

  const responseHeaders = new Headers(originResponse.headers);
  responseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");

  const proxiedResponse = new Response(originResponse.body, {
    status: 200,
    headers: responseHeaders,
  });

  if (defaultCache) {
    ctx.waitUntil(defaultCache.put(cacheKey, proxiedResponse.clone()));
  }
  return proxiedResponse;
}

export default {
  async fetch(request: Request, env: Env, ctx: CloudflareExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/webhook/notion" && request.method === "POST") {
      const authHeader = request.headers.get("Authorization");
      const secret = env.WEBHOOK_SECRET;

      if (secret && authHeader !== `Bearer ${secret}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      return triggerGitHubDispatch(env);
    }

    if (url.pathname === "/api/image-proxy") {
      return handleImageProxy(request, ctx);
    }

    const staticResponse = await env.ASSETS.fetch(request);
    return applySecurityHeaders(staticResponse);
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: CloudflareExecutionContext): Promise<void> {
    ctx.waitUntil(checkAndSyncNotion(env, ctx));
  },
};

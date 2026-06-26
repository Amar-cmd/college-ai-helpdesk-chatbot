import { WEB_SEARCH_CONFIG } from "@/config/web-search";
import type { WebSearchResult, WebSearchSource } from "./types";

type BraveSearchApiResponse = {
  web?: {
    results?: Array<{
      title?: string;
      url?: string;
      description?: string;
      extra_snippets?: string[];
    }>;
  };
  message?: string;
  error?: {
    message?: string;
  };
};

function buildSearchQuery(question: string) {
  const safeQuestion = question.trim().slice(0, 300);

  if (WEB_SEARCH_CONFIG.siteHints.length === 0) {
    return safeQuestion;
  }

  const siteClause = WEB_SEARCH_CONFIG.siteHints
    .map((site) => `site:${site}`)
    .join(" OR ");

  return `${safeQuestion} ${siteClause}`.trim();
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isAllowedSource(url: string) {
  if (WEB_SEARCH_CONFIG.allowedDomains.length === 0) {
    return true;
  }

  const hostname = getHostname(url);

  if (!hostname) {
    return false;
  }

  return WEB_SEARCH_CONFIG.allowedDomains.some((domain) => {
    const cleanDomain = domain.replace(/^www\./, "");
    return hostname === cleanDomain || hostname.endsWith(`.${cleanDomain}`);
  });
}

function cleanText(value: string | undefined) {
  return (value || "")
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim();
}

function formatWebSearchContext(sources: WebSearchSource[]) {
  if (sources.length === 0) {
    return "";
  }

  return sources
    .map((source, index) => {
      return [
        `Web Source ${index + 1}: ${source.title}`,
        `URL: ${source.url}`,
        `Snippet: ${source.snippet}`,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

function mapBraveResults(responseBody: BraveSearchApiResponse) {
  const results = responseBody.web?.results ?? [];

  return results
    .map<WebSearchSource | null>((result) => {
      const title = cleanText(result.title);
      const url = cleanText(result.url);
      const description = cleanText(result.description);
      const extraSnippet = cleanText(result.extra_snippets?.join(" "));

      const snippet = [description, extraSnippet]
        .filter(Boolean)
        .join(" ")
        .slice(0, 800);

      if (!title || !url || !snippet) {
        return null;
      }

      if (!isAllowedSource(url)) {
        return null;
      }

      return {
        title,
        url,
        snippet,
      };
    })
    .filter((source): source is WebSearchSource => Boolean(source))
    .slice(0, WEB_SEARCH_CONFIG.resultLimit);
}

export async function retrieveWebSearchForQuestion(
  question: string
): Promise<WebSearchResult> {
  const query = buildSearchQuery(question);

  if (!WEB_SEARCH_CONFIG.enabled) {
    return {
      ok: false,
      query,
      context: "",
      sources: [],
      error: "Web search fallback is disabled.",
      disabled: true,
    };
  }

  if (!WEB_SEARCH_CONFIG.braveApiKey) {
    return {
      ok: false,
      query,
      context: "",
      sources: [],
      error: "Missing BRAVE_SEARCH_API_KEY.",
      disabled: true,
    };
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, WEB_SEARCH_CONFIG.timeoutMs);

  try {
    const params = new URLSearchParams({
      q: query,
      count: String(WEB_SEARCH_CONFIG.resultLimit),
      country: "in",
      search_lang: "en",
      safesearch: "moderate",
      text_decorations: "false",
      spellcheck: "true",
    });

    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": WEB_SEARCH_CONFIG.braveApiKey,
        },
        signal: controller.signal,
      }
    );

    const responseBody = (await response.json()) as BraveSearchApiResponse;

    if (!response.ok) {
      return {
        ok: false,
        query,
        context: "",
        sources: [],
        error:
          responseBody.error?.message ||
          responseBody.message ||
          "Web search request failed.",
      };
    }

    const sources = mapBraveResults(responseBody);
    const context = formatWebSearchContext(sources);

    if (!context) {
      return {
        ok: false,
        query,
        context: "",
        sources: [],
        error: "No usable web search results were found.",
      };
    }

    return {
      ok: true,
      query,
      context,
      sources,
    };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";

    return {
      ok: false,
      query,
      context: "",
      sources: [],
      error: isTimeout
        ? "Web search request timed out."
        : "Web search request failed unexpectedly.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
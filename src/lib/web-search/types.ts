export type WebSearchSource = {
  title: string;
  url: string;
  snippet: string;
};

export type WebSearchResult =
  | {
      ok: true;
      query: string;
      context: string;
      sources: WebSearchSource[];
    }
  | {
      ok: false;
      query: string;
      context: "";
      sources: [];
      error: string;
      disabled?: boolean;
    };
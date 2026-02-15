export interface LinkMatch {
  id: string;
  targetPageUrl: string;
  foundHref: string;
  anchorText: string;
  decodedHref: string;
  matchType: 'exact' | 'partial' | 'none';
  matchedSource: string | null;
}

export interface AnalysisStatus {
  total: number;
  processed: number;
  currentUrl: string;
}

export interface ScrapeResult {
  url: string;
  links: { href: string; text: string }[];
  error?: string;
}

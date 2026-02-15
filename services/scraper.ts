import { safeDecodeURI, normalizeUrl } from '../utils/helpers';
import { ScrapeResult } from '../types';

interface ProxyConfig {
  name: string;
  getUrl: (target: string) => string;
  extract: (response: Response) => Promise<string>;
}

// Proxy rotation strategy to improve reliability
const PROXIES: ProxyConfig[] = [
  {
    name: 'CorsProxy.io',
    getUrl: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    extract: async (res) => {
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return res.text();
    }
  },
  {
    name: 'AllOrigins',
    // disableCache=true ensures we get fresh content and avoids some stale CORS headers
    getUrl: (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&disableCache=true`,
    extract: async (res) => {
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      return data.contents;
    }
  }
];

/**
 * Fetches the source links from a Google Sheet (must be public).
 */
export const fetchSourceLinks = async (sheetId: string): Promise<string[]> => {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  const response = await fetch(csvUrl);
  
  if (!response.ok) {
    throw new Error('Failed to fetch Google Sheet. Make sure the sheet is "Public" or "Anyone with the link can view".');
  }

  const csvText = await response.text();
  const rows = csvText.split(/\r?\n/);
  
  // extracting links from the first column of each row
  const links: string[] = [];
  rows.forEach(row => {
    // Simple CSV split by comma (handles basic cases)
    const columns = row.split(',');
    if (columns.length > 0) {
      const cell = columns[0].trim();
      // Basic URL validation
      if (cell && (cell.startsWith('http') || cell.startsWith('www'))) {
        links.push(normalizeUrl(cell));
      }
    }
  });

  return links;
};

/**
 * Scrapes a target page for links within the specific class.
 */
export const scrapeTargetPage = async (targetUrl: string): Promise<ScrapeResult> => {
  let htmlContent = '';
  let lastError = '';

  // Try proxies in order until one succeeds
  for (const proxy of PROXIES) {
    try {
      const proxyUrl = proxy.getUrl(targetUrl);
      const response = await fetch(proxyUrl);
      
      htmlContent = await proxy.extract(response);
      
      if (htmlContent) {
        break; // Success
      }
    } catch (e: any) {
      console.warn(`Proxy ${proxy.name} failed for ${targetUrl}:`, e);
      lastError = e.message;
      // Continue to next proxy
    }
  }

  if (!htmlContent) {
    return { 
      url: targetUrl, 
      links: [], 
      error: `Failed to fetch page. All proxies failed. Last error: ${lastError}` 
    };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Selector based on prompt: "post-show__content__body typography"
    // Assuming these are classes on the same element or nested. 
    // Most likely: <div class="post-show__content__body typography">
    const contentBody = doc.querySelector('.post-show__content__body.typography');
    
    if (!contentBody) {
      return { url: targetUrl, links: [], error: 'Class ".post-show__content__body.typography" not found on page.' };
    }

    const anchors = contentBody.querySelectorAll('a');
    const foundLinks: { href: string; text: string }[] = [];

    anchors.forEach((a) => {
      let href = a.getAttribute('href');
      if (href) {
        // Resolve relative URLs to absolute
        try {
          const absoluteUrl = new URL(href, targetUrl).href;
          foundLinks.push({
            href: absoluteUrl,
            text: a.innerText.trim()
          });
        } catch (e) {
            // Keep original if resolution fails
             foundLinks.push({
                href: href,
                text: a.innerText.trim()
            });
        }
      }
    });

    return { url: targetUrl, links: foundLinks };

  } catch (error: any) {
    return { url: targetUrl, links: [], error: error.message || 'Unknown parsing error' };
  }
};
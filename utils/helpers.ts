/**
 * Decodes a URL, specifically handling percent-encoded UTF-8 characters (e.g., Persian).
 * Fails gracefully by returning the original string if decoding fails.
 */
export const safeDecodeURI = (uri: string): string => {
  try {
    return decodeURIComponent(uri);
  } catch (e) {
    try {
      return decodeURI(uri);
    } catch (e2) {
      return uri;
    }
  }
};

/**
 * Extracts the spreadsheet ID from a Google Sheet URL.
 */
export const extractGoogleSheetId = (url: string): string | null => {
  const matches = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return matches ? matches[1] : null;
};

/**
 * Normalizes a URL for comparison (removes trailing slashes, converts to lower case if needed).
 * Note: For exact matching required by the prompt, we should be careful about lowercasing strictly,
 * but usually domains are case-insensitive while paths are case-sensitive. 
 * To be robust, we will trim and potentially remove trailing slashes for consistency.
 */
export const normalizeUrl = (url: string): string => {
  let normalized = url.trim();
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

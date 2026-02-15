import React, { useState } from 'react';
import InputSection from './components/InputSection';
import ResultsTable from './components/ResultsTable';
import { extractGoogleSheetId, safeDecodeURI, normalizeUrl, generateId } from './utils/helpers';
import { fetchSourceLinks, scrapeTargetPage } from './services/scraper';
import { LinkMatch } from './types';
import { Layers } from 'lucide-react';

const App: React.FC = () => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [targetUrls, setTargetUrls] = useState('');
  const [results, setResults] = useState<LinkMatch[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const handleAnalyze = async () => {
    setError(null);
    setResults([]);
    setIsAnalyzing(true);
    setProgress('Initializing...');

    try {
      // 1. Get Google Sheet ID
      const sheetId = extractGoogleSheetId(sheetUrl);
      if (!sheetId) {
        throw new Error('Invalid Google Sheet URL. Please ensure it follows the format: docs.google.com/spreadsheets/d/ID/...');
      }

      // 2. Fetch Source Links
      setProgress('Fetching source links from Google Sheet...');
      const sourceLinksRaw = await fetchSourceLinks(sheetId);
      const sourceLinks = sourceLinksRaw.map(normalizeUrl); // Normalize source links
      
      console.log('Source Links:', sourceLinks);

      if (sourceLinks.length === 0) {
        throw new Error('No valid links found in the provided Google Sheet (Column A).');
      }

      // 3. Process Target URLs
      const targets = targetUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      if (targets.length === 0) {
        throw new Error('Please enter at least one target URL.');
      }

      // 4. Scrape and Compare
      const allMatches: LinkMatch[] = [];

      for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        setProgress(`Analyzing ${i + 1}/${targets.length}: ${target}`);
        
        const scrapeResult = await scrapeTargetPage(target);
        
        if (scrapeResult.error) {
          console.error(`Error scraping ${target}:`, scrapeResult.error);
           allMatches.push({
             id: generateId(),
             targetPageUrl: target,
             foundHref: '-',
             decodedHref: 'Error Accessing Page',
             anchorText: scrapeResult.error,
             matchType: 'none',
             matchedSource: null
           });
           continue;
        }

        // Check if any matches found
        let foundAnyMatch = false;

        // Check each found link against source list
        for (const link of scrapeResult.links) {
            const foundDecoded = safeDecodeURI(link.href);
            const foundDecodedNormalized = normalizeUrl(foundDecoded);

            let matchType: 'exact' | 'partial' | 'none' = 'none';
            let matchedSource: string | null = null;

            // Check against all source links
            for (const source of sourceLinks) {
                const sourceDecoded = safeDecodeURI(source);
                const sourceNormalized = normalizeUrl(sourceDecoded);
                
                if (foundDecodedNormalized === sourceNormalized) {
                    matchType = 'exact';
                    matchedSource = source;
                    break; 
                } else if (foundDecodedNormalized.includes(sourceNormalized)) {
                     matchType = 'partial';
                     matchedSource = source;
                }
            }

            if (matchType !== 'none') {
                foundAnyMatch = true;
                allMatches.push({
                    id: generateId(),
                    targetPageUrl: target,
                    foundHref: link.href,
                    decodedHref: foundDecoded,
                    anchorText: link.text,
                    matchType: matchType,
                    matchedSource: matchedSource
                });
            }
        }
        
        // If no matches were found for this target page, we still want it to appear in the results list
        // so the user knows it was checked but nothing was found.
        if (!foundAnyMatch) {
             allMatches.push({
                id: generateId(),
                targetPageUrl: target,
                foundHref: '',
                decodedHref: '',
                anchorText: '',
                matchType: 'none',
                matchedSource: null
            });
        }
      }

      setResults(allMatches);
      setProgress('');

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        
      {/* Navbar / Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Link Audit Pro</h1>
           </div>
           <div className="text-sm text-slate-500 hidden sm:block">
              Internal Link Validator
           </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Status Messages */}
        <div className="mb-6">
            {error && (
               <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-3 shadow-sm">
                 <div className="p-1 bg-red-100 rounded-full"><Layers className="w-4 h-4 rotate-180" /></div>
                 {error}
               </div>
             )}
             {progress && isAnalyzing && (
               <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-700 flex items-center gap-3 shadow-sm animate-pulse">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                 {progress}
               </div>
             )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Inputs (Fixed Width on Large Screens) */}
          <div className="lg:col-span-4 xl:col-span-3">
             <InputSection
                sheetUrl={sheetUrl}
                setSheetUrl={setSheetUrl}
                targetUrls={targetUrls}
                setTargetUrls={setTargetUrls}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
             />
          </div>

          {/* Right Column: Results (Expands) */}
          <div className="lg:col-span-8 xl:col-span-9">
            <ResultsTable results={results} />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;

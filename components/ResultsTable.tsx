import React from 'react';
import { LinkMatch } from '../types';
import { ExternalLink, CheckCircle, AlertTriangle, XCircle, ArrowRight, Link as LinkIcon, AlertOctagon } from 'lucide-react';

interface ResultsTableProps {
  results: LinkMatch[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  // Group results by targetPageUrl
  const groupedResults = results.reduce((acc, curr) => {
    if (!acc[curr.targetPageUrl]) {
      acc[curr.targetPageUrl] = [];
    }
    acc[curr.targetPageUrl].push(curr);
    return acc;
  }, {} as Record<string, LinkMatch[]>);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
           <LinkIcon className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">No Results Yet</h3>
        <p className="text-slate-500 max-w-sm">
          Enter your Google Sheet URL and target pages on the left to start auditing links.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedResults).map(([targetUrl, matches]) => {
        const hasError = matches.some(m => m.matchType === 'none' && m.decodedHref === 'Error Accessing Page');
        const matchCount = matches.filter(m => m.matchType !== 'none').length;
        
        // Determine Card Border/Header Color based on status
        let borderColor = 'border-slate-200';
        let headerBg = 'bg-white';
        let statusIcon = <CheckCircle className="w-5 h-5 text-emerald-500" />;

        if (hasError) {
             borderColor = 'border-red-200';
             headerBg = 'bg-red-50';
             statusIcon = <AlertOctagon className="w-5 h-5 text-red-500" />;
        } else if (matchCount === 0) {
             borderColor = 'border-orange-200';
             headerBg = 'bg-orange-50';
             statusIcon = <AlertTriangle className="w-5 h-5 text-orange-500" />;
        }

        return (
          <div key={targetUrl} className={`bg-white rounded-2xl shadow-sm border ${borderColor} overflow-hidden transition-all hover:shadow-md`}>
            {/* Card Header */}
            <div className={`px-6 py-4 border-b ${borderColor} ${headerBg} flex items-center justify-between flex-wrap gap-4`}>
              <div className="flex items-center gap-3 overflow-hidden">
                 {statusIcon}
                 <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target Page</span>
                    <a 
                      href={targetUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-sm font-medium text-slate-900 hover:text-indigo-600 truncate flex items-center gap-1.5 transition-colors"
                    >
                      {targetUrl}
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                 </div>
              </div>
              
              <div className="flex items-center gap-2">
                 {hasError ? (
                   <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Error</span>
                 ) : (
                   <span className={`px-3 py-1 text-xs font-bold rounded-full ${matchCount > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                     {matchCount} Match{matchCount !== 1 ? 'es' : ''} Found
                   </span>
                 )}
              </div>
            </div>

            {/* Card Content */}
            <div className="overflow-x-auto">
                {hasError ? (
                    <div className="p-8 text-center text-red-600 bg-red-50/50">
                        <p className="font-medium">{matches[0].anchorText}</p>
                        <p className="text-sm opacity-80 mt-1">Check if the URL is correct or if the site is blocking access.</p>
                    </div>
                ) : matchCount === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <p>No links from your source sheet were found on this page.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">Type</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Found Link (On Page)</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Anchor Text</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Matched Source</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {matches.map((match) => (
                            <tr key={match.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    {match.matchType === 'exact' && (
                                    <div className="tooltip" title="Exact Match">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    )}
                                    {match.matchType === 'partial' && (
                                    <div className="tooltip" title="Partial Match">
                                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="max-w-xs break-all text-sm font-medium text-slate-800" dir="auto">
                                        {match.decodedHref}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-600" dir="auto">
                                        {match.anchorText || <span className="italic text-slate-400 opacity-50">No Text</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-500 break-all bg-slate-50 rounded-lg px-2 py-1 border border-slate-100 max-w-xs">
                                        <LinkIcon className="w-3 h-3 text-slate-400 shrink-0" />
                                        {match.matchedSource}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResultsTable;

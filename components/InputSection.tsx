import React from 'react';
import { FileSpreadsheet, Globe, Play, Loader2, Link2 } from 'lucide-react';

interface InputSectionProps {
  sheetUrl: string;
  setSheetUrl: (url: string) => void;
  targetUrls: string;
  setTargetUrls: (urls: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({
  sheetUrl,
  setSheetUrl,
  targetUrls,
  setTargetUrls,
  onAnalyze,
  isAnalyzing,
}) => {
  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-6 md:p-8 space-y-8 h-fit sticky top-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Link2 className="w-5 h-5 text-indigo-400" />
          Configuration
        </h2>
        <p className="text-slate-400 text-sm">
          Setup your source sheet and target pages to begin the audit.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Google Sheet Source
          </label>
          <input
            type="text"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white placeholder-slate-500 text-sm shadow-inner"
          />
          <p className="text-xs text-slate-500 mt-2">
            Ensure the sheet is public or visible to "Anyone with the link".
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            Target Pages
          </label>
          <textarea
            value={targetUrls}
            onChange={(e) => setTargetUrls(e.target.value)}
            placeholder="https://example.com/blog/article-1&#10;https://example.com/blog/article-2"
            className="w-full h-48 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white placeholder-slate-500 font-mono text-sm shadow-inner resize-none"
          />
          <div className="flex justify-between items-center mt-2">
             <p className="text-xs text-slate-500">One URL per line.</p>
             <span className="text-xs text-slate-500">{targetUrls.split('\n').filter(l => l.trim()).length} URLs detected</span>
          </div>
        </div>
      </div>

      <button
        onClick={onAnalyze}
        disabled={isAnalyzing || !sheetUrl || !targetUrls}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm tracking-wide uppercase transition-all shadow-lg hover:shadow-indigo-500/25 ${
          isAnalyzing || !sheetUrl || !targetUrls
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 hover:scale-[1.02] active:scale-[0.98]'
        }`}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Running Audit...
          </>
        ) : (
          <>
            <Play className="w-5 h-5 fill-current" />
            Start Audit
          </>
        )}
      </button>
    </div>
  );
};

export default InputSection;

import { BibleVerse } from '../types/bible';
import { useGeminiAnalysis } from '../hooks/useGeminiAnalysis';
import LoadingSpinner from './LoadingSpinner';

export default function VerseDetails({ verse }: { verse: BibleVerse | null }) {
  const { analysis, isLoading, error, analyzeVerse } = useGeminiAnalysis();

  if (!verse) return null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="p-8 border rounded-xl bg-white/50 dark:bg-black/20 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              {verse.book} {verse.chapter}:{verse.verse}
            </h2>
            <p className="text-xl text-foreground/80">{verse.text}</p>
          </div>
          <button
            onClick={() => analyzeVerse(verse)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                <span>Analyzing...</span>
              </>
            ) : (
              'Analyze with AI'
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {analysis && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                Key Themes
              </h3>
              <ul className="space-y-2">
                {analysis.themes?.map((theme, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{theme}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                Related Verses
              </h3>
              <ul className="space-y-2">
                {analysis.relatedVerses?.map((verse, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{verse}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="md:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                Theological Significance
              </h3>
              <p className="text-foreground/80 leading-relaxed">
                {analysis.significance}
              </p>
            </section>

            <section className="md:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                Historical Context
              </h3>
              <p className="text-foreground/80 leading-relaxed">
                {analysis.context}
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
} 
import { BibleVerse } from '../types/bible';
import { useGeminiAnalysis } from '../hooks/useGeminiAnalysis';
import LoadingSpinner from './LoadingSpinner';

export default function VerseDetails({ verse }: { verse: BibleVerse | null }) {
  const { analysis, isLoading, error, analyzeVerse } = useGeminiAnalysis();

  if (!verse) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      {/* Selected Verse */}
      <div className="p-6 border rounded-lg bg-black/[.03] dark:bg-white/[.03] mb-8">
        <h2 className="text-2xl font-semibold mb-4">{verse.book} {verse.chapter}:{verse.verse}</h2>
        <p className="text-xl">{verse.text}</p>
        <button
          onClick={() => analyzeVerse(verse)}
          className="mt-4 bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner /> : 'Analyze with AI'}
        </button>
      </div>

      {/* AI Analysis */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="space-y-4">
            <h3 className="text-xl font-semibold">Key Themes</h3>
            <ul className="space-y-2">
              {analysis.themes.map((theme, i) => (
                <li key={i} className="p-3 bg-black/[.02] dark:bg-white/[.02] rounded">
                  {theme}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold">Related Verses</h3>
            <ul className="space-y-2">
              {analysis.relatedVerses.map((verse, i) => (
                <li key={i} className="p-3 bg-black/[.02] dark:bg-white/[.02] rounded">
                  {verse}
                </li>
              ))}
            </ul>
          </section>

          <section className="md:col-span-2 space-y-4">
            <h3 className="text-xl font-semibold">Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-black/[.02] dark:bg-white/[.02] rounded">
                <h4 className="font-medium mb-2">Theological Significance</h4>
                <p>{analysis.significance}</p>
              </div>
              <div className="p-4 bg-black/[.02] dark:bg-white/[.02] rounded">
                <h4 className="font-medium mb-2">Historical Context</h4>
                <p>{analysis.context}</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
} 
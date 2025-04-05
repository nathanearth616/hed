import { useGeminiAnalysis } from '../hooks/useGeminiAnalysis';
import { BibleVerse } from '../types/bible';
import LoadingSpinner from './LoadingSpinner';

export default function VerseAnalysis({ verse }: { verse: BibleVerse | null }) {
  const { analysis, isLoading, error, analyzeVerse } = useGeminiAnalysis();

  if (!verse) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">AI Analysis</h2>
        <button
          onClick={() => analyzeVerse(verse)}
          className="bg-foreground text-background px-4 py-2 rounded flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              <span>Analyzing</span>
            </>
          ) : (
            'Analyze with AI'
          )}
        </button>
      </div>

      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      {analysis && (
        <div className="space-y-6">
          <section>
            <h3 className="font-semibold mb-2">Key Themes</h3>
            <ul className="list-disc list-inside">
              {analysis.themes.map((theme, i) => (
                <li key={i}>{theme}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Related Verses</h3>
            <ul className="list-disc list-inside">
              {analysis.relatedVerses.map((verse, i) => (
                <li key={i}>{verse}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Theological Significance</h3>
            <p>{analysis.significance}</p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Historical Context</h3>
            <p>{analysis.context}</p>
          </section>
        </div>
      )}
    </div>
  );
} 
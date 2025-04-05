'use client';

import BibleSearch from './components/BibleSearch';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background/95 to-black/[.05] dark:to-white/[.05]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="text-center mb-20">
          <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
            הדhed
          </h1>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
            Explore Biblical insights with AI-powered search and discover interconnected verses through interactive visualization
          </p>
        </header>
        
        <BibleSearch />
      </div>
    </main>
  );
}

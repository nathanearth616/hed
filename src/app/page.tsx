'use client';

import BibleSearch from './components/BibleSearch';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-black/[.02] dark:to-white/[.02]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">הדhed</h1>
          <p className="text-xl text-foreground/80">Explore Biblical insights with AI-powered search</p>
        </header>
        
        <BibleSearch />
      </div>
    </main>
  );
}

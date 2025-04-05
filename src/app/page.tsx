'use client';

import BibleSearch from './components/BibleSearch';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-[#111] transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <header className="flex flex-col items-center space-y-2 mb-12">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-2">
            <h1 className="text-2xl font-bold text-white">הד</h1>
          </div>
          <p className="text-sm uppercase tracking-wider text-foreground/60 font-medium">
            Biblical Research Assistant
          </p>
        </header>
        
        <BibleSearch />
      </div>
    </main>
  );
}

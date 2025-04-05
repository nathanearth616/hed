'use client';

import BibleSearch from './components/BibleSearch';

export default function Home() {
  return (
    <main className="min-h-screen relative">
      {/* Video Background with improved performance */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ willChange: 'transform' }}
        >
          <source 
            src="/rain1.mp4" 
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800 opacity-90" 
          style={{ display: 'none' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 text-white">הדhed</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Explore Biblical connections and insights through AI-powered visualization
          </p>
        </header>
        
        <BibleSearch />
      </div>
    </main>
  );
}

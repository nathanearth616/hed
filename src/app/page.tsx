'use client';

import BibleSearch from './components/BibleSearch';
import Footer from './components/Footer';
import { useState } from 'react';
import { AIModel, AI_MODELS } from './types/ai';

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <main className="min-h-screen flex flex-col relative">
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

      {/* Content - adjust the padding bottom */}
      <div className="flex-1 relative z-10 pb-[400px] sm:pb-[300px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <header className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
              {/* AI Model Selector */}
              <div className="relative order-2 sm:order-1">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg 
                    bg-white/10 border border-white/20 
                    text-white/90 text-sm font-medium
                    hover:bg-white/20 transition-all duration-200"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className="text-xl">{AI_MODELS.find(m => m.id === selectedModel)?.icon}</span>
                  <span>{AI_MODELS.find(m => m.id === selectedModel)?.name}</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-lg shadow-lg 
                    bg-black/70 border border-white/20 backdrop-blur-md z-20"
                  >
                    {AI_MODELS.map((model) => (
                      <button
                        key={model.id}
                        className="w-full text-left px-4 py-2 text-sm text-white/90 hover:bg-white/10
                          flex items-center gap-2"
                        onClick={() => {
                          setSelectedModel(model.id);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span className="text-xl">{model.icon}</span>
                        <span>{model.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title - centered */}
              <h1 className="text-4xl sm:text-6xl font-bold text-white order-1 sm:order-2">הדhed</h1>
              
              {/* Empty div for flex spacing */}
              <div className="w-[144px] hidden sm:block order-3"></div>
            </div>
            
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto text-center mt-4">
              Explore Biblical connections and insights through AI-powered visualization
            </p>
          </header>
          
          <div className="mt-8 sm:mt-12">
            <BibleSearch selectedModel={selectedModel} />
          </div>
        </div>
      </div>

      {/* Footer - make it absolute */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <Footer />
      </div>
    </main>
  );
}

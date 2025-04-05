import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { rateLimit } from '@/app/lib/rate-limit';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const limiter = rateLimit({ interval: 60 * 1000, // 1 minute
                           uniqueTokenPerInterval: 10 });

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    await limiter.check();

    const { verse } = await request.json();
    
    if (!verse) {
      return NextResponse.json({ error: 'Verse is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent([
      { text: `Analyze this Bible verse: ${verse.book} ${verse.chapter}:${verse.verse} - ${verse.text}` }
    ]);

    // If we hit the rate limit, return a cached or fallback response
    if (!result.response) {
      return NextResponse.json({
        themes: ["Theme analysis unavailable"],
        relatedVerses: [],
        significance: "Analysis temporarily unavailable due to high traffic. Please try again in a few minutes.",
        context: "Historical context analysis temporarily unavailable."
      });
    }

    return NextResponse.json(result.response);

  } catch (error) {
    console.error('API error:', error);
    
    // Handle rate limit errors specifically
    if (error instanceof Error && error.message.includes('429')) {
      return NextResponse.json({
        error: 'Too many requests. Please try again in a few minutes.',
        retryAfter: 60 // Suggest retry after 1 minute
      }, { status: 429 });
    }

    return NextResponse.json(
      { error: 'Failed to analyze verse. Please try again later.' },
      { status: 500 }
    );
  }
} 
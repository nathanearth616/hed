import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';
import { rateLimit } from '@/app/lib/rate-limit';

// Initialize the AI models
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const limiter = rateLimit({ interval: 60 * 1000, // 1 minute
                           uniqueTokenPerInterval: 10 });

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    await limiter.check();
    
    const { topic, model = 'gemini' } = await request.json();
    
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Combine all prompts into a single request
    const combinedPrompt = `
      Analyze the biblical topic "${topic}" and provide a JSON response with the following structure:
      {
        "verseReferences": [
          {
            "reference": "Book Chapter:Verse",
            "summary": "Brief explanation of what this verse discusses",
            "relevance": "High/Medium/Low relevance to the topic"
          }
        ],
        "analysis": "Brief analysis of the biblical perspective on this topic, including key principles, different perspectives, and how understanding evolved (500 words max)",
        "mainThemes": ["theme1", "theme2", "theme3"] // 5-7 main themes
      }

      Focus on finding 10-15 most relevant verses. Do not include the full verse text.
      Only respond with the JSON object, nothing else.
    `;
    
    let responseText;
    
    if (model === 'groq') {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: combinedPrompt }],
        model: 'llama3-70b-8192',
        temperature: 0.5,
        max_tokens: 1024,
      });
      
      responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from Groq API');
      }
    } else {
      // Default to Gemini
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const result = await geminiModel.generateContent(combinedPrompt);
      responseText = result.response.text();
    }
    
    // Extract the JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 });
    }
    
    const data = JSON.parse(jsonMatch[0]);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    
    // Handle rate limit errors specifically
    if (error instanceof Error && error.message.includes('429')) {
      return NextResponse.json({
        error: 'Too many requests. Please try again in a few minutes.',
        retryAfter: 60 // Suggest retry after 1 minute
      }, { status: 429 });
    }
    
    return NextResponse.json({ error: 'Failed to fetch verses by topic' }, { status: 500 });
  }
}
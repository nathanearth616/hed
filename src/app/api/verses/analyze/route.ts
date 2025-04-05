import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';
import { rateLimit } from '@/app/lib/rate-limit';

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

    const { verse, model } = await request.json();
    
    if (!verse) {
      return NextResponse.json({ error: 'Verse is required' }, { status: 400 });
    }

    const prompt = `
      Analyze the following Bible verse:
      "${verse.book} ${verse.chapter}:${verse.verse} - ${verse.text}"
      
      Provide a comprehensive analysis in the following JSON format:
      {
        "themes": ["theme1", "theme2", "theme3"],
        "relatedVerses": ["verse1", "verse2", "verse3"],
        "significance": "theological significance explanation",
        "context": "historical context explanation",
        "wordStudy": {
          "keyWords": [
            {
              "word": "original word",
              "translation": "English translation",
              "meaning": "detailed meaning and usage"
            }
          ]
        },
        "crossReferences": [
          {
            "reference": "Book Chapter:Verse",
            "connection": "explanation of how this verse connects to the original verse"
          }
        ],
        "application": {
          "personal": "how this verse applies to personal life",
          "community": "how this verse applies to community/church",
          "society": "how this verse applies to society at large"
        },
        "literaryDevices": [
          {
            "device": "name of literary device",
            "explanation": "how this device is used in the verse"
          }
        ]
      }
      
      Return only the JSON object, no additional text.
    `;

    let result;
    
    if (model === 'groq') {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-70b-8192',
        temperature: 0.5,
        max_tokens: 1024,
      });
      
      result = completion.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from Groq API');
      }
    } else {
      // Default to Gemini
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const geminiResult = await geminiModel.generateContent(prompt);
      result = geminiResult.response.text();
    }

    // Extract the JSON object from the response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid analysis format received');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json(analysis);
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
      { error: error instanceof Error ? error.message : 'Failed to analyze verse' },
      { status: 500 }
    );
  }
} 
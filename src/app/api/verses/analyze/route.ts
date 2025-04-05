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
        "relatedVerses": ["verse1 with reference", "verse2 with reference"],
        "significance": "theological significance explanation",
        "context": "historical context explanation",
        "originalLanguage": [
          {
            "text": "original Hebrew/Greek word",
            "transliteration": "transliteration to English alphabet",
            "definition": "detailed word definition",
            "strongsNumber": "Strong's Concordance reference number"
          }
        ],
        "culturalContext": "explanation of cultural context and customs",
        "applicationPoints": [
          "practical application point 1",
          "practical application point 2"
        ],
        "keyWords": [
          {
            "word": "significant word from the verse",
            "meaning": "detailed meaning in context",
            "significance": "theological/practical significance"
          }
        ],
        "interpretation": {
          "literal": "literal interpretation of the verse",
          "allegorical": "allegorical/symbolic meaning if applicable",
          "moral": "moral teaching or principle"
        },
        "crossReferences": [
          {
            "reference": "Book Chapter:Verse",
            "connection": "explanation of how verses connect"
          }
        ],
        "application": {
          "personal": "personal life application",
          "community": "church/community application",
          "society": "broader societal application"
        },
        "literaryDevices": [
          {
            "device": "literary device used (metaphor, simile, etc.)",
            "explanation": "how the device is used and its effect"
          }
        ]
      }

      Guidelines:
      1. For original language analysis, include the actual Hebrew/Greek text when relevant
      2. Provide Strong's numbers when available
      3. Include 3-5 key themes
      4. List 3-5 relevant cross-references with explanations
      5. Ensure all verse references include book, chapter, and verse
      6. Make application points specific and actionable
      7. Include cultural and historical context from the time period
      8. Analyze any significant words or phrases in detail
      9. Consider both immediate and broader biblical context
      10. Identify and explain any literary devices or writing styles

      Return only the JSON object, no additional text. Ensure proper JSON formatting.
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
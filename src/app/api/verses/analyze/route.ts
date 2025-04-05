import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { verse } = await request.json();
    
    if (!verse) {
      return NextResponse.json({ error: 'Verse is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      Analyze the following Bible verse:
      "${verse.book} ${verse.chapter}:${verse.verse} - ${verse.text}"
      
      Provide analysis in the following JSON format:
      {
        "themes": ["theme1", "theme2", "theme3"],
        "relatedVerses": ["verse1", "verse2", "verse3"],
        "significance": "theological significance explanation",
        "context": "historical context explanation"
      }
      
      Return only the JSON object, no additional text.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract the JSON object from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid analysis format received');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze verse' },
      { status: 500 }
    );
  }
} 
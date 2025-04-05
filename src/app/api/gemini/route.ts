import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

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
      
      Provide the analysis in the following JSON format:
      {
        "themes": ["theme1", "theme2", "theme3"],
        "relatedVerses": ["verse1", "verse2", "verse3"],
        "significance": "theological significance explanation",
        "context": "historical context explanation"
      }
      
      Only return the JSON object, no other text.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }
      const analysis = JSON.parse(jsonMatch[0]);
      return NextResponse.json(analysis);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse analysis' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze verse' },
      { status: 500 }
    );
  }
} 
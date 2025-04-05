import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const verseId = searchParams.get('id');
  
  if (!verseId) {
    return NextResponse.json({ error: 'Verse ID is required' }, { status: 400 });
  }
  
  try {
    // Use Gemini to find related verses
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `
      For the Bible verse with ID "${verseId}", please identify 5-10 other Bible verses that are thematically related.
      Format your response as a JSON array of objects, where each object has:
      - reference: the verse reference (e.g., "John 3:16")
      - text: the verse text
      - relationship_type: the type of relationship (e.g., "THEMATIC", "CROSS_REFERENCE")
      - strength: a number from 1-10 indicating relationship strength
      - description: a brief description of how they relate
      
      Example:
      [
        {
          "reference": "Romans 5:8",
          "text": "But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.",
          "relationship_type": "THEMATIC",
          "strength": 8,
          "description": "Both verses speak about God's sacrificial love"
        }
      ]
      
      Only include the JSON array in your response, nothing else.
    `;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Extract the JSON array from the response
    const jsonMatch = text.match(/\[.*\]/);
    const relatedVerses = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    
    return NextResponse.json({ relatedVerses });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch related verses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { verses } = await request.json();
    console.log('Received verses:', verses);
    
    if (!verses || !Array.isArray(verses)) {
      return NextResponse.json({ error: 'Invalid verses array' }, { status: 400 });
    }

    // Use Gemini to find related verses for each verse
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const verseRelationships = await Promise.all(verses.map(async (verse) => {
      const prompt = `
        For the Bible verse "${verse}", please identify 5-10 other Bible verses that are thematically related.
        Format your response as a JSON array of strings, where each string is a verse reference in the format "Book Chapter:Verse".
        For example: ["John 3:16", "Romans 5:8", "1 John 4:9"]
        Only include the JSON array in your response, nothing else.
      `;

      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        // Extract the JSON array from the response
        const jsonMatch = text.match(/\[.*\]/);
        const relatedVerses = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        
        return {
          verse,
          related: relatedVerses
        };
      } catch (error) {
        console.error(`Error getting related verses for ${verse}:`, error);
        return {
          verse,
          related: []
        };
      }
    }));

    return NextResponse.json(verseRelationships);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch relationships' }, { status: 500 });
  }
} 
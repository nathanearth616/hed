import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { searchText } = await request.json();
    
    if (!searchText) {
      return NextResponse.json({ error: 'Search text is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `
      Analyze this Bible-related search query: "${searchText}"
      
      Please provide a JSON response with the following structure:
      {
        "mainThemes": ["theme1", "theme2"],
        "verseReferences": [
          {
            "reference": "Book Chapter:Verse",
            "summary": "brief summary of the verse's content",
            "relevance": "explanation of how this verse relates to the search query"
          }
        ],
        "analysis": "brief analysis of the search query and its biblical significance"
      }
      
      Focus on:
      1. Analyzing the themes and concepts
      2. Explaining the relevance of verses without quoting them directly
      3. Providing references that can be looked up
      
      Only respond with the JSON object.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response text to ensure it's valid JSON
    const cleanedText = text.trim().replace(/^```json\s*|\s*```$/g, '');
    
    // Parse the JSON response from Gemini
    const analysis = JSON.parse(cleanedText);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze search' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();
    
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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
    
    const result = await model.generateContent(combinedPrompt);
    const responseText = result.response.text();
    
    // Extract the JSON from the response
    const jsonMatch = responseText.match(/\{.*\}/s);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 });
    }
    
    const data = JSON.parse(jsonMatch[0]);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to fetch verses by topic' }, { status: 500 });
  }
}
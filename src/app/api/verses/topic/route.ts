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
            "text": "The actual verse text",
            "summary": "Brief explanation of what this verse discusses",
            "relevance": "High/Medium/Low relevance to the topic"
          }
        ],
        "analysis": "Comprehensive analysis of the biblical perspective on this topic, including key principles, different perspectives, and how understanding evolved (500 words max)",
        "mainThemes": ["theme1", "theme2", "theme3"], // 5-7 main themes
        "theologicalFramework": {
          "oldTestament": "How this topic is presented in the Old Testament",
          "newTestament": "How this topic is presented in the New Testament",
          "development": "How understanding of this topic developed throughout scripture"
        },
        "contemporaryApplication": {
          "personal": "How this topic applies to personal life today",
          "community": "How this topic applies to community/church today",
          "society": "How this topic applies to society at large today"
        },
        "commonMisconceptions": [
          {
            "misconception": "Description of the misconception",
            "correction": "Biblical correction for this misconception"
          }
        ],
        "furtherStudy": {
          "keyPassages": ["Book Chapter:Verse", "Book Chapter:Verse"],
          "suggestedTopics": ["Related topic 1", "Related topic 2"]
        }
      }

      Focus on finding 10-15 most relevant verses. Include the full verse text.
      Only respond with the JSON object, nothing else.
      IMPORTANT: Ensure the JSON is properly formatted with all quotes, brackets, and braces closed correctly.
      Do not include any text before or after the JSON object.
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
    
    // Try to parse the JSON
    try {
      // First attempt: try to parse the extracted JSON directly
      const data = JSON.parse(jsonMatch[0]);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Response text:', responseText);
      console.error('Extracted JSON:', jsonMatch[0]);
      
      // Second attempt: try to clean the JSON string before parsing
      try {
        // Remove any non-JSON content before or after the JSON object
        const cleanedJson = jsonMatch[0]
          .replace(/^[^{]*/, '') // Remove anything before the first {
          .replace(/[^}]*$/, ''); // Remove anything after the last }
        
        const data = JSON.parse(cleanedJson);
        return NextResponse.json(data);
      } catch (cleanError) {
        // Third attempt: try to extract just the verse references and create a valid JSON
        try {
          // Extract verse references using regex
          const verseRefsRegex = /"reference"\s*:\s*"([^"]+)",\s*"text"\s*:\s*"([^"]+)",\s*"summary"\s*:\s*"([^"]+)",\s*"relevance"\s*:\s*"([^"]+)"/g;
          const verseRefs = [];
          let match;
          
          while ((match = verseRefsRegex.exec(responseText)) !== null) {
            verseRefs.push({
              reference: match[1],
              text: match[2],
              summary: match[3],
              relevance: match[4]
            });
          }
          
          // Extract analysis if available
          const analysisMatch = responseText.match(/"analysis"\s*:\s*"([^"]+)"/);
          const analysis = analysisMatch ? analysisMatch[1] : "Analysis not available due to parsing error.";
          
          // Extract main themes if available
          const themesMatch = responseText.match(/"mainThemes"\s*:\s*\[([\s\S]*?)\]/);
          let mainThemes = ["Theme information not available"];
          
          if (themesMatch) {
            const themesText = themesMatch[1];
            const themeRegex = /"([^"]+)"/g;
            const themes = [];
            let themeMatch;
            
            while ((themeMatch = themeRegex.exec(themesText)) !== null) {
              themes.push(themeMatch[1]);
            }
            
            if (themes.length > 0) {
              mainThemes = themes;
            }
          }
          
          // Create a valid JSON with the extracted data
          const validJson = {
            verseReferences: verseRefs,
            analysis: analysis,
            mainThemes: mainThemes
          };
          
          return NextResponse.json(validJson);
        } catch (extractError) {
          // All attempts failed, return a minimal valid JSON
          return NextResponse.json({ 
            verseReferences: [],
            analysis: "Analysis not available due to parsing error.",
            mainThemes: ["Theme information not available"]
          });
        }
      }
    }
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
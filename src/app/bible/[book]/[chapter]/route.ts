import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { book: string; chapter: string } }
) {
  try {
    const decodedBook = decodeURIComponent(params.book);
    const chapterNum = parseInt(params.chapter);

    // ISSUE 2: Missing error handling for invalid chapter number
    if (isNaN(chapterNum)) {
      return NextResponse.json(
        { error: 'Invalid chapter number' },
        { status: 400 }
      );
    }

    const apiUrl = `https://bible-api.com/${decodedBook} ${chapterNum}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the request' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { book: string; chapter: string } }
) {
  try {
    const book = decodeURIComponent(params.book);
    const chapter = parseInt(params.chapter);

    if (!book || isNaN(chapter)) {
      return NextResponse.json(
        { error: 'Invalid book or chapter' },
        { status: 400 }
      );
    }

    // Use Supabase directly to fetch verses
    const { data: verses, error } = await supabase
      .from('bible_verses')
      .select('*')
      .eq('book', book)
      .eq('chapter', chapter)
      .order('verse');
    
    if (error) {
      console.error('Error fetching verses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch verses' },
        { status: 500 }
      );
    }

    if (!verses || verses.length === 0) {
      return NextResponse.json(
        { verses: [], error: `No verses found for ${book} chapter ${chapter}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ verses: verses });
  } catch (error) {
    console.error('Error fetching verses:', error);
    return NextResponse.json(
      { verses: [], error: 'Failed to fetch verses' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }
  
  try {
    const { data, error } = await supabase
      .from('bible_verses')
      .select('*')
      .textSearch('text', query, {
        config: 'english'
      })
      .limit(20);
    
    if (error) throw error;
    
    return NextResponse.json({ verses: data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to search verses' }, { status: 500 });
  }
} 
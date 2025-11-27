import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const backendUrl = process.env.BACKEND_URL || 'www.grhog.mn';

    const response = await fetch(`${backendUrl}/dashboard/total-cards`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    });

    console.log(
      'Backend response status:',
      response.body ? response.status : 'No response body'
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      return NextResponse.json(
        { error: `Backend returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend data received:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in total-household API route:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch total households',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

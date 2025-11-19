import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const params = request.nextUrl.searchParams;

    const qs = params.toString();
    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
  // Backend expects /dashboard/khoroo-usage
  const target = `${backendUrl}/dashboard/khoroo-usage${qs ? `?${qs}` : ''}`;

    const response = await fetch(target, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {})
      }
    });

    if (!response.ok) {
      // Return backend status to client for easier debugging
      const text = await response.text().catch(() => '');
    // proxy error logged for debugging
      return NextResponse.json({ error: 'Failed to fetch khoroo usage', details: text }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
  // internal proxy error logged for debugging
    return NextResponse.json({ error: 'Internal proxy error' }, { status: 500 });
  }
}

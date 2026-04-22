import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    const response = await fetch(`${backendUrl}${API_CONFIG.ENDPOINTS.DASHBOARD.BIN_SUMMARY}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching dashboard bin summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard bin summary' },
      { status: 500 }
    );
  }
}

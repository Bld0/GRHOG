import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function GET(request: NextRequest) {
  try {
    // Get Authorization header from the request
    const authHeader = request.headers.get('authorization');

    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';

    const response = await fetch(
      `${backendUrl}${API_CONFIG.ENDPOINTS.DASHBOARD.BIN_STATUS_DISTRIBUTION}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {})
        }
      }
    );

    console.log('backendUrl:', backendUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching bin status distribution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bin status distribution' },
      { status: 500 }
    );
  }
}

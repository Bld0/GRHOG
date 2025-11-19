import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    // Prefer dashboard/all-bins if available, otherwise fallback to bins
    const endpoint = API_CONFIG.ENDPOINTS.DASHBOARD.ALL_BINS ?? '/bins';
    const response = await fetch(`${backendUrl}${endpoint}`, {
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
    // Log suppressed by linter - return generic error
    return NextResponse.json({ error: 'Failed to fetch all bins' }, { status: 500 });
  }
}

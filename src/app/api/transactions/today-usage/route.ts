import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function GET(request: NextRequest) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    // Use the backend URL directly since this is a server-side API route
    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    const response = await fetch(`${backendUrl}${API_CONFIG.ENDPOINTS.STATISTICS.TRANSACTIONS.TODAY_USAGE}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching today usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch today usage' },
      { status: 500 }
    );
  }
} 
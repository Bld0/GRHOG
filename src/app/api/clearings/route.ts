import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build query string for the backend API
    const queryParams = new URLSearchParams();
    
    // Add all query parameters to the backend request
    searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    const url = `${backendUrl}${API_CONFIG.ENDPOINTS.CLEARINGS}?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching clearings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clearings' },
      { status: 500 }
    );
  }
} 
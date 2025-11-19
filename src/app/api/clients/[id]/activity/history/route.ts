import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const { searchParams } = new URL(request.url);
    
    const page = searchParams.get('page') || '0';
    const size = searchParams.get('size') || '20';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const authHeader = request.headers.get('authorization');
    console.log('Client activity history request - Authorization header:', authHeader ? 'Present' : 'Missing');
    if (authHeader) {
      headers.Authorization = authHeader;
      console.log('Authorization header forwarded to backend');
    } else {
      console.log('No authorization header found in request');
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      page,
      size,
      sortBy,
      sortDirection,
    });
    
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    const response = await fetch(`${backendUrl}${API_CONFIG.ENDPOINTS.CLIENT_ACTIVITY}/${id}/activity/history?${queryParams}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error for client activity history:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching client activity history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client activity history' },
      { status: 500 }
    );
  }
} 
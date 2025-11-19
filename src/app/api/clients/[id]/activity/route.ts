import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const authHeader = request.headers.get('authorization');
    console.log('Client activity request - Authorization header:', authHeader ? 'Present' : 'Missing');
    if (authHeader) {
      headers.Authorization = authHeader;
      console.log('Authorization header forwarded to backend');
    } else {
      console.log('No authorization header found in request');
    }

    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    const response = await fetch(`${backendUrl}${API_CONFIG.ENDPOINTS.CLIENT_ACTIVITY}/${id}/activity`, {
      method: 'GET',
      headers,
    }); 

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error for client activity:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching client activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client activity' },
      { status: 500 }
    );
  }
} 
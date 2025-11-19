import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  console.log('🚀 CLIENT PUT API ROUTE CALLED - ID:', id);
  try {
    const body = await request.json();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if present
    const authHeader = request.headers.get('authorization');
    console.log('Client update request - Authorization header:', authHeader ? 'Present' : 'Missing');
    if (authHeader) {
      headers.Authorization = authHeader;
      console.log('Authorization header forwarded to backend');
    } else {
      console.log('No authorization header found in request');
    }

    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    console.log('Calling backend endpoint:', `${backendUrl}/users/clients/${id}`);
    const response = await fetch(`${backendUrl}/users/clients/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      
      // Try to parse as JSON for structured error messages
      try {
        const errorData = JSON.parse(errorText);
        return NextResponse.json(
          { error: errorData.message || 'Failed to update client' },
          { status: response.status }
        );
      } catch {
        // If not JSON, return the raw error text
        return NextResponse.json(
          { error: errorText || 'Failed to update client' },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
} 
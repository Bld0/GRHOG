import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function GET(request: NextRequest) {
  try {
    console.log('=== BIN-USAGES API ROUTE CALLED ===');
    
    // Get all query parameters from the request
    const { searchParams } = new URL(request.url);
    console.log('Query parameters:', Object.fromEntries(searchParams.entries()));
    
    // Build query string for the backend API
    const queryParams = new URLSearchParams();
    
    // Add all query parameters to the backend request
    searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if present
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header from request:', authHeader ? 'Present' : 'Missing');
    
    if (authHeader) {
      headers.Authorization = authHeader;
      console.log('Forwarding authorization header to backend');
    } else {
      console.log('No authorization header found in request');
    }

    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    const url = `${backendUrl}${API_CONFIG.ENDPOINTS.BIN_USAGES}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Calling backend URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Backend response received successfully');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching bin usages:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to fetch bin usages' },
      { status: 500 }
    );
  }
}
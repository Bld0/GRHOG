import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Refresh token request received');
    
    // Validate request body
    if (!body.refreshToken) {
      console.error('Missing refresh token');
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }
    
    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    console.log('Attempting to refresh token with backend:', `${backendUrl}/auth/refresh`);
    
    const response = await fetch(`${backendUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: body.refreshToken
      }),
    });

    console.log('Backend refresh response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend token refresh failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      
      return NextResponse.json(
        { error: 'Token refresh failed' },
        { status: response.status }
      );
    }

    // Return the response from the backend
    const refreshResponse = await response.json();
    console.log('Token refresh successful');
    
    return NextResponse.json(refreshResponse);
    
  } catch (error) {
    console.error('Auth refresh route error:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Cannot connect to backend server. Please check if the backend is running.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Token refresh failed due to server error' },
      { status: 500 }
    );
  }
}

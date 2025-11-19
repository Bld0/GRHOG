import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Token validation request received');
    
    // Validate request body
    if (!body.token) {
      console.error('Missing token');
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
    
    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    console.log('Attempting to validate token with backend:', `${backendUrl}/auth/validate`);
    
    const response = await fetch(`${backendUrl}/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: body.token
      }),
    });

    console.log('Backend validation response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend token validation failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      
      return NextResponse.json(
        { error: 'Token validation failed' },
        { status: response.status }
      );
    }

    // Return the response from the backend
    const validationResponse = await response.json();
    console.log('Token validation successful');
    
    return NextResponse.json(validationResponse);
    
  } catch (error) {
    console.error('Auth validate route error:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Cannot connect to backend server. Please check if the backend is running.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Token validation failed due to server error' },
      { status: 500 }
    );
  }
}

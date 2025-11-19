import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Auth status request received');
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    console.log('Attempting to check auth status with backend:', `${backendUrl}/auth/status`);
    
    const response = await fetch(`${backendUrl}/auth/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    console.log('Backend status response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend auth status check failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      
      return NextResponse.json(
        { error: 'Auth status check failed' },
        { status: response.status }
      );
    }

    // Return the response from the backend
    const statusResponse = await response.json();
    console.log('Auth status check successful');
    
    return NextResponse.json(statusResponse);
    
  } catch (error) {
    console.error('Auth status route error:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Cannot connect to backend server. Please check if the backend is running.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Auth status check failed due to server error' },
      { status: 500 }
    );
  }
}

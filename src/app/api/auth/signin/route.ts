import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Auth request received:', { username: body.username, passwordLength: body.password?.length });
    
    // Validate request body
    if (!body.username || !body.password) {
      console.error('Missing username or password');
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    console.log('Attempting to authenticate with backend:', `${backendUrl}${API_CONFIG.ENDPOINTS.AUTH.SIGNIN}`);
    
    const response = await fetch(`${backendUrl}${API_CONFIG.ENDPOINTS.AUTH.SIGNIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: body.username,
        password: body.password
      }),
    });

    console.log('Backend response status:', response.status);
    console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend authentication failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      
      // Return more specific error messages
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      } else if (response.status === 403) {
        return NextResponse.json(
          { error: 'Access forbidden' },
          { status: 403 }
        );
      } else if (response.status === 404) {
        return NextResponse.json(
          { error: 'Authentication endpoint not found' },
          { status: 404 }
        );
      } else {
        return NextResponse.json(
          { error: `Backend error: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }
    }

    // The AuthController returns a JSON object with token and user data
    const authResponse = await response.json();
    console.log('Authentication successful, response received:', authResponse ? 'Yes' : 'No');
    
    if (!authResponse || !authResponse.token) {
      console.error('No valid response received from backend');
      return NextResponse.json(
        { error: 'No valid response received from backend' },
        { status: 500 }
      );
    }
    
    // Create response with cookie set for middleware authentication
    const nextResponse = NextResponse.json(authResponse);
    nextResponse.cookies.set('auth-token', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
    
    return nextResponse;
    
  } catch (error) {
    console.error('Auth route error:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Cannot connect to backend server. Please check if the backend is running.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Authentication failed due to server error' },
      { status: 500 }
    );
  }
} 
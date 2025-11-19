import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function POST(request: NextRequest) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    // Call backend signout endpoint
    // Use the backend URL directly since this is a server-side API route
    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    const response = await fetch(`${backendUrl}${API_CONFIG.ENDPOINTS.AUTH.SIGNOUT}`, {
      method: 'POST',
      headers,
    });

    // Create response with cleared cookie
    const nextResponse = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Clear the auth cookie
    nextResponse.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
    });

    return nextResponse;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
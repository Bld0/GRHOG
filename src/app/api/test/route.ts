import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function GET() {
  try {
    // Use the backend URL directly since this is a server-side API route
    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    const response = await fetch(`${backendUrl}${API_CONFIG.ENDPOINTS.TEST}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      ...data,
      frontend: 'GRHOG Frontend is working!',
      backend: data.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing backend connection:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect to backend',
        frontend: 'GRHOG Frontend is working!',
        backend: 'Connection failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 
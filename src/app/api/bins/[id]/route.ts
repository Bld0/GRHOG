import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  console.log('Bins API route called - GET /api/bins/' + id);
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const authHeader = request.headers.get('authorization');
    console.log('Bins GET request - Authorization header:', authHeader ? 'Present' : 'Missing');
    if (authHeader) {
      headers.Authorization = authHeader;
      console.log('Authorization header forwarded to backend');
    } else {
      console.log('No authorization header found in request');
    }

    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    const fullUrl = `${backendUrl}${API_CONFIG.ENDPOINTS.BINS}/${id}`;
    console.log('Fetching from backend URL:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
    });
    
    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error('Backend error:', response.status, text);
      if (response.status === 404) {
        return NextResponse.json({ error: 'Bin not found' }, { status: 404 });
      }
      return NextResponse.json({ error: text || 'Backend error' }, { status: response.status });
    }

    const bin = await response.json();
    return NextResponse.json(bin);
  } catch (error) {
    console.error('Error fetching bin:', error);
    return NextResponse.json({ error: 'Failed to fetch bin' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  console.log('🚀 BIN PUT API ROUTE CALLED - ID:', id);
  try {
    const body = await request.json();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const authHeader = request.headers.get('authorization');
    console.log('Bin update request - Authorization header:', authHeader ? 'Present' : 'Missing');
    if (authHeader) {
      headers.Authorization = authHeader;
      console.log('Authorization header forwarded to backend');
    } else {
      console.log('No authorization header found in request');
    }
    
    // Call the backend API to update the bin
    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    const response = await fetch(`${backendUrl}${API_CONFIG.ENDPOINTS.BINS}/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Bin not found' },
          { status: 404 }
        );
      }
      throw new Error(`Backend API error: ${response.status}`);
    }

    const updatedBin = await response.json();
    
    return NextResponse.json(updatedBin);
  } catch (error) {
    console.error('Error updating bin:', error);
    return NextResponse.json(
      { error: 'Failed to update bin' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers.Authorization = authHeader;
    }
    
    // Call the backend API to delete the bin
    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    const response = await fetch(`${backendUrl}${API_CONFIG.ENDPOINTS.BINS}/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Bin not found' },
          { status: 404 }
        );
      }
      throw new Error(`Backend API error: ${response.status}`);
    }

    const result = await response.json();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting bin:', error);
    return NextResponse.json(
      { error: 'Failed to delete bin' },
      { status: 500 }
    );
  }
} 
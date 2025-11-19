import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export async function GET(request: NextRequest) {
  try {
    console.log('=== CARDS EXPORT API ROUTE CALLED ===');
    
    // Get all query parameters from the request
    const { searchParams } = new URL(request.url);
    console.log('Export query parameters:', Object.fromEntries(searchParams.entries()));
    
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
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
    const url = `${backendUrl}/export/cards/excel${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Calling backend export URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend export error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    // Get the Excel file as blob
    const blob = await response.blob();
    const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'cards_export.xlsx';
    
    console.log('Backend export response received successfully, filename:', filename);
    
    // Return the Excel file
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting cards:', error);
    return NextResponse.json(
      { error: 'Failed to export cards' },
      { status: 500 }
    );
  }
}

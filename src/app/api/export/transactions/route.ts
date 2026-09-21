import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG, getBackendUrl } from '@/config/api';

// Excel үүсгэх нь олон мөр дээр 10 секундээс удаж болно — Vercel-ийн анхны
// хугацааны хязгаар богино тул тодорхой заана.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    console.log('=== TRANSACTIONS EXPORT API ROUTE CALLED ===');

    // Get all query parameters from the request
    const { searchParams } = new URL(request.url);
    console.log(
      'Export query parameters:',
      Object.fromEntries(searchParams.entries())
    );

    // Build query string for the backend API
    const queryParams = new URLSearchParams();

    // Add all query parameters to the backend request
    searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add authorization header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    // getBackendUrl нь схемгүй BACKEND_URL-ыг засаж, амьд Railway хост руу
    // унана — өмнөх `http://device.grhog.mn` нь DNS-д байхгүй тул fetch унаж,
    // экспорт бүр 500 болдог байв.
    const backendUrl = getBackendUrl();
    const url = `${backendUrl}/export/transactions/excel${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Calling backend export URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers
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

    // Файлыг буферлэхгүй — backend-ийн урсгалыг шууд дамжуулна.
    const filename =
      response.headers
        .get('content-disposition')
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || 'transactions_export.xlsx';

    console.log(
      'Backend export response received successfully, filename:',
      filename
    );

    // Return the Excel file
    return new NextResponse(response.body, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Error exporting transactions:', error);
    return NextResponse.json(
      { error: 'Failed to export transactions' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG, getBackendUrl } from '@/config/api';

// Excel үүсгэх нь олон мөр дээр 10 секундээс удаж болно — Vercel-ийн анхны
// хугацааны хязгаар богино тул тодорхой заана.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    console.log('=== BINS EXPORT API ROUTE CALLED ===');

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
      console.log('🔐 Auth header found:', authHeader.substring(0, 20) + '...');
    } else {
      console.log('⚠️ No auth header found');
    }

    // getBackendUrl нь схемгүй BACKEND_URL-ыг засаж, амьд Railway хост руу
    // унана — өмнөх `http://device.grhog.mn` нь DNS-д байхгүй тул fetch унаж,
    // экспорт бүр 500 болдог байв.
    const backendUrl = getBackendUrl();
    const url = `${backendUrl}/export/bins/excel${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('📤 Calling backend export URL:', url);
    console.log('📤 Request headers:', headers);

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    console.log('📥 Backend response status:', response.status);
    console.log(
      '📥 Backend response headers:',
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend export error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      // Backend-ийн статусыг хэвээр буцаана — өмнө нь бүгд 500 болж,
      // 403 (эрх) ба 500 (серверийн алдаа) ялгагдахгүй байв.
      return NextResponse.json(
        { error: errorText || response.statusText },
        { status: response.status }
      );
    }

    // Файлыг буферлэхгүй — backend-ийн урсгалыг шууд дамжуулна.
    const filename =
      response.headers
        .get('content-disposition')
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || 'bins_export.xlsx';

    console.log(
      '✅ Backend export response received successfully, filename:',
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
    console.error('❌ Error exporting bins:', error);
    return NextResponse.json(
      {
        error:
          'Failed to export bins: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}

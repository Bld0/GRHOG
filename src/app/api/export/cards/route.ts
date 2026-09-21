import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG, getBackendUrl } from '@/config/api';

// Excel үүсгэх нь олон мөр дээр 10 секундээс удаж болно — Vercel-ийн анхны
// хугацааны хязгаар богино тул тодорхой заана.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    console.log('=== CARDS EXPORT API ROUTE CALLED ===');

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

    // Same scheme-normalization as next.config.ts's rewrite destination:
    // Vercel's BACKEND_URL env var has been observed set WITHOUT a scheme
    // (bare hostname), which makes fetch() throw "Failed to parse URL" since
    // it requires an absolute URL. Prepend https:// when missing.
    const backendUrl = getBackendUrl();
    const url = `${backendUrl}/export/cards/excel${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
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
      // Propagate the backend's real status/body instead of masking every
      // failure as a generic 500 — a 401/403 here needs to reach the browser
      // as 401/403 so apiClient.fetchWithAuth's token-refresh-and-retry logic
      // (api-client.ts:220-228) actually triggers instead of silently failing.
      return NextResponse.json(
        {
          error: 'Failed to export cards',
          backendStatus: response.status,
          backendError: errorText || response.statusText
        },
        { status: response.status }
      );
    }

    // Файлыг буферлэхгүй — backend-ийн урсгалыг шууд дамжуулна.
    const filename =
      response.headers
        .get('content-disposition')
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || 'cards_export.xlsx';

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
    console.error('Error exporting cards:', error);
    return NextResponse.json(
      {
        error: 'Failed to export cards',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

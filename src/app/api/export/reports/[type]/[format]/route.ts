import { NextRequest, NextResponse } from 'next/server';

/**
 * Тайлан татах прокси (Excel/PDF).
 *
 * next.config.ts дахь edge rewrite нь `/api/export/*`-ийг ЗОРИУДААР тойрдог
 * (хуучин export замууд backend дээр өөр path-тай) тул энэ маршрутыг гараар
 * дамжуулж өгнө. Файлыг binary хэвээр нь буцаана — text болгон уншвал
 * xlsx/pdf эвдэрнэ.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string; format: string }> }
) {
  const { type, format } = await context.params;

  if (!['client-activity', 'clearings', 'battery', 'maintenance'].includes(type)) {
    return NextResponse.json({ error: 'Тайлангийн төрөл буруу' }, { status: 400 });
  }
  if (!['excel', 'pdf'].includes(format)) {
    return NextResponse.json({ error: 'Файлын формат буруу' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.toString();

    const headers: Record<string, string> = {};
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    // Same scheme-normalization as next.config.ts's rewrite destination:
    // BACKEND_URL has been observed set without a scheme, which makes fetch()
    // throw "Failed to parse URL".
    const rawBackendUrl = (
      process.env.BACKEND_URL || 'http://device.grhog.mn'
    ).replace(/\/$/, '');
    const backendUrl = /^https?:\/\//.test(rawBackendUrl)
      ? rawBackendUrl
      : `https://${rawBackendUrl}`;

    const response = await fetch(
      `${backendUrl}/export/reports/${type}/${format}${query ? `?${query}` : ''}`,
      { method: 'GET', headers }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Report export failed:', response.status, errorText);
      return NextResponse.json(
        { error: 'Тайлан татахад алдаа гарлаа' },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    const contentType =
      response.headers.get('content-type') ??
      (format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition':
          response.headers.get('content-disposition') ??
          `attachment; filename="${type}.${format === 'excel' ? 'xlsx' : 'pdf'}"`
      }
    });
  } catch (error) {
    console.error('Report export proxy error:', error);
    return NextResponse.json(
      { error: 'Тайлан татахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

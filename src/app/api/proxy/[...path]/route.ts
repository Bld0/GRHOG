import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://device.grhog.mn';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'DELETE');
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // CORS preflight passthrough response
  const resp = new NextResponse(null, { status: 204 });
  resp.headers.set('Access-Control-Allow-Origin', '*');
  resp.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  resp.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return resp;
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const path = pathSegments.join('/');
    
    // Block proxy access to routes that have dedicated Next.js API handlers
    const blockedPaths = [
      'clients/',
      'bins/',
      'users/',
      'auth/',
      'analytics/',
      'dashboard/',
      'transactions/',
      'cards/',
      'clearings/',
      'bin-usages/'
    ];
    
    // Check if this path should be handled by dedicated API routes instead of proxy
    if (blockedPaths.some(blockedPath => path.startsWith(blockedPath))) {
      return NextResponse.json(
        { error: `Path /${path} should use dedicated API routes, not proxy` },
        { status: 404 }
      );
    }
    
    const url = new URL(request.url);
    const backendUrl = `${BACKEND_BASE_URL}/${path}${url.search}`;
    
    // Get the request body if it exists
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      body = await request.text();
    }
    
    // Prepare headers: drop hop-by-hop and browser-only headers to avoid backend rejecting
    const incoming = new Headers(request.headers);
    const forwardedHeaders = new Headers();
    const allowedHeaderNames = [
      'content-type',
      'authorization',
      'accept',
      'accept-language',
    ];
    for (const [k, v] of Array.from(incoming.entries()) as [string, string][]) {
      const key = k.toLowerCase();
      if (allowedHeaderNames.includes(key)) {
        forwardedHeaders.set(k, v);
      }
    }
    // Identify the original client IP if useful for logs
    const xff = incoming.get('x-forwarded-for');
    if (xff) forwardedHeaders.set('x-forwarded-for', xff);

    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method,
      headers: forwardedHeaders,
      body,
    });
    
    // Get the response data
    const responseData = await response.text();
    
    // Create a new response with the backend data
    const newResponse = new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
    });
    
    // Copy relevant headers
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        newResponse.headers.set(key, value);
      }
    });
    
    return newResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request to backend' },
      { status: 500 }
    );
  }
}

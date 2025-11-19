import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = url.search;
  const backendUrl = `${process.env.BACKEND_URL || 'http://device.grhog.mn'}/dashboard/getKhoroo${params}`;

  const headers: Record<string, string> = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['authorization'] = auth;

  const res = await fetch(backendUrl, { headers });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
}

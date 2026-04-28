import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://www.bhyone.com';
  const targetUrl = `${apiBase}/api/web_site/upload_image`;

  const auth = req.headers.get('Authorization') || req.headers.get('authorization') || '';
  const contentType = req.headers.get('content-type') || '';

  console.log('[upload-proxy] targetUrl:', targetUrl);
  console.log('[upload-proxy] Content-Type:', contentType);
  console.log('[upload-proxy] Authorization:', auth ? auth.slice(0, 20) + '...' : '(none)');

  try {
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        ...(auth ? { Authorization: auth } : {}),
        ...(contentType ? { 'Content-Type': contentType } : {}),
      },
      body: req.body,
      // @ts-expect-error Node.js fetch duplex
      duplex: 'half',
    });

    const text = await upstream.text();
    console.log('[upload-proxy] upstream status:', upstream.status);
    console.log('[upload-proxy] upstream body:', text);

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
    return NextResponse.json(json, { status: upstream.status });
  } catch (err) {
    console.error('[upload-proxy] fetch error:', err);
    return NextResponse.json({ status: 500, message: String(err) }, { status: 500 });
  }
}

import { CommonEngine } from '@angular/ssr/node';
import { render } from '@netlify/angular-runtime/common-engine.mjs';

const commonEngine = new CommonEngine();

export async function netlifyCommonEngineHandler(request: Request, context: any): Promise<Response> {
  // Example API endpoints can be defined here.
  // Uncomment and define endpoints as necessary.
  const pathname = new URL(request.url).pathname;
  if (pathname === '/api/health') {
    return Response.json({ status: 'ok' });
  }

  try {
    return await render(commonEngine);
  } catch (error: any) {
    console.error('SSR render failed:', error);
    const isDebug = new URL(request.url).searchParams.get('debug') === 'true';
    if (isDebug) {
      const body = typeof error?.stack === 'string' ? error.stack : String(error);
      return new Response(body, { status: 500, headers: { 'content-type': 'text/plain' } });
    }
    return new Response('Internal Server Error', { status: 500 });
  }
}

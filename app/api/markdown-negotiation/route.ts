import { NextRequest } from 'next/server';
import TurndownService from 'turndown';

export async function GET(request: NextRequest) {
  const path = request.headers.get('x-markdown-path') || '/';
  const port = process.env.PORT || 3000;
  // Fetch locally to avoid routing loops and DNS/Firewall issues inside the VPS/Docker container
  const targetUrl = new URL(path, `http://127.0.0.1:${port}`);

  const headers = new Headers();
  // Only forward essential headers to avoid Next.js/Node fetch issues (like gzip decoding bugs)
  const forwardHeaders = ['cookie', 'user-agent', 'x-forwarded-proto', 'x-forwarded-for'];
  forwardHeaders.forEach((h) => {
    if (request.headers.has(h)) headers.set(h, request.headers.get(h)!);
  });
  
  if (request.headers.has('host')) {
    headers.set('host', request.headers.get('host')!);
  }

  // Remove the text/markdown accept header to prevent infinite loops,
  // and request standard HTML instead.
  headers.set('accept', 'text/html,application/xhtml+xml,application/xml;q=0.9');

  try {
    const htmlResponse = await fetch(targetUrl.toString(), { headers });
    
    if (!htmlResponse.ok) {
      return new Response('Error fetching content', { status: htmlResponse.status });
    }

    const html = await htmlResponse.text();

    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });

    // Remove extraneous elements for cleaner markdown, similar to Cloudflare's Markdown for Agents
    turndownService.remove(['script', 'style', 'noscript', 'nav', 'iframe']);

    const markdown = turndownService.turndown(html);

    // Approximate token count: 1 token ~ 4 characters
    const tokens = Math.ceil(markdown.length / 4);

    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/markdown',
        'x-markdown-tokens': tokens.toString(),
      },
    });
  } catch (error) {
    console.error('Error converting to markdown:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

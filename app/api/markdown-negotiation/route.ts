import TurndownService from 'turndown';

export async function GET(request: Request) {
  const { protocol, host } = new URL(request.url);
  const path = request.headers.get('x-markdown-path') || '/';

  // We construct the target URL using the incoming request's protocol and host.
  const targetUrl = new URL(path, `${protocol}//${host}`);

  const headers = new Headers(request.headers);
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

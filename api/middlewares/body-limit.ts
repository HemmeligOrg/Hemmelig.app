import { createMiddleware } from 'hono/factory';

/**
 * Enforces a maximum request body size.
 *
 * Bodies with a `Content-Length` header are checked without reading them.
 * Chunked bodies are streamed with a cap and then rebuilt as a fresh
 * `Request`. Rebuilding avoids relying on runtime-specific request classes,
 * which the original middleware does when it clones the incoming request.
 *
 * @param maxSize Maximum body size in bytes.
 */
export const enforceBodyLimit = (maxSize: number) =>
    createMiddleware(async (c, next) => {
        const raw = c.req.raw;

        if (!raw.body) {
            return next();
        }

        const contentLength = raw.headers.get('content-length');

        if (contentLength !== null) {
            if (Number(contentLength) > maxSize) {
                return c.json({ error: 'Request body too large' }, 413);
            }

            return next();
        }

        // No Content-Length: read the stream with a cap, then rebuild it.
        const reader = raw.body.getReader();
        const chunks: Uint8Array[] = [];
        let size = 0;

        for (;;) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            size += value.length;

            if (size > maxSize) {
                await reader.cancel();
                return c.json({ error: 'Request body too large' }, 413);
            }

            chunks.push(value);
        }

        const requestInit: RequestInit & { duplex?: 'half' } = {
            method: raw.method,
            headers: raw.headers,
        };

        if (chunks.length > 0) {
            if (raw.method === 'GET' || raw.method === 'HEAD') {
                return c.json({ error: 'Request body too large' }, 413);
            }

            requestInit.body = new ReadableStream({
                start(controller) {
                    for (const chunk of chunks) {
                        controller.enqueue(chunk);
                    }
                    controller.close();
                },
            }) as unknown as BodyInit;
            requestInit.duplex = 'half';
        }

        c.req.raw = new Request(raw.url, requestInit);

        return next();
    });

/// <reference types="vitest/config" />
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function apiDevServer(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        try {
          const url = new URL(req.url, 'http://localhost');
          const endpoint = url.pathname.replace(/^\/api\//, '').replace(/\.ts$/, '');
          const apiFile = path.resolve(process.cwd(), `api/${endpoint}.ts`);

          if (!fs.existsSync(apiFile)) {
            return next();
          }

          // Direct parse of .env.local to ensure latest credentials are used
          const envLocalPath = path.resolve(process.cwd(), '.env.local');
          if (fs.existsSync(envLocalPath)) {
            const content = fs.readFileSync(envLocalPath, 'utf-8');
            for (const line of content.split(/\r?\n/)) {
              const trimmed = line.trim();
              if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const idx = trimmed.indexOf('=');
                const k = trimmed.slice(0, idx).trim();
                const v = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
                if (k && v) {
                  process.env[k] = v;
                }
              }
            }
          }

          // Populate process.env from loadEnv as well
          const env = loadEnv(server.config.mode || 'development', process.cwd(), '');
          for (const [key, value] of Object.entries(env)) {
            if (value) {
              process.env[key] = value;
            }
          }

          // Parse query parameters
          const query: Record<string, string | string[]> = {};
          for (const [k, v] of url.searchParams.entries()) {
            if (query[k]) {
              query[k] = Array.isArray(query[k]) ? [...query[k], v] : [query[k] as string, v];
            } else {
              query[k] = v;
            }
          }

          // Parse body for non-GET/HEAD requests
          let body: any = {};
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            const raw = Buffer.concat(chunks).toString('utf-8');
            if (raw) {
              try {
                body = JSON.parse(raw);
              } catch {
                body = raw;
              }
            }
          }

          (req as any).query = query;
          (req as any).body = body;

          // Extend res to support VercelResponse methods
          const vercelRes = res as any;
          vercelRes.status = (code: number) => {
            res.statusCode = code;
            return vercelRes;
          };
          vercelRes.json = (data: any) => {
            if (data?.error && typeof data.error === 'string' && data.error.includes('AWS credentials missing')) {
              res.statusCode = 503;
            }
            if (!res.getHeader('Content-Type')) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
            }
            res.end(JSON.stringify(data));
            return vercelRes;
          };
          vercelRes.send = (data: any) => {
            res.end(data);
            return vercelRes;
          };

          const mod = await server.ssrLoadModule(`/api/${endpoint}.ts`);
          const handler = mod.default || mod;
          await handler(req, vercelRes);
        } catch (err: any) {
          if ((err?.message || '').includes('AWS credentials missing')) {
            if (!res.headersSent) {
              res.statusCode = 503;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(
                JSON.stringify({
                  error: 'Database not configured. Please add APP_AWS_ACCESS_KEY_ID and APP_AWS_SECRET_ACCESS_KEY in .env.local to access live DynamoDB.',
                })
              );
              return;
            }
          }
          console.error('[API Dev Middleware Error]', err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Internal API Server Error', details: err?.message }));
          }
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), apiDevServer()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    // Give interaction-heavy component tests (userEvent + mock latency) more
    // headroom so they don't flake under load on constrained machines. Files
    // still run in isolation so module-level mock stores start fresh per file.
    testTimeout: 15000,
    // Local admin account used by the tests (local fallback mode only).
    env: { VITE_LOCAL_ADMIN_PASSWORD: 'test-admin-password' },
  },
});


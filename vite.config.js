import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import handler from './api/lookup.js'
import dns from 'dns'

dns.setDefaultResultOrder('verbatim')

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env files in current directory
  const env = loadEnv(mode, process.cwd(), '');
  
  // Assign keys to process.env so our serverless handler can access them locally
  process.env.RAPIDAPI_KEY = env.RAPIDAPI_KEY || env.VITE_RAPIDAPI_KEY;
  process.env.VITE_RAPIDAPI_KEY = env.VITE_RAPIDAPI_KEY;

  return {
    plugins: [
      react(),
      {
        name: 'api-lookup-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url.startsWith('/api/lookup')) {
              const url = new URL(req.url, `http://${req.headers.host}`);
              const query = Object.fromEntries(url.searchParams.entries());

              // Mock request and response objects for the Vercel handler
              const mockReq = { query };
              const mockRes = {
                status(code) {
                  res.statusCode = code;
                  return this;
                },
                json(data) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                  return this;
                },
                setHeader(name, value) {
                  res.setHeader(name, value);
                  return this;
                },
                end(data) {
                  res.end(data);
                  return this;
                }
              };

              try {
                await handler(mockReq, mockRes);
              } catch (err) {
                console.error(err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }
            next();
          });
        }
      }
    ],
  };
})

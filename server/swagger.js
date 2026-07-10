import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const setupSwagger = (app) => {
  try {
    const swaggerFile = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger_output.json'), 'utf8'));

    // Serve the JSON spec data
    app.get('/api-docs/swagger.json', (req, res) => {
      res.json(swaggerFile);
    });

    // Serve the Scalar API Reference via HTML (Ultra-lightweight, 100% Vercel compatible)
    app.get('/api-docs', (req, res) => {
      res.send(`
<!doctype html>
<html>
  <head>
    <title>smart100X API Documentation</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <!-- Setup Scalar -->
    <script id="api-reference" data-url="/api-docs/swagger.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
      `);
    });

    console.log('📄 Scalar API Reference (CDN) available at /api-docs');
  } catch (error) {
    console.error('Failed to setup Scalar API Reference:', error.message);
  }
};

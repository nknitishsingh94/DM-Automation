import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const setupSwagger = (app) => {
  try {
    const swaggerFile = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger_output.json'), 'utf8'));
    
    // Fix for trailing slash issue which causes static files to fail loading
    app.use('/api-docs', (req, res, next) => {
      if (req.originalUrl === '/api-docs') {
        return res.redirect('/api-docs/');
      }
      next();
    });

    app.use('/api-docs/', swaggerUi.serve, swaggerUi.setup(swaggerFile, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Insta AI Agent API Documentation'
    }));
    console.log('📄 Swagger API Docs available at /api-docs');
  } catch (error) {
    console.error('Failed to setup Swagger:', error.message);
  }
};

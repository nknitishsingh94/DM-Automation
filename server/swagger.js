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

    const swaggerOptions = {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Insta AI Agent API Documentation',
      customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.8/swagger-ui.min.css',
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.8/swagger-ui-bundle.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.8/swagger-ui-standalone-preset.min.js'
      ]
    };

    app.use('/api-docs', swaggerUi.serveFiles(swaggerFile, swaggerOptions), swaggerUi.setup(swaggerFile, swaggerOptions));
    console.log('📄 Swagger API Docs available at /api-docs');
  } catch (error) {
    console.error('Failed to setup Swagger:', error.message);
  }
};

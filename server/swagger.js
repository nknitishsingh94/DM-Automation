import { apiReference } from '@scalar/express-api-reference';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const setupSwagger = (app) => {
  try {
    const swaggerFile = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger_output.json'), 'utf8'));

    app.use('/api-docs', apiReference({
      spec: {
        content: swaggerFile,
      },
      theme: 'default',
      layout: 'modern',
      metaData: {
        title: 'Insta AI Agent API Documentation',
      }
    }));

    console.log('📄 Scalar API Reference available at /api-docs');
  } catch (error) {
    console.error('Failed to setup Scalar API Reference:', error.message);
  }
};

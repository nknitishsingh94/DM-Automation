import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Insta AI Agent API Docs',
      version: '1.0.0',
      description: 'API documentation for the Instagram DM Automation Backend',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
      {
        url: process.env.SERVER_PUBLIC_URL || 'https://your-production-url.com',
        description: 'Production Server',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Document analytics and posts routes as a starting point
  apis: [
    path.join(__dirname, './routes/analytics.js'),
    path.join(__dirname, './routes/posts.js'),
    path.join(__dirname, './index.js')
  ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  console.log('📄 Swagger API Docs available at /api-docs');
};

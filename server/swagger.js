import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './swaggerConfig.js';

export const setupSwagger = (app) => {
  try {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Insta AI Agent API Documentation'
    }));
    console.log('📄 Swagger API Docs available at /api-docs');
  } catch (error) {
    console.error('Failed to setup Swagger:', error.message);
  }
};

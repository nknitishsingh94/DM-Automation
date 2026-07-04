import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Insta AI Agent API',
    description: 'Comprehensive API documentation for the Insta AI Agent Backend.',
  },
  host: 'localhost:5000',
  schemes: ['http', 'https'],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [ { bearerAuth: [] } ]
};

const outputFile = './swagger_output.json';
const routes = ['./index.js']; 

swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, doc).then(() => {
    console.log("Swagger UI generated successfully.");
});

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

import fs from 'fs';

swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, doc).then(() => {
    const swaggerData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    
    const tagDescriptions = {
      'Auth': 'Authentication and User Management',
      'Youtube': 'YouTube Video & Analytics APIs',
      'Webhooks': 'Meta & Platform Webhooks',
      'Connections': 'Social Media Platform Connections',
      'Scheduling': 'Post Scheduling & Publishing',
      'Analytics': 'Dashboard and Metrics',
      'Posts': 'Manage Posts and Media',
      'Forms': 'Custom Forms & Lead Gen',
      'Payment': 'Stripe/Razorpay Integrations',
      'Messaging': 'Chats & Direct Messages'
    };
    
    const tagsSet = new Set();

    for (const path in swaggerData.paths) {
      let tagName = 'General';
      if (path.includes('/auth') || path.includes('/oauth')) tagName = 'Auth';
      else if (path.includes('/youtube')) tagName = 'Youtube';
      else if (path.includes('/webhook')) tagName = 'Webhooks';
      else if (path.includes('/connections')) tagName = 'Connections';
      else if (path.includes('/scheduling')) tagName = 'Scheduling';
      else if (path.includes('/analytics')) tagName = 'Analytics';
      else if (path.includes('/post')) tagName = 'Posts';
      else if (path.includes('/forms')) tagName = 'Forms';
      else if (path.includes('/payment') || path.includes('/checkout') || path.includes('/subscription')) tagName = 'Payment';
      else if (path.includes('/chat') || path.includes('/threads')) tagName = 'Messaging';
      
      tagsSet.add(tagName);
      
      for (const method in swaggerData.paths[path]) {
        swaggerData.paths[path][method].tags = [tagName];
      }
    }
    
    swaggerData.tags = Array.from(tagsSet).map(name => ({
      name,
      description: tagDescriptions[name] || `${name} APIs`
    }));

    fs.writeFileSync(outputFile, JSON.stringify(swaggerData, null, 2));
    console.log("Swagger UI generated and auto-tagged successfully.");
});

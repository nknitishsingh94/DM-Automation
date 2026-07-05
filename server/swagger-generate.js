import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'smart10X API',
    description: 'Comprehensive API documentation for the smart10X Backend.',
  },
  servers: [
    {
      url: 'https://dm-automation-w9a4.vercel.app',
      description: 'Production Server'
    },
    {
      url: 'http://localhost:5001',
      description: 'Local Development Server'
    }
  ],
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
      'YouTube': 'YouTube Video & Analytics APIs',
      'Facebook': 'Facebook Pages and Media APIs',
      'Instagram': 'Instagram Graph APIs',
      'Twitter': 'Twitter Post & DM APIs',
      'Pinterest': 'Pinterest Board & Pin APIs',
      'LinkedIn': 'LinkedIn Posting APIs',
      'WhatsApp': 'WhatsApp Business APIs',
      'Webhooks': 'Meta & Platform Webhooks',
      'Scheduling': 'Post Scheduling & Publishing',
      'Automations': 'Comment & DM Automation Campaigns',
      'Messaging': 'Unified Inbox & Direct Messages',
      'Payment': 'Stripe/Razorpay Integrations',
      'Analytics': 'Dashboard and Metrics',
      'General': 'Core System APIs'
    };
    
    const tagsSet = new Set();
    
    // Filter out internal, test, and debug routes so they don't show up in public docs
    const excludedKeywords = ['/test', '/debug', '/diag', '/fix', '/health', '/ping', '/cron'];
    
    for (const path in swaggerData.paths) {
      if (excludedKeywords.some(keyword => path.includes(keyword))) {
        delete swaggerData.paths[path];
        continue;
      }

      let tagName = 'General';
      if (path.includes('/auth') || path.includes('/oauth')) tagName = 'Auth';
      else if (path.includes('/youtube')) tagName = 'YouTube';
      else if (path.includes('/facebook')) tagName = 'Facebook';
      else if (path.includes('/instagram')) tagName = 'Instagram';
      else if (path.includes('/twitter')) tagName = 'Twitter';
      else if (path.includes('/pinterest')) tagName = 'Pinterest';
      else if (path.includes('/linkedin')) tagName = 'LinkedIn';
      else if (path.includes('/whatsapp')) tagName = 'WhatsApp';
      else if (path.includes('/webhook')) tagName = 'Webhooks';
      else if (path.includes('/scheduling')) tagName = 'Scheduling';
      else if (path.includes('/campaign')) tagName = 'Automations';
      else if (path.includes('/analytics')) tagName = 'Analytics';
      else if (path.includes('/post')) tagName = 'General';
      else if (path.includes('/forms')) tagName = 'General';
      else if (path.includes('/payment') || path.includes('/checkout') || path.includes('/subscription')) tagName = 'Payment';
      else if (path.includes('/chat') || path.includes('/threads') || path.includes('/message')) tagName = 'Messaging';
      
      tagsSet.add(tagName);
      
      for (const method in swaggerData.paths[path]) {
        const endpoint = swaggerData.paths[path][method];
        
        // Assign tags to endpoints. If it's a unified endpoint, assign it to multiple platforms so it appears under each!
        if (path.includes('/scheduling') && method === 'post') {
            endpoint.tags = ['Facebook', 'Instagram', 'Twitter', 'Pinterest', 'LinkedIn', 'YouTube'];
        } else if (path.includes('/campaign')) {
            endpoint.tags = ['Facebook', 'Instagram']; // Comment automations are for Meta
        } else if (path.includes('/messages') || path.includes('/chat') || path.includes('/broadcasts')) {
            endpoint.tags = ['Facebook', 'Instagram', 'WhatsApp', 'Twitter']; // Unified Inbox
        } else {
            endpoint.tags = [tagName];
        }
        
        // Auto-generate a readable summary based on path
        let pathParts = path.replace('/api/', '').split('/').filter(p => !p.includes('{'));
        let resource = pathParts.join(' ');
        if (!resource || resource === '/') resource = 'System';
        
        let action = method.charAt(0).toUpperCase() + method.slice(1);
        if (method === 'get') action = 'Retrieve';
        if (method === 'post') action = 'Create';
        if (method === 'put' || method === 'patch') action = 'Update';
        if (method === 'delete') action = 'Delete';
        
        // Title Case Resource
        resource = resource.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        let summary = `${action} ${resource}`;
        let description = `This endpoint allows you to ${action.toLowerCase()} data for the ${resource} resource. Authentication may be required depending on the route.`;
        
        // Manual high-quality overrides for critical endpoints (Zernio style)
        if (path === '/api/auth/signup' && method === 'post') {
            summary = 'Register New User';
            description = 'Creates a new user account in the system and provisions an initial workspace. Requires email and password. Returns user object and authentication token.';
        } else if (path === '/api/auth/login' && method === 'post') {
            summary = 'User Login';
            description = 'Authenticates an existing user and returns a JWT access token. Use this token in the Authorization header (Bearer format) for all subsequent API requests.';
        } else if (path === '/api/scheduling' && method === 'post') {
            summary = 'Schedule a Post';
            description = 'Schedules a new social media post (image, video, or carousel) to connected platforms. Supports setting automation rules (like requireFollow, publicReply) natively via this endpoint.';
        } else if (path === '/api/campaigns' && method === 'post') {
            summary = 'Create Automation Campaign';
            description = 'Creates a Comment-to-DM automation campaign. Defines trigger keywords and the automatic direct message response for followers.';
        } else if (path.includes('/webhook')) {
            summary = 'Platform Webhook Handler';
            description = 'Endpoint for receiving real-time event webhooks from social media platforms (Meta, Twitter). Automatically processes incoming comments, DMs, and live streams to trigger automations.';
        } else if (path === '/api/ai/generate' && method === 'post') {
            summary = 'AI Generation Tool';
            description = 'Generates intelligent content or images using AI. Provide a prompt and type (e.g., thumbnail, caption) to receive an AI-generated asset.';
        } else if (path === '/api/settings' && method === 'post') {
            summary = 'Update Integrations Settings';
            description = 'Updates workspace integrations and social media platform connections (e.g., Facebook, Instagram, Twitter tokens).';
        } else if (path.includes('/messages') && method === 'post') {
            summary = 'Send Direct Message';
            description = 'Sends a direct message to a user on a specified platform via the unified inbox system.';
        }
        
        endpoint.summary = summary;
        endpoint.description = description;
      }
    }
    
    swaggerData.tags = Array.from(tagsSet).map(name => ({
      name,
      description: tagDescriptions[name] || `${name} APIs`
    }));

    fs.writeFileSync(outputFile, JSON.stringify(swaggerData, null, 2));
    console.log("Swagger UI generated and auto-tagged successfully.");
});

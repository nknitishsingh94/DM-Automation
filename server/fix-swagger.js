import fs from 'fs';

const outputFile = './swagger_output.json';
const swaggerData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

// Delete the malformed auth path if it exists
if (swaggerData.paths['/auth']) delete swaggerData.paths['/auth'];
if (swaggerData.paths['/signup']) delete swaggerData.paths['/signup'];
if (swaggerData.paths['/login']) delete swaggerData.paths['/login'];

// Delete google auth routes
if (swaggerData.paths['/api/auth/google']) delete swaggerData.paths['/api/auth/google'];
if (swaggerData.paths['/api/auth/google_custom']) delete swaggerData.paths['/api/auth/google_custom'];

// Fix tags missing
const orderedTags = ['Auth', 'API Keys', 'General', 'Scheduling', 'Automations', 'Messaging', 'Analytics', 'Payment', 'Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube', 'Pinterest', 'WhatsApp', 'Webhooks'];
if (!swaggerData.tags.find(t => t.name === 'API Keys')) {
  swaggerData.tags.splice(1, 0, { name: 'API Keys', description: 'Manage Developer API Keys' });
}

swaggerData.paths['/api/auth/signup'] = {
  post: {
    tags: ['Auth'],
    summary: 'Register New User',
    description: 'Creates a new user account in the system and provisions an initial workspace. Requires email and password. Returns user object and authentication token.',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              username: { type: 'string', example: 'john_doe' },
              email: { type: 'string', example: 'john@example.com' },
              password: { type: 'string', example: 'securepassword123' }
            },
            required: ['username', 'email', 'password']
          }
        }
      }
    },
    responses: {
      '201': { description: 'User created successfully' },
      '400': { description: 'Bad Request' }
    }
  }
};

swaggerData.paths['/api/auth/login'] = {
  post: {
    tags: ['Auth'],
    summary: 'User Login',
    description: 'Authenticates an existing user and returns a JWT access token. Use this token in the Authorization header (Bearer format) for all subsequent API requests.',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: { type: 'string', example: 'john@example.com' },
              password: { type: 'string', example: 'securepassword123' }
            },
            required: ['email', 'password']
          }
        }
      }
    },
    responses: {
      '200': { description: 'Login successful' },
      '400': { description: 'Bad Request' },
      '404': { description: 'User not found' }
    }
  }
};

swaggerData.paths['/api/api-keys'] = {
  get: {
    tags: ['API Keys'],
    summary: 'List API Keys',
    description: 'Retrieves a list of all active API keys for the authenticated user/workspace. Keys are returned partially masked for security.',
    responses: {
      '200': { description: 'Successful operation' }
    }
  },
  post: {
    tags: ['API Keys'],
    summary: 'Create API Key',
    description: 'Creates a new API Key for server-to-server integration (e.g. ZERNIO_API_KEY). Format: sk_live_ + 48 hex characters. The full key is only returned once.',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Production Node.js Server' }
            }
          }
        }
      }
    },
    responses: {
      '201': { description: 'API Key created successfully' },
      '400': { description: 'Maximum limit of active API keys reached' }
    }
  }
};

swaggerData.paths['/api/api-keys/{id}'] = {
  delete: {
    tags: ['API Keys'],
    summary: 'Revoke API Key',
    description: 'Permanently revokes an API key, immediately disabling its ability to authenticate requests.',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
    ],
    responses: {
      '200': { description: 'API Key successfully revoked.' },
      '404': { description: 'API Key not found.' }
    }
  }
};

fs.writeFileSync(outputFile, JSON.stringify(swaggerData, null, 2));
console.log('Fixed auth paths manually!');

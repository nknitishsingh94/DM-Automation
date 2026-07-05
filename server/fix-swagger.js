import fs from 'fs';

const outputFile = './swagger_output.json';
const swaggerData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

// Delete the malformed auth path if it exists
if (swaggerData.paths['/auth']) delete swaggerData.paths['/auth'];
if (swaggerData.paths['/signup']) delete swaggerData.paths['/signup'];
if (swaggerData.paths['/login']) delete swaggerData.paths['/login'];

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

fs.writeFileSync(outputFile, JSON.stringify(swaggerData, null, 2));
console.log('Fixed auth paths manually!');

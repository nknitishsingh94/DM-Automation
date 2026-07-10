export const swaggerDocument = {
  "openapi": "3.0.0",
  "info": {
    "title": "Smart100X API",
    "version": "1.0.0",
    "description": "Comprehensive API documentation for the Smart100X Backend. Integrate social media automation, scheduling, and AI-driven responses into your applications seamlessly.",
    "contact": {
      "name": "API Support",
      "email": "support@smart100x.com"
    }
  },
  "servers": [
    {
      "url": "http://localhost:5000",
      "description": "Local Development Server"
    },
    {
      "url": "https://smart100x-w9a4.vercel.app",
      "description": "Production Server"
    }
  ],
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Enter your JWT token to authorize API requests."
      }
    }
  },
  "security": [
    {
      "bearerAuth": []
    }
  ],
  "tags": [
    {
      "name": "Authentication",
      "description": "Endpoints related to user authentication and session management."
    },
    {
      "name": "Scheduling",
      "description": "Endpoints for scheduling, updating, and managing social media posts."
    },
    {
      "name": "Social Connections",
      "description": "Endpoints to manage and verify connections with social media platforms (OAuth)."
    },
    {
      "name": "YouTube",
      "description": "YouTube-specific endpoints for video uploads and data retrieval."
    },
    {
      "name": "Webhooks",
      "description": "Endpoints for handling incoming webhooks from external platforms like Meta."
    },
    {
      "name": "Analytics",
      "description": "Endpoints to retrieve performance metrics and analytics."
    }
  ],
  "paths": {
    "/api/auth/google": {
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "Authenticate with Google",
        "description": "Exchange a Google OAuth token or authorization code for a session token in our system.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "token": {
                    "type": "string",
                    "description": "Google ID Token from the client-side login."
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful authentication",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "token": {
                      "type": "string"
                    },
                    "userId": {
                      "type": "string"
                    },
                    "user": {
                      "type": "object"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/scheduling": {
      "post": {
        "tags": [
          "Scheduling"
        ],
        "summary": "Create a Scheduled Post",
        "description": "Schedule a new post for supported platforms including Instagram, Facebook, LinkedIn, Twitter, Pinterest, and YouTube.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "platform": {
                    "type": "string",
                    "example": "instagram"
                  },
                  "caption": {
                    "type": "string"
                  },
                  "scheduledFor": {
                    "type": "string",
                    "format": "date-time"
                  },
                  "mediaUrl": {
                    "type": "string"
                  },
                  "status": {
                    "type": "string",
                    "example": "Scheduled"
                  },
                  "pinterestTitle": {
                    "type": "string"
                  },
                  "pinterestLink": {
                    "type": "string"
                  },
                  "pinterestBoard": {
                    "type": "string"
                  },
                  "pinterestIsAIModified": {
                    "type": "boolean"
                  },
                  "pinterestAllowComments": {
                    "type": "boolean"
                  },
                  "youtubeTitle": {
                    "type": "string"
                  },
                  "youtubeVisibility": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Post scheduled successfully."
          }
        }
      },
      "get": {
        "tags": [
          "Scheduling"
        ],
        "summary": "Get Scheduled Posts",
        "description": "Retrieve all scheduled and drafted posts for the authenticated user.",
        "responses": {
          "200": {
            "description": "List of scheduled posts."
          }
        }
      }
    },
    "/api/youtube/get-upload-url": {
      "post": {
        "tags": [
          "YouTube"
        ],
        "summary": "Get YouTube Resumable Upload URL",
        "description": "Initiate a resumable upload session with YouTube API to upload large video files directly from the client.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "fileSize": {
                    "type": "number",
                    "description": "Size of the video file in bytes."
                  },
                  "mimeType": {
                    "type": "string",
                    "description": "MIME type of the video."
                  },
                  "title": {
                    "type": "string"
                  },
                  "description": {
                    "type": "string"
                  },
                  "visibility": {
                    "type": "string",
                    "enum": [
                      "public",
                      "unlisted",
                      "private"
                    ]
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Upload URL generated successfully."
          }
        }
      }
    },
    "/api/connections": {
      "get": {
        "tags": [
          "Social Connections"
        ],
        "summary": "Get Connection Status",
        "description": "Retrieve the connection status and credentials validity for all integrated social platforms.",
        "responses": {
          "200": {
            "description": "Connection statuses retrieved successfully."
          }
        }
      }
    },
    "/api/webhooks/instagram": {
      "post": {
        "tags": [
          "Webhooks"
        ],
        "summary": "Instagram Webhook Listener",
        "description": "Endpoint for Meta to push incoming Instagram DMs, Comments, and Story Mentions. Triggers automated responses.",
        "responses": {
          "200": {
            "description": "EVENT_RECEIVED"
          },
          "404": {
            "description": "Not Found"
          }
        }
      },
      "get": {
        "tags": [
          "Webhooks"
        ],
        "summary": "Instagram Webhook Verification",
        "description": "Endpoint for Meta to verify the webhook URL during setup.",
        "parameters": [
          {
            "name": "hub.mode",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "hub.verify_token",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "hub.challenge",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Challenge accepted"
          },
          "403": {
            "description": "Verification failed"
          }
        }
      }
    }
  }
};

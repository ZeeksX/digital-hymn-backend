export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Digital Hymn Book REST API',
    version: '1.0.0',
    description: `
## Overview & Frontend Integration Guide
Welcome to the **Digital Hymn Book Production API** documentation. This API powers the Digital Hymn Book Angular application, replacing mock data and browser-local storage with a secure, server-backed REST API.

---

### Key Frontend Integration Notes

#### 1. Authentication & Cookie Management
- **HttpOnly Cookies**: All authentication is handled through secure **HttpOnly cookies** (\`access_token\` and \`refresh_token\`).
- **Angular HttpClient Setting**: You **MUST** configure all Angular HTTP requests to include credentials:
  \`\`\`typescript
  // In your Angular service or HTTP Interceptor:
  this.http.get(url, { withCredentials: true });
  \`\`\`
  Or provide a global interceptor that sets \`req.clone({ withCredentials: true })\`.
- **Determining Auth State**: Because cookies are \`HttpOnly\`, Angular cannot read tokens directly. On app startup or route transitions, call **\`GET /api/v1/auth/me\`**. If it succeeds (HTTP 200), the user is authenticated. If it returns HTTP 401, the user is anonymous or needs to refresh.
- **Token Refresh Flow**:
  1. Access tokens are short-lived (15 minutes).
  2. When an API call returns HTTP 401 \`UNAUTHENTICATED\`, catch it in your Angular HTTP interceptor.
  3. Call **\`POST /api/v1/auth/refresh\`** (with \`withCredentials: true\`).
  4. The server validates the \`refresh_token\` cookie, performs rotation, sets new cookies, and responds with HTTP 200.
  5. Retry the original request.
  6. If refresh returns 401, redirect the user to Login.

#### 2. CSRF (Cross-Site Request Forgery) Protection
- Angular's \`HttpClientXsrfModule\` automatically reads the cookie named \`XSRF-TOKEN\` and sends its value in the \`X-XSRF-TOKEN\` header on all mutating requests (\`POST\`, \`PUT\`, \`PATCH\`, \`DELETE\`).
- This backend issues an \`XSRF-TOKEN\` cookie on all requests or via **\`GET /api/v1/auth/csrf-token\`**.

#### 3. Standard Response Formats
- **Standard Success**:
  \`\`\`json
  {
    "success": true,
    "message": "Optional message",
    "data": { ... }
  }
  \`\`\`
- **Paginated List**:
  \`\`\`json
  {
    "success": true,
    "data": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 120,
      "totalPages": 6,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
  \`\`\`
- **Standard Error**:
  \`\`\`json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR | UNAUTHENTICATED | FORBIDDEN | NOT_FOUND | CONFLICT | RATE_LIMITED | INTERNAL_ERROR",
      "message": "Human readable summary",
      "fields": {
        "email": "Field-specific validation error"
      }
    }
  }
  \`\`\`
    `,
    contact: {
      name: 'Digital Hymn Book Engineering',
      email: 'support@digitalhymnbook.org',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Current Base URL',
    },
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description: 'HttpOnly cookie automatically transmitted by browser with `withCredentials: true`.',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Optional Bearer token header for testing tools outside browsers.',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '652f1a2b3c4d5e6f7a8b9c0d' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
          authProvider: { type: 'string', enum: ['local', 'google'], example: 'local' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      UserPreference: {
        type: 'object',
        properties: {
          theme: { type: 'string', enum: ['light', 'dark', 'system'], example: 'dark' },
          defaultTextSize: { type: 'string', enum: ['sm', 'md', 'lg', 'xl'], example: 'lg' },
          rememberRecentlyViewed: { type: 'boolean', example: true },
          keepScreenAwake: { type: 'boolean', example: false },
          serifLyrics: { type: 'boolean', example: false },
          showVerseNumbers: { type: 'boolean', example: true },
        },
      },
      HymnVerse: {
        type: 'object',
        properties: {
          number: { type: 'integer', example: 1 },
          lines: {
            type: 'array',
            items: { type: 'string' },
            example: [
              'Nnam Abasi, ke nyin inam,',
              'Ekwo ikwo idara ke ebe iso Esie;',
            ],
          },
          englishLines: {
            type: 'array',
            items: { type: 'string' },
            example: ['All people that on earth do dwell,', 'Sing to the Lord with cheerful voice;'],
          },
        },
      },
      Hymn: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '652f1a2b3c4d5e6f7a8b9c01' },
          number: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Nnam Abasi' },
          alternateTitle: { type: 'string', example: 'All People That On Earth Do Dwell' },
          category: { type: 'string', example: 'Praise' },
          author: { type: 'string', example: 'William Kethe' },
          verses: {
            type: 'array',
            items: { $ref: '#/components/schemas/HymnVerse' },
          },
          chorus: {
            type: 'array',
            items: { type: 'string' },
          },
          englishChorus: {
            type: 'array',
            items: { type: 'string' },
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            example: ['praise', 'worship'],
          },
          meter: { type: 'string', example: 'L.M. (8.8.8.8)' },
          tune: { type: 'string', example: 'Old 100th' },
          key: { type: 'string', example: 'G Major' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '652f1a2b3c4d5e6f7a8b9c10' },
          name: { type: 'string', example: 'Praise' },
          slug: { type: 'string', example: 'praise' },
          description: { type: 'string', example: 'Songs of exaltation and thanksgiving.' },
          hymnCount: { type: 'integer', example: 58 },
          iconName: { type: 'string', example: 'Users' },
          color: { type: 'string', example: 'emerald' },
        },
      },
      FavoriteItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '652f1a2b3c4d5e6f7a8b9c20' },
          hymn: { $ref: '#/components/schemas/Hymn' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      RecentlyViewedItem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '652f1a2b3c4d5e6f7a8b9c30' },
          hymn: { $ref: '#/components/schemas/Hymn' },
          viewedAt: { type: 'string', format: 'date-time' },
        },
      },
      HymnSuggestion: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '652f1a2b3c4d5e6f7a8b9c40' },
          title: { type: 'string', example: 'Abasi Mbom' },
          author: { type: 'string', example: 'Mary Slessor' },
          category: { type: 'string', example: 'Grace' },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'], example: 'pending' },
          submittedBy: { type: 'string', example: 'Ezekiel' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 120 },
          totalPages: { type: 'integer', example: 6 },
          hasNextPage: { type: 'boolean', example: true },
          hasPreviousPage: { type: 'boolean', example: false },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100, example: 'Esther Ezekiel' },
          email: { type: 'string', format: 'email', example: 'esther@example.com' },
          password: {
            type: 'string',
            minLength: 8,
            maxLength: 128,
            description: 'Minimum 8 characters, at least 1 letter and 1 number/symbol',
            example: 'HymnPassword123!',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'esther@example.com' },
          password: { type: 'string', example: 'HymnPassword123!' },
        },
      },
      GoogleAuthRequest: {
        type: 'object',
        required: ['idToken'],
        properties: {
          idToken: {
            type: 'string',
            description: 'Google credential / idToken returned by Google Identity SDK (@angular/google-signin or Google GIS)',
            example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMy...google_id_token',
          },
        },
      },
      UpdatePreferencesRequest: {
        type: 'object',
        properties: {
          theme: { type: 'string', enum: ['light', 'dark', 'system'], example: 'dark' },
          defaultTextSize: { type: 'string', enum: ['sm', 'md', 'lg', 'xl'], example: 'lg' },
          rememberRecentlyViewed: { type: 'boolean', example: true },
          keepScreenAwake: { type: 'boolean', example: false },
          serifLyrics: { type: 'boolean', example: false },
          showVerseNumbers: { type: 'boolean', example: true },
        },
      },
      HymnSuggestionRequest: {
        type: 'object',
        required: ['title', 'author', 'category', 'lyrics', 'submittedBy', 'email'],
        properties: {
          title: { type: 'string', minLength: 2, maxLength: 150, example: 'Amazing Grace' },
          author: { type: 'string', minLength: 2, maxLength: 100, example: 'John Newton' },
          category: { type: 'string', minLength: 2, maxLength: 100, example: 'Grace' },
          lyrics: {
            type: 'string',
            minLength: 10,
            maxLength: 10000,
            example: 'Amazing grace how sweet the sound...',
          },
          submittedBy: { type: 'string', minLength: 2, maxLength: 100, example: 'Esther' },
          email: { type: 'string', format: 'email', example: 'esther@example.com' },
        },
      },
      StandardSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully.' },
          data: { type: 'object' },
        },
      },
      PaginatedHymnsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Hymn' },
          },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      StandardErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                enum: [
                  'VALIDATION_ERROR',
                  'UNAUTHENTICATED',
                  'FORBIDDEN',
                  'NOT_FOUND',
                  'CONFLICT',
                  'RATE_LIMITED',
                  'INTERNAL_ERROR',
                ],
                example: 'VALIDATION_ERROR',
              },
              message: { type: 'string', example: 'Some of the provided information is invalid.' },
              fields: {
                type: 'object',
                additionalProperties: { type: 'string' },
                example: { email: 'Please provide a valid email address.' },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Service health check',
        description: 'Lightweight endpoint returning service status and uptime.',
        responses: {
          200: {
            description: 'Service is operational',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'healthy' },
                        uptime: { type: 'number', example: 123.45 },
                        timestamp: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register with Email & Password',
        description: 'Creates a new user account, stores password hash securely, issues HttpOnly cookies, and returns the user profile.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Account registered and authenticated.',
            headers: {
              'Set-Cookie': {
                description: 'Sets `access_token` and `refresh_token` HttpOnly cookies.',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Registration successful.' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          409: {
            description: 'Email already registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
          422: {
            description: 'Validation failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
          429: {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with Email & Password',
        description: 'Authenticates a user, issues HttpOnly session cookies, and returns the user profile.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful.',
            headers: {
              'Set-Cookie': {
                description: 'Sets `access_token` and `refresh_token` HttpOnly cookies.',
                schema: { type: 'string' },
              },
            },
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful.' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Invalid email or password (prevents user enumeration)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
          429: {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/google': {
      post: {
        tags: ['Authentication'],
        summary: 'Google OAuth / Google Identity login',
        description: 'Verifies the Google ID token server-side, links or creates an account, and establishes an HttpOnly session.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GoogleAuthRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Google authentication successful.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Google authentication successful.' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid or expired Google token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description: 'Uses the `refresh_token` HttpOnly cookie to issue a new access token and rotate the refresh token with reuse detection.',
        responses: {
          200: {
            description: 'Session refreshed with new token pair.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Session refreshed successfully.' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Refresh token invalid, expired, or reuse detected',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Log out current user',
        description: 'Revokes the active refresh token in the database and clears authentication cookies.',
        responses: {
          200: {
            description: 'Successfully logged out.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Logged out successfully.' },
                    data: { type: 'null', example: null },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current authenticated user profile & preferences',
        description: 'Returns the authenticated user details and their saved preferences. Use this on app initialization to check if the user is already logged in.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: 'Authenticated user profile and preferences',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        preferences: { $ref: '#/components/schemas/UserPreference' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthenticated or session expired',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/csrf-token': {
      get: {
        tags: ['Authentication'],
        summary: 'Initialize CSRF Token',
        description: 'Issues or returns the `XSRF-TOKEN` cookie required for Angular mutating requests.',
        responses: {
          200: {
            description: 'CSRF token initialized',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        csrfToken: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/hymns': {
      get: {
        tags: ['Hymns'],
        summary: 'List hymns with pagination, search, category filtering, and sorting',
        description: 'Searches across hymn title, number, alternate title, author, and lyrics. Supports pagination and category filtering.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number (default: 1)',
            schema: { type: 'integer', default: 1, minimum: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page (default: 20, max: 100)',
            schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search keyword matching title, number, author, or lyrics (e.g. `grace`, `12`)',
            schema: { type: 'string', maxLength: 100 },
          },
          {
            name: 'category',
            in: 'query',
            description: 'Filter by category name (e.g. `Praise`, `Worship`, `Grace`)',
            schema: { type: 'string' },
          },
          {
            name: 'sort',
            in: 'query',
            description: 'Field to sort by (prefix with `-` for descending)',
            schema: {
              type: 'string',
              enum: ['number', '-number', 'title', '-title', 'createdAt', '-createdAt'],
              default: 'number',
            },
          },
        ],
        responses: {
          200: {
            description: 'Paginated list of hymns',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedHymnsResponse' },
              },
            },
          },
          400: {
            description: 'Invalid pagination or sorting parameters',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/hymns/{id}': {
      get: {
        tags: ['Hymns'],
        summary: 'Get single hymn details',
        description: 'Retrieves a single hymn by its MongoDB ObjectId or by its hymn number (e.g. `1` or `652f1a2b...`).',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Hymn ObjectId (24 hex characters) or numeric hymn number',
            schema: { type: 'string' },
            example: '1',
          },
        ],
        responses: {
          200: {
            description: 'Hymn found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Hymn' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Hymn not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List all hymn categories',
        description: 'Returns all available hymn categories along with their description, icon, color, and dynamic hymn count.',
        responses: {
          200: {
            description: 'List of categories',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Category' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/categories/{slug}/hymns': {
      get: {
        tags: ['Categories'],
        summary: 'Get hymns by category slug',
        description: 'Retrieves paginated hymns belonging to a specific category slug (e.g. `praise`, `worship`).',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            description: 'Category slug identifier',
            schema: { type: 'string' },
            example: 'praise',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
          },
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string', enum: ['number', '-number', 'title', '-title'], default: 'number' },
          },
        ],
        responses: {
          200: {
            description: 'Category hymns list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedHymnsResponse' },
              },
            },
          },
          404: {
            description: 'Category slug not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users/me/favorites': {
      get: {
        tags: ['Favorites'],
        summary: 'List user favorites',
        description: 'Returns all favorited hymns for the currently authenticated user.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of user favorites',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/FavoriteItem' },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthenticated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users/me/favorites/{hymnId}': {
      post: {
        tags: ['Favorites'],
        summary: 'Add a hymn to favorites',
        description: 'Adds a hymn (by ObjectId or hymn number) to the authenticated user favorites. Returns 409 if already in favorites.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: 'hymnId',
            in: 'path',
            required: true,
            description: 'Hymn ObjectId or hymn number',
            schema: { type: 'string' },
            example: '1',
          },
        ],
        responses: {
          201: {
            description: 'Hymn added to favorites',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Hymn added to favorites.' },
                    data: { $ref: '#/components/schemas/FavoriteItem' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Hymn does not exist',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
          409: {
            description: 'Hymn already in favorites',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Favorites'],
        summary: 'Remove a hymn from favorites',
        description: 'Removes a hymn (by ObjectId or hymn number) from the user favorites.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: 'hymnId',
            in: 'path',
            required: true,
            description: 'Hymn ObjectId or hymn number',
            schema: { type: 'string' },
            example: '1',
          },
        ],
        responses: {
          200: {
            description: 'Hymn removed from favorites',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Hymn removed from favorites.' },
                    data: {
                      type: 'object',
                      properties: {
                        removed: { type: 'boolean', example: true },
                        hymnId: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          404: {
            description: 'Favorite not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users/me/recently-viewed': {
      get: {
        tags: ['Recently Viewed'],
        summary: 'Get recently viewed hymns',
        description: 'Returns the user reading history, newest-first, bounded to 30 items.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: 'Recently viewed hymns list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/RecentlyViewedItem' },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthenticated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users/me/recently-viewed/{hymnId}': {
      post: {
        tags: ['Recently Viewed'],
        summary: 'Record a hymn in recently viewed history',
        description: 'Records or updates the recency timestamp for a hymn in the authenticated user reading history.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: 'hymnId',
            in: 'path',
            required: true,
            description: 'Hymn ObjectId or hymn number',
            schema: { type: 'string' },
            example: '1',
          },
        ],
        responses: {
          201: {
            description: 'Recorded in history',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Hymn recorded in recently viewed.' },
                    data: { $ref: '#/components/schemas/RecentlyViewedItem' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Hymn not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/users/me/preferences': {
      get: {
        tags: ['User Preferences'],
        summary: 'Get current user preferences',
        description: 'Retrieves the reader settings and preferences for the authenticated user.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: 'User preferences',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/UserPreference' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthenticated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['User Preferences'],
        summary: 'Update user preferences',
        description: 'Patches one or more user preferences. Strict schema prevents unauthorized field updates.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdatePreferencesRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Preferences successfully updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Preferences updated successfully.' },
                    data: { $ref: '#/components/schemas/UserPreference' },
                  },
                },
              },
            },
          },
          422: {
            description: 'Invalid preference property or value',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/hymn-suggestions': {
      post: {
        tags: ['Hymn Suggestions'],
        summary: 'Submit a hymn suggestion',
        description: 'Allows users or guests to suggest a new hymn. Rate-limited to prevent abuse. If authenticated, links to the user account.',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/HymnSuggestionRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Suggestion submitted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: {
                      type: 'string',
                      example: 'Hymn suggestion submitted successfully. Thank you for your contribution!',
                    },
                    data: { $ref: '#/components/schemas/HymnSuggestion' },
                  },
                },
              },
            },
          },
          422: {
            description: 'Validation error in submitted fields',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
          429: {
            description: 'Too many submissions (anti-spam limit)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardErrorResponse' },
              },
            },
          },
        },
      },
    },
  },
};

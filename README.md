# Digital Hymn Book — Production Backend API

A production-grade, secure REST API built with **Node.js, Express, TypeScript, and MongoDB (Mongoose)** for the **Digital Hymn Book Angular project**.

This backend replaces client-side mock data and browser-only `localStorage` with a robust, scalable server architecture supporting authenticated sessions, HttpOnly cookies, Google OAuth, full-text search, categories, favorites, reading history, reader preferences, and hymn submissions.

---

## Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [Technology Stack](#technology-stack)
3. [Project Directory Structure](#project-directory-structure)
4. [Getting Started & Local Setup](#getting-started--local-setup)
5. [Database Seeding](#database-seeding)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Frontend Angular Integration Guide](#frontend-angular-integration-guide)
   - [Credentialed Requests (`withCredentials`)](#1-credentialed-requests-withcredentials)
   - [Authentication Lifecycle & Token Rotation](#2-authentication-lifecycle--token-rotation)
   - [CSRF Protection (`XSRF-TOKEN`)](#3-csrf-protection-xsrf-token)
   - [Sample Angular Auth & CSRF Interceptor](#4-sample-angular-auth--csrf-interceptor)
8. [Security & Abuse Protection](#security--abuse-protection)
9. [Error Contract](#error-contract)
10. [Automated Testing](#automated-testing)
11. [Production Deployment & Graceful Shutdown](#production-deployment--graceful-shutdown)

---

## Architectural Overview

The backend is built around clean separation of concerns and layered architecture:
- **Routes**: Declare URI endpoints, attach specific rate-limiters, validation schemas, and auth guards.
- **Controllers**: Handle request unpacking, response headers, and HTTP status codes.
- **Services**: Enforce domain logic, database queries, password hashing, and token rotation.
- **Models**: Strongly typed Mongoose schemas with compound indexes, TTL cleanup, and projection sanitization.
- **Middleware**: Centralized validation, JWT/cookie authentication, CSRF validation, rate limiting, and safe error masking.

---

## Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB & Mongoose
- **Validation**: Zod (runtime validation of body, query, and params)
- **Password Security**: `bcryptjs` (salt rounds: 12)
- **Authentication**: Double HttpOnly Cookies (`access_token` + `refresh_token`), JWT, Token Family Rotation with Reuse Detection
- **OAuth**: Google Identity verification via `google-auth-library`
- **Security**: Helmet HTTP headers, CORS with explicit origin allowlist, CSRF protection, and categorized `express-rate-limit`
- **Documentation**: Swagger UI / OpenAPI 3.0 specification (`/api/docs`, `/api/v1/docs`)
- **Testing**: Vitest, Supertest, and `mongodb-memory-server` (100% self-contained integration tests)

---

## Project Directory Structure

```text
src/
├── config/
│   ├── constants.ts          # Expirations, cookie keys, page limits, error codes
│   ├── database.ts           # Mongoose connection & lifecycle handlers
│   └── env.ts                # Zod-validated environment config with fail-fast
├── docs/
│   ├── swagger.openapi.ts    # OpenAPI 3.0 specification
│   └── swagger.routes.ts     # Serves /api/docs and /api/docs.json
├── middleware/
│   ├── auth.middleware.ts    # RequireAuth & OptionalAuth guards
│   ├── csrf.middleware.ts    # Angular-compatible double submit cookie CSRF protection
│   ├── error.middleware.ts   # Centralized error handler with safe production masking
│   ├── not-found.middleware.ts # Standard JSON 404 handler
│   ├── rate-limiter.ts       # Categorized limiters (general, auth, search, suggestions)
│   ├── request-logger.ts     # Request logging middleware
│   └── validate.middleware.ts# Zod request validator
├── modules/
│   ├── auth/                 # Register, login, google, refresh, logout, me, refresh-tokens
│   ├── categories/           # Categories listing & category-filtered hymns
│   ├── favorites/            # User hymn favorites
│   ├── history/              # Recently viewed hymns (bounded, newest-first)
│   ├── hymns/                # Hymn listing, search, category filter, sorting, pagination
│   ├── preferences/          # User reader settings (theme, text size, etc.)
│   ├── suggestions/          # Community hymn suggestions
│   └── users/                # User model & safe projection
├── scripts/
│   ├── seed-data.ts          # Authentic hymn dataset (52+ hymns) & categories
│   └── seed.ts               # Database seed runner
├── shared/
│   ├── types/                # Express request type augmentations
│   └── utils/                # Standard ApiError, ApiResponse, tokens, password, sanitize
├── app.ts                    # Express app configuration
└── server.ts                 # HTTP server bootstrap & graceful shutdown
```

---

## Getting Started & Local Setup

### 1. Prerequisites
- Node.js >= 18
- MongoDB instance (local `mongod` or MongoDB Atlas URI)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example configuration:
```bash
cp .env.example .env
```
Update values in `.env` as required:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/digital-hymn-book
FRONTEND_ORIGIN=http://localhost:4200,http://127.0.0.1:4200
COOKIE_SECRET=change_to_a_long_random_secret_32_characters_minimum
JWT_ACCESS_SECRET=change_to_a_long_random_jwt_access_secret_32_chars
JWT_REFRESH_SECRET=change_to_a_long_random_jwt_refresh_secret_32_chars
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 4. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:5000`.
Swagger interactive documentation will be accessible at:
- **`http://localhost:5000/api/docs`**

---

## Database Seeding

The backend includes a seed script that populates all required categories and **52 complete hymns** with lyrics, verses, authors, meters, and tunes:

```bash
npm run seed
```

Output:
```text
--- Starting Database Seeding ---
Seeding categories...
Inserted/updated 10 categories.
Seeding hymns...
Inserted/updated 52 hymns.
Updating category hymn counts...
--- Database Seeding Completed Successfully! ---
```

---

## API Endpoints Reference

All application endpoints are prefixed with `/api/v1`.

### Health & Docs
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service uptime and status | Public |
| `GET` | `/api/docs` | Interactive Swagger UI | Public |
| `GET` | `/api/docs.json` | Raw OpenAPI 3.0 JSON specification | Public |

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new user with name, email, password | Public (Rate-limited) |
| `POST` | `/api/v1/auth/login` | Authenticate with email and password | Public (Rate-limited) |
| `POST` | `/api/v1/auth/google` | Verify Google ID token and log in / link account | Public (Rate-limited) |
| `POST` | `/api/v1/auth/refresh` | Rotate access & refresh tokens | HttpOnly Cookie |
| `POST` | `/api/v1/auth/logout` | Revoke session and clear cookies | HttpOnly Cookie |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile & preferences | Authenticated |
| `GET` | `/api/v1/auth/csrf-token`| Issue or verify `XSRF-TOKEN` cookie | Public |

### Hymns (`/api/v1/hymns`)
| Method | Endpoint | Description | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/hymns` | List hymns with pagination, search, category filter, and sorting | `page`, `limit` (max 100), `search`, `category`, `sort` |
| `GET` | `/api/v1/hymns/:id` | Get single hymn by MongoDB ObjectId or hymn number | None |

### Categories (`/api/v1/categories`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | List all categories with dynamic hymn counts |
| `GET` | `/api/v1/categories/:slug/hymns` | Get paginated hymns for a specific category slug |

### User Favorites (`/api/v1/users/me/favorites`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/me/favorites` | List all favorites for current user | Authenticated |
| `POST` | `/api/v1/users/me/favorites/:hymnId` | Add hymn to favorites (returns 409 if duplicate) | Authenticated |
| `DELETE` | `/api/v1/users/me/favorites/:hymnId` | Remove hymn from favorites | Authenticated |

### Recently Viewed (`/api/v1/users/me/recently-viewed`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/me/recently-viewed` | List reading history (newest-first, bounded to 30) | Authenticated |
| `POST` | `/api/v1/users/me/recently-viewed/:hymnId` | Record/update recency timestamp for hymn | Authenticated |

### User Preferences (`/api/v1/users/me/preferences`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/me/preferences` | Get current reader settings | Authenticated |
| `PATCH` | `/api/v1/users/me/preferences` | Update reader settings (`theme`, `defaultTextSize`, etc.) | Authenticated |

### Hymn Suggestions (`/api/v1/hymn-suggestions`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/hymn-suggestions` | Submit a hymn suggestion | Optional (Rate-limited) |

---

## Frontend Angular Integration Guide

### 1. Credentialed Requests (`withCredentials`)
Because authentication uses secure **HttpOnly cookies**, the browser must send cookies with every request.

In Angular:
```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';

// Ensure withCredentials: true on requests to this backend
req = req.clone({
  withCredentials: true,
});
```

### 2. Authentication Lifecycle & Token Rotation
1. **Determining Auth State on Startup**:
   Call `GET /api/v1/auth/me` with `withCredentials: true`.
   - If **HTTP 200**: User is logged in. Update your Angular state with `res.data.user` and `res.data.preferences`.
   - If **HTTP 401**: User is unauthenticated. Render anonymous state.
2. **Access Token Expiry**:
   Access tokens expire in **15 minutes**.
   When an API request returns HTTP 401:
   - Catch it in an HTTP interceptor.
   - Call `POST /api/v1/auth/refresh`.
   - The backend validates the refresh cookie, performs token rotation, and sets fresh cookies.
   - Retry the failed original request.
   - If refresh returns 401, redirect to `/login`.

### 3. CSRF Protection (`XSRF-TOKEN`)
Angular has built-in CSRF support:
- The backend sets a cookie named **`XSRF-TOKEN`** on all requests.
- Angular's `provideHttpClient(withXsrfConfiguration(...))` automatically reads `XSRF-TOKEN` and appends header `X-XSRF-TOKEN` on mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`).

### 4. Sample Angular Auth & CSRF Interceptor

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Always enable credentials for the backend
  const authReq = req.clone({
    withCredentials: true,
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle expired access token
      if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
        return authService.refreshToken().pipe(
          switchMap(() => next(authReq)),
          catchError((refreshErr) => {
            authService.handleSessionExpired();
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
```

---

## Security & Abuse Protection

- **Password Hashing**: Uses `bcryptjs` with salt work factor 12.
- **Credential Protection**: Passwords and hashes are marked `{ select: false }` and stripped from JSON serializations.
- **HttpOnly Cookies**: Session tokens cannot be accessed by client-side JavaScript, mitigating XSS token theft.
- **Token Rotation & Reuse Detection**: Refresh tokens are single-use. If a previously used token is submitted, the entire token family is revoked immediately.
- **Hashed Refresh Tokens**: Only SHA-256 hashes of refresh tokens are stored in the database.
- **Categorized Rate Limiting**:
  - Auth routes: 20 attempts per 15 minutes.
  - Hymn suggestions: 15 submissions per hour.
  - Search queries: 60 requests per minute.
  - General API: 300 requests per 15 minutes.
- **NoSQL Injection Defense**: User queries use explicit filters and regular expressions are escaped with `escapeRegex()` to prevent ReDoS.
- **Prototype Pollution Defense**: Preference updates use strict Zod schemas rejecting unexpected keys.

---

## Error Contract

All error responses return a standardized JSON structure with appropriate HTTP status codes:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some of the provided information is invalid.",
    "fields": {
      "email": "Please provide a valid email address.",
      "password": "Password must be at least 8 characters long."
    }
  }
}
```

### Standard Error Codes
| Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | 400 / 422 | Input failed Zod validation |
| `UNAUTHENTICATED` | 401 | Missing, expired, or invalid session |
| `FORBIDDEN` | 403 | CSRF failure or insufficient permissions |
| `NOT_FOUND` | 404 | Hymn, category, or endpoint does not exist |
| `CONFLICT` | 409 | Duplicate email or duplicate favorite |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Unhandled server error (details masked in production) |

---

## Automated Testing

The project includes 38 automated integration tests covering all critical paths. Tests use `mongodb-memory-server` and run completely self-contained without needing an external MongoDB instance.

```bash
# Run test suite once
npm test

# Run tests in watch mode
npm run test:watch
```

Test Suites:
- `tests/auth.test.ts`: Register, duplicate email, login, bad credentials, `/auth/me`, refresh token rotation, logout, Google auth verification.
- `tests/hymns.test.ts`: Pagination envelope, title/number/lyrics search, category filtering, sorting, get by ID/number, 404 handling, pagination boundary validation.
- `tests/favorites.test.ts`: Add favorite, duplicate favorite (409 Conflict), user isolation, remove favorite, unauthenticated protection.
- `tests/preferences.test.ts`: Retrieve preferences, update preferences, strict schema validation (rejection of malicious/unexpected properties).
- `tests/history-and-suggestions.test.ts`: Recently viewed recency update, duplicate prevention, guest suggestions, authenticated submissions, field validation.
- `tests/security.test.ts`: JSON 404 for unknown endpoints, lightweight health check, Swagger JSON availability, Helmet security headers.

---

## Production Deployment & Graceful Shutdown

### Build Production Bundle
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Graceful Shutdown
The application listens for `SIGTERM` and `SIGINT` signals:
1. Stops accepting incoming requests on the HTTP server.
2. Closes database connections cleanly with `mongoose.disconnect()`.
3. Exits with code 0 once pending requests complete.

---

## License

ISC License. Built for the Digital Hymn Book Application.

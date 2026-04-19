---
name: Backend Integration
description: Guidelines for integrating external APIs with high type safety and error handling.
---

# Backend Integration Skill

This skill ensures that the frontend communicates efficiently and safely with the external backend services.

## Service Layer
- **Architecture:** Use a dedicated `services/` or `lib/api/` directory.
- **Data Fetching:** Prefer `isomorphic-fetch` (native in Next.js) or established patterns for Server Components.
- **Types:** Every API response MUST have a corresponding TypeScript interface/type.

## Error Handling
- Use structured error handling (try/catch blocks).
- Display user-friendly error messages (e.g., "Membresía no activa", "Credenciales incorrectas").
- Handle loading states gracefully with Skeletons or Spinners.

## Features Logic
1. **Authentication:**
   - Session management (NextAuth or manual JWT).
   - Recovery flow must be strictly typed.
2. **Profile:**
   - Validation for editable fields.
   - QR code integration (handle loading/error states for the API call).
3. **Public Link:**
   - Ensure the public profile fetching logic is separated from authenticated routes.

## Best Practices
- Avoid hardcoding URLs; use environment variables.
- Log errors to a central system (if available) or console in development.

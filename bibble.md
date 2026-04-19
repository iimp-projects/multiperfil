# IIMP Multiperfil V2 - Technical Source of Truth (Bibble)

## Project Overview

A multi-profile intranet for the **IIMP** (Instituto de Ingenieros de Minas del Perú) associates, centralizing users from three main verticals:
- **GESS** (Gestión de Seguridad y Salud)
- **PROEXPLO** (Exploración Minera)
- **WMC** (World Mining Congress)

## Technical Stack (Confirmed)

- **Framework:** Next.js 16.1.6 (App Router + Turbopack)
- **Language:** TypeScript
- **Database:** MongoDB (Local + AWS)
- **ORM:** Prisma 6.19.3
- **Styling:** Tailwind CSS 4 + Lucide Icons.
- **Components:** `@nrivera-iimp/ui-kit-iimp` (Standard UI Library).

## Data Models (Prisma)

- **`UserSession`**: Tracks individual browser sessions, storing `userKey`, `userAgent`, `ip`, and timestamps.
- **`UserSessionLock`**: One record per `userKey`. Stores `activeSessionId`. Used to enforce "One active session per account".

## Business Logic & Security

### 1. Authentication & Session Lock
- **Genexus Provider**: The credentials (DNI/Password) are validated against a Genexus external API.
- **Lock Enforcement**: Upon successful login, the system creates a new `UserSession` and updates/creates the `UserSessionLock`. Any existing `activeSessionId` for that user is replaced.
- **Frontend Validation**: A background poll (every 20s) calls `/api/auth/validate`. If the `iimp_sid` does not match the `activeSessionId` in the lock table, the user is kicked out.

### 2. Google Translate Stability
- **Issue**: Google Translate mutates the DOM, causing React's `removeChild` and `insertBefore` to fail during navigation.
- **Fix**: A global patch in `layout.tsx` overrides `Node.prototype.removeChild` and `Node.prototype.insertBefore` to skip errors when parent-child relationships are broken by translation tags.
- **Error Boundary**: `TranslateErrorBoundary` wraps the entire app to catch hydration and DOM mismatches.

## Mandatory Coding standards

- **UI Kit**: All basic components (Inputs, Buttons, Tables) MUST come from `@nrivera-iimp/ui-kit-iimp`.
- **Language**: Core labels and strings must be in **Spanish**.
- **Icons**: Use `react-icons` or `lucide-react`.
- **Toasts**: Always use `sonner`.
- **Fonts/Sizes**: 
  - Use `text-base` as base text.
  - Never use `font-black` (use `font-bold`).
  - Never use hardcoded pixel sizes (use `sm`, `xs`).

## Development Scripts

- `npm run dev`: Automatically runs `prisma generate` and `prisma db push` before starting the Next.js server.
- **MongoDB Note**: Prisma transactions require MongoDB to be in **Replica Set** mode (`?replicaSet=rs0` in `DATABASE_URL`).

## Verification Workflow

- All pathnames and file names must be in **English**.
- Manual responsive testing on common breakpoints: 375px (Mobile), 1440px (Desktop).

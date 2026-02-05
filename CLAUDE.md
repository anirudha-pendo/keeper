# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 project using the App Router, React 19, TypeScript, and Tailwind CSS v4. The project uses shadcn/ui components with the "radix-mira" style variant and Hugeicons for iconography.

## Development Commands

- `pnpm dev` - Start the development server at http://localhost:3000
- `pnpm build` - Build the production application
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint (uses Next.js flat config format)

## Architecture

### UI Component System

This project uses shadcn/ui components configured with:
- **Style**: radix-mira (a Radix UI-based design system)
- **Icon Library**: Hugeicons (via `@hugeicons/react` and `@hugeicons/core-free-icons`)
- **Component Location**: `components/ui/` for reusable UI primitives
- **Utility Function**: `lib/utils.ts` exports `cn()` for className merging using `clsx` and `tailwind-merge`

### Path Aliases

The project uses TypeScript path aliases defined in `tsconfig.json`:
- `@/*` maps to the project root
- Key aliases from `components.json`:
  - `@/components` → `components/`
  - `@/lib` → `lib/`
  - `@/hooks` → `hooks/`
  - `@/ui` → `components/ui/`

### Styling

- **CSS Framework**: Tailwind CSS v4 (using PostCSS)
- **Theme System**: Custom CSS variables defined in `app/globals.css` with OKLCH color space
- **Dark Mode**: Implemented via `.dark` class variant
- **Design Tokens**: Uses CSS custom properties for colors, spacing, and radii
- **Base Color**: Stone (from Tailwind palette)
- **Border Radius**: CSS variable `--radius` set to `0.45rem`

### Component Patterns

Components follow these conventions:
- Client components use `"use client"` directive
- UI components are built on Radix UI primitives (via `radix-ui` package)
- Icons are imported from `@hugeicons/core-free-icons` and rendered with `HugeiconsIcon` wrapper
- Forms use the Field component pattern (`Field`, `FieldGroup`, `FieldLabel` from `components/ui/field.tsx`)
- Complex UI uses composition of shadcn primitives (AlertDialog, Card, Dropdown Menu, Select, Combobox, etc.)

### File Structure

```
app/              # Next.js App Router pages and layouts
├── layout.tsx    # Root layout with Geist fonts
├── page.tsx      # Home page (renders ComponentExample)
└── globals.css   # Global styles and theme variables

components/       # React components
├── ui/          # shadcn/ui component primitives
├── example.tsx  # Example wrapper components
└── component-example.tsx  # Main demo component

lib/             # Utility functions
└── utils.ts     # className merging utility
```

## Key Technologies

- **Framework**: Next.js 16.1.6 (App Router)
- **React**: 19.2.3 (latest stable)
- **TypeScript**: 5.x (strict mode enabled)
- **Styling**: Tailwind CSS v4 with PostCSS
- **UI Components**: shadcn/ui (radix-mira style) + Radix UI primitives
- **Icons**: Hugeicons
- **Utilities**: class-variance-authority, clsx, tailwind-merge

## Component Development

When adding new UI components:
1. Use shadcn CLI or manually create in `components/ui/`
2. Follow the radix-mira style conventions
3. Import icons from `@hugeicons/core-free-icons`
4. Render icons with `<HugeiconsIcon icon={IconName} strokeWidth={2} />`
5. Use `cn()` utility for conditional className logic
6. Leverage Radix UI primitives for accessibility

## TypeScript Configuration

- **Target**: ES2017
- **JSX**: react-jsx (automatic runtime)
- **Module Resolution**: bundler (modern)
- **Strict Mode**: Enabled
- **Path Mapping**: `@/*` resolves to project root

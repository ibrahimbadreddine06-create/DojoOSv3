# Dojo OS V2

## Overview

Dojo OS V2 is a focused personal operating system with 6 core active modules (Homepage, Daily Planner, Goals, Second Brain, Languages, Studies) and 10+ locked "Coming Soon" modules. It provides a unified platform for tracking daily activities, long-term goals, and knowledge acquisition with beautiful UI, mobile responsiveness, and Replit Auth integration.

## Recent Changes (December 2024)

### Comprehensive Note-Taking System
- **Notes Database Table**: New `notes` table with title, content (rich HTML), and chapter associations
- **Rich Text Editor**: Full-featured note editor with formatting toolbar (bold, italic, underline, strikethrough, headings H1-H3, bullet lists, numbered lists, text alignment, links, undo/redo)
- **File-Based Notes**: Notes displayed as clickable file list that opens in the editor; auto-save with debouncing
- **Materials File Upload**: Materials now support both URL links and direct file uploads (base64 encoded) with PDF, Word, PowerPoint, Excel, images, and videos
- **Hierarchical Content Aggregation**: Parent chapters automatically show content from all child chapters:
  - New API endpoints: `/api/materials/chapter/:id/with-children`, `/api/flashcards/chapter/:id/with-children`, `/api/notes/chapter/:id/with-children`
  - Child chapter IDs passed as query parameter for efficient fetching
- **Redesigned Chapter Content Area Layout**:
  - Row 1: Flashcards (left) + Progress metrics with completion/readiness bars (right)
  - Row 2: Materials section (full width)
  - Row 3: Notes section (full width)
- **Modernized UI**: Removed flashcard pie chart legends for cleaner look

### Time-Series Charts for Knowledge Modules
- **Unified Chart Structure**: Languages, Second Brain, and Studies pages now share identical structure with metrics chart and tabbed content
- **Time-Series LineCharts**: All three knowledge modules display multi-line charts with:
  - X-axis: Date progression (formatted as "MMM d")
  - Y-axis: Completion percentage (0-100% with 10% intervals)
  - Multiple lines: One line per language/theme/course showing individual progress
- **courseMetrics Table**: Added database table for tracking course completion over time
- **API Endpoints**: New endpoints `/api/knowledge-metrics-all/:type` and `/api/course-metrics-all` for time-series data
- **Data Validation**: Server-side validation for metrics (0-100 range) with NaN guards in chart rendering

## Changes (November 2024)

### Completed Features
1. **Authentication & Onboarding**: Beautiful landing page, Replit Auth integration, Profile page
2. **Locked Modules**: Coming Soon states for Body, Worship, Finances, Masterpieces, Possessions, Business, Work, Social Purpose, Disciplines, Ultimate Test
3. **Daily Planner**: Google Calendar-style hour grid (6am-midnight), click-to-add, drag-to-move/resize blocks with Pointer Events for touch support
4. **Block System**: Cross-page linking, nested sub-blocks (max 2 levels), tasks with importance (1-5)
5. **Preset System**: Create and apply day presets with blocks and tasks
6. **Knowledge Tracking**: Second Brain, Languages, Studies with shared structure (themes/courses, chapters, flashcards, materials)
7. **Learning System**: Notion-style nested chapters (infinite depth), Anki-style flashcards with spaced repetition
8. **Homepage Dashboard**: Customizable bento boxes with key metrics per module
9. **Charts & Metrics**: Completion/readiness charts with decay calculation
10. **Mobile Responsive**: Pointer events with touch-action:none, responsive layouts, sidebar overlay on sub-pages
11. **API Security**: All routes protected with isAuthenticated middleware

### Known Limitations
- Per-user data scoping not implemented (storage methods don't filter by userId) - suitable for single-user deployment

The application features two top-level spaces:
- **Dojo**: Active workspace with real-time tracking and input across multiple life domains
- **Ultimate Test**: Summarized dashboard that aggregates metrics from all Dojo modules

The system is built around modularity and interconnectivity - each module operates independently while exposing metrics that other modules can read and reference. Time blocks from the Daily Planner can be associated with any module and appear in both locations, maintaining bidirectional sync.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- Path aliases configured for clean imports (@/ for client, @shared for shared code)

**UI Component System**
- Shadcn UI component library (New York style variant) with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Design system influenced by Linear, Notion, and Material Design
- Typography: Inter for primary text, JetBrains Mono for numeric data
- Consistent spacing scale (2, 4, 6, 8, 12, 16, 24) and border radius values
- Custom CSS variables for theming with light/dark mode support

**State Management**
- TanStack Query (React Query) for server state management and caching
- Custom query client with error handling and automatic retries disabled
- Optimistic updates for real-time UI feedback
- Local component state with React hooks for UI-only state

**Form Handling**
- React Hook Form for form state and validation
- Zod schemas (from shared layer) for runtime validation
- @hookform/resolvers/zod for seamless integration

### Backend Architecture

**Server Framework**
- Express.js with TypeScript running on Node.js
- ESM module system throughout the codebase
- Custom middleware for request logging and JSON body parsing
- RESTful API design with resource-based routing

**Database Layer**
- PostgreSQL as the primary database (Neon serverless)
- Drizzle ORM for type-safe database queries and migrations
- WebSocket-based connection pooling for serverless environments
- Schema-first approach with shared TypeScript types

**Data Storage Pattern**
- Storage abstraction layer (IStorage interface) separating business logic from database operations
- All database operations centralized in server/storage.ts
- Type-safe query builders using Drizzle's API
- Schema definitions in shared/schema.ts for client-server type consistency

### Key Architectural Patterns

**Module-Based Organization**
Each life domain (Goals, Body, Worship, Finances, etc.) is implemented as:
- Independent page component with its own routing
- Dedicated database tables and schemas
- API endpoints following RESTful conventions
- Optional sub-modules (e.g., Body → Workout, Intake, Sleep, Hygiene)

**Cross-Module Data Flow**
- Time blocks can be associated with multiple modules via `associatedModules` array
- Modules expose metrics through dedicated API endpoints
- Ultimate Test aggregates data by querying individual module endpoints
- No hard dependencies between modules - loose coupling via exposed interfaces

**Metrics and Progress Tracking**
- Goals: Hierarchical progress calculation from subgoal completion
- Knowledge themes: Dual metrics (completion from learn-plan, readiness from spaced repetition)
- Daily habits: Weighted completion scoring based on importance levels (1-5)
- All metrics designed to be time-series compatible for historical trending

**Preset System**
- Day presets: Pre-configured sets of time blocks that can be applied to any date
- Activity presets: Module-specific task lists that can be attached to time blocks
- Stored as JSONB for flexible schema evolution

### Database Schema Design

**Core Tables**
- `time_blocks`: Daily scheduling with importance weighting and module associations
- `goals`: Hierarchical goal structure with year/quarter/month organization and JSONB subgoals
- `knowledge_themes`: Tracks learning themes across Second Brain, Languages, and Disciplines
- `daily_metrics`: Aggregated daily statistics for historical analysis
- `page_settings`: User preferences for which modules are active

**Specialized Domain Tables**
- Body: `workouts`, `exercises`, `intake_logs`, `sleep_logs`, `hygiene_routines`
- Worship: `salah_logs`, `quran_logs`, `dhikr_logs`, `dua_logs`
- Finances: `transactions` (income, expenses, recurring)
- Creative: `masterpieces`, `masterpiece_sections`
- Possessions: `possessions`, `outfits` (with laundry status tracking)
- Learning: `courses`, `lessons`, `course_exercises`
- Work: `businesses`, `work_projects`, `tasks`
- Social: `social_activities`, `people`

**Data Types**
- JSONB for flexible nested structures (subgoals, tasks, preset configurations)
- PostgreSQL enums for controlled vocabularies (priority, salah_status, laundry_status, module)
- Decimal types for financial and measurement precision
- Date vs Timestamp: dates for day-level tracking, timestamps for creation metadata

### API Design

**Endpoint Conventions**
- GET `/api/{resource}` - List all items
- GET `/api/{resource}/:id` - Get single item
- POST `/api/{resource}` - Create new item
- PATCH `/api/{resource}/:id` - Update existing item
- DELETE `/api/{resource}/:id` - Delete item

**Specialized Endpoints**
- GET `/api/time-blocks/:date` - Get blocks for specific date
- GET `/api/goals` - Returns goals with calculated progress
- GET `/api/knowledge-themes/:type` - Filter themes by type (second_brain, language, discipline)
- GET `/api/daily-metrics/:date` - Aggregated metrics for specific date

**Request/Response Flow**
- Zod schemas validate incoming data at API boundary
- Storage layer handles database operations
- Query client on frontend provides caching and optimistic updates
- Toast notifications for user feedback on mutations

## External Dependencies

**Database & ORM**
- @neondatabase/serverless: PostgreSQL serverless driver with WebSocket support
- drizzle-orm: Type-safe ORM for database queries and schema management
- drizzle-zod: Automatic Zod schema generation from Drizzle schemas
- connect-pg-simple: PostgreSQL session store (configured but sessions not yet implemented)

**UI Component Libraries**
- @radix-ui/*: Unstyled, accessible component primitives (20+ packages)
- class-variance-authority: Type-safe component variant system
- tailwindcss: Utility-first CSS framework
- cmdk: Command menu interface component
- embla-carousel-react: Touch-friendly carousel component
- lucide-react: Icon library

**Form & Validation**
- react-hook-form: Performant form state management
- @hookform/resolvers: Validation resolver for React Hook Form
- zod: TypeScript-first schema validation

**Data Fetching & State**
- @tanstack/react-query: Server state management and caching
- date-fns: Date utility library for formatting and manipulation

**Development Tools**
- vite: Fast build tool and dev server
- @vitejs/plugin-react: React integration for Vite
- typescript: Type system and compiler
- tsx: TypeScript execution for development
- esbuild: JavaScript bundler for production builds
- @replit/vite-plugin-*: Replit-specific development plugins

**Utilities**
- clsx: Conditional className utility
- tailwind-merge: Merge Tailwind classes without conflicts
- nanoid: Unique ID generation

**Runtime Environment**
- Node.js with ESM modules
- Express.js for HTTP server
- WebSocket support for database connections in serverless environment
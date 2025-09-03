# Overview

ApprovalFlow is a comprehensive document approval and workflow management system built with React and Express.js. The application enables organizations to create custom forms, design approval workflows, manage documents through approval processes, and handle user permissions through role-based access control. The system features a modern, responsive interface for form creation, workflow visualization, and real-time approval tracking.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Build System**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with custom design system using CSS variables for theming
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for accessibility
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Drag & Drop**: DND Kit for form designer and workflow builder interactions

## Backend Architecture
- **Runtime**: Node.js with Express.js framework using ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Validation**: Zod schemas shared between frontend and backend for consistent data validation
- **API Design**: RESTful endpoints with consistent error handling and request/response logging
- **File Structure**: Monorepo structure with shared schemas and separate client/server directories

## Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon Database for scalability and reliability
- **ORM**: Drizzle ORM with migrations support for database schema management
- **Schema Design**: 
  - Users and roles for authentication and authorization
  - Forms with JSON schema storage for dynamic form definitions
  - Workflows with step-based approval processes
  - Documents linking forms and workflows with status tracking
  - Approvals for tracking decision history and comments

## Authentication and Authorization
- **Role-Based Access Control**: Flexible permission system with custom roles
- **User Management**: Complete CRUD operations for user accounts with active/inactive status
- **Permission System**: JSON-based permissions stored in roles table for granular access control

## External Dependencies
- **Database**: Neon Database (PostgreSQL) for cloud-hosted data persistence
- **Font Services**: Google Fonts integration for typography (Inter, DM Sans, Fira Code, Geist Mono, Architects Daughter)
- **Development Tools**: 
  - Replit integration for development environment
  - ESBuild for server-side bundling in production
  - PostCSS with Autoprefixer for CSS processing

## Key Design Patterns
- **Shared Schema Architecture**: Common data validation schemas used across frontend and backend
- **Component Composition**: Reusable UI components with consistent design patterns
- **Type Safety**: End-to-end TypeScript implementation with strict type checking
- **Real-time UI Updates**: Optimistic updates and cache invalidation for responsive user experience
- **Modular Architecture**: Clear separation of concerns between form designer, workflow builder, and document management
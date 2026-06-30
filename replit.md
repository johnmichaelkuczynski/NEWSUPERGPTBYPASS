# GPT Bypass - AI Text Rewriter

## Overview

GPT Bypass is a comprehensive AI text rewriting application designed to transform AI-generated content to bypass detection tools. The system provides surgical style mimicking capabilities using multiple AI providers (OpenAI, Anthropic, DeepSeek, Perplexity) and integrates with GPTZero for AI detection scoring. Users can upload documents, apply style samples, customize rewrite instructions, and process text through intelligent chunking for large documents.

## Recent Changes (January 2025)

**State Persistence Across Stripe Checkout (October 4, 2025 - Latest)**
- Implemented localStorage-based state preservation that saves rewrites during payment flow
- **Automatic State Saving**: When user clicks "Buy Credits" (paywall banner or header), all rewrite data is saved to localStorage
- **Complete State Capture**: Preserves input text, output text, style text, content mix, custom instructions, selected presets, AI scores, and job ID
- **Seamless Restoration**: On return from Stripe checkout, automatically restores entire rewrite session
- **User Notification**: Shows "Rewrite Restored" toast notification when state is successfully restored
- **Auto-Cleanup**: Saved state is cleared after restoration to prevent stale data
- **Unified Navigation**: Shared `handleNavigateToPricing` callback used by both paywall banner and header pricing links
- **Confirmed Working**: User-tested and verified end-to-end flow

**Paywall System Improvements (October 4, 2025)**
- Fixed "Buy Credits" button in paywall banner to be clickable and route to /pricing page
- Implemented variable truncation for better user experience:
  - 80% preview for outputs ≤50 words (very generous for short content)
  - 65% preview for 51-100 words
  - 55% preview for 101-200 words
  - 45% preview for 201-400 words
  - 40% preview for 401-600 words
  - 35% preview for >600 words (30-50% range for long content)
- Enhanced credit deduction security: `creditsPaid` flag only set if deduction actually succeeds
- Consistent `truncateForPaywall()` function applied across all 6 endpoints: `/api/rewrite`, `/api/re-rewrite`, `/api/chat`, `/api/jobs/:id`, `/api/jobs`, `/api/user/materials`
- Prevents bypass where credit deduction errors could leak full output to users

**Stripe Payment System with Atomic Credit Fulfillment (October 4, 2025)**
- Implemented production-ready Stripe payment integration with database transactions for atomic credit fulfillment
- **Payment Tiers**: ZHI 1-4 credit packages at $5 (500 credits), $10 (1,050 credits), $25 (2,750 credits), $50 (5,750 credits), $100 (12,000 credits)
- **Transactional Processing**: Database transactions wrap payment insert and credit increment for atomicity (both succeed or both roll back)
- **Idempotency Protection**: Unique constraint on `stripe_payment_intent_id` prevents duplicate credit grants from concurrent requests
- **Dual Fulfillment**: Both `/api/verify-payment` endpoint and Stripe webhook handle credit fulfillment with shared transactional logic
- **Atomic Credit Increment**: SQL-level `UPDATE users SET credits = credits + $1` prevents read-modify-write race conditions
- **Error Handling**: Unique constraint violations caught gracefully, indicating payment already processed
- **Payment Tracking**: `payments` table stores all successful transactions with Stripe payment intent ID, user ID, credits, and amount
- **Real-time Updates**: Frontend invalidates user query cache after payment for immediate credit balance refresh
- **Security**: Payment verification confirms Stripe payment status and user ownership before granting credits

**User Authentication & Persistence System (October 3, 2025)**
- Implemented complete optional authentication system - site remains fully accessible to guest users
- **Database Setup**: PostgreSQL database with Drizzle ORM, migrated from memory storage to persistent storage
- **Secure Authentication**: Passport.js integration with scrypt password hashing, session management, and secure cookie handling
- **Auth Endpoints**: Registration, login, logout with proper validation using Zod schemas and JSON error responses
- **Security Hardening**: All user responses sanitized to exclude hashed passwords, request validation on all auth routes
- **Frontend Integration**: Login/register UI in header with AuthProvider hook, seamless user experience
- **User Dashboard**: View saved materials (documents and rewrite jobs) when logged in at /dashboard route
- **Material Persistence**: Documents and rewrite jobs automatically save with userId when user is authenticated
- **Guest Access**: Full application functionality available without login - authentication is optional enhancement
- **Session Management**: Express-session with PostgreSQL store (connect-pg-simple) for production-ready session persistence

**GPTZero Integration Fixed (October 2, 2025)**
- Successfully updated GPTZero API key with proper authentication
- Confirmed API integration working with 32-character key format
- Text analysis returning accurate AI detection scores (tested with 100% AI content)
- Full pipeline operational: PDF upload → Text extraction → GPTZero analysis → AI rewriting → Output analysis

**PDF Binary-Safe Processing (Confirmed Working)**
- Dedicated `/api/pdf/extract` endpoint using multer memory storage
- Clean text extraction using pdf-parse library
- Binary corruption issues fully resolved - PDFs display readable text
- "Completely de novo" implementation as required

**Advanced Preset System Implementation**
- Added comprehensive PRESET_TEXT mapping with 40+ precise rewrite instructions
- Implemented expandPresets function for combo preset handling ("Lean & Sharp", "Analytic")
- Created unified buildRewritePrompt function replacing individual provider prompt logic
- Added "Advanced Techniques" category with 8 sophisticated instructions:
  - Mixed cadence + clause sprawl, Asymmetric emphasis, One aside, Hedge twice
  - Local disfluency, Analogy injection, Topic snap, Friction detail
- All AI providers now use consistent prompt structure with proper preset integration
- Removed deprecated buildSystemPrompt method for cleaner codebase

**Default AI Provider Update**
- Changed default AI provider from OpenAI to Anthropic Claude Sonnet 4
- Updated both main interface and chat interface to default to Anthropic
- Maintains full multi-provider support (OpenAI, Anthropic, DeepSeek, Perplexity)

**Default Style Sample Configuration**
- Set "Formal and Functional Relationships" as the default style sample
- Automatically loads in style text box when application starts
- Pre-selected in the LeftSidebar dropdown for immediate use

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript SPA**: Modern single-page application using React 18 with TypeScript for type safety
- **Vite Build System**: Fast development server and optimized production builds with HMR support
- **Styling**: Tailwind CSS with shadcn/ui components providing a consistent design system
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Express.js API**: RESTful API server handling file uploads, text processing, AI provider integrations, and user authentication
- **Authentication**: Passport.js with local strategy, scrypt password hashing, and session-based authentication
- **File Processing**: Multer-based file upload system supporting TXT, PDF, DOC/DOCX formats up to 50MB
- **Service Layer Pattern**: Modular services for file processing, text chunking, GPTZero integration, and AI provider management
- **Database Storage**: PostgreSQL with Drizzle ORM for persistent user data and generated materials storage
- **Middleware Stack**: Session management, request logging, JSON parsing, authentication, and error handling middleware

### Data Architecture
- **Drizzle ORM**: Type-safe database toolkit with active PostgreSQL integration for persistent storage
- **Schema Design**: Well-defined schemas for users (with authentication), documents, rewrite jobs, and payments with proper relationships
- **User Data**: Secure storage of user credentials with hashed passwords, credit balance, Stripe customer ID, session data persisted to database
- **Payment Tracking**: Payments table with unique constraint on Stripe payment intent ID for idempotency
- **Transactional Operations**: Database transactions ensure atomic payment insert and credit increment (both succeed or both roll back)
- **Material Storage**: Documents and rewrite jobs linked to user accounts via foreign keys for authenticated users
- **Text Chunking**: Intelligent text segmentation for large documents (>500 words) with configurable overlap
- **Job Management**: Async rewrite job processing with status tracking and result storage

### AI Provider Integration
- **Multi-Provider Support**: Unified interface for OpenAI GPT-4o, Anthropic Claude Sonnet 4, DeepSeek, and Perplexity
- **Model Configuration**: Latest model versions with proper fallback handling and error management  
- **Unified Prompt System**: Single buildRewritePrompt function ensures consistent prompt structure across all providers
- **Advanced Preset Integration**: Comprehensive PRESET_TEXT mapping with expandable combo presets
- **Prompt Engineering**: Sophisticated prompt construction for style mimicking, content mixing, and granular instruction following
- **Rate Limiting**: Built-in error handling and retry logic for API failures

### Style System
- **Categorized Samples**: Writing sample collection organized by category with scalable architecture:
  - **Paradoxes** (26 samples): Classical paradoxes including Hilbert-Bernays, Heterological, Sorites, Coin, Analysis, Barber, Unexpected Hanging, Ross's, Lottery, Slacker's, Economic Efficiency, Raven, Riddle of Induction, and more
  - **Epistemology** (4 samples): Rational belief analysis, Hume's problem of induction with explanation theory, explanatory goodness vs correctness, and knowledge vs awareness distinctions
  - **Content-Neutral** (2 samples): General analytical writing on formal and functional relationships, and alternative accounts with explanatory efficiency
- **Scalable Sample UI**: Category-based dropdown interface with sample counts, designed to handle thousands of samples efficiently
- **Advanced Instruction Presets**: 40+ categorized rewrite instructions with sophisticated controls:
  - **Advanced Techniques**: Mixed cadence + clause sprawl, Asymmetric emphasis, One aside, Hedge twice, Local disfluency, Analogy injection, Topic snap, Friction detail
  - **Structure & Cadence**: Compression levels, Mixed cadence, Clause surgery, Front/back-load claims
  - **Framing & Inference**: Conditional framing, Local contrast, Scope check, Imply steps
  - **Voice & Style**: Low-heat voice, Hedge controls, Intensifier removal, Concrete benchmarks
  - **Content Control**: Quote management, Claim/entity locks, Exact nouns, Metric nudges
- **Combo Presets**: "Lean & Sharp" and "Analytic" automatically expand to atomic instructions
- **Custom Instructions**: User-defined rewrite instructions with preset combination support
- **Style Analysis**: GPTZero integration for analyzing both input and reference texts

### File Processing Pipeline
- **Multi-Format Support**: Handles TXT, PDF, and Word documents with appropriate parsing
- **Content Extraction**: Clean text extraction maintaining document structure
- **Word Count Analysis**: Accurate word counting for chunking decisions
- **Temporary File Management**: Secure file handling with automatic cleanup

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4o model for text rewriting with configurable parameters
- **Anthropic API**: Claude Sonnet 4 integration for alternative AI processing
- **GPTZero API**: AI detection scoring service for input and output analysis
- **DeepSeek & Perplexity**: Additional AI provider support (configured for future implementation)

### Payment Integration
- **Stripe API**: Credit package purchases with live payment processing
- **Payment Intents**: Secure payment flow with metadata for credit amounts
- **Webhook Integration**: `payment_intent.succeeded` event handling for backup credit fulfillment
- **Transaction Safety**: Database transactions ensure payment records and credit grants are atomic

### Database
- **PostgreSQL**: Configured via Neon Database serverless connection (ready for production)
- **Drizzle Kit**: Database migration and schema management tools

### File Processing
- **PDF Processing**: PDF parsing capabilities for document upload support
- **Word Document Processing**: DOC/DOCX file parsing and text extraction

### UI Framework
- **Radix UI**: Comprehensive component primitives for accessible interface elements
- **Lucide Icons**: Modern icon library for consistent visual elements
- **Font Awesome**: Additional icon support for specialized interface elements

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESBuild**: Fast bundling for production server builds
- **Replit Integration**: Development environment optimization and deployment support
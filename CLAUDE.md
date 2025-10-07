# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend Development
```bash
cd frontend
npm install          # Install dependencies
npm start           # Start development server (localhost:3000)
npm run dev         # Alternative start command
npm run build       # Build for production
npm test            # Run tests
```

### Backend Development
```bash
cd backend
npm install          # Install dependencies
npm run dev         # Start development server with hot reload (port 3001)
npm run build       # Compile TypeScript to JavaScript
npm start           # Run compiled production server
```

### Full Stack Development
```bash
# Root directory deployment commands (Vercel)
# Frontend runs on port 3000, Backend on port 3001
```

## Architecture

This is an AI-powered portfolio generation system with a React TypeScript frontend and Express TypeScript backend.

### Project Structure
```
AutoPortfolio/
├── frontend/          # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # Business logic & API calls
│   │   ├── types/          # TypeScript definitions
│   │   ├── templates/      # Portfolio templates
│   │   └── main.tsx        # App entry point
│   └── package.json
├── backend/           # Express TypeScript backend
│   ├── src/
│   │   ├── api/            # API routes
│   │   ├── services/       # Business logic
│   │   ├── types/          # Shared type definitions
│   │   └── index.ts        # Server entry point
│   └── package.json
└── vercel.json       # Deployment configuration
```

### Core Workflow
The application follows a page-based routing approach for portfolio creation:

1. **Home Page** (`/`) - Landing page
2. **Template Selection** (`/template`) - User chooses from predefined portfolio templates (minimal, clean, colorful, elegant)
3. **AI Organization** (`/organize`) - User inputs raw information that gets organized by OpenAI GPT-4
4. **Auto-fill** (`/autofill`) - System auto-fills portfolio data based on organized content
5. **Enhanced Editing** (`/edit`) - Manual refinement of generated content with AI assistance
6. **Template Editing** (`/edit/:template`) - Template-specific editing
7. **Feedback Editing** (`/feedback`) - User feedback integration
8. **Completion** (`/complete`) - Final result generation and export (markdown, HTML, PDF)

### Frontend Architecture

#### Pages (React Router)
- `HomePage.tsx` - Landing page (`/`)
- `TemplateSelectionPage.tsx` - Template selection interface (`/template`)
- `OrganizeContentPage.tsx` - AI organization step (`/organize`)
- `AutoFillPage.tsx` - Auto-fill step (`/autofill`)
- `EnhancedEditPage.tsx` - Enhanced editing (`/edit`)
- `TemplateEditPage.tsx` - Template-specific editing (`/edit/:template`)
- `FeedbackEditPage.tsx` - Feedback collection (`/feedback`)
- `CompletePage.tsx` - Final result and download (`/complete`)

#### Key Components
- `AIOrganizer.tsx` - Handles AI-powered content organization
- `AutoFillPortfolioEditor.tsx` - Auto-population of portfolio fields
- `EnhancedPortfolioEditor.tsx` - Manual editing interface with AI suggestions
- `FinalResultPanel.tsx` - Final output and download functionality
- `TemplateSelector.tsx` - Template selection interface
- `SimpleNaturalLanguageEditor.tsx` - Natural language editing interface
- `NaturalLanguageSidebar.tsx` - AI assistant sidebar
- `JobRecommendationSlider.tsx` - Job recommendation feature

#### Services Layer
Service classes are exported as singleton instances:
- `aiOrganizer.ts` - OpenAI integration for content organization (exports `aiOrganizer`)
- `autoFillService.ts` - Auto-fill functionality (exports `autoFillService`)
- `oneClickGenerator.ts` - Portfolio generation using Mustache templates (exports `oneClickGenerator`)
- `userFeedbackService.ts` - User feedback collection and processing (exports `userFeedbackService`)
- `portfolioTextEnhancer.ts` - Text enhancement and improvement (exports `portfolioTextEnhancer`)
- `interactiveBooster.ts` - Interactive content boosting (exports `interactiveBooster`)

#### Data Models
Core types in `src/types/portfolio.ts`:
- `PortfolioData` - Main portfolio structure containing all sections
- `UserInfo` - Personal information (name, title, contact details)
- `Experience` - Work experience entries
- `Project` - Project entries with technologies and highlights
- `Education` - Educational background
- `Skill` - Technical skills categorized by proficiency
- `AssistantResponse` - AI assistant communication interface

### Backend Architecture

The backend is a lightweight Express server for portfolio content verification:

#### API Endpoints
- `GET /health` - Health check endpoint returning status and timestamp
- Block API endpoints in `blockAPI.ts` for portfolio content validation

#### Structure
- `src/index.ts` - Express server setup with CORS and JSON middleware
- `src/api/blockAPI.ts` - Block management API routes
- `src/services/` - Business logic services
- `src/types/` - Shared type definitions with frontend

### Tech Stack

#### Frontend
- **React 19.1.1** with TypeScript for UI
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for smooth animations
- **React Hook Form** for form state management
- **React Query** for server state management
- **OpenAI API** for AI-powered features
- **Mustache** for template rendering
- **HTML2Canvas + jsPDF** for PDF generation
- **Axios** for API communication

#### Backend
- **Express 4.18** with TypeScript for API server
- **CORS** for cross-origin resource sharing
- **TypeScript 5.1** for type safety

### State Management
- **React Context API** - `PortfolioContext` provides global state management
  - Tracks current step in the workflow (`template`, `organize`, `autofill`, `enhanced-edit`, `feedback`, `complete`)
  - Stores selected template, organized content, and generation results
  - Persists state to localStorage for session recovery
- **React Router** - Client-side routing between workflow pages
- **React Hook Form** - Form state management in editor components
- **React Query** - Server state caching (if backend API is used)

### Templates
Portfolio templates are stored in `frontend/src/templates/`:
- `portfolioTemplates.ts` - Basic template definitions
- `improvedTemplates.ts` - Enhanced template versions
- Templates support Mustache syntax for dynamic content injection

### AI Integration
- **OpenAI GPT-4** for intelligent content parsing and organization
- **Smart questioning** to identify missing portfolio information
- **Content enhancement** for professional writing improvement
- **Template-based generation** with AI-optimized content

### Environment Setup
Frontend requires OpenAI API key:
```bash
# Copy example environment file
cp .env.example frontend/.env

# Set your OpenAI API key in frontend/.env
REACT_APP_OPENAI_API_KEY=your-api-key-here
```

### PDF Generation
The application uses browser-based PDF generation (not html2canvas/jsPDF):
- `pdfGenerator.ts` - Generates print-optimized HTML with CSS `@media print` rules
- Opens a new window with optimized HTML and triggers browser's print dialog
- User selects "Save as PDF" in the print dialog

#### PDF Optimization Strategy
- **Page Break Control**: Uses `page-break-before`, `page-break-after`, `page-break-inside` CSS properties
- **Template-specific Rules**:
  - `colorful` template: Explicit page breaks per section (Hero → Experience → Projects → Skills)
  - Other templates: Auto-fill strategy to minimize whitespace
- **Layout Preservation**: Headers stay with content, items don't split across pages
- **Print Styles**: Removes shadows, animations, buttons, and browser headers/footers

#### Colorful Template PDF Specifics
When modifying PDF generation for the colorful template:
1. Use `page-break-before: always` for major section boundaries
2. Keep experience/project headers as single-line flex layouts (icon + title + date)
3. Allow `page-break-inside: auto` so long sections can split if needed
4. Section grouping: "Basic Info + About" → "Experience" → "Projects" → "Skills + Contact"

### Important Notes
- **Service Singletons**: All service classes in `frontend/src/services/` are exported as singleton instances, not classes
- **LocalStorage Persistence**: Application state persists to localStorage, allowing users to resume their workflow
- **Text Processing**: Templates support line break preservation and markdown formatting for HTML display
- **Template Types**: Use `minimal`, `clean`, `colorful`, or `elegant` (not the old james/geon/eunseong/iu names)
- **No Backend Required**: The backend is optional; frontend can run standalone with direct OpenAI API calls
- **Working Directory**: Commands should be run from the `frontend/` directory (current working directory in development)

### Deployment
- Configured for Vercel deployment via `vercel.json`
- Frontend builds to `frontend/build`
- Backend can be deployed separately or as serverless functions
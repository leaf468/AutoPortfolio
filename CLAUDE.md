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
The application follows a wizard-based approach for portfolio creation:

1. **Template Selection** - User chooses from predefined portfolio templates (james, geon, eunseong, iu)
2. **AI Organization** - User inputs raw information that gets organized by OpenAI GPT-4
3. **Auto-fill** - System auto-fills portfolio data based on organized content
4. **Enhanced Editing** - Manual refinement of generated content with AI assistance
5. **Feedback & Completion** - User feedback integration and final result generation
6. **Export** - Generate markdown, HTML, and PDF formats

### Frontend Architecture

#### Key Components
- `PortfolioWizard.tsx` - Main wizard orchestrating the entire flow
- `AIOrganizer.tsx` - Handles AI-powered content organization
- `AutoFillPortfolioEditor.tsx` - Auto-population of portfolio fields
- `EnhancedPortfolioEditor.tsx` - Manual editing interface with AI suggestions
- `FinalResultPanel.tsx` - Final output and download functionality
- `BlockCard.tsx` - Reusable component for portfolio content blocks

#### Services Layer
- `aiOrganizer.ts` - OpenAI integration for content organization
- `autoFillService.ts` - Auto-fill functionality
- `oneClickGenerator.ts` - Portfolio generation using Mustache templates
- `userFeedbackService.ts` - User feedback collection and processing
- `contentRecommendationService.ts` - AI-powered content suggestions
- `portfolioTextEnhancer.ts` - Text enhancement and improvement

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

The backend provides verification and block-based content management:

#### API Endpoints
- `/health` - Health check endpoint
- Block management endpoints for portfolio content validation

#### Services
- `blockService.ts` - Handles content block operations and validation
- Shared types with frontend for consistent data structures

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
- Frontend uses React hooks with prop drilling for component communication
- The PortfolioWizard maintains overall step state
- Form state managed by React Hook Form
- Server state cached with React Query

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
# In frontend/.env
REACT_APP_OPENAI_API_KEY=your-api-key-here
```

### Deployment
- Configured for Vercel deployment via `vercel.json`
- Frontend builds to `frontend/build`
- Backend can be deployed separately or as serverless functions
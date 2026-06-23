# Fitness Buddy - Frontend

The frontend for the Personalized Fitness Intelligence Platform. Built with React and Vite.

## Overview
This application provides a comprehensive interface for both clients and fitness coaches. It includes features for tracking workouts, diets, communicating with an AI assistant for meal substitutions and fitness advice, and allowing coaches to manage their clients' progress.

## Key Features
- **Landing Page**: An engaging entry point introducing the platform's capabilities.
- **Client Dashboard**: A personalized space for users to log daily check-ins, view performance metrics, and interact with the AI Chat Widget.
- **Coach Dashboard**: A command center for fitness coaches to monitor client progress, review daily logs, and provide personalized feedback.
- **Onboarding Wizard**: A smooth step-by-step setup process for new users to define their fitness goals, body metrics, and dietary preferences.
- **AI Chat Widget**: An integrated chat interface leveraging AI to assist clients with meal substitutions and fitness inquiries.

## Technology Stack
- **Framework**: React 19
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization
- **Markdown Rendering**: react-markdown for displaying AI responses

## Getting Started

### Prerequisites
- Node.js
- npm or yarn

### Installation
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production
To create a production build:
```bash
npm run build
```

## Scripts
- `npm run dev`: Starts the local development server.
- `npm run build`: Compiles the application for production.
- `npm run lint`: Runs ESLint to identify and fix code issues.
- `npm run preview`: Previews the production build locally.

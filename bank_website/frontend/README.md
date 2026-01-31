# Bank Sentinel - Frontend

React + Vite + TypeScript control panel for the Bank Sentinel multi-agent system.

## Features

- **Real-Time Dashboard**: WebSocket-powered live updates of FDA → IAA → EBA workflow
- **PR Posts Management**: Human-in-the-loop editing and approval of AI-generated posts
- **Database Management**: Full CRUD operations for transactions, reviews, and sentiments
- **Modern UI**: Tailwind CSS with dark theme and responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Pages

- **Dashboard** (`/`) - Real-time workflow visualization
- **PR Posts** (`/posts`) - Review, edit, and approve posts
- **Database** (`/database`) - Manage all database records

## Tech Stack

- React 18
- TypeScript
- Vite
- TanStack Query (React Query)
- React Router
- Tailwind CSS
- WebSockets
- Axios

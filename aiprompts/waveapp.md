# Wave Apps Architecture Guide

Wave Apps are self-contained web applications that run within Wave Terminal blocks. They combine a Node.js backend server with a React frontend, providing a standardized way to create interactive applications that integrate seamlessly with Wave Terminal's block system.

## Project Structure

A typical Wave App follows this directory structure:

```
waveapp-name/
├── describe.json          # App metadata and API specification
├── package.json          # Node.js dependencies and scripts
├── server.js             # Hono backend server (Node.js)
├── vite.config.ts        # Vite build configuration
├── tsconfig.json         # TypeScript configuration
├── index.html            # HTML entry point
├── public/               # Static assets
└── src/
    ├── main.tsx          # React app entry point
    ├── index.css         # Tailwind CSS styles
    └── App.tsx           # Main React component (optional)
```

## Technology Stack

### Backend Framework
- **[Hono](https://hono.dev/)** - Fast, lightweight web framework for Node.js
- **[@hono/node-server](https://github.com/honojs/node-server)** - Node.js adapter for Hono
- **CORS support** via `hono/cors` middleware
- **Static file serving** via `@hono/node-server/serve-static`

### Frontend Framework
- **[React 19](https://react.dev/)** - UI framework with modern features
- **[Vite 7](https://vitejs.dev/)** - Fast build tool and dev server
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react)** - React support for Vite

### Styling
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[@tailwindcss/vite](https://github.com/tailwindlabs/tailwindcss-vite)** - Vite plugin for Tailwind
- **Custom CSS variables** - Wave Terminal theme integration

### Development Tools
- **[concurrently](https://github.com/open-cli-tools/concurrently)** - Run backend and frontend simultaneously
- **TypeScript definitions** - Full type safety across the stack

## Core Configuration Files

### describe.json

The [`describe.json`](waveapps/jwt/describe.json) file is the heart of every Wave App. It defines:

- **App metadata** (name, version, description)
- **API specification** (endpoints, schemas, actions)
- **Configuration schema** for app settings
- **Data schema** for app state
- **Custom actions** the app can perform

```json
{
    "name": "App Name",
    "version": "1.0.0",
    "baseurl": "/",
    "description": "App description",
    "actions": [
        {
            "name": "action-name",
            "method": "POST",
            "path": "/api/action",
            "description": "Action description",
            "inputschema": "InputSchema",
            "outputschema": "OutputSchema"
        }
    ],
    "schemas": {
        "config": {
            "type": "object",
            "description": "App configuration schema",
            "properties": {}
        },
        "data": {
            "type": "object", 
            "description": "App data schema",
            "properties": {}
        }
    }
}
```

### package.json Scripts

Standard scripts for Wave App development:

```json
{
    "scripts": {
        "start": "node server.js",
        "dev": "concurrently \"node server.js\" \"vite\"",
        "build": "vite build",
        "preview": "vite preview"
    }
}
```

### vite.config.ts

Vite configuration with Tailwind CSS and API proxy:

```typescript
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 5173,
        proxy: {
            "/api": "http://localhost:3000",
        },
    },
    build: {
        outDir: "dist",
    },
});
```

## Required API Endpoints

Every Wave App **MUST** implement these three endpoints:

### 1. `/api/config` (GET/PUT)

**GET** - Returns current app configuration
**PUT** - Updates app configuration with new settings

```javascript
// GET /api/config
app.get("/api/config", (c) => {
    return c.json(appConfig);
});

// PUT /api/config  
app.put("/api/config", async (c) => {
    try {
        const newConfig = await c.req.json();
        appConfig = { ...appConfig, ...newConfig };
        return c.json(appConfig);
    } catch (error) {
        return c.json({ error: "Invalid config format" }, 400);
    }
});
```

### 2. `/api/describe` (GET)

Serves the [`describe.json`](waveapps/jwt/describe.json) file containing app metadata and API specification:

```javascript
app.get("/api/describe", serveStatic({ path: "./describe.json" }));
```

### 3. `/api/data` (GET)

Returns current app state/data for Wave Terminal integration:

```javascript
app.get("/api/data", (c) => {
    return c.json(appData || {});
});
```

## Server Architecture

### Hono Server Setup

Wave Apps use Hono as the backend framework with these key features:

```javascript
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

// CORS for frontend communication
app.use("/*", cors());

// Static file serving for built frontend
app.use("/static/*", serveStatic({ root: "./dist" }));
app.use("/*", serveStatic({ root: "./dist" }));

// Start server on fixed port
const server = serve({
    fetch: app.fetch,
    port: 3000,
});
```

### Wave Terminal Integration

Apps communicate with Wave Terminal through a messaging system:

```javascript
function sendWaveAppMessage(message) {
    if (process.send) {
        process.send(message);
    } else {
        console.log(`#waveapp${JSON.stringify(message)}`);
    }
}

server.on("listening", () => {
    const port = server.address().port;
    sendWaveAppMessage({
        type: "listening",
        port: port,
    });
});
```

### State Management

Apps maintain their own state for configuration and data:

```javascript
let appData = null;      // Current app state
let appConfig = {};      // App configuration
```

## Frontend Architecture

### React Entry Point

The frontend uses React 19 with TypeScript, typically structured as a single-page application:

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const App: React.FC = () => {
    // App component logic
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* App UI */}
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

### Tailwind CSS Integration

Wave Apps use Tailwind CSS v4 with custom CSS variables for Wave Terminal theme integration:

```css
/* src/index.css */
@import "tailwindcss";

@theme {
    --color-background: rgb(34, 34, 34);
    --color-foreground: #f7f7f7;
    --color-accent: rgb(88, 193, 66);
    --color-panel: rgba(31, 33, 31, 0.5);
    --color-border: rgba(255, 255, 255, 0.16);
    /* ... more theme variables */
}
```

### API Communication

Frontend communicates with backend via standard fetch API:

```typescript
const response = await fetch('/api/endpoint', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
});

const result = await response.json();
```

## Development Workflow

### Development Mode

Run both backend and frontend in development:

```bash
npm run dev
# Runs: concurrently "node server.js" "vite"
```

This starts:
- **Backend server** on port 3000 (Hono)
- **Frontend dev server** on port 5173 (Vite)
- **API proxy** from frontend to backend

### Production Build

Build and serve the app:

```bash
npm run build    # Build frontend to dist/
npm start        # Start production server
```

### File Structure After Build

```
waveapp-name/
├── dist/                 # Built frontend files
│   ├── index.html
│   ├── assets/
│   └── static/
├── server.js            # Backend server
└── describe.json        # App metadata
```

## Integration with Wave Terminal

Wave Apps integrate with Wave Terminal through:

1. **Block System** - Apps run within Wave Terminal blocks
2. **Configuration** - Apps receive config from Wave Terminal via `/api/config`
3. **Data Exchange** - Apps expose state via `/api/data`
4. **Actions** - Apps define custom actions in `describe.json`
5. **Messaging** - Apps communicate status via the messaging system

## Best Practices

### Backend
- Use fixed ports (3000 for backend, 5173 for dev frontend)
- Implement proper error handling in API endpoints
- Maintain app state in memory (or persist as needed)
- Use CORS middleware for frontend communication
- Serve static files from the `dist` directory

### Frontend
- Use Tailwind CSS with Wave Terminal theme variables
- Implement proper loading and error states
- Use TypeScript for type safety
- Follow React best practices and hooks patterns
- Handle API errors gracefully

### Configuration
- Define clear schemas in `describe.json`
- Validate configuration inputs
- Provide sensible defaults
- Document all API endpoints and schemas

### Development
- Use `concurrently` for simultaneous backend/frontend development
- Leverage Vite's hot reload for fast iteration
- Test both development and production builds
- Follow Wave Terminal's coding conventions

This architecture provides a robust foundation for building interactive applications that integrate seamlessly with Wave Terminal's block-based interface while maintaining modern web development practices.
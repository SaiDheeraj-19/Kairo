# Kairo 🌀

Kairo is a next-generation AI-native cloud workspace platform. It allows users to instantly launch isolated, persistent developer environments directly in the browser.

## ✨ Features

- **🚀 Instant Workspaces**: Launch VS Code (code-server) or Linux Desktops in seconds.
- **💾 Persistent Storage**: All your work is saved in dedicated host volumes.
- **🖥️ Desktop Streaming**: Full Ubuntu desktop support via KasmVNC.
- **🤖 AI Ready**: Programmatic execution engine for AI coding agents.
- **🎨 Premium UI**: Futuristic, glassmorphic dashboard inspired by Linear and Vercel.

## 🏗️ Architecture

- **Frontend**: Next.js 15, Tailwind CSS, Framer Motion.
- **Orchestrator**: Node.js/Express, Dockerode.
- **Environment**: Docker Engine.

## 🛠️ Setup

### Prerequisites
- Docker Desktop (Running)
- Node.js 18+

### Quick Start
1. Clone the repository.
2. Create a `.env` file in the root (see `.env.example`).
3. Install dependencies:
   ```bash
   cd apps/server && npm install
   cd ../web && npm install
   ```
4. Run the platform:
   - Server: `cd apps/server && npm run dev`
   - Web: `cd apps/web && npm run dev`

## 📂 Project Structure

```text
kairo/
├── apps/
│   ├── web/          # Next.js Dashboard
│   └── server/       # Orchestration API
├── packages/
│   └── shared/       # Shared TypeScript types
├── docker/           # Workspace environment templates (Node, Python, Go)
├── storage/          # Local volume storage for workspaces
└── docker-compose.yml
```

## 📜 License
MIT

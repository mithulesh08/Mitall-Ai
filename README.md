# MITALL Personal Intelligence 🧠⚡

**MITALL** (*MITALL Personal Intelligence*) is a modern, modular, production-grade personal AI assistant built for software engineering, deep learning, task planning, research, and personal knowledge management.

---

## 🌟 Key Features

1. **Multi-Provider AI Orchestration**
   - **Google Gemini**: Built with the latest `@google/genai` TypeScript SDK (`gemini-3.8-flash`, `gemini-4-argon`).
   - **Ollama (Local Models)**: Connect directly to local offline models (`llama3.2`, `mistral`, `deepseek-coder`) at `http://127.0.0.1:11434`.
   - **OpenAI-Compatible Providers**: Configure custom endpoints (Groq, OpenRouter, vLLM) with custom models and API keys.
   - Hot-switch between providers seamlessly in **Settings**.

2. **Persistent Two-Tier Memory System**
   - **Short-Term Memory**: Conversation context windowing and recent message retention.
   - **Long-Term Memory**: Permanent personal facts, technical preferences, learning goals, and project context across sessions.
   - Teach MITALL naturally during chat: *"Please remember that my primary tech stack is TypeScript and Rust."*
   - Dedicated **Memory Manager** interface to inspect, toggle, edit, search, and delete saved memories.

3. **Knowledge Base & Document RAG**
   - Upload PDF, Markdown, Plain Text, CSV, JSON, and source code files.
   - Automated text extraction, chunking with overlap, and semantic similarity retrieval.
   - Context-aware responses with source document badges, relevance scores, and cited excerpts.

4. **Coding Studio & Safe Sandboxed Runner**
   - Dedicated programming mode for JavaScript, TypeScript, Python, C++, Java, and SQL.
   - Instant AI tools: **Explain Code**, **Debug & Fix**, **Big-O Time/Space Complexity Analysis**, and **Unit Test Generator**.
   - Safe Sandboxed Execution Console with execution time metrics and console output capture.

5. **Integrated Personal AI Tools**
   - 🧮 **Calculator**: Mathematical formulas, scientific functions, and percentage evaluations.
   - 🕒 **Date & Time**: Real-time ISO date, formatted time, and timezone resolution.
   - 🌐 **Web Search**: DuckDuckGo search integration with citations and reference URLs.
   - 📁 **File Reader**: Inspect uploaded document chunks.
   - 📝 **Notes & PKM**: Create, pin, tag, and summarize markdown notes.
   - ✅ **Task Manager**: Priorities (*Urgent, High, Medium, Low*), categories, due dates, and in-app reminders.

6. **Voice & Multilingual Assistance**
   - Speech-to-Text via Web Speech Recognition with live listening pulse.
   - Text-to-Speech audio readout with adjustable speech rates.
   - Native multilingual capabilities, including English and Tamil (தமிழ்).

7. **Data Privacy & Control**
   - 1-click **Export Personal Data** (download full JSON archive).
   - Safe reset functionality with confirmation guards.
   - API keys are protected on the server side and never exposed to client bundles.

---

## 🚀 Quick Start (Development & Local)

### In Google AI Studio
The applet automatically launches on port 3000 running the full-stack server.
All Gemini API calls are securely authenticated via `process.env.GEMINI_API_KEY`.

---

## 💻 Windows 10 / 11 Installation & Startup

### Prerequisites
- **Node.js** (v18.0.0 or higher): [Download Node.js](https://nodejs.org)
- *(Optional for Python FastAPI backend)*: Python 3.10+

### Option A: One-Click Startup (Recommended)
1. Double-click `scripts\setup.bat` to install packages and initialize `.env`.
2. Double-click `scripts\start.bat` to start the application.
3. Open your browser at: `http://localhost:3000`

### Option B: Manual Command Line
```cmd
# 1. Clone or extract repository
cd mitall

# 2. Copy environment file
copy .env.example .env

# 3. Install dependencies
npm install

# 4. Start Full-Stack Server
npm run dev
```

Visit `http://localhost:3000` to interact with MITALL.

---

## 📱 Android Native Application (Capacitor)

MITALL is fully configured as a native Android app sharing the exact same frontend, database, AI orchestrator, and real-time synchronization.

- **Application Name**: `MITALL`
- **Package ID**: `com.mitall.app`
- **Native Directory**: `/android`

### Building Android APK & AAB

1. **Prerequisites**: Install Android Studio with Android SDK (API 34+).
2. **Build Web Assets & Sync with Capacitor**:
   ```bash
   npm run build:android
   ```
3. **Compile Native Android APK (Command Line)**:
   ```bash
   # Linux / macOS
   chmod +x ./scripts/build_android.sh && ./scripts/build_android.sh

   # Windows
   .\scripts\build_android.bat
   ```
4. **Compile in Android Studio**:
   ```bash
   npx cap open android
   ```
   In Android Studio, click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

### Output Artifacts:
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release AAB (Google Play)**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## ☁️ Production Cloud Deployment

### 1. Google Cloud Run / Docker
```bash
# Build and run with Docker Compose
docker compose up -d --build
```
Or deploy directly to Cloud Run:
```bash
gcloud run deploy mitall-ai --source . --port 3000 --allow-unauthenticated
```

### 2. Vercel Deployment
The repository includes `vercel.json` and `/api/index.ts` pre-configured for Vercel Serverless Functions:
- Deploy via Vercel CLI: `vercel --prod`
- Environment Variables: Set `GEMINI_API_KEY` in Vercel Project Settings -> **Environment Variables**.
- Or use in-app API key configuration under **Settings > AI Provider & Models**.

---

## 🏗️ Universal Platform Architecture

```
MITALL Architecture
├── Website Frontend (React 19, TypeScript, Tailwind CSS, Lucide icons, Motion)
│   ├── Home View (Platform overview, prompt starters, module quick-nav)
│   ├── Chat Workspace (Streaming SSE, Markdown & syntax highlighting)
│   ├── Live Agent View (Full duplex voice & video assistant)
│   ├── Productivity Dashboard (Metrics, quick actions, today's tasks)
│   ├── Long-Term Memory (Structured records & category filters)
│   ├── Knowledge Base (Chunking, RAG semantic search, document preview)
│   ├── Coding Studio (Dual-pane editor, Big-O analyzer, safe runner)
│   ├── Task Manager (Priorities, due dates, in-app reminders)
│   ├── Notes & PKM (Markdown notes, tags, AI summarization)
│   ├── Profile & Sync (User credentials, cross-platform synchronization)
│   └── Settings (Model switches, API key management)
│
├── Android Native Layer (Capacitor 8)
│   ├── Package ID: com.mitall.app
│   ├── Native Hardware: Microphone, Camera, Haptics, Network monitor
│   ├── Back Button navigation & Keyboard management
│   └── AndroidManifest.xml (Permissions & Deep links)
│
├── Server & AI Orchestration (Express 4 + Node 22 / FastAPI Python)
│   ├── server.ts / serverApp.ts (REST APIs, SSE streaming, Auth & Sync)
│   ├── server/ai.ts (Multi-provider engine: Gemini 2.5/3.8, Ollama, OpenAI)
│   ├── server/db.ts (Atomic persistent storage in data/mitall_db.json)
│   ├── server/rag.ts (Text extraction, chunking, and similarity search)
│   ├── server/tools.ts (Calculator, DateTime, Web Search, Code Sandbox)
│   └── backend/ (FastAPI Python implementation with SQLAlchemy & Pydantic)
│
└── Automation Scripts & DevOps
    ├── Dockerfile & docker-compose.yml (Multi-cloud containerization)
    ├── scripts/build_android.sh & scripts/build_android.bat (APK/AAB builds)
    └── vercel.json & capacitor.config.ts (Cloud & Mobile configs)
```


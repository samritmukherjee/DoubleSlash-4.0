<div align="center">

<img src="Frontend/public/favicon.svg" alt="OutreachX Logo" width="60" />

# OutreachX

**AI-powered multi-channel campaign automation platform**

YouTube Video : https://www.youtube.com/watch?v=u6DrlZKFz_k

Launch, manage, and analyze outreach campaigns across WhatsApp, Voice, and AI Phone Calls — all from a single interface.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)](https://firebase.google.com)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-purple?logo=clerk)](https://clerk.com)
[![Gemini](https://img.shields.io/badge/AI-Gemini_2.5_Flash-4285F4?logo=google)](https://deepmind.google/technologies/gemini)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Campaign Creation Flow](#campaign-creation-flow)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [API Reference](#api-reference)
- [Key Workflows](#key-workflows)

---

## Overview

OutreachX is a hackathon project (DoubleSlash 4.0) built by **Team Async**. It is an agentic AI-driven campaign automation platform that enables businesses to:

- Create campaigns in a guided 6-step wizard
- Send bulk messages across **WhatsApp**, **Voice Notes**, and **AI Phone Calls**
- Use AI (Gemini, LangChain, VAPI) to personalize content and hold live conversations
- Upload PDFs as a knowledge base for RAG-powered AI responses
- Track real-time delivery, engagement, and call metrics on a unified dashboard
- Manage inbound WhatsApp replies with auto AI responses

---

## Features

### Campaign Builder
- 6-step wizard: Title → Channels → Assets → Description → Contacts → Preview & Launch
- Multi-channel selection: Text (WhatsApp/SMS), Voice Message, AI Phone Calls
- Per-channel configuration (word limits, duration, tone of voice)
- Live preview before launch

### AI Content Generation
- **Description enhancement** — Gemini refines your campaign copy in your chosen tone
- **Text-to-Speech** — Gemini TTS converts descriptions to voice notes (OGG/Opus for WhatsApp)
- **Image generation** — Prompt-based image creation via Pixazo API
- **RAG (Retrieval-Augmented Generation)** — Upload PDFs; AI references them when responding to contacts

### WhatsApp Integration
- Bulk WhatsApp campaign sending (title + description + assets + voice note)
- Inbound message webhook handling
- AI auto-replies using campaign context + PDF knowledge base + chat history
- Conversation inbox with per-contact thread view

### AI Phone Calls (VAPI)
- Outbound AI calls to all campaign contacts
- Natural multi-turn conversations with campaign-aware AI agent
- Call status tracking (answered / missed)
- Real-time transcription and recording

### Analytics Dashboard
- Voice call metrics: total, answered, missed, answer rate
- WhatsApp metrics: messages sent, users interacted, engagement score
- Donut & bar charts via Recharts
- Per-conversation breakdown

### Onboarding
- Business context profile (type, audience, brand style, language, compliance notes)
- Persisted to Firestore; used by AI across all campaigns

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16 | React framework, API routes, SSR |
| React | 19 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Styling |
| Framer Motion | 12 | Animations |
| Recharts | 3 | Analytics charts |
| SWR | 2 | Data fetching & caching |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 4 | HTTP server |
| nodemon | 3 | Dev auto-reload |

### AI & ML
| Service | Purpose |
|---|---|
| Google Gemini 2.0 / 2.5 Flash | Text generation, AI responses, TTS |
| LangChain + LangGraph | Agent orchestration, RAG pipelines |
| OpenAI (text-embedding-3-small) | Document embeddings for vector search |
| VAPI.ai | AI phone call orchestration |

### Infrastructure & Services
| Service | Purpose |
|---|---|
| Firebase / Firestore | Primary database, real-time sync |
| Clerk | Authentication & user management |
| Cloudinary | Image/video/audio CDN & storage |
| Twilio | SMS, SIP voice infrastructure |
| WhatsApp Business Cloud API | WhatsApp messaging |
| LiveKit | Real-time voice streaming |
| FFmpeg | Audio conversion (WAV → OGG/Opus) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
│                                                         │
│  App Routes          API Routes          Lib            │
│  /campaign/*    ←→  /api/campaigns/*  ←→  ai-service   │
│  /yourcampaigns     /api/inbox/*          langchain     │
│  /analytics/*       /api/voice/*          vapi-caller  │
│  /inbox/*           /api/onboarding       firestore-ops │
│  /onboarding        /api/yourcampaigns    cloudinary    │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP
┌───────────────────────────▼─────────────────────────────┐
│                  BACKEND (Express)                       │
│                                                         │
│  /api/whatsapp/send-campaign  → WhatsApp Cloud API      │
│  /api/whatsapp/send-reply     → Gemini AI → WhatsApp    │
│  conversation-service.js      → LangChain + Gemini      │
│  analysis-service.js          → Firestore analytics     │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                  EXTERNAL SERVICES                       │
│                                                         │
│  Firestore  │  Clerk  │  Gemini  │  VAPI               │
│  Cloudinary │  Twilio │  OpenAI  │  WhatsApp API        │
│  LiveKit    │  FFmpeg │  Recharts│  Pixazo              │
└─────────────────────────────────────────────────────────┘
```

---

## Campaign Creation Flow

```
Step 1 — Title
  Enter campaign name → auto-save draft to Firestore

Step 2 — Channels
  Select: ☑ Text  ☑ Voice  ☑ AI Calls
  Configure word limits, duration, tone

Step 3 — Assets
  Upload images/videos  OR  generate via AI (Pixazo)
  → stored in Cloudinary

Step 4 — Description
  Write copy → AI enhances it (Gemini) based on tone

Step 5 — Contacts
  Upload CSV / Excel → auto-parse name + phone
  Phone numbers normalized to international format

Step 6 — Preview & Launch
  ├─ Voice channel  → Gemini TTS → FFmpeg (OGG) → Cloudinary
  ├─ Text channel   → Backend sends WhatsApp messages to all contacts
  └─ Calls channel  → VAPI initiates outbound AI calls to all contacts
```

---

## Project Structure

```
DoubleSlash-4.0/
├── Frontend/                    # Next.js application
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── campaign/            # 6-step campaign wizard
│   │   ├── yourcampaigns/       # Campaign management dashboard
│   │   │   └── [campaignId]/
│   │   │       └── analytics/   # Campaign analytics dashboard
│   │   ├── inbox/               # WhatsApp conversation inbox
│   │   ├── onboarding/          # Business context setup
│   │   └── api/                 # Next.js API routes
│   │       ├── campaigns/       # Campaign CRUD, TTS, contacts, docs
│   │       ├── inbox/           # Inbox & message tracking
│   │       ├── voice/           # LiveKit token, call status
│   │       ├── vapi/            # VAPI webhook
│   │       ├── onboarding/      # Onboarding data
│   │       └── yourcampaigns/   # List user campaigns
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── Features.tsx
│   │   ├── HeroVideo.tsx
│   │   ├── Cards.tsx
│   │   ├── Onboarding/          # Onboarding multi-step form
│   │   └── ui/                  # Shared UI components
│   └── lib/
│       ├── ai-service.ts        # AI text generation & refinement
│       ├── whatsapp-ai-service.ts # WhatsApp-specific AI responses
│       ├── campaign-langchain.ts # LangChain campaign context
│       ├── agent-graph.ts       # LangGraph agent orchestration
│       ├── vapi-caller.ts       # VAPI API wrapper
│       ├── call-agent.ts        # VAPI call orchestration
│       ├── twilio-client.ts     # Twilio SDK
│       ├── cloudinary.ts        # Cloudinary client
│       ├── vector-store.ts      # Document embeddings & search
│       ├── pdf-extraction.ts    # PDF text extraction
│       ├── firestore-ops.ts     # Generic Firestore CRUD
│       ├── analysis-ops.ts      # Analytics data operations
│       ├── inbox-operations.ts  # Inbox CRUD
│       └── types.ts             # Shared TypeScript types
│
└── Backend/                     # Node.js / Express server
    └── src/
        ├── index.js             # Express entry point (port 3001)
        ├── routes/
        │   └── whatsapp.js      # WhatsApp send & webhook routes
        ├── conversation-service.js # Incoming message AI handler
        ├── analysis-service.js  # Analytics persistence
        └── campaign-selector.js # Map contact phone → campaign
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project (Firestore enabled)
- Clerk account
- Google AI Studio API key (Gemini)
- WhatsApp Business Cloud API credentials
- Cloudinary account
- VAPI account (for AI calls)
- Twilio account (for SMS/SIP voice)

### Environment Variables

#### `Frontend/.env`

```env
# ── Firebase (Admin SDK) ──────────────────────────────────────
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY_ID=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=
FIREBASE_STORAGE_BUCKET=

# ── Firebase (Client SDK) ─────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# ── Clerk ─────────────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# ── AI (Gemini) ───────────────────────────────────────────────
GEMINI_API_KEY=
GEMINI_TTS_API_KEY=
GEMINI_WHATSAPP_API_KEY=
GEMINI_IMG_GEN=

# ── AI (OpenAI) ───────────────────────────────────────────────
OPEN_AI_CALLING=

# ── Cloudinary ────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ── Twilio ────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
LIVEKIT_SIP_TRUNK_ID=

# ── VAPI (AI Calls) ───────────────────────────────────────────
VAPI_API_KEY=
VAPI_NUMBER_ID=
VAPI_ASSISTANT_ID=

# ── LiveKit ───────────────────────────────────────────────────
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

# ── WhatsApp Business API ─────────────────────────────────────
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=

# ── Backend ───────────────────────────────────────────────────
BACKEND_URL=https://your-backend.onrender.com
```

#### `Backend/.env`

```env
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=

WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
GEMINI_WHATSAPP_API_KEY=

PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Running Locally

**1. Clone the repository**
```bash
git clone <repo-url>
cd DoubleSlash-4.0
```

**2. Start the Frontend**
```bash
cd Frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

**3. Start the Backend**
```bash
cd Backend
npm install
npm run dev
# Runs on http://localhost:3001
```

---

## API Reference

### Campaign Routes

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/campaigns` | Create a new campaign |
| `POST` | `/api/campaigns/draft` | Create or update a draft |
| `GET` | `/api/campaigns/[id]` | Get campaign details |
| `DELETE` | `/api/campaigns/[id]/delete` | Delete a campaign |
| `GET` | `/api/yourcampaigns` | List all user campaigns |

### Content & Assets

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/campaigns/[id]/description` | AI-enhance campaign description |
| `POST` | `/api/campaigns/[id]/tts` | Generate voice note (Gemini TTS → OGG) |
| `POST` | `/api/campaigns/[id]/files` | Upload images/videos to Cloudinary |
| `POST` | `/api/campaigns/[id]/generate-image` | AI image generation (Pixazo) |
| `POST` | `/api/campaigns/[id]/contacts` | Upload & parse contacts CSV/Excel |
| `POST` | `/api/campaigns/[id]/docs` | Upload PDF knowledge base |
| `GET` | `/api/campaigns/[id]/docs` | List campaign documents |

### Communication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/campaigns/[id]/make-calls` | Launch outbound AI calls via VAPI |
| `GET` | `/api/voice/token` | Generate LiveKit voice token |
| `POST` | `/api/voice/status` | Update voice call status |

### Analytics & Inbox

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/campaigns/[id]/analytics` | Fetch campaign analytics |
| `POST` | `/api/campaigns/[id]/analysis/whatsapp` | Track a WhatsApp message |
| `GET` | `/api/inbox` | List all launched campaigns (inbox) |
| `GET` | `/api/inbox/message` | Fetch messages for a contact |
| `POST` | `/api/inbox/message` | Send or receive a message |

### Onboarding

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/onboarding` | Save onboarding profile |
| `GET` | `/api/onboarding` | Get user's onboarding profile |

---

## Key Workflows

### WhatsApp Campaign Send
1. User clicks **Launch** on the preview page
2. Frontend calls the Backend (`POST /api/whatsapp/send-campaign`)
3. Backend iterates over all contacts and sends sequentially:
   - Campaign title (text)
   - Campaign description (text)
   - Assets (images / PDFs)
   - Voice note (OGG audio) — if Voice channel enabled
4. Each sent message is tracked in Firestore analytics

### AI WhatsApp Reply (Inbox)
1. Contact replies to the business WhatsApp number
2. Backend webhook receives the message
3. `conversation-service.js` loads:
   - Campaign context (description, documents)
   - Chat history (last 20 messages)
   - RAG context from PDF embeddings
4. LangChain + Gemini 2.5 Flash generates a reply
5. Response is sent back via WhatsApp Cloud API
6. Message + reply logged to Firestore

### AI Phone Calls (VAPI)
1. User enables **Calls** channel and clicks Launch
2. `callAgent()` builds a campaign-aware system prompt
3. VAPI initiates outbound calls to each contact
4. AI agent handles natural multi-turn conversations
5. Webhooks update call status (answered / missed) in real time

### Voice Note Generation
1. Campaign description is sent to Gemini TTS API
2. Audio is returned as base64 (WAV/MP3)
3. FFmpeg converts it to **OGG/Opus** (required by WhatsApp)
4. Uploaded to Cloudinary; URL stored in campaign
5. Sent as a WhatsApp voice message on launch

---

## Team

**Team Async** — DoubleSlash 4.0

| Name | Role |
|---|---|
| Sohom Roy | Team Lead |
| Ankur Bag | Member |
| Samrit Mukherjee | Member |
| Ankit Karmakar | Member |

---

<div align="center">

Built with ❤️ by **Team Async** — DoubleSlash 4.0

</div>


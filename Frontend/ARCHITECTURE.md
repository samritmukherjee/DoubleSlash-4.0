# OutreachX Project: Complete Architecture Analysis

## 🎯 Project Overview

**OutreachX** is an AI-powered outreach campaign orchestration platform that:

1. **Creates campaigns** with AI-enhanced descriptions
2. **Supports multi-channel delivery**: Text, Voice (WhatsApp), Calls
3. **Manages contacts** via CSV/Excel uploads
4. **Generates AI content**: Transcripts, TTS audio, descriptions
5. **Facilitates real-time messaging** via inbox (WhatsApp-like UI)
6. **Tracks launched campaigns** with contact management

**Core Users**: Marketing teams, educational institutions, outreach organizations

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│  Homepage → Onboarding → Campaign Creation → Launch → Inbox    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              NEXT.JS COMPONENT LAYER (Client-Side)              │
├─────────────────────────────────────────────────────────────────┤
│  Pages:                    Providers:          Contexts:        │
│  - /campaign/*            - CampaignProvider   - Campaign       │
│  - /inbox/*               - OnboardingProvider - Inbox Campaign │
│  - /yourcampaigns/*       - ClerkProvider      - Onboarding    │
│                           - OnboardingFlow                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 API ROUTES LAYER (Server-Side)                  │
├─────────────────────────────────────────────────────────────────┤
│  Campaign APIs:            Inbox APIs:         Utility:         │
│  - /api/campaigns          - /api/inbox/*      - /api/parse     │
│  - /api/campaigns/draft    - /api/messages     - /api/onboarding│
│  - /api/campaigns/[id]/*   - /api/inbox/route - /api/debug      │
│    ├─ /description                            - /api/migrate    │
│    ├─ /transcript                                              │
│    ├─ /tts                                                     │
│    ├─ /contacts                                                │
│    ├─ /files                                                   │
│    ├─ /docs                                                    │
│    └─ /launch                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICE LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Clerk Auth          Firebase             Google APIs           │
│  ├─ Auth()           ├─ Firestore         ├─ Gemini 2.5-flash   │
│  └─ useUser()        ├─ Admin SDK         ├─ Gemini TTS         │
│                      └─ Storage           └─ Cloudinary         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Authentication & Authorization Flow

**File**: `middleware.ts`

```
Request
  ↓
Clerk Middleware
  ├─ Public Routes (/sign-in, /sign-up, /): Allow
  ├─ Protected Routes (/campaign/*, /inbox/*, /api/campaigns/*): 
  │  ├─ No userId → Redirect to /sign-in
  │  └─ Has userId → Allow
  └─ userId stored in request context
       ↓
   API Routes
     ↓
   auth() from @clerk/nextjs/server
     ↓
   Extract userId for Firestore queries
```

**Key Files**:
- `middleware.ts` - Route protection
- `lib/firebase/admin.ts` - Admin auth
- @clerk/nextjs - Client auth

---

## 📁 Project Structure & Critical Files

### **1. Entry Points**

| File | Purpose |
|------|---------|
| `app/page.tsx` | Homepage with onboarding modal |
| `app/layout.tsx` | Root layout with providers |
| `app/campaign/layout.tsx` | Campaign creation flow layout |

### **2. Campaign Creation Flow**

**Path**: `/campaign/title` → `/campaign/description` → `/campaign/channels` → `/campaign/assets` → `/campaign/docs` → `/campaign/contacts` → `/campaign/preview`

| Step | Component | Context | API Route |
|------|-----------|---------|-----------|
| 1. Title | `app/campaign/title/page.tsx` | `CampaignContext` | - |
| 2. Description | `app/campaign/description/page.tsx` | `CampaignContext` | `/api/campaigns/[id]/description` |
| 3. Channels | `app/campaign/channels/page.tsx` | `CampaignContext` | - |
| 4. Assets | `app/campaign/assets/page.tsx` | `CampaignContext` | `/api/campaigns/[id]/files` |
| 5. Docs | `app/campaign/docs/page.tsx` | `CampaignContext` | `/api/campaigns/[id]/docs` |
| 6. Contacts | `app/campaign/contacts/page.tsx` | `CampaignContext` | `/api/campaigns/[id]/contacts` |
| 7. Preview | `app/campaign/preview/PreviewPageImpl.tsx` | `CampaignContext` | `/api/campaigns/[id]/transcript`, `/api/campaigns/[id]/tts` |

**Campaign Persistence**:
```
CampaignContext (in-memory)
       ↓
/api/campaigns/draft (POST/PATCH) ← Creates/updates Firestore doc
       ↓
Firestore: users/{userId}/campaigns/{campaignId}
```

### **3. Campaign Launch Flow**

**File**: `app/api/campaigns/[campaignId]/launch/route.ts`

```
User clicks "Launch"
  ↓
POST /api/campaigns/{campaignId}/launch
  ├─ Fetch campaign data from Firestore
  ├─ Extract contacts from campaign.contacts[]
  ├─ For each contact:
  │  └─ Create messages in inbox structure:
  │     ├─ users/{userId}/campaigns/{campaignId}/inbox/contacts/contacts/{contactId}/messages/
  │        ├─ msg_title (text)
  │        ├─ msg_description (text)
  │        ├─ msg_voice (audio) [if voice channel enabled]
  │        ├─ msg_assets (text with asset refs) [if assets exist]
  │        └─ (batch writes, max 500 ops)
  ├─ Update campaign.status = "launched"
  ├─ Set campaign.launchedAt = timestamp
  └─ Return success
       ↓
Campaign appears in /yourcampaigns (status="launched")
```

### **4. Inbox System**

**Files**:
- `app/inbox/page.tsx` - Campaign list
- `app/inbox/CampaignContext.tsx` - Shared campaign data
- `app/inbox/[campaignId]/page.tsx` - Campaign redirect
- `app/inbox/[campaignId]/[contactId]/page.tsx` - **Chat UI** (WhatsApp-like) [YOUR ACTIVE FILE]
- `app/api/inbox/route.ts` - Fetch launched campaigns + contacts

**Inbox Data Structure** (Firestore):
```
users/{userId}/campaigns/{campaignId}/
  ├─ inbox/
  │  └─ contacts/
  │     └─ contacts/
  │        └─ {contactId}/
  │           └─ messages/
  │              ├─ msg_title: { sender: 'campaign', type: 'text', content: '...' }
  │              ├─ msg_description: { sender: 'campaign', type: 'text', content: '...' }
  │              ├─ msg_voice: { sender: 'campaign', type: 'audio', audioUrl: '...' }
  │              ├─ msg_assets: { sender: 'campaign', type: 'text', assets: [...] }
  │              └─ user_message_{id}: { sender: 'user', type: 'text', content: '...' }
```

**Message Flow** (Active File - Your File):
```
User types message in app/inbox/[campaignId]/[contactId]/page.tsx
  ↓
handleSendMessage()
  ├─ If inputValue.trim() empty:
  │  └─ payload = buildCampaignMessage() → { message, audioUrl, assets }
  └─ Else:
     └─ payload = { message: inputValue }
  ↓
POST /api/inbox/{campaignId}/{contactId}/send
  ├─ Extract { message, audioUrl, assets } from body
  ├─ Write to Firestore:
  │  └─ users/{userId}/campaigns/{campaignId}/inbox/contacts/contacts/{contactId}/messages/msg_{uuid}
  │     = { sender: 'user', type: 'text|audio', content, audioUrl?, assets?, createdAt: now }
  └─ Return { success: true }
  ↓
Frontend reloads messages via:
  ↓
GET /api/inbox/{campaignId}/{contactId}/messages
  ├─ Try to fetch from Firestore (inbox structure)
  ├─ Fallback: Generate campaign messages if no inbox data
  └─ Return { messages: [...] }
  ↓
Update UI with new messages
```

---

## 🔥 Firebase Firestore Schema

### **Collections Hierarchy**

```
Firestore Database
│
├─ users/
│  └─ {userId}/
│     ├─ campaigns/
│     │  └─ {campaignId}/
│     │     ├─ title: string
│     │     ├─ description: { original, aiEnhanced } | string
│     │     ├─ channels: { text?, voice?, calls? }
│     │     ├─ toneOfVoice: string
│     │     ├─ wordLimit: number
│     │     ├─ status: "draft" | "launched"
│     │     ├─ contacts: [ { name, phone, email? } ]
│     │     ├─ contactsSummary: { items: [...], uploadedAt }
│     │     ├─ contactsFile: { url, publicId, name }
│     │     ├─ assets: [ { url, publicId, type } ]
│     │     ├─ documents: [ { url, publicId, name, extractedText } ]
│     │     ├─ channelContent: { voice: { transcript }, calls: { transcript } }
│     │     ├─ audioUrls: { voice, calls }
│     │     ├─ audioPublicIds: { voice, calls }
│     │     ├─ launchedAt: timestamp
│     │     ├─ createdAt: timestamp
│     │     ├─ updatedAt: timestamp
│     │     │
│     │     └─ inbox/
│     │        └─ contacts/
│     │           └─ contacts/
│     │              └─ {contactId}/
│     │                 └─ messages/
│     │                    ├─ {messageId}: { sender, type, content, audioUrl?, assets?, createdAt }
│     │                    └─ ...
│     │
│     └─ onboarding/
│        └─ profile/
│           ├─ businessType: string
│           ├─ targetAudience: string
│           ├─ brandStyle: string
│           ├─ responsePreference: string
│           ├─ agreedToTerms: boolean
│           ├─ createdAt: timestamp
│           └─ updatedAt: timestamp
│
└─ (Global collections if any - none in current schema)
```

### **Key Firestore Operations**

```
campaignOps.createCampaign()     // Create new campaign
campaignOps.getCampaigns()        // List all campaigns for user
campaignOps.getCampaign()         // Get single campaign
campaignOps.updateCampaign()      // Update campaign fields
campaignOps.deleteCampaign()      // Delete campaign

contactOps.addContact()           // Add contact to campaign
contactOps.getContacts()          // List contacts
contactOps.updateContact()        // Update contact

conversationOps.createConversation()  // Create conversation
conversationOps.addMessage()          // Add message to conversation
```

---

## 🤖 AI Integration

### **Gemini APIs Used**

| Model | Purpose | File |
|-------|---------|------|
| `gemini-2.5-flash` | Description enhancement, transcript generation | `/api/campaigns/[id]/description`, `/api/campaigns/[id]/transcript` |
| `gemini-2.5-flash-preview-tts` | Text-to-Speech audio generation | `/api/campaigns/[id]/tts` |

### **AI Content Generation Flow**

**Description Enhancement**:
```
User enters campaign description
  ↓
POST /api/campaigns/{campaignId}/description
  ├─ Call Gemini with prompt:
  │  "Enhance this campaign description for WhatsApp marketing"
  ├─ Gemini returns aiEnhanced text
  └─ Save to Firestore: campaign.description = { original, aiEnhanced }
```

**Transcript Generation (Voice/Calls)**:
```
User selects Voice or Calls channel
  ↓
POST /api/campaigns/{campaignId}/transcript
  ├─ Call Gemini with prompt:
  │  "Create a voice script for this campaign"
  │  (Uses title, description, tone, channel type)
  ├─ Gemini returns transcript (natural voice script)
  └─ Save to Firestore: campaign.channelContent.voice.transcript
```

**TTS Audio Generation**:
```
POST /api/campaigns/{campaignId}/tts
  ├─ Call Gemini TTS API with transcript + tone
  ├─ Gemini returns audio buffer (WAV format)
  ├─ Create WAV header (PCM format)
  ├─ Upload to Cloudinary
  └─ Save URL to Firestore: campaign.audioUrls.voice
```

---

## 📤 File Upload & Storage

### **Cloudinary Integration**

```
Local File (image/video/csv/pdf)
  ↓
/api/campaigns/{campaignId}/files (POST)
  ├─ Extract FormData: assets[], contactsFile
  ├─ Call uploadToCloudinary()
  │  └─ cloudinary.uploader.upload_stream()
  │     ├─ resource_type: 'image' | 'video' | 'raw'
  │     ├─ public_id: outreachx-campaigns/{userId}/{type}/{filename}
  │     └─ Returns: { secure_url, public_id }
  ├─ Save metadata to Firestore:
  │  ├─ campaign.assets = [ { url, publicId, type } ]
  │  └─ campaign.contactsFile = { url, publicId, name }
  └─ Return { success, assets, contactsFile }
```

### **Document Parsing**

```
PDF Upload
  ↓
/api/campaigns/{campaignId}/docs (POST)
  ├─ extractPdfText() using pdf-parse
  ├─ Upload to Cloudinary (resource_type: 'raw')
  ├─ Save to Firestore: campaign.documents = [ { url, publicId, name, extractedText } ]
  └─ Return { documents }
```

---

## 🔄 API Routes Deep Dive

### **Campaign APIs**

| Route | Method | Purpose | Key Logic |
|-------|--------|---------|-----------|
| `/api/campaigns` | POST | Create campaign | Create doc in Firestore, return campaignId |
| `/api/campaigns/draft` | POST/PATCH | Create/update draft | Merge fields, skip undefined values |
| `/api/campaigns/[id]` | GET | Fetch campaign | Extract channelContent, audioUrls safely |
| `/api/campaigns/[id]/description` | POST | Enhance description | Gemini API → save to Firestore |
| `/api/campaigns/[id]/transcript` | POST | Generate voice script | Gemini API → save to Firestore |
| `/api/campaigns/[id]/tts` | POST | Generate audio | Gemini TTS → WAV → Cloudinary → Firestore |
| `/api/campaigns/[id]/contacts` | POST | Parse contacts file | Papa Parse (CSV) / XLSX → Firestore |
| `/api/campaigns/[id]/files` | POST | Upload assets | Cloudinary → Firestore |
| `/api/campaigns/[id]/docs` | POST/GET | Upload/fetch documents | PDF extraction → Cloudinary → Firestore |
| `/api/campaigns/[id]/launch` | POST | Launch campaign | Batch write messages to inbox structure |
| `/api/campaigns/[id]/delete` | DELETE | Delete campaign | Remove from Firestore |

### **Inbox APIs**

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/inbox` | GET | Fetch all launched campaigns + contacts |
| `/api/inbox/[campaignId]/contacts` | GET | Fetch contacts for campaign |
| `/api/inbox/[campaignId]/[contactId]/messages` | GET | Fetch messages (Firestore or fallback) |
| `/api/inbox/[campaignId]/[contactId]/send` | POST | Send message to Firestore |

**Key**: Messages are stored in `users/{userId}/campaigns/{campaignId}/inbox/contacts/contacts/{contactId}/messages/`

### **Utility APIs**

| Route | Purpose |
|-------|---------|
| `/api/parse` | Parse CSV/Excel files (Cloudinary download → parse → extract contacts) |
| `/api/onboarding` | GET/POST onboarding profile |
| `/api/yourcampaigns` | GET launched campaigns (filters status="launched") |
| `/api/inbox/migrate` | Migrate old campaigns to inbox structure (batch writes) |
| `/api/inbox/cleanup` | Delete old inbox collections |
| `/api/debug/campaign-inbox-status/[campaignId]` | Debug inbox structure |

---

## 🎨 State Management

### **1. Campaign Creation Context**

File: `app/campaign/CampaignContext.tsx`

```typescript
interface CampaignData {
  campaignId?: string           // Persisted to Firestore
  title: string                 // Step 1
  description: string           // Step 2 (enhanced by AI)
  channels: ChannelConfig       // Step 3
  toneOfVoice?: string          // Step 3
  assets: File[]                // Step 4 (uploaded to Cloudinary)
  contacts: { name, phone }[]   // Step 6 (parsed from CSV)
  contactsFile?: File           // Step 6
  documents: Document[]         // Step 5 (parsed PDFs)
  aiDescription?: string        // AI-enhanced description
  previewText?: string          // Used in inbox
  channelContent?: ChannelContent // Voice/calls transcripts
}
```

**Usage**: All campaign creation pages (`/campaign/*`) consume this context via `useCampaign()`.

### **2. Inbox Campaign Context**

File: `app/inbox/CampaignContext.tsx`

```typescript
interface CampaignContextType {
  campaignDetails: CampaignDetails | null
  contacts: Contact[]
  loading: boolean
  fetchCampaignData: (campaignId: string) => Promise<void>
}
```

**Usage**: Shared between inbox contact list and chat UI.

### **3. Onboarding Context**

File: `app/components/Onboarding/OnboardingContext.tsx`

```typescript
interface OnboardingData {
  businessType?: string
  targetAudience?: string
  brandStyle?: string
  responsePreference?: string
  agreedToTerms?: boolean
}
```

**Usage**: Initial user setup modal on homepage.

---

## 🔐 Environment Variables

**Required** (`.env.local`):

```bash
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Firebase (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase (Admin - Server-side only)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=... # Include \n as literal

# Google APIs
GEMINI_API_KEY=...
GEMINI_TTS_API_KEY=... # For audio generation

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 🏗️ Build & Runtime Architecture

### **Build Time (Next.js)**

```
next build
  ├─ Compile .tsx/.ts files
  ├─ Generate API routes
  ├─ Optimize images
  ├─ Code splitting
  └─ .next/ output
```

### **Runtime**

```
Production (Vercel/Node.js):
  ├─ Next.js server runs
  ├─ API routes execute in Node.js
  │  ├─ Access server-only secrets (FIREBASE_PRIVATE_KEY, GEMINI_API_KEY)
  │  ├─ Initialize Admin SDK
  │  ├─ Call Firebase Admin (write/read)
  │  └─ Call Google APIs
  └─ Client-side code (browser)
     ├─ Clerk auth
     ├─ Fetch from API routes
     └─ Render components

Development (localhost):
  ├─ next dev runs
  ├─ Hot reload enabled
  ├─ Optional: Firestore emulator (localhost:8080)
  └─ All features available
```

---

## 🎯 Critical Files (DO NOT MODIFY WITHOUT TESTING)

| File | Why Critical | Impact of Breaking |
|------|--------------|-------------------|
| `lib/firebase/admin.ts` | Firebase Admin initialization | All Firestore writes fail |
| `middleware.ts` | Route protection | Unauthenticated access to protected pages |
| `app/campaign/CampaignContext.tsx` | Campaign state across flow | Campaign creation pages break |
| `app/inbox/CampaignContext.tsx` | Inbox data sharing | Chat UI loses campaign data |
| `app/api/campaigns/[campaignId]/launch/route.ts` | Campaign launch logic | Users can't launch campaigns |
| `app/inbox/[campaignId]/[contactId]/page.tsx` | Chat UI (YOUR ACTIVE FILE) | Inbox messaging broken |

---

## 🧩 Safe-to-Modify Files

| File | Purpose | Safety |
|------|---------|--------|
| `app/page.tsx` | Homepage content | ✅ Safe (UI only) |
| `app/campaign/description/page.tsx` | Description step form | ✅ Safe (UI only) |
| Components in `app/components` | Reusable UI | ✅ Safe (UI only) |
| `lib/ai-service.ts` | Helper AI functions | ✅ Safe (utilities only) |
| `lib/api-helpers.ts` | Response formatting | ✅ Safe (utilities only) |

---

## 📍 Where are Key Operations?

### **Firebase Reads**

| Operation | File | Logic |
|-----------|------|-------|
| Fetch campaign | `/api/campaigns/[id]` | `db.collection('users').doc(userId).collection('campaigns').doc(campaignId).get()` |
| Fetch contacts | `app/api/inbox/route.ts` | `campaignData.contacts or campaignData.contactsSummary.items` |
| Fetch messages | `/api/inbox/[campaignId]/[contactId]/messages` | Try Firestore, fallback to generate campaign messages |
| List launched campaigns | `app/api/yourcampaigns/route.ts` | `where('status', '==', 'launched').orderBy('createdAt')` |

### **Firebase Writes**

| Operation | File | Trigger |
|-----------|------|---------|
| Create campaign | `/api/campaigns/draft` | POST from campaign creation pages |
| Update campaign | `/api/campaigns/[id]/description` | POST after AI enhancement |
| Launch campaign (batch) | `/api/campaigns/[id]/launch` | POST from preview page |
| Send message | `/api/inbox/[campaignId]/[contactId]/send` | POST from chat UI |

### **Response Formatting**

| Endpoint | Formats Response As | File |
|----------|-------------------|------|
| `/api/campaigns/*` | `NextResponse.json({ ... })` | Individual route files |
| `/api/inbox/*` | `NextResponse.json({ messages, campaigns, contacts })` | `lib/api-helpers.ts` |
| Error handling | `NextResponse.json({ error: string }, { status: 400/401/500 })` | Each route |

### **Logging & Error Handling**

```typescript
// Pattern across all API routes:

console.log('🔍 Starting operation...')  // Blue info
console.error('❌ Error:', error)        // Red error
console.log('✅ Success:', data)         // Green success

return NextResponse.json(
  { error: 'Message' },
  { status: 500 }
)
```

---

## 🤝 Integration Preparation: LangChain Chatbot Module

### **Where Should It Live?**

**Best Location**: **API Route** (`app/api/campaigns/[campaignId]/chat/route.ts`)

**Why**:
1. ✅ Server-side execution (safe access to secrets)
2. ✅ Can access Firestore directly via Admin SDK
3. ✅ Can call LangChain without exposing API keys
4. ✅ Can stream responses using Next.js streaming
5. ✅ Existing pattern (similar to `/api/campaigns/[id]/description`)

### **Safe Firebase Access Pattern**

```typescript
// api/campaigns/[id]/chat/route.ts
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/firebase/admin'

export async function POST(req: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { campaignId } = await params
  
  // ✅ SAFE: Use Admin SDK to fetch campaign data
  const campaignRef = db
    .collection('users')
    .doc(userId)
    .collection('campaigns')
    .doc(campaignId)
  
  const campaignSnap = await campaignRef.get()
  if (!campaignSnap.exists) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }
  
  const campaignData = campaignSnap.data()
  
  // ✅ SAFE: Pass campaign context to LangChain
  const langChainResponse = await langchainModule.chat({
    context: {
      campaignTitle: campaignData.title,
      campaignDescription: campaignData.aiDescription,
      channelContent: campaignData.channelContent,
      contacts: campaignData.contacts
    },
    userMessage: req.body.message
  })
  
  // ✅ SAFE: Log to Firestore
  await campaignRef.collection('chat_history').add({
    role: 'user',
    content: req.body.message,
    timestamp: new Date()
  })
  
  await campaignRef.collection('chat_history').add({
    role: 'assistant',
    content: langChainResponse,
    timestamp: new Date()
  })
  
  return NextResponse.json({ response: langChainResponse })
}
```

### **How to Avoid Breaking Existing Logic**

1. **Do NOT modify**:
   - Campaign context or launch logic
   - Message sending flow
   - Firebase schema

2. **Do create**:
   - New API route: `/api/campaigns/[id]/chat`
   - New Firestore subcollection: `campaigns/{id}/chat_history`
   - New frontend component: `app/components/CampaignChatbot.tsx`

3. **Integration Points** (safe to consume):
   - `useCampaignContext()` → Get campaign data
   - `/api/campaigns/[id]` → Fetch campaign for context
   - `/api/inbox/[campaignId]/[contactId]/messages` → Fetch message history

4. **Do NOT consume directly**:
   - Private Firebase refs from components
   - Admin SDK from client-side code

---

## 🎓 Final Mental Map

```
┌─────────────────────────────────────────────────────────────────┐
│                   OUTREACHX ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ENTRY POINTS:                                                  │
│  ├─ app/page.tsx (Homepage)                                     │
│  ├─ app/campaign/layout.tsx (Campaign flow)                    │
│  ├─ app/inbox/page.tsx (Inbox list)                           │
│  └─ app/yourcampaigns/page.tsx (Launched campaigns)           │
│                                                                 │
│  CAMPAIGN CREATION FLOW (In-Memory):                           │
│  ├─ CampaignContext holds campaign state                       │
│  ├─ /api/campaigns/draft creates Firestore doc                 │
│  ├─ Each step POSTs to specific /api/campaigns/[id]/* route    │
│  └─ Final: /api/campaigns/[id]/launch batch-writes inbox msgs  │
│                                                                 │
│  FIREBASE DATA:                                                 │
│  ├─ users/{userId}/campaigns/{campaignId}/                     │
│  │  ├─ title, description, channels, assets, contacts          │
│  │  ├─ audioUrls, channelContent (transcripts)                 │
│  │  ├─ status: "draft" | "launched"                            │
│  │  └─ inbox/contacts/contacts/{contactId}/messages/           │
│  │                                                               │
│  │  └─ [SAFE TO ADD]: chat_history/                            │
│  │                    (new subcollection for chatbot)           │
│  │                                                               │
│  └─ users/{userId}/onboarding/profile/                         │
│                                                                 │
│  AI INTEGRATIONS:                                              │
│  ├─ Gemini 2.5-flash: Description, transcripts                │
│  ├─ Gemini TTS: Audio generation                              │
│  └─ [NEW]: LangChain in /api/campaigns/[id]/chat              │
│                                                                 │
│  EXTERNAL SERVICES:                                            │
│  ├─ Clerk: Authentication                                      │
│  ├─ Firebase: Firestore, Storage                              │
│  ├─ Cloudinary: File uploads                                  │
│  └─ [NEW]: LangChain: Conversational AI                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Summary Table

| Aspect | Answer |
|--------|--------|
| **Project Type** | Next.js 15 + Firebase + AI SaaS |
| **Primary Use** | Multi-channel campaign orchestration |
| **Auth** | Clerk (client + server) |
| **Database** | Firestore (users/campaigns/inbox structure) |
| **AI Models** | Google Gemini 2.5-flash + TTS |
| **File Storage** | Cloudinary (images, videos, audio, PDFs) |
| **Chat Interface** | WhatsApp-like (already implemented) |
| **State Management** | React Context + Firestore |
| **API Pattern** | REST routes + batch writes |
| **Your Active File** | Chat UI component (messages display + send) |
| **Recommended Chatbot** | `/api/campaigns/[id]/chat` (new route) |
| **Chatbot Firestore** | `campaigns/{id}/chat_history` (new subcollection) |

---

## 🚀 Your Active File Analysis

**File**: `app/inbox/[campaignId]/[contactId]/page.tsx`

### **What This Component Does**

This is the **WhatsApp-like chat interface** for your outreach campaigns. It allows:

1. **Contact Management**: View list of all campaign contacts (left sidebar)
2. **Message Display**: Show campaign messages + user replies (center area)
3. **Audio Playback**: Play TTS audio with progress bar and waveform
4. **Asset Display**: Show images/videos sent in campaign
5. **Message Sending**: Send user messages to Firestore

### **Key Hooks & State**

```typescript
// From Clerk
const { isSignedIn } = useAuth()

// From Next.js Navigation
const router = useRouter()
const params = useParams()
// → Gets campaignId and contactId from URL

// From shared context
const { campaignDetails, contacts, fetchCampaignData } = useCampaignContext()

// Local state
const [selectedContactId, setSelectedContactId] = useState<string>('')
const [messages, setMessages] = useState<Record<string, Message[]>>({})
const [inputValue, setInputValue] = useState('')
const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)
const [audioDuration, setAudioDuration] = useState<{[key: string]: number}>({})
const [audioCurrentTime, setAudioCurrentTime] = useState<{[key: string]: number}>({})
```

### **Message Types**

```typescript
interface Message {
  id: string
  sender: 'user' | 'ai'              // 'ai' = campaign message
  type: 'text' | 'audio'             // text message or voice
  content: string                    // text content
  timestamp: string                  // formatted time string
  audioUrl?: string                  // URL to audio file
  assets?: Asset[]                   // images/videos array
}
```

### **Key Functions**

#### **buildCampaignMessage()**
Constructs the campaign message structure:
1. Title
2. AI-enhanced description
3. Audio URL (if exists)
4. Assets (if exist)

```typescript
return {
  message: textMessage,      // Title + description joined
  audioUrl: audioUrl,        // Voice audio if available
  assets: campaignAssets     // Images/videos array
}
```

#### **handleSendMessage()**
When user clicks send button:
- If input is empty → Send campaign message (title + description + audio + assets)
- If input has text → Send user's typed message
- Posts to `/api/inbox/{campaignId}/{contactId}/send`
- Reloads messages after 1.5s delay

#### **Message Playback**
Audio player UI with:
- Waveform visualization
- Play/Pause button
- Progress bar
- Current time / Duration display
- Hidden HTML5 audio element for actual playback

### **Data Flow in This Component**

```
Component Mount
  ↓
useEffect: Fetch campaign data via fetchCampaignData()
  ↓
campaignDetails populated
  ↓
Contact selected (from URL)
  ↓
useEffect: Load messages via GET /api/inbox/{campaignId}/{contactId}/messages
  ↓
Messages displayed in UI
  ↓
User types message
  ↓
User clicks Send
  ↓
handleSendMessage():
  ├─ buildCampaignMessage() or use inputValue
  ├─ POST /api/inbox/{campaignId}/{contactId}/send
  ├─ Wait 1.5s
  └─ Reload messages via GET /api/inbox/{campaignId}/{contactId}/messages
  ↓
UI updates with new message
```

### **UI Layout**

```
┌─────────────────────────────────────────────┐
│  Top Bar (Campaign Title + Contact Count)   │
├──────────────────┬──────────────────────────┤
│                  │                          │
│  Contact List    │   Chat Messages Area     │
│  (left sidebar)  │   (center/right main)    │
│  - Search        │                          │
│  - Contacts      │   - Message bubbles      │
│  - Last msg      │   - Audio player         │
│  - Unread badge  │   - Asset grid          │
│                  │                          │
├──────────────────┼──────────────────────────┤
│                  │  Input Area              │
│                  │  - Emoji button          │
│                  │  - Attachment button    │
│                  │  - Text input            │
│                  │  - Send button           │
└──────────────────┴──────────────────────────┘
```

### **WhatsApp Design Elements**

- **Colors**: 
  - Green (#00a884) for header
  - White for campaign messages
  - Light green (#d9fdd3) for user messages
  - Light gray (#efeae2) for background

- **Message Bubbles**:
  - Rounded corners
  - Drop shadow
  - Sender-specific styling (right=user, left=campaign)
  - Timestamp + read receipt checkmarks

- **Contact List**:
  - Avatar with unread badge
  - Last message preview
  - Last message timestamp
  - Hover effects

- **Audio Player**:
  - Waveform bars (animated)
  - Play/Pause button
  - Progress bar
  - Time display (current/duration)

---

## 🧠 How to Extend This Component

### **To Add LangChain AI Responses**

1. **Create API route** (`/api/campaigns/[id]/chat`)
2. **Add message type** to interface (e.g., `sender: 'ai' | 'user' | 'langchain'`)
3. **Modify handleSendMessage()** to also call LangChain endpoint
4. **Store responses** in Firestore under `campaigns/{id}/chat_history`
5. **Update message reload** to fetch from chat_history if present

### **To Add Real-Time Updates**

Replace manual fetch with Firestore listener:

```typescript
useEffect(() => {
  const unsubscribe = db
    .collection('users').doc(userId)
    .collection('campaigns').doc(campaignId)
    .collection('inbox').collection('contacts').collection('contacts')
    .doc(contactId)
    .collection('messages')
    .orderBy('createdAt', 'asc')
    .onSnapshot(snapshot => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setMessages(prev => ({ ...prev, [contactId]: msgs }))
    })
  
  return unsubscribe
}, [contactId, campaignId])
```

### **To Add Typing Indicators**

Update Firestore field `isTyping` on user input/blur:

```typescript
const handleTyping = async (isTyping: boolean) => {
  await db
    .collection('users').doc(userId)
    .collection('campaigns').doc(campaignId)
    .collection('inbox').collection('contacts').collection('contacts')
    .doc(contactId)
    .update({ isTyping })
}
```

---

## 📋 Complete File Structure Reference

```
d:\PROGRAMMING\ShowCaseX\OutreachX\frontend\

├── app/
│   ├── page.tsx                          # Homepage
│   ├── layout.tsx                        # Root layout + providers
│   ├── middleware.ts                     # Route protection
│   │
│   ├── campaign/
│   │   ├── layout.tsx                    # Campaign flow wrapper
│   │   ├── CampaignContext.tsx           # Campaign state context
│   │   ├── title/page.tsx               # Step 1: Campaign title
│   │   ├── description/page.tsx         # Step 2: Description (AI enhanced)
│   │   ├── channels/page.tsx            # Step 3: Select channels
│   │   ├── assets/page.tsx              # Step 4: Upload images/videos
│   │   ├── docs/page.tsx                # Step 5: Upload PDFs
│   │   ├── contacts/page.tsx            # Step 6: Upload contacts CSV
│   │   └── preview/
│   │       └── PreviewPageImpl.tsx       # Step 7: Preview & launch
│   │
│   ├── inbox/
│   │   ├── page.tsx                      # List launched campaigns
│   │   ├── CampaignContext.tsx          # Inbox campaign context
│   │   ├── [campaignId]/
│   │   │   ├── page.tsx                  # Redirect to first contact
│   │   │   └── [contactId]/
│   │   │       └── page.tsx              # 👈 YOUR ACTIVE FILE - Chat UI
│   │   │
│   │   └── (other inbox pages)
│   │
│   ├── yourcampaigns/
│   │   └── page.tsx                      # Launched campaigns view
│   │
│   ├── components/
│   │   ├── Onboarding/                   # Onboarding flow components
│   │   ├── (other shared components)
│   │   └── CampaignChatbot.tsx          # 👈 WHERE TO ADD CHATBOT
│   │
│   └── api/
│       ├── campaigns/
│       │   ├── route.ts                  # Create campaign
│       │   ├── draft/route.ts            # Create/update draft
│       │   ├── [campaignId]/
│       │   │   ├── route.ts              # Get campaign
│       │   │   ├── description/route.ts  # AI description enhancement
│       │   │   ├── transcript/route.ts   # Voice script generation
│       │   │   ├── tts/route.ts          # Audio generation
│       │   │   ├── contacts/route.ts     # Parse contacts
│       │   │   ├── files/route.ts        # Upload assets
│       │   │   ├── docs/route.ts         # Parse documents
│       │   │   ├── launch/route.ts       # Launch campaign
│       │   │   ├── delete/route.ts       # Delete campaign
│       │   │   └── chat/route.ts         # 👈 WHERE TO ADD LANGCHAIN
│       │   │
│       │   └── (other campaign routes)
│       │
│       ├── inbox/
│       │   ├── route.ts                  # Get launched campaigns
│       │   ├── [campaignId]/
│       │   │   ├── [contactId]/
│       │   │   │   ├── messages/route.ts # Get messages
│       │   │   │   └── send/route.ts     # Send message
│       │   │   └── (other inbox routes)
│       │   │
│       │   ├── migrate/route.ts          # Migration utility
│       │   └── cleanup/route.ts          # Cleanup utility
│       │
│       ├── parse/route.ts                # CSV/Excel parser
│       ├── onboarding/route.ts           # Onboarding profile
│       ├── yourcampaigns/route.ts        # Launched campaigns
│       ├── debug/route.ts                # Debug utilities
│       └── (other API routes)
│
├── lib/
│   ├── firebase/
│   │   ├── admin.ts                      # Firebase Admin SDK init
│   │   ├── client.ts                     # Firebase client init
│   │   └── (other firebase helpers)
│   │
│   ├── firestore-ops.ts                  # Firestore operations
│   ├── api-helpers.ts                    # API response formatting
│   ├── ai-service.ts                     # AI helper functions
│   ├── cloudinary.ts                     # Cloudinary integration
│   └── (other utilities)
│
├── public/
│   └── (static assets)
│
├── .env.local                            # Environment variables
├── next.config.ts                        # Next.js config
├── tsconfig.json                         # TypeScript config
├── package.json                          # Dependencies
└── (other config files)
```

---

**END OF ARCHITECTURE DOCUMENTATION**

Last Updated: January 1, 2026

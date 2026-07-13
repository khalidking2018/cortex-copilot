# Cortex Copilot - Industrial Energy Platform AI Assistant

Cortex Copilot is a self-hosted, secure, multi-tenant AI assistant designed for an Industrial Intelligence Platform. It allows factory operators to ask questions about energy consumption in natural language, querying telemetry databases and explaining charts deterministically while strictly preventing data hallucinations and cross-tenant leakage.

## Architecture & Design

### Components
1. **Frontend:** React SPA built with Vite, utilizing Recharts for telemetry graphing, and styled with premium vanilla CSS.
2. **Backend:** FastAPI Python server providing deterministic statistical API endpoints and LLM integration.
3. **Database:** SQLite database containing factory telemetry data isolated by `tenant_id`.
4. **LLM:** Self-hosted open-weight `qwen2.5:3b` model executed locally via **Ollama**.

---

## Key Features & Tier 1 Completion

### 1. Secure Tenant Login & Verification
Rather than a client-side tenant selector, users authenticate through a dedicated login interface.
- **Tenant A (Commercial):** Username `tenant_a` | Password `password_a`
- **Tenant B (Industrial):** Username `tenant_b` | Password `password_b`

### 2. Server-Side Tenant Isolation
The server issues a cryptographically signed HMAC-SHA256 session token upon successful login. 
- All telemetry and chat API requests must supply the `Authorization: Bearer <token>` header.
- The server decodes the token, verifies the signature, and retrieves the corresponding `tenant_id`. This prevents Insecure Direct Object Reference (IDOR) attacks and prompt injection breaches.

### 3. Grounded & Refusal Behaviour
The AI engine implements strict grounding to avoid hallucinating facts or numbers.
- **Date Range Check:** The dataset contains telemetry from `2026-05-19` to `2026-07-04`. If the user asks about an out-of-bounds date (e.g., *"What was my consumption in 2023?"*), the backend filters this deterministically and responds exactly with:
  `The requested data is unavailable.`
- **Prompt Isolation:** Telemetry statistics are queried deterministically and passed directly inside a locked prompt context. General knowledge questions that fall outside our telemetry parameters are rejected.

---

## How to Run

### Option A: Unified Docker Container (Recommended)
You can build and run both the frontend and backend served together from a single container on port 8000.

1. **Build the Docker Image:**
   ```bash
   docker build -t cortex-copilot .
   ```

2. **Run the Docker Container:**
   ```bash
   docker run -d -p 8000:8000 --name cortex-app cortex-copilot
   ```

3. **Access the application:**
   Open [http://localhost:8000](http://localhost:8000) in your browser.

---

### Option B: Local Development Run

#### 1. Backend Setup
1. Open a terminal in the `backend` folder:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   - **Windows (PowerShell):** `.\venv\Scripts\Activate.ps1`
   - **macOS/Linux:** `source venv/bin/activate`
3. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

#### 2. Frontend Setup
1. Open a terminal in the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the React app at [http://localhost:5173](http://localhost:5173).

---

## Testing Scenarios

1. **Verify Isolation:**
   Log in as `tenant_a`. Attempt to query Tenant B's data using curl requests or developer tools. Note that because requests do not carry Tenant B's cryptographic signature, they are rejected or locked strictly to Tenant A.
2. **Verify Temporal Refusal:**
   In the chat box, ask: *"What was my consumption in 2023?"*. The system will refuse and output exactly *"The requested data is unavailable."*.
3. **Verify Unknown Metrics Refusal:**
   In the chat box, ask: *"How many solar panels do I have?"*. The system will refuse and output *"The requested data is unavailable."* since solar data is not present in the telemetry.

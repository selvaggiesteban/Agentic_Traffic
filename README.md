# 🤖 AgenticTraffic: High-Performance WooCommerce Simulation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

**AgenticTraffic** is a distributed load-testing framework that leverages Large Language Models (LLMs) to power autonomous agents. Unlike traditional tools, it simulates real human-like interaction patterns—navigating the DOM, managing sessions, and making decisions—to identify critical bottlenecks in the full HTTP $\rightarrow$ PHP-FPM $\rightarrow$ MySQL stack.

---

## 🏗 Architecture & "The Brain" (How it works)

This project does not use "magic", but a **Reasoning-Action Loop**:
1. **Extraction:** A headless browser (Playwright) captures the current page's visible text and DOM.
2. **Reasoning:** This text is sent to an LLM (Claude/GPT) via API. The LLM acts as the "User's Brain", analyzing the page to find elements (e.g., "Where is the Checkout button?").
3. **Action:** The LLM returns a specific command from a predefined **Action Space** (e.g., `click_element`).
4. **Execution:** Playwright executes that command on the live site.

**API Key Required:** Yes. This system requires an **Anthropic** or **OpenAI** API key to power the decision-making process.

---

## 🛠 Installation & Configuration

### 1. Server Requirements (Target Site)
To get valid results, the audited server should meet these baseline specifications:
- **Environment:** WordPress + WooCommerce.
- **PHP:** $\ge$ 8.1 (Recommended 8.2+).
- **PHP Workers:** At least 100 (for the intended stress level).
- **MySQL:** $\ge$ 5.7 or MariaDB $\ge$ 10.3.
- **Memory:** $\ge$ 256MB `memory_limit` in `php.ini`.
- **Tools:** `WP-CLI` must be installed for the cleanup scripts.

### 2. Local Setup
```bash
git clone https://github.com/selvaggiesteban/Agentic_Traffic.git
cd Agentic_Traffic
cp .env.example .env
```
Edit the `.env` file:
```env
ANTHROPIC_API_KEY=your_key
TARGET_SITE_URL=https://staging.yoursite.com
REDIS_HOST=redis
REDIS_PORT=6379
```

### 3. Infrastructure Launch
```bash
docker-compose up -d --build
```

---

## 🏃 Execution Flow

### Phase 1: Infrastructure Audit
Before launching agents, you MUST run the diagnostic script via SSH to identify existing bottlenecks.

```bash
# Connect to your server via SSH
ssh user@server

# Run the diagnostic script
bash /path/to/scripts/ssh/diag_server.sh
```
This script audits the server's PHP Workers, MySQL connections, and RAM to determine if the site is "Ready for Stress".

### Phase 2: The Smoke Test (Verification)
**Mandatory Step:** Launch 1 single agent per persona.
If the agent completes the purchase flow successfully, the "Action Space" and "Pattern Recognition" are verified for your specific site version.

### Phase 3: Stress Test (Fan-Out)
Scale the workers to reach the breaking point:
```bash
# Scale to 10 workers (approx 50-100 concurrent agents depending on config)
docker-compose up -d --scale worker=10
```

The orchestrator will automatically distribute personas:
- **Decisive Buyer:** Direct path to checkout.
- **Comparison Shopper:** High read load.
- **Indecisive User:** Session/Cart stress.
- **Account Manager:** Auth/DB stress.

### Phase 4: Cleanup
To restore your staging site instantly:
```bash
# Via SSH
bash /path/to/scripts/ssh/cleanup_site.sh
```

---

## 📊 Deliverables

### 1. Flow Map (`flow_map.html`)
A technical map showing the request path and the **actual server configuration** audited by the diagnostic script.

### 2. Transaction Logs (`logs/transactions/`)
- **Global Log:** Chronological JSON-Lines of all actions.
- **Entity Snapshots:** Individual JSON files mirroring the database schema for every created user and order.

## 🛡 Safety Guards
- **Circuit Breaker:** Automated shutdown if 5xx error rate exceeds 5%.
- **Human-Like Delay:** Randomized "Think Time" between actions.
- **Resource Blocking:** Blocks images/CSS to focus strictly on server-side processing.

## 📜 License
MIT

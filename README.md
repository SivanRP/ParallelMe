# Parallel Me — Multiverse Decision Engine

> Enter a life decision. Watch two versions of you unfold.

Parallel Me is a full-stack web app that simulates parallel life timelines for any decision you're facing. Powered by live AI and real-world data signals, it renders two possible futures side by side — complete with 3D world maps, branching story paths, metric charts, and multiplayer debate.

---

## Features

### Core Simulation
- **AI-Powered Futures** — Calls Groq (llama-3.3-70b) with automatic fallback to llama-3.1-8b and mock data if APIs are unavailable
- **Evidence-Aware** — Real-world data modifiers pulled from BLS, research datasets, and category heuristics shape each simulation
- **Source Trust Layer** — Every simulation surfaces confidence ratings and data provenance so you know how grounded the output is
- **Streaming Panel** — Live progress UI while the simulation is being generated

### Visualization
- **3D Parallel Worlds** — Interactive Three.js/R3F scene showing both timelines as navigable 3D environments with a decade slider and autoplay
- **Constellation Map** — Year-by-year life events rendered as a star map
- **Life Arc Chart** — Income / stress / freedom curves across 10 years
- **Ripple Timeline** — Cascading effect visualization of each decision
- **Probability Drift** — How confidence in each path shifts year by year
- **Decision Graph** — Causal relationship graph between life outcomes
- **Life Event Graph** — Force-directed graph of milestones and their connections
- **Comparison Chart** — Side-by-side metric breakdown
- **Metric Timeline** — Tabular view of all tracked dimensions over time

### Story & Reflection
- **Story Cards** — Narrative milestones for each path written in second person
- **Branching Events** — Interactive "what if" forks mid-timeline
- **Verdict Card** — AI verdict on which path scores higher for your profile
- **Future Reflection** — Introspective prompts based on the simulation
- **Future Letter** — A letter from your future self in each timeline
- **Life Summary Report** — Full decade report card for both paths
- **Point of No Return** — Identifies the year each path becomes irreversible

### Strategy
- **Third Path** — AI-generated synthesis path that combines the best of both options
- **Decision Analysis** — Breaks down the tradeoffs across 6 dimensions
- **Decision Variables** — Key factors that influence the outcome
- **Decision Scoreboard** — Live outcome scores for Path A vs B
- **Next Week Plan** — Concrete action items for the week ahead based on your choice

### Social
- **Decision Arena** — Multiplayer room where friends vote on your decision, add rationale, and debate in real time (backed by Supabase)
- **Share** — Shareable simulation links via unique session IDs stored in localStorage
- **Decision Journal** — Persistent log of all your past simulations with scores

### Personalization
- **Onboarding Profile** — Risk tolerance, priority (wealth / creativity / freedom), decision-making style, age bracket, and cost-of-living tier
- **Context Panel** — Add free-text context to any simulation (e.g. "I have 3 years savings", "my partner supports this")

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| 3D | Three.js + React Three Fiber + Drei |
| Charts | Custom SVG + react-force-graph-2d |
| AI | Groq API (llama-3.3-70b / llama-3.1-8b fallback) |
| Database | Supabase (PostgreSQL via REST) |
| Email | Resend |
| Icons | Lucide React |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/SivanRP/ParallelMe.git
cd ParallelMe
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root:

```env
# Required — get a free key at console.groq.com
GROQ_API_KEY=your_groq_api_key

# Optional — for multiplayer Decision Arena
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional — for Future Letter email feature
RESEND_API_KEY=your_resend_api_key
```

> The app works without Supabase and Resend — the Decision Arena falls back to in-memory + localStorage, and the email feature is simply disabled.

### 3. (Optional) Set up Supabase for multiplayer

In your Supabase SQL Editor, run:

```sql
create table arena_votes (
  id bigint generated always as identity primary key,
  room text not null,
  name text not null,
  vote text not null,
  confidence int not null default 3,
  rationale text not null default '',
  created_at timestamptz not null default now()
);
create index on arena_votes(room);
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
/app
  /api
    /simulate       # Main AI simulation endpoint (Groq → OpenAI → mock)
    /arena          # Multiplayer votes (Supabase or in-memory fallback)
    /graph          # Causal decision graph generation
    /branch         # Branching event generation
    /third-path     # Third path synthesis
    /reflect        # Future reflection prompts
    /letter         # Future letter generation
  /simulate         # Simulation results page
  /journal          # Decision history page
  page.tsx          # Landing page

/components         # All UI components (30+)
/lib
  simulateHelpers   # Prompt building and decision parsing
  dataDecisionEngine # Real-world data modifiers
  sourceTrustLayer  # Confidence and provenance scoring
  outcomesEngine    # Outcome computation
  decisionGraphEngine # Graph data generation
  normalizeSimulate # API response normalization
  journal           # localStorage journal helpers
  shareStore        # Shareable session storage
  withTimeout       # Timeout utility for external API calls
```

---

## AI Model Cascade

The simulation endpoint tries providers in this order:

1. **Groq llama-3.3-70b-versatile** — primary, high quality
2. **Groq llama-3.1-8b-instant** — fallback if 70b is rate-limited
3. **OpenAI gpt-4o-mini** — if `OPENAI_API_KEY` is set
4. **Mock data** — always works, no API key required

---

## License

MIT

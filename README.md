# XaniPromt

A clean web app for turning rough ideas into high-quality prompts for LLMs and image models.

[![Vercel](https://img.shields.io/badge/Live-Vercel-000000?logo=vercel&logoColor=white)](https://xani4kapromt.vercel.app)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

## What It Does

- Refines a rough idea before prompt generation
- Generates 1-5 prompt variants
- Supports multiple target models, tones, and output formats
- Optionally adds role prefix and negative prompt
- Stores last prompts in local history
- One-click copy for prompt and negative prompt

> [!TIP]
> You can generate prompts for ChatGPT, Claude, Gemini, GitHub Copilot, Midjourney, Stable Diffusion, and other LLM/image platforms.
> This app is a prompt generator: copy the result and use it in your preferred cloud or local AI tool.

## Tech Stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- Google Gemini SDK (`@google/genai`)

## Quick Start

### 1. Requirements

- Node.js 20+ (recommended)
- npm

### 2. Install

```bash
npm install
```

### 3. Configure Environment

Create `.env.local`:

```bash
cp env.sample .env.local
```

Then set your key:

```bash
GEMINI_API_KEY=your_key_here
```

### 4. Run Locally

```bash
npx vercel dev
```

Open: `http://localhost:3000`

## Scripts

```bash
npm run dev      # Start local dev server
npm run build    # Build production bundle
npm run preview  # Preview production build
npm run lint     # Type-check (tsc --noEmit)
```

## Deploy (Vercel)

1. Import this repository into Vercel.
2. Set `GEMINI_API_KEY` in Project Settings -> Environment Variables.
3. Trigger redeploy.

## Troubleshooting

- `403` / `API key is invalid` / `key leaked`
: Your old key was revoked. Create a new Gemini API key, update `GEMINI_API_KEY` in Vercel, and redeploy.
- `GEMINI_API_KEY is not configured`
: Add `GEMINI_API_KEY` in Vercel Project Settings -> Environment Variables for `Production`, `Preview`, and `Development`.

## Security

- Never commit real API keys.
- Keep `.env*` files private.
- If a key was exposed, rotate it immediately.

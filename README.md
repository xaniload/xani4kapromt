# XaniPromt

XaniPromt is a prompt builder for text and image AI tools. It takes a rough idea, improves it, suggests missing details, and generates 1 to 5 prompt variants through Gemini-powered API routes.

## Current Version

This version includes:

- React 19 + TypeScript frontend built with Vite 6
- Tailwind CSS 4 styling
- API routes in `api/`
- Prompt generation through `gemini-2.5-flash`
- Idea enhancement before generation
- Short improvement suggestions
- Prompt history stored in `localStorage`
- Copy buttons for prompt and negative prompt
- Output controls for language, structure, tone, response style, role prefix, negative prompt, no extra text, and no formatting

## How It Works

The app has three backend endpoints:

- `POST /api/generate` creates final prompt variants
- `POST /api/enhance` rewrites the raw idea into a cleaner brief
- `POST /api/suggestions` returns short idea-improvement chips

The frontend sends the selected settings to these endpoints and renders the result cards in the browser.

## Tech Stack

- React 19
- TypeScript 5
- Vite 6
- Tailwind CSS 4
- `@google/genai`
- Node-based API functions
- `motion` for UI transitions
- `lucide-react` for icons

## Project Structure

```text
.
├── api/
│   ├── enhance.js
│   ├── generate.js
│   └── suggestions.js
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── services/gemini.ts
├── dist/
├── env.sample
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Requirements

- Node.js 20 or newer
- npm
- Gemini API key

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment file:

```bash
cp env.sample .env.local
```

3. Set your Gemini API key in `.env.local`:

```bash
GEMINI_API_KEY=your_real_key_here
APP_URL=http://localhost:3000
```

4. Start local development:

```bash
npx vercel dev
```

The app will usually be available at `http://localhost:3000`.

## Available Commands

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

`npm run dev` starts the Vite frontend only.

`npx vercel dev` is the correct way to run the frontend together with the `api/` routes locally.

## Production Build

Create the frontend bundle with:

```bash
npm run build
```

The compiled frontend files are written to `dist/`.

## Notes

- The frontend history is stored in browser `localStorage` under `xani_history_v2`.
- Generated prompts are returned as structured JSON from the backend.
- The selected Gemini model in this version is `gemini-2.5-flash`.
- `APP_URL` exists in `env.sample`, but the current code path relies mainly on relative `/api/...` requests.

## Troubleshooting

- `GEMINI_API_KEY is not configured`
  Add the key to Vercel environment variables or `.env.local` for local serverless development.

- Requests fail in plain `npm run dev`
  Use `npx vercel dev` instead, because Vite alone does not serve the `api/` functions.

- Empty prompt results
  Check API logs, confirm the key is valid, and verify the Gemini request is not being rate-limited.

## Security

- Do not commit real `.env.local` files.
- Rotate the Gemini key if it was exposed.
- Keep secrets only in environment variables.

Deploying ChainCacao backend (relayer) to Render

Overview
- We deploy the backend `server.ts` as a Docker Web Service on Render.
- Secrets (RPC URL, Alchemy key, PRIVATE_KEY_RELAYER, Firebase service account) must be set in Render's Environment variables / Secrets.

Files added
- `Dockerfile` : builds the Node app and runs `npx tsx server.ts`.
- `.dockerignore` : ignores local secrets and node_modules.

Required environment variables on Render (set in Dashboard > Environment):
- NEXT_PUBLIC_POLYGON_RPC_URL
- NEXT_PUBLIC_AMOY_RPC_URL (optional)
- NEXT_PUBLIC_CONTRACT_ADDRESS
- PRIVATE_KEY_RELAYER (secret)
- FIREBASE_SERVICE_ACCOUNT_KEY_PATH (not recommended on Render; prefer storing service account JSON in Render's secret store and writing to a file at startup)
- Any `NEXT_PUBLIC_FIREBASE_*` keys used by the frontend

Recommended Render service settings
- Service type: Web Service (Docker)
- Dockerfile path: Dockerfile
- Instance: at least 1x Standard (or smallest to start)
- Health check path: `/api/health`
- Start command: default from Dockerfile

Security notes
- Remove local `.env` from the repository and rotate any exposed keys immediately.
- Use Render's Secrets/Environment to inject `PRIVATE_KEY_RELAYER`. Do NOT store private keys in repo.

Testing after deploy
1. Visit `https://<your-service>.onrender.com/api/health` — should return status UP.
2. Call `POST /api/blockchain/notarize` from a trusted client to confirm notarization flow.

Optional: Deploy only PWA to Vercel / static host
- The PWA (frontend) is static in `public/` and can be deployed separately (Vercel or Netlify). Set client-side `NEXT_PUBLIC_*` envs in that platform.

If you want, I can:
- Add a `render.yaml` spec for auto-deploy, or
- Add a small Docker-compose for local testing, or
- Convert `server.ts` to a small compiled Node build (tsc) to avoid installing devDependencies in production.

# LadyChain Faucet

Single-page faucet UI built with Vite + React for distributing 1 $LADY per request.

## Getting started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the dev server:
   ```bash
   npm run dev
   ```
3. Build for production (Netlify uses the same command):
   ```bash
   npm run build
   ```

## Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- Faucet function endpoint: `/.netlify/functions/faucet`

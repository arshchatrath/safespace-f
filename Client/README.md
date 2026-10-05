# SafeSpace Frontend

This is the Next.js client for the SafeSpace stress assessment app. The backend setup, sample CSV instructions, and end-to-end test steps are maintained in the [project README](../README.md).

## Run locally

Use Node.js 22.14.0, npm 10.9.2, and pnpm 10.10.0. The project pins pnpm in `package.json` and resolves package versions through `pnpm-lock.yaml`. Start the Python 3.11.9 backend from `../Server` first. Then, from this directory, run:

```powershell
pnpm install --frozen-lockfile
pnpm run dev
```

If pnpm is not installed, install the pinned version once with `npm install --global pnpm@10.10.0`.

Open the assessment at [http://localhost:3000/check](http://localhost:3000/check). The frontend sends prediction requests to `http://localhost:8000/predict` by default. To use another backend, set `NEXT_PUBLIC_API_URL` (for example `NEXT_PUBLIC_API_URL=https://api.example.com` in `.env.local`) before `pnpm run dev` or `pnpm run build`.

## Production build check

```powershell
pnpm run build
```

# SafeSpace Frontend

This is the Next.js client for the SafeSpace stress assessment app. The backend setup, sample CSV instructions, and end-to-end test steps are maintained in the [project README](../README.md).

## Run locally

Use Node.js 22.14.0, npm 10.9.2, and pnpm 10.10.0. The project pins pnpm in `package.json` and resolves package versions through `pnpm-lock.yaml`. Start the Python 3.11.9 backend from `../Server` first. Then, from this directory, run:

```powershell
pnpm install --frozen-lockfile
pnpm run dev
```

If pnpm is not installed, install the pinned version once with `npm install --global pnpm@10.10.0`.

Open the assessment at [http://localhost:3000/check](http://localhost:3000/check). The frontend sends prediction requests to the backend at `http://localhost:8000/predict`.

## Production build check

```powershell
pnpm run build
```

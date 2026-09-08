# GitHub Pages Deployment

This Vite React site is configured for GitHub Pages static deployment.

## Local Check

```bash
npm ci
npm run deploy:check
```

## GitHub Setup

1. Open the repository on GitHub.
2. Go to `Settings`.
3. Open `Pages`.
4. Set `Source` to `GitHub Actions`.
5. Push to `main`.

The workflow in `.github/workflows/deploy.yml` installs dependencies, runs lint, builds the Vite app, uploads `dist`, and deploys it to GitHub Pages.

Expected project Pages URL:

```text
https://latchinfinity.github.io/bijapur-lodge/
```

For a custom domain deployment later, set this GitHub Actions environment variable:

```text
VITE_BASE_PATH=/
```

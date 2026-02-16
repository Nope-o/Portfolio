# Protected Build (Deploy Output)

This project now supports a deploy-only build that keeps source code editable and generates a harder-to-read output.

## Install

```bash
npm install
```

## Build

```bash
npm run build:protect
```

Output is generated in `dist/`.
`dist/` is generated output only. Do not edit it manually.

## What it does

- Copies site content to `dist/`
- Bundles + minifies + obfuscates main portfolio app:
  - `index.html` local scripts -> `dist/js/site.bundle.js`
- Bundles + minifies + obfuscates:
  - `projects/liteedit-app/js/app-core.js` -> `projects/liteedit-app/js/app-core.bundle.js`
  - `projects/sursight-studio-app/js/app.js` -> `projects/sursight-studio-app/js/app.bundle.js`
- Rewrites those HTML files in `dist/` to point to bundled files
- Removes readable source JS files for those bundled app targets in `dist/`
- Minifies all CSS and HTML in `dist/`
- Excludes non-site dev files from `dist/` (workflow files, scripts, package files, etc.)

## Notes

- This is deterrence, not real security. Frontend code can always be inspected by advanced users.
- Keep editing your normal source files. Deploy from `dist/` when you want protected output.

## Netlify (Recommended for this repo)

`netlify.toml` is included and configured to deploy protected output:

- Build command: `npm run build:protect`
- Publish directory: `dist`

If your site is connected to Netlify, redeploy and Netlify will publish only `dist/` (not raw source files).

## GitHub Pages (Automatic Protected Deploy)

This repo includes a workflow at `.github/workflows/deploy-protected-pages.yml` that:

- runs on every push to `main`
- builds the protected `dist/` output
- deploys only `dist/` to GitHub Pages

### One-time GitHub setting

In repository settings:

1. Open `Settings` -> `Pages`
2. Set `Source` to `GitHub Actions`

After that, every push to `main` publishes the protected build automatically.

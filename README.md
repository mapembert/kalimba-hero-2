<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Kalimba Hero 2

A rhythm game where you can play along with your real Kalimba or use on-screen controls!

View your app in AI Studio: https://ai.studio/apps/drive/1g4Y3kG4yifgu-ARhyhRm5bLxfCKPSWHO

Live Demo: https://mapembert.github.io/kalimba-hero-2/

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Changelog

### December 24, 2025 - Production Deployment

**Fixed Critical Rendering Issues:**
- Fixed WebGL framebuffer errors by switching to Canvas renderer
- Resolved zero-height container issue preventing game rendering
- Added proper CSS height chain (html → body → #root → container)
- Implemented dimension checking before Phaser initialization
- Added 100ms delay for container dimension stability

**Deployment Setup:**
- Configured GitHub Actions workflow for automatic builds
- Set up GitHub Pages deployment via gh-pages branch
- Added Vite base path configuration for GitHub Pages
- Generated package-lock.json for CI/CD reproducibility

**Technical Improvements:**
- Enhanced texture creation with error handling and larger dimensions
- Improved Canvas 2D context initialization with proper options
- Added comprehensive logging for debugging
- Disabled camera shake effect to improve stability
- Optimized Phaser configuration for Canvas rendering

**Result:** Game now renders and plays correctly in production! 🎮

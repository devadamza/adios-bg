# Adiós BG

<div align="center">
  <img src="assets/icons/icon-512.svg" alt="Adiós BG Icon" width="120" height="120">
  <h3>Remove image backgrounds directly in your browser, 100% private and offline.</h3>
  <br>
  <a href="https://devadamza.github.io/adios-bg/"><strong>👉 Live Demo 👈</strong></a>
</div>

---

**Adiós BG** is a Privacy-First Progressive Web App (PWA) built with Vanilla JS and Web Components that allows you to remove the background of your images using AI, **without sending your photos to any server**. All heavy lifting and processing occurs completely locally on your device.

## ✨ Key Features

- **100% Client-Side**: Total respect for your privacy. Your images never leave your browser.
- **Local AI Engine**: Seamless integration of the `briaai/RMBG-1.4` model (quantized version, ~44MB) via [Transformers.js](https://huggingface.co/docs/transformers.js/index), powered by WebGPU and WebAssembly hardware acceleration.
- **Offline By Default**: Operates purely as a PWA. After the initial load, models are cached via a Service Worker, and the app functions completely offline.
- **Multi-threaded (Web Workers)**: The main UI never freezes. Computer Vision and Machine Learning flows run fully optimized in separate threads utilizing `OffscreenCanvas`.
- **Premium Design**: Modern Dark Mode Glassmorphism UI. Zero heavy CSS frameworks like Tailwind or Bootstrap.
- **Vanilla Components**: Modular architecture using native Web Components (`<ar-dropzone>`, `<ar-editor>`, `<ar-progress>`) without the bloat of React or Vue. 
- **i18n Support**: Dynamically switch between English and Spanish.

## 🛠️ Tech Stack

- **Frontend Core**: HTML5, Vanilla JavaScript, CSS3
- **Architecture**: Web Components (Custom Elements, Shadow DOM), Web Workers, Service Workers
- **Machine Learning**: `ONNX Runtime Web`, `@huggingface/transformers`
- **Algorithms & CV**: Custom Alpha Matting and Edge Refinement pipelines written in pure JavaScript for ultra-clean halos.
- **UI/UX**: Native CSS Custom Properties (Design Tokens), lightweight micro-animations.

## 🚀 Local Deployment

To run the application locally, simply serve the root directory using any static HTTP server (since no backend is needed). For example:

1. Clone this repository.
2. If you have Node.js installed, run:
```bash
npx serve .
```
3. Or using Python:
```bash
python3 -m http.server 3000
```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 License & Usage Notes

- The codebase covering the User Interface and the logic of this repository is provided under the **MIT License**.
- **Important**: This app uses the `briaai/RMBG-1.4` model by default. Please review the specific [BRIA AI commercial license](https://huggingface.co/briaai/RMBG-1.4) before deploying this codebase for commercial or massive for-profit purposes, as the model itself restricts unbound commercialization without permission.

/* ==========================================================================
   Adiós BG — <ar-editor>
   Before/after comparison canvas with checkerboard transparency
   ========================================================================== */

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: none;
    width: 100%;
    max-width: 680px;
  }

  :host([active]) {
    display: block;
    animation: fadeInScale 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .editor {
    position: relative;
    border: 1px solid hsla(255, 30%, 40%, 0.2);
    border-radius: 1.25rem;
    background: hsla(255, 20%, 15%, 0.5);
    backdrop-filter: blur(16px);
    overflow: hidden;
  }

  .canvas-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: auto;
    overflow: hidden;
    cursor: crosshair;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    max-height: 500px;
    /* Checkerboard pattern for transparency */
    background-image:
      linear-gradient(45deg, hsl(255, 15%, 12%) 25%, transparent 25%),
      linear-gradient(-45deg, hsl(255, 15%, 12%) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, hsl(255, 15%, 12%) 75%),
      linear-gradient(-45deg, transparent 75%, hsl(255, 15%, 12%) 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0;
    background-color: hsl(255, 15%, 9%);
  }

  .canvas-wrapper canvas {
    max-width: 100%;
    max-height: 500px;
    object-fit: contain;
  }

  /* Slider comparison */
  .compare-slider {
    position: absolute;
    inset: 0;
    cursor: col-resize;
    display: none;
  }

  :host([compare]) .compare-slider { display: block; }

  .compare-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: white;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    box-shadow: 0 0 8px rgba(0,0,0,0.5);
    z-index: 2;
  }

  .compare-handle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 12px rgba(0,0,0,0.4);
    z-index: 3;
    cursor: col-resize;
    pointer-events: auto;
  }

  .compare-handle svg {
    width: 20px;
    height: 20px;
    fill: hsl(255, 20%, 15%);
  }

  .compare-label {
    position: absolute;
    top: 0.75rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    pointer-events: none;
    z-index: 2;
    backdrop-filter: blur(8px);
  }

  .compare-label--before {
    left: 0.75rem;
    background: hsla(0, 0%, 0%, 0.6);
    color: hsl(0, 0%, 80%);
  }

  .compare-label--after {
    right: 0.75rem;
    background: hsla(265, 85%, 65%, 0.3);
    color: hsl(265, 85%, 80%);
  }

  /* Controls bar */
  .editor-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-top: 1px solid hsla(255, 30%, 40%, 0.15);
    background: hsla(255, 20%, 12%, 0.5);
  }

  .view-btn {
    padding: 0.375rem 0.875rem;
    border: 1px solid hsla(255, 30%, 40%, 0.2);
    border-radius: 9999px;
    background: transparent;
    color: hsl(255, 10%, 55%);
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .view-btn:hover {
    border-color: hsla(265, 85%, 65%, 0.4);
    color: hsl(0, 0%, 90%);
  }

  .view-btn.active {
    background: hsla(265, 85%, 65%, 0.15);
    border-color: hsl(265, 85%, 65%);
    color: hsl(265, 85%, 80%);
  }

  /* Zoom info */
  .zoom-label {
    font-size: 0.6875rem;
    color: hsl(255, 10%, 45%);
    margin-left: auto;
    font-variant-numeric: tabular-nums;
  }

  @keyframes fadeInScale {
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1); }
  }

  @media (max-width: 480px) {
    .canvas-wrapper {
      min-height: 200px;
      max-height: 350px;
    }
  }
</style>

<div class="editor">
  <div class="canvas-wrapper" id="canvasWrapper">
    <canvas id="canvasResult"></canvas>

    <div class="compare-slider" id="compareSlider">
      <canvas id="canvasOriginal" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;clip-path:inset(0 50% 0 0);"></canvas>
      <div class="compare-line" id="compareLine"></div>
      <div class="compare-handle" id="compareHandle">
        <svg viewBox="0 0 24 24"><path d="M8 5l-5 7 5 7M16 5l5 7-5 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <span class="compare-label compare-label--before">Original</span>
      <span class="compare-label compare-label--after">Resultado</span>
    </div>
  </div>

  <div class="editor-controls">
    <button class="view-btn active" id="btnResult" type="button">Resultado</button>
    <button class="view-btn" id="btnOriginal" type="button">Original</button>
    <button class="view-btn" id="btnCompare" type="button">Comparar</button>
    <span class="zoom-label" id="zoomLabel">100%</span>
  </div>
</div>
`;

export class ArEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._canvasResult = this.shadowRoot.getElementById('canvasResult');
    this._canvasOriginal = this.shadowRoot.getElementById('canvasOriginal');
    this._wrapper = this.shadowRoot.getElementById('canvasWrapper');
    this._compareSlider = this.shadowRoot.getElementById('compareSlider');
    this._compareLine = this.shadowRoot.getElementById('compareLine');
    this._compareHandle = this.shadowRoot.getElementById('compareHandle');
    this._zoomLabel = this.shadowRoot.getElementById('zoomLabel');

    this._btnResult = this.shadowRoot.getElementById('btnResult');
    this._btnOriginal = this.shadowRoot.getElementById('btnOriginal');
    this._btnCompare = this.shadowRoot.getElementById('btnCompare');

    this._zoom = 1;
    this._isDraggingSlider = false;
    this._currentView = 'result';
    this._originalImg = null;
    this._resultImg = null;
  }

  connectedCallback() {
    this._btnResult.addEventListener('click', () => this._setView('result'));
    this._btnOriginal.addEventListener('click', () => this._setView('original'));
    this._btnCompare.addEventListener('click', () => this._setView('compare'));

    // Compare slider drag
    this._compareHandle.addEventListener('mousedown', (e) => this._startSliderDrag(e));
    this._compareSlider.addEventListener('mousedown', (e) => this._startSliderDrag(e));
    document.addEventListener('mousemove', (e) => this._moveSlider(e));
    document.addEventListener('mouseup', () => this._isDraggingSlider = false);
    
    // Touch support
    this._compareHandle.addEventListener('touchstart', (e) => this._startSliderDrag(e.touches[0]), { passive: true });
    document.addEventListener('touchmove', (e) => this._moveSlider(e.touches[0]), { passive: true });
    document.addEventListener('touchend', () => this._isDraggingSlider = false);

    // Zoom
    this._wrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this._zoom = Math.min(5, Math.max(0.25, this._zoom * delta));
      this._canvasResult.style.transform = `scale(${this._zoom})`;
      this._zoomLabel.textContent = `${Math.round(this._zoom * 100)}%`;
    }, { passive: false });
  }

  /**
   * Load the original image
   * @param {string} src - Data URL or blob URL
   */
  async setOriginal(src) {
    this._originalImg = new Image();
    this._originalImg.src = src;
    await this._originalImg.decode();
  }

  /**
   * Display the result image
   * @param {string} src - Data URL or blob URL of the processed image
   */
  async setResult(src) {
    this.setAttribute('active', '');
    this._resultImg = new Image();
    this._resultImg.src = src;
    await this._resultImg.decode();

    // Draw result on main canvas
    const ctx = this._canvasResult.getContext('2d');
    this._canvasResult.width = this._resultImg.naturalWidth;
    this._canvasResult.height = this._resultImg.naturalHeight;
    ctx.clearRect(0, 0, this._canvasResult.width, this._canvasResult.height);
    ctx.drawImage(this._resultImg, 0, 0);

    // Draw original on compare canvas
    if (this._originalImg) {
      this._canvasOriginal.width = this._resultImg.naturalWidth;
      this._canvasOriginal.height = this._resultImg.naturalHeight;
      const ctxOrig = this._canvasOriginal.getContext('2d');
      ctxOrig.drawImage(this._originalImg, 0, 0, this._canvasOriginal.width, this._canvasOriginal.height);
    }

    this._setView('result');
  }

  _setView(view) {
    this._currentView = view;
    
    // Update buttons
    [this._btnResult, this._btnOriginal, this._btnCompare].forEach(b => b.classList.remove('active'));
    
    if (view === 'result') {
      this._btnResult.classList.add('active');
      this.removeAttribute('compare');
      this._drawResult();
    } else if (view === 'original') {
      this._btnOriginal.classList.add('active');
      this.removeAttribute('compare');
      this._drawOriginal();
    } else {
      this._btnCompare.classList.add('active');
      this.setAttribute('compare', '');
      this._drawResult();
    }
  }

  _drawResult() {
    if (!this._resultImg) return;
    const ctx = this._canvasResult.getContext('2d');
    ctx.clearRect(0, 0, this._canvasResult.width, this._canvasResult.height);
    ctx.drawImage(this._resultImg, 0, 0);
  }

  _drawOriginal() {
    if (!this._originalImg) return;
    const ctx = this._canvasResult.getContext('2d');
    this._canvasResult.width = this._originalImg.naturalWidth;
    this._canvasResult.height = this._originalImg.naturalHeight;
    ctx.clearRect(0, 0, this._canvasResult.width, this._canvasResult.height);
    ctx.drawImage(this._originalImg, 0, 0);
  }

  _startSliderDrag(e) {
    this._isDraggingSlider = true;
    this._moveSlider(e);
  }

  _moveSlider(e) {
    if (!this._isDraggingSlider) return;
    const rect = this._wrapper.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    x = Math.max(0, Math.min(1, x));
    
    const pct = x * 100;
    this._compareLine.style.left = `${pct}%`;
    this._compareHandle.style.left = `${pct}%`;
    this._canvasOriginal.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
  }

  /** Get result canvas for download */
  getResultCanvas() {
    return this._canvasResult;
  }

  reset() {
    this.removeAttribute('active');
    this.removeAttribute('compare');
    this._zoom = 1;
    this._canvasResult.style.transform = '';
    this._zoomLabel.textContent = '100%';
    this._originalImg = null;
    this._resultImg = null;
  }
}

customElements.define('ar-editor', ArEditor);

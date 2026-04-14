/* ==========================================================================
   Adiós BG — <ar-toolbar>
   Download and action buttons
   ========================================================================== */

import { t } from '../i18n.js';
import { store } from '../state.js';

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
    animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border: 1px solid hsla(255, 30%, 40%, 0.2);
    border-radius: 1.25rem;
    background: hsla(255, 20%, 15%, 0.5);
    backdrop-filter: blur(16px);
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    border: none;
    border-radius: 0.75rem;
    font-family: 'Inter', sans-serif;
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
    white-space: nowrap;
  }

  .btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(rgba(255,255,255,0.1), transparent);
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .btn:hover::before { opacity: 1; }
  .btn:active { transform: scale(0.97); }

  .btn svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    flex-shrink: 0;
  }

  .btn--primary {
    background: linear-gradient(135deg, hsl(265, 85%, 65%), hsl(185, 80%, 55%));
    color: white;
    box-shadow: 0 4px 16px hsla(265, 85%, 65%, 0.3);
  }

  .btn--primary:hover {
    box-shadow: 0 6px 24px hsla(265, 85%, 65%, 0.4);
    transform: translateY(-1px);
  }

  .btn--secondary {
    background: hsla(255, 20%, 15%, 0.6);
    color: hsl(0, 0%, 90%);
    border: 1px solid hsla(255, 30%, 40%, 0.3);
    backdrop-filter: blur(8px);
  }

  .btn--secondary:hover {
    border-color: hsl(265, 85%, 65%);
    background: hsla(265, 85%, 65%, 0.1);
  }

  .btn--ghost {
    background: transparent;
    color: hsl(255, 10%, 55%);
  }

  .btn--ghost:hover {
    background: hsla(265, 85%, 65%, 0.1);
    color: hsl(265, 85%, 75%);
  }

  .separator {
    width: 1px;
    height: 24px;
    background: hsla(255, 30%, 40%, 0.2);
  }

  /* Color picker for custom bg */
  .color-picker-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .color-swatch {
    width: 24px;
    height: 24px;
    border-radius: 0.375rem;
    border: 2px solid hsla(255, 30%, 40%, 0.3);
    cursor: pointer;
    transition: border-color 0.2s ease;
  }

  .color-swatch:hover {
    border-color: hsl(265, 85%, 65%);
  }

  input[type="color"] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  /* Stats */
  .stats {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    color: hsl(255, 10%, 50%);
    margin-top: 0.5rem;
    justify-content: center;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .stat__value {
    color: hsl(0, 0%, 80%);
    font-weight: 500;
  }

  /* Success animation */
  .btn--success {
    background: hsl(145, 65%, 42%) !important;
    color: white !important;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 480px) {
    .toolbar { gap: 0.5rem; padding: 0.75rem 1rem; }
    .btn { padding: 0.5rem 0.875rem; font-size: 0.75rem; }
    .separator { display: none; }
  }
</style>

<div class="toolbar">
  <button class="btn btn--primary" id="btnDownloadPng" type="button">
    <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    <span id="tBtnPng">Descargar PNG</span>
  </button>

  <button class="btn btn--secondary" id="btnDownloadBg" type="button">
    <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    <span id="tBtnBg">Con fondo</span>
    <div class="color-picker-wrapper">
      <div class="color-swatch" id="colorSwatch" style="background: #ffffff;"></div>
      <input type="color" id="colorPicker" value="#ffffff" />
    </div>
  </button>

  <div class="separator"></div>

  <button class="btn btn--secondary" id="btnCopy" type="button">
    <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
    <span id="tBtnCopy">Copiar</span>
  </button>

  <button class="btn btn--ghost" id="btnNew" type="button">
    <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    <span id="tBtnNew">Nueva</span>
  </button>
</div>

<div class="stats" id="stats">
  <span class="stat" id="tStatTime">Procesado en <span class="stat__value" id="statTime">—</span></span>
  <span class="stat" id="tStatType">Tipo: <span class="stat__value" id="statType">—</span></span>
</div>
`;

export class ArToolbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._btnDownloadPng = this.shadowRoot.getElementById('btnDownloadPng');
    this._btnDownloadBg = this.shadowRoot.getElementById('btnDownloadBg');
    this._btnCopy = this.shadowRoot.getElementById('btnCopy');
    this._btnNew = this.shadowRoot.getElementById('btnNew');
    this._colorPicker = this.shadowRoot.getElementById('colorPicker');
    this._colorSwatch = this.shadowRoot.getElementById('colorSwatch');
    this._statTime = this.shadowRoot.getElementById('statTime');
    this._statType = this.shadowRoot.getElementById('statType');

    this._resultBlob = null;
    this._resultCanvas = null;

    this._updateTexts = this._updateTexts.bind(this);
  }

  _updateTexts() {
    this.shadowRoot.getElementById('tBtnPng').textContent = t('toolbar.downloadPng');
    this.shadowRoot.getElementById('tBtnBg').textContent = t('toolbar.downloadBg');
    this.shadowRoot.getElementById('tBtnCopy').textContent = t('toolbar.copy');
    this.shadowRoot.getElementById('tBtnNew').textContent = t('toolbar.new');
    
    // We update stats only if they are active, because they contain inner HTML wrappers
    if (this.hasAttribute('active')) {
      const pTime = this._statTime.textContent.replace('s', ''); 
      this.shadowRoot.getElementById('tStatTime').innerHTML = t('toolbar.statTime', pTime);
      const pType = this._statType.textContent;
      this.shadowRoot.getElementById('tStatType').innerHTML = t('toolbar.statType', pType);
    }
  }

  connectedCallback() {
    this._updateTexts();
    store.addEventListener('change', this._updateTexts);

    // Download PNG (transparent)
    this._btnDownloadPng.addEventListener('click', () => {
      this._downloadCanvas(null);
    });

    // Download with background color
    this._btnDownloadBg.addEventListener('click', () => {
      this._downloadCanvas(this._colorPicker.value);
    });

    // Color picker
    this._colorSwatch.addEventListener('click', () => this._colorPicker.click());
    this._colorPicker.addEventListener('input', (e) => {
      this._colorSwatch.style.background = e.target.value;
    });

    // Copy
    this._btnCopy.addEventListener('click', async () => {
      await this._copyToClipboard();
    });

    // New image
    this._btnNew.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('new-image', {
        bubbles: true, composed: true
      }));
    });
  }

  disconnectedCallback() {
    store.removeEventListener('change', this._updateTexts);
  }

  /**
   * Set the result data for download
   * @param {HTMLCanvasElement} canvas 
   * @param {object} meta - { processingTime, imageType }
   */
  setResult(canvas, meta = {}) {
    this._resultCanvas = canvas;
    this.setAttribute('active', '');

    if (meta.processingTime) {
      const seconds = (meta.processingTime / 1000).toFixed(1);
      this._statTime.textContent = `${seconds}s`; // For tracking
      this.shadowRoot.getElementById('tStatTime').innerHTML = t('toolbar.statTime', seconds);
    }
    if (meta.imageType) {
      this._statType.textContent = meta.imageType; // For tracking
      this.shadowRoot.getElementById('tStatType').innerHTML = t('toolbar.statType', meta.imageType);
    }
  }

  _downloadCanvas(bgColor) {
    if (!this._resultCanvas) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = this._resultCanvas.width;
    canvas.height = this._resultCanvas.height;

    if (bgColor) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(this._resultCanvas, 0, 0);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adiosbg-result${bgColor ? '' : '-transparent'}.png`;
      a.click();
      URL.revokeObjectURL(url);

      // Flash success
      this._flashButton(this._btnDownloadPng);
    }, 'image/png');
  }

  async _copyToClipboard() {
    if (!this._resultCanvas) return;

    try {
      const blob = await new Promise(resolve => 
        this._resultCanvas.toBlob(resolve, 'image/png')
      );
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      this._flashButton(this.shadowRoot.getElementById('tBtnCopy'), t('toast.copied'));
    } catch (err) {
      console.warn('Clipboard write failed:', err);
      // Fallback: fire event
      this.dispatchEvent(new CustomEvent('toast', {
        bubbles: true, composed: true,
        detail: { type: 'error', message: t('toast.errCopy') }
      }));
    }
  }

  _flashButton(btn, text) {
    const orig = btn.innerHTML;
    btn.classList.add('btn--success');
    if (text) btn.textContent = text;
    setTimeout(() => {
      btn.classList.remove('btn--success');
      if (text) btn.innerHTML = orig;
    }, 1500);
  }

  reset() {
    this.removeAttribute('active');
    this._resultCanvas = null;
    this._statTime.textContent = '—';
    this._statType.textContent = '—';
  }
}

customElements.define('ar-toolbar', ArToolbar);

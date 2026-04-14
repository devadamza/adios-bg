/* ==========================================================================
   Adiós BG — <ar-dropzone>
   Drag & drop + file input component
   ========================================================================== */

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'];
const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    display: block;
    width: 100%;
    max-width: 680px;
  }

  .dropzone {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    padding: 3.5rem 2rem;
    border: 2px dashed hsla(255, 30%, 40%, 0.3);
    border-radius: 1.5rem;
    background: hsla(255, 20%, 15%, 0.4);
    backdrop-filter: blur(16px);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
  }

  .dropzone::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, hsla(265, 85%, 65%, 0.05), hsla(185, 80%, 55%, 0.05));
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .dropzone:hover::before,
  .dropzone.dragover::before {
    opacity: 1;
  }

  .dropzone:hover {
    border-color: hsla(265, 85%, 65%, 0.5);
    box-shadow: 0 0 40px hsla(265, 85%, 65%, 0.1);
  }

  .dropzone.dragover {
    border-color: hsl(265, 85%, 65%);
    background: hsla(265, 85%, 65%, 0.08);
    box-shadow: 0 0 60px hsla(265, 85%, 65%, 0.2);
    transform: scale(1.02);
  }

  .dropzone.dragover .icon {
    transform: scale(1.2);
  }

  .icon {
    width: 72px;
    height: 72px;
    border-radius: 1rem;
    background: linear-gradient(135deg, hsl(265, 85%, 65%), hsl(185, 80%, 55%));
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 8px 32px hsla(265, 85%, 65%, 0.3);
  }

  .icon svg {
    width: 36px;
    height: 36px;
    fill: white;
  }

  .text {
    text-align: center;
  }

  .text__title {
    font-size: 1.25rem;
    font-weight: 600;
    color: hsl(0, 0%, 95%);
    margin-bottom: 0.5rem;
  }

  .text__subtitle {
    font-size: 0.875rem;
    color: hsl(255, 10%, 65%);
    line-height: 1.6;
  }

  .text__formats {
    font-size: 0.75rem;
    color: hsl(255, 10%, 45%);
    margin-top: 0.5rem;
  }

  .btn-browse {
    padding: 0.625rem 1.5rem;
    border: none;
    border-radius: 9999px;
    background: linear-gradient(135deg, hsl(265, 85%, 65%), hsl(185, 80%, 55%));
    color: white;
    font-family: 'Inter', sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 16px hsla(265, 85%, 65%, 0.3);
    position: relative;
    overflow: hidden;
  }

  .btn-browse::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(rgba(255,255,255,0.15), transparent);
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .btn-browse:hover::before {
    opacity: 1;
  }

  .btn-browse:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px hsla(265, 85%, 65%, 0.4);
  }

  .btn-browse:active {
    transform: scale(0.97);
  }

  input[type="file"] {
    display: none;
  }

  /* ── Preview state ─── */
  .preview {
    display: none;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    border: 1px solid hsla(255, 30%, 40%, 0.2);
    border-radius: 1.5rem;
    background: hsla(255, 20%, 15%, 0.4);
    backdrop-filter: blur(16px);
    animation: fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  :host([has-image]) .dropzone { display: none; }
  :host([has-image]) .preview  { display: flex; }

  .preview__img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 0.75rem;
    box-shadow: 0 8px 32px hsla(0, 0%, 0%, 0.4);
    object-fit: contain;
  }

  .preview__info {
    text-align: center;
  }

  .preview__name {
    font-size: 0.875rem;
    font-weight: 500;
    color: hsl(0, 0%, 95%);
    margin-bottom: 0.25rem;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .preview__meta {
    font-size: 0.75rem;
    color: hsl(255, 10%, 55%);
  }

  .preview__actions {
    display: flex;
    gap: 0.75rem;
  }

  .btn-change {
    padding: 0.5rem 1rem;
    border: 1px solid hsla(255, 30%, 40%, 0.3);
    border-radius: 0.75rem;
    background: hsla(255, 20%, 15%, 0.6);
    color: hsl(255, 10%, 65%);
    font-family: 'Inter', sans-serif;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(8px);
  }

  .btn-change:hover {
    border-color: hsl(265, 85%, 65%);
    color: hsl(0, 0%, 95%);
    background: hsla(265, 85%, 65%, 0.1);
  }

  @keyframes fadeInScale {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* Paste hint */
  .paste-hint {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: hsl(255, 10%, 45%);
    margin-top: 0.25rem;
  }

  .paste-hint kbd {
    padding: 0.125rem 0.375rem;
    background: hsla(255, 20%, 20%, 0.8);
    border: 1px solid hsla(255, 30%, 40%, 0.3);
    border-radius: 0.25rem;
    font-family: 'Inter', sans-serif;
    font-size: 0.6875rem;
    color: hsl(255, 10%, 60%);
  }
</style>

<div class="dropzone" id="dropzone" tabindex="0" role="button" aria-label="Suelta una imagen aquí o haz clic para seleccionar">
  <div class="icon">
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="12" y1="3" x2="12" y2="15" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </div>
  <div class="text">
    <div class="text__title">Suelta tu imagen aquí</div>
    <div class="text__subtitle">o haz clic para seleccionar un archivo</div>
    <div class="text__formats">PNG, JPG, WebP, SVG, BMP · Máx ${MAX_SIZE_MB}MB</div>
  </div>
  <button class="btn-browse" id="btnBrowse" type="button">Seleccionar archivo</button>
  <div class="paste-hint">
    <span>También puedes pegar con</span>
    <kbd>⌘V</kbd>
  </div>
</div>

<div class="preview" id="preview">
  <img class="preview__img" id="previewImg" alt="Vista previa"/>
  <div class="preview__info">
    <div class="preview__name" id="previewName"></div>
    <div class="preview__meta" id="previewMeta"></div>
  </div>
  <div class="preview__actions">
    <button class="btn-change" id="btnChange" type="button">Cambiar imagen</button>
  </div>
</div>

<input type="file" id="fileInput" accept="${ACCEPTED_TYPES.join(',')}" />
`;

export class ArDropzone extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    
    this._dropzone = this.shadowRoot.getElementById('dropzone');
    this._fileInput = this.shadowRoot.getElementById('fileInput');
    this._btnBrowse = this.shadowRoot.getElementById('btnBrowse');
    this._btnChange = this.shadowRoot.getElementById('btnChange');
    this._previewImg = this.shadowRoot.getElementById('previewImg');
    this._previewName = this.shadowRoot.getElementById('previewName');
    this._previewMeta = this.shadowRoot.getElementById('previewMeta');
  }

  connectedCallback() {
    // Drag events
    this._dropzone.addEventListener('dragenter', this._onDragEnter.bind(this));
    this._dropzone.addEventListener('dragover', this._onDragOver.bind(this));
    this._dropzone.addEventListener('dragleave', this._onDragLeave.bind(this));
    this._dropzone.addEventListener('drop', this._onDrop.bind(this));
    
    // Click
    this._dropzone.addEventListener('click', () => this._fileInput.click());
    this._btnBrowse.addEventListener('click', (e) => {
      e.stopPropagation();
      this._fileInput.click();
    });
    this._btnChange.addEventListener('click', () => this._fileInput.click());
    
    // File input
    this._fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) this._handleFile(e.target.files[0]);
    });
    
    // Paste
    document.addEventListener('paste', this._onPaste.bind(this));
    
    // Keyboard
    this._dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._fileInput.click();
      }
    });
  }

  disconnectedCallback() {
    document.removeEventListener('paste', this._onPaste.bind(this));
  }

  _onDragEnter(e) {
    e.preventDefault();
    this._dropzone.classList.add('dragover');
  }

  _onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  _onDragLeave(e) {
    e.preventDefault();
    if (!this._dropzone.contains(e.relatedTarget)) {
      this._dropzone.classList.remove('dragover');
    }
  }

  _onDrop(e) {
    e.preventDefault();
    this._dropzone.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file) this._handleFile(file);
  }

  _onPaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) this._handleFile(file);
        break;
      }
    }
  }

  _handleFile(file) {
    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      this.dispatchEvent(new CustomEvent('dropzone-error', {
        bubbles: true, composed: true,
        detail: { message: `Formato no soportado: ${file.type || 'desconocido'}` }
      }));
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      this.dispatchEvent(new CustomEvent('dropzone-error', {
        bubbles: true, composed: true,
        detail: { message: `El archivo excede el límite de ${MAX_SIZE_MB}MB` }
      }));
      return;
    }

    // Show preview
    const url = URL.createObjectURL(file);
    this._previewImg.src = url;
    this._previewName.textContent = file.name;
    this._previewMeta.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB · ${file.type.split('/')[1].toUpperCase()}`;
    this.setAttribute('has-image', '');

    // Emit event
    this.dispatchEvent(new CustomEvent('image-selected', {
      bubbles: true, composed: true,
      detail: { file, dataUrl: url }
    }));
  }

  /** Public method to reset dropzone */
  reset() {
    this.removeAttribute('has-image');
    this._previewImg.src = '';
    this._fileInput.value = '';
  }
}

customElements.define('ar-dropzone', ArDropzone);

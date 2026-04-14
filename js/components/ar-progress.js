/* ==========================================================================
   Adiós BG — <ar-progress>
   Multi-stage pipeline progress indicator
   ========================================================================== */

const STAGES = [
  { id: 'classify',   label: 'Clasificar',    icon: '🔍' },
  { id: 'watermark',  label: 'Watermarks',    icon: '🔬' },
  { id: 'segment',    label: 'Segmentar',     icon: '🧠' },
  { id: 'refine',     label: 'Refinar',       icon: '✨' },
];

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
    animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .progress-card {
    padding: 1.5rem 2rem;
    border: 1px solid hsla(255, 30%, 40%, 0.2);
    border-radius: 1.25rem;
    background: hsla(255, 20%, 15%, 0.5);
    backdrop-filter: blur(16px);
  }

  .progress-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }

  .progress-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: hsl(0, 0%, 95%);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid hsla(265, 85%, 65%, 0.2);
    border-top-color: hsl(265, 85%, 65%);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .progress-time {
    font-size: 0.8125rem;
    color: hsl(255, 10%, 55%);
    font-variant-numeric: tabular-nums;
  }

  .stages {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 0.25rem;
    border-radius: 0.75rem;
    background: hsla(255, 20%, 12%, 0.5);
    border: 1px solid transparent;
    transition: all 0.3s ease;
    position: relative;
  }

  .stage.active {
    border-color: hsla(265, 85%, 65%, 0.4);
    background: hsla(265, 85%, 65%, 0.08);
    box-shadow: 0 0 20px hsla(265, 85%, 65%, 0.1);
  }

  .stage.done {
    border-color: hsla(145, 65%, 50%, 0.3);
    background: hsla(145, 65%, 50%, 0.05);
  }

  .stage__icon {
    font-size: 1.25rem;
    line-height: 1;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .stage.active .stage__icon {
    transform: scale(1.2);
    animation: pulse 1.5s ease-in-out infinite;
  }

  .stage.done .stage__icon {
    /* Replace with checkmark */
  }

  .stage__label {
    font-size: 0.6875rem;
    font-weight: 500;
    color: hsl(255, 10%, 45%);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: color 0.3s ease;
  }

  .stage.active .stage__label {
    color: hsl(265, 85%, 75%);
  }

  .stage.done .stage__label {
    color: hsl(145, 65%, 55%);
  }

  .stage__check {
    display: none;
    font-size: 1.25rem;
  }

  .stage.done .stage__icon { display: none; }
  .stage.done .stage__check { display: block; }

  /* Progress bar */
  .progress-bar-track {
    width: 100%;
    height: 4px;
    background: hsla(255, 20%, 20%, 0.8);
    border-radius: 9999px;
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, hsl(265, 85%, 65%), hsl(185, 80%, 55%));
    border-radius: 9999px;
    transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 0 10px hsla(265, 85%, 65%, 0.5);
  }

  /* Done state */
  :host([done]) .spinner { display: none; }
  :host([done]) .progress-title::after {
    content: '✓';
    color: hsl(145, 65%, 55%);
    margin-left: 0.25rem;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.5; }
  }

  @media (max-width: 480px) {
    .stage__label { font-size: 0.625rem; }
    .stage__icon  { font-size: 1rem; }
    .stages { gap: 0.25rem; }
  }
</style>

<div class="progress-card">
  <div class="progress-header">
    <div class="progress-title">
      <div class="spinner"></div>
      <span id="statusText">Procesando...</span>
    </div>
    <div class="progress-time" id="timeDisplay">0.0s</div>
  </div>

  <div class="stages" id="stages">
    ${STAGES.map((s, i) => `
      <div class="stage" data-index="${i}" id="stage-${i}">
        <span class="stage__icon">${s.icon}</span>
        <span class="stage__check">✅</span>
        <span class="stage__label">${s.label}</span>
      </div>
    `).join('')}
  </div>

  <div class="progress-bar-track">
    <div class="progress-bar-fill" id="progressFill"></div>
  </div>
</div>
`;

export class ArProgress extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    
    this._fill = this.shadowRoot.getElementById('progressFill');
    this._statusText = this.shadowRoot.getElementById('statusText');
    this._timeDisplay = this.shadowRoot.getElementById('timeDisplay');
    this._stageEls = this.shadowRoot.querySelectorAll('.stage');
    
    this._startTime = null;
    this._rafId = null;
  }

  connectedCallback() {}

  disconnectedCallback() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
  }

  /**
   * Show progress and start timer
   */
  start() {
    this.setAttribute('active', '');
    this.removeAttribute('done');
    this._startTime = performance.now();
    this._tickTimer();
  }

  /**
   * Update the current stage (0-3) and progress (0-100)
   */
  update(stageIndex, progress, statusText) {
    // Update stages
    this._stageEls.forEach((el, i) => {
      el.classList.remove('active', 'done');
      if (i < stageIndex) el.classList.add('done');
      else if (i === stageIndex) el.classList.add('active');
    });

    // Update progress bar
    this._fill.style.width = `${progress}%`;

    // Update status
    if (statusText) {
      this._statusText.textContent = statusText;
    }
  }

  /**
   * Mark as complete
   */
  complete(totalTime) {
    this.setAttribute('done', '');
    this._fill.style.width = '100%';
    this._statusText.textContent = '¡Completado!';
    
    this._stageEls.forEach(el => {
      el.classList.remove('active');
      el.classList.add('done');
    });

    if (totalTime) {
      this._timeDisplay.textContent = `${(totalTime / 1000).toFixed(1)}s`;
    }

    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /**
   * Reset to initial state
   */
  reset() {
    this.removeAttribute('active');
    this.removeAttribute('done');
    this._fill.style.width = '0%';
    this._statusText.textContent = 'Procesando...';
    this._timeDisplay.textContent = '0.0s';
    this._stageEls.forEach(el => el.classList.remove('active', 'done'));
    
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _tickTimer() {
    if (!this._startTime) return;
    const elapsed = (performance.now() - this._startTime) / 1000;
    this._timeDisplay.textContent = `${elapsed.toFixed(1)}s`;
    this._rafId = requestAnimationFrame(() => this._tickTimer());
  }
}

customElements.define('ar-progress', ArProgress);

/* ==========================================================================
   Adiós BG — <ar-toast>
   Stackable notification toasts
   ========================================================================== */

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 50;
    display: flex;
    flex-direction: column-reverse;
    gap: 0.5rem;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    background: hsla(255, 20%, 15%, 0.9);
    backdrop-filter: blur(16px);
    border: 1px solid hsla(255, 30%, 40%, 0.2);
    box-shadow: 0 8px 32px hsla(0, 0%, 0%, 0.4);
    pointer-events: auto;
    animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
    max-width: 380px;
    min-width: 260px;
  }

  .toast.dismissing {
    animation: slideOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .toast__icon {
    font-size: 1.125rem;
    flex-shrink: 0;
    line-height: 1;
  }

  .toast__message {
    flex: 1;
    font-size: 0.8125rem;
    font-weight: 500;
    color: hsl(0, 0%, 92%);
    line-height: 1.4;
  }

  .toast__close {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: hsl(255, 10%, 50%);
    cursor: pointer;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .toast__close:hover {
    background: hsla(255, 20%, 25%, 0.8);
    color: hsl(0, 0%, 90%);
  }

  .toast__close svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }

  /* Types */
  .toast--success { border-color: hsla(145, 65%, 50%, 0.3); }
  .toast--success .toast__icon { color: hsl(145, 65%, 55%); }

  .toast--error { border-color: hsla(0, 75%, 60%, 0.3); }
  .toast--error .toast__icon { color: hsl(0, 75%, 60%); }

  .toast--info { border-color: hsla(210, 80%, 60%, 0.3); }
  .toast--info .toast__icon { color: hsl(210, 80%, 65%); }

  .toast--warning { border-color: hsla(40, 90%, 55%, 0.3); }
  .toast--warning .toast__icon { color: hsl(40, 90%, 55%); }

  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(30px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  @keyframes slideOutRight {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(30px) scale(0.95); }
  }

  @media (max-width: 480px) {
    :host {
      left: 1rem;
      right: 1rem;
      bottom: 1rem;
    }
    .toast {
      max-width: 100%;
      min-width: 0;
    }
  }
</style>

<div id="container"></div>
`;

const ICONS = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

export class ArToast extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this._container = this.shadowRoot.getElementById('container');
  }

  connectedCallback() {}

  /**
   * Show a toast notification
   * @param {object} options
   * @param {'success'|'error'|'info'|'warning'} options.type
   * @param {string} options.message
   * @param {number} [options.duration=4000] ms before auto-dismiss
   */
  show({ type = 'info', message, duration = 4000 }) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${ICONS[type] || ICONS.info}</span>
      <span class="toast__message">${message}</span>
      <button class="toast__close" type="button">
        <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    this._container.appendChild(toast);

    // Close button
    toast.querySelector('.toast__close').addEventListener('click', () => {
      this._dismiss(toast);
    });

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => this._dismiss(toast), duration);
    }
  }

  _dismiss(toast) {
    if (toast.classList.contains('dismissing')) return;
    toast.classList.add('dismissing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }
}

customElements.define('ar-toast', ArToast);

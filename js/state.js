/* ==========================================================================
   Adiós BG — Reactive State Store
   Lightweight state management using EventTarget
   ========================================================================== */

const AppState = {
  /** @type {'idle'|'loading-model'|'processing'|'done'|'error'} */
  status: 'idle',
  
  /** @type {File|null} */
  originalFile: null,
  
  /** @type {string|null} data URL of the original image */
  originalDataUrl: null,
  
  /** @type {ImageBitmap|null} */
  originalBitmap: null,
  
  /** @type {Blob|null} result PNG blob */
  resultBlob: null,
  
  /** @type {string|null} data URL of the result */
  resultDataUrl: null,
  
  /** @type {string|null} */
  imageType: null, // 'photo' | 'icon' | 'signature'
  
  /** @type {boolean} */
  watermarkDetected: false,
  
  /** @type {number} 0-100 */
  progress: 0,
  
  /** @type {string} */
  currentStage: '',
  
  /** @type {number} index of current pipeline stage 0-3 */
  stageIndex: -1,
  
  /** @type {string|null} */
  errorMessage: null,

  /** @type {boolean} */
  modelLoaded: false,
  
  /** @type {number} ms taken for processing */
  processingTime: 0,
};

class StateManager extends EventTarget {
  constructor() {
    super();
    this._state = { ...AppState };
  }

  get state() {
    return this._state;
  }

  /**
   * Update state and notify listeners
   * @param {Partial<typeof AppState>} updates 
   */
  set(updates) {
    const prev = { ...this._state };
    Object.assign(this._state, updates);
    
    for (const key of Object.keys(updates)) {
      if (prev[key] !== this._state[key]) {
        this.dispatchEvent(new CustomEvent('change', {
          detail: { key, value: this._state[key], prev: prev[key], state: this._state }
        }));
        this.dispatchEvent(new CustomEvent(`change:${key}`, {
          detail: { value: this._state[key], prev: prev[key], state: this._state }
        }));
      }
    }
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch, or '*' for all changes
   * @param {Function} callback 
   * @returns {Function} unsubscribe function
   */
  on(key, callback) {
    const event = key === '*' ? 'change' : `change:${key}`;
    this.addEventListener(event, callback);
    return () => this.removeEventListener(event, callback);
  }

  /**
   * Reset state to initial values
   */
  reset() {
    // Revoke any object URLs to prevent memory leaks
    if (this._state.originalDataUrl && this._state.originalDataUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this._state.originalDataUrl);
    }
    if (this._state.resultDataUrl && this._state.resultDataUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this._state.resultDataUrl);
    }
    if (this._state.originalBitmap) {
      this._state.originalBitmap.close();
    }
    
    this.set({
      status: 'idle',
      originalFile: null,
      originalDataUrl: null,
      originalBitmap: null,
      resultBlob: null,
      resultDataUrl: null,
      imageType: null,
      watermarkDetected: false,
      progress: 0,
      currentStage: '',
      stageIndex: -1,
      errorMessage: null,
      processingTime: 0,
    });
  }
}

// Singleton
export const store = new StateManager();

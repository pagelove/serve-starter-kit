// ABOUTME: Web components for the Pagelove starter kit
// ABOUTME: Provides run-kit for interactive code editing and network-inspector for monitoring traffic

// run-kit component for editable code examples
class RunKit extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._scripts = [];
    this._targetSelector = '';
    this._activeTab = 0;
    this._viewMode = 'html'; // 'html' or 'display'
  }

  connectedCallback() {
    this._targetSelector = this.getAttribute('modifies');
    const scriptElements = this.querySelectorAll('script[type="text/plain"]');
    // Store each script separately, using title attribute if available
    this._scripts = Array.from(scriptElements).map((script, index) => {
      // Remove common leading whitespace from all lines
      const lines = script.textContent.split('\n');
      const nonEmptyLines = lines.filter(line => line.trim().length > 0);
      if (nonEmptyLines.length === 0) {
        return {
          id: index,
          title: script.getAttribute('title') || `Script ${index + 1}`,
          code: '',
          originalCode: ''
        };
      }
      
      // Find the minimum indentation (ignoring empty lines)
      const minIndent = Math.min(...nonEmptyLines.map(line => {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
      }));
      
      // Remove the common indentation from all lines
      const dedentedLines = lines.map(line => {
        if (line.trim().length === 0) return '';
        return line.substring(minIndent);
      });
      
      // Trim leading and trailing empty lines
      while (dedentedLines.length > 0 && dedentedLines[0] === '') {
        dedentedLines.shift();
      }
      while (dedentedLines.length > 0 && dedentedLines[dedentedLines.length - 1] === '') {
        dedentedLines.pop();
      }
      
      const code = dedentedLines.join('\n');
      return {
        id: index,
        title: script.getAttribute('title') || `Script ${index + 1}`,
        code: code,
        originalCode: code
      };
    });
    
    if (this._scripts.length === 0) {
      this._scripts.push({
        id: 0,
        title: 'Script 1',
        code: '',
        originalCode: ''
      });
    }
    
    // No need to hide the target element here - it's handled by CSS
    
    this.render();
    this.setupEventListeners();
  }

  render() {
    const targetElement = document.querySelector(this._targetSelector);
    const targetHTML = targetElement ? targetElement.outerHTML : '<div>Target not found</div>';
    const activeScript = this._scripts[this._activeTab];
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin: 20px 0;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          background: white;
        }
        
        .toolbar {
          background: #f7fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 10px 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .title {
          font-weight: 600;
          color: #2d3748;
          font-size: 14px;
        }
        
        .buttons {
          display: flex;
          gap: 10px;
        }
        
        button {
          background: #667eea;
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        
        button:hover {
          background: #5a67d8;
        }
        
        button:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
        }
        
        .tabs {
          display: flex;
          background: #f7fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .tab {
          padding: 10px 20px;
          cursor: pointer;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 500;
          color: #718096;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        
        .tab:hover {
          color: #4a5568;
        }
        
        .tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
          background: white;
        }
        
        .content {
          display: flex;
          height: 400px;
        }
        
        .editor-panel {
          flex: 2;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #e2e8f0;
          position: relative;
        }
        
        .output-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .panel-header {
          background: #f7fafc;
          padding: 8px 15px;
          font-size: 12px;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .run-fab {
          position: absolute;
          bottom: 20px;
          left: 20px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #667eea;
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.3s;
        }
        
        .run-fab:hover {
          background: #5a67d8;
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
        }
        
        .run-fab:active {
          transform: scale(0.95);
        }
        
        .play-icon {
          width: 0;
          height: 0;
          border-left: 16px solid white;
          border-top: 10px solid transparent;
          border-bottom: 10px solid transparent;
          margin-left: 3px;
        }
        
        .toggle-view {
          background: transparent;
          border: 1px solid #cbd5e0;
          color: #4a5568;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          text-transform: none;
        }
        
        .toggle-view:hover {
          background: #e2e8f0;
        }
        
        .editor {
          flex: 1;
          padding: 15px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.5;
          border: none;
          outline: none;
          resize: none;
          background: #1a202c;
          color: #68d391;
          overflow: auto;
          white-space: pre;
        }
        
        .output {
          flex: 1;
          padding: 15px;
          overflow: auto;
          background: #f7fafc;
        }
        
        .output pre {
          margin: 0;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        
        .display {
          flex: 1;
          padding: 20px;
          overflow: auto;
          background: white;
        }
        
        .display-content {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .panel.hidden {
          display: none;
        }
        
        .error {
          color: #f56565;
          background: #fff5f5;
          padding: 10px;
          border-radius: 4px;
          margin-top: 10px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 12px;
        }
        
        .success {
          color: #48bb78;
          font-size: 12px;
          margin-top: 10px;
        }
      </style>
      
      <div class="toolbar">
        <div class="title">Run Kit - Target: ${this._targetSelector}</div>
        <div class="buttons">
          <button class="save-btn">Save</button>
          <button class="reset-btn">Reset</button>
        </div>
      </div>
      
      ${this._scripts.length > 1 ? `
        <div class="tabs">
          ${this._scripts.map((script, index) => `
            <button class="tab ${index === this._activeTab ? 'active' : ''}" data-tab="${index}">
              ${script.title}
            </button>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="content">
        <div class="editor-panel">
          <div class="panel-header">Code</div>
          <textarea class="editor" spellcheck="false">${activeScript.code}</textarea>
          <button class="run-fab" title="Run code">
            <div class="play-icon"></div>
          </button>
        </div>
        <div class="output-panel">
          <div class="panel-header">
            <span>${this._viewMode === 'html' ? 'HTML Source' : 'Display'}</span>
            <button class="toggle-view">${this._viewMode === 'html' ? 'Show Display' : 'Show HTML'}</button>
          </div>
          ${this._viewMode === 'html' ? `
            <div class="output">
              <pre>${this.escapeHtml(this.prettyPrintHtml(targetHTML))}</pre>
            </div>
          ` : `
            <div class="display">
              <div class="display-content" id="display-${this._activeTab}"></div>
            </div>
          `}
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const runBtn = this.shadowRoot.querySelector('.run-fab');
    const saveBtn = this.shadowRoot.querySelector('.save-btn');
    const resetBtn = this.shadowRoot.querySelector('.reset-btn');
    const editor = this.shadowRoot.querySelector('.editor');
    const toggleView = this.shadowRoot.querySelector('.toggle-view');
    
    if (runBtn) runBtn.addEventListener('click', () => this.runScript());
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveScript());
    if (resetBtn) resetBtn.addEventListener('click', () => this.resetScript());
    
    // Save current script when editing
    if (editor) {
      editor.addEventListener('input', () => {
        this._scripts[this._activeTab].code = editor.value;
      });
      
      // Tab handling in editor
      editor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = editor.selectionStart;
          const end = editor.selectionEnd;
          editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
          editor.selectionStart = editor.selectionEnd = start + 4;
        }
      });
    }
    
    // View toggle
    if (toggleView) {
      toggleView.addEventListener('click', () => {
        this._viewMode = this._viewMode === 'html' ? 'display' : 'html';
        this.render();
        this.setupEventListeners();
        this.updateDisplay();
      });
    }
    
    // Tab switching
    const tabs = this.shadowRoot.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabIndex = parseInt(e.target.dataset.tab);
        this._activeTab = tabIndex;
        this.render();
        this.setupEventListeners();
        this.updateDisplay();
      });
    });
    
    // Initial display update
    this.updateDisplay();
  }

  updateDisplay() {
    const displayContent = this.shadowRoot.querySelector('.display-content');
    if (!displayContent) return;
    
    const targetElement = document.querySelector(this._targetSelector);
    if (targetElement) {
      // Clone the element and remove the display:none style for the display panel
      const clonedElement = targetElement.cloneNode(true);
      clonedElement.style.display = '';
      displayContent.innerHTML = '';
      displayContent.appendChild(clonedElement);
    }
  }

  async runScript() {
    const editor = this.shadowRoot.querySelector('.editor');
    const output = this.shadowRoot.querySelector('.output');
    const code = editor ? editor.value : this._scripts[this._activeTab].code;
    
    try {
      // Clear previous errors
      if (output) {
        const existingError = output.querySelector('.error');
        if (existingError) existingError.remove();
      }
      
      // Check if code already waits for DASAvailable
      const waitForDAS = !code.includes('DASAvailable');
      
      // Create a new script element with the user's code
      const scriptContent = waitForDAS ? `
        (async function() {
          try {
            // If DOM primitives aren't ready, wait for them
            if (!document.querySelector('body').POST) {
              await new Promise(resolve => {
                document.addEventListener('DASAvailable', resolve, { once: true });
              });
            }
            ${code}
            // Update all panels with the new HTML
            setTimeout(() => {
              const targetElement = document.querySelector('${this._targetSelector}');
              if (targetElement) {
                const runKit = document.querySelector('run-kit');
                if (runKit && runKit.shadowRoot) {
                  // Update HTML source panel
                  const outputPanel = runKit.shadowRoot.querySelector('.output pre');
                  if (outputPanel) {
                    // Pretty print first, then set as text content (browser handles escaping)
                    outputPanel.textContent = runKit.prettyPrintHtml(targetElement.outerHTML);
                  }
                  // Update display panel
                  const displayContent = runKit.shadowRoot.querySelector('.display-content');
                  if (displayContent) {
                    const clonedElement = targetElement.cloneNode(true);
                    clonedElement.style.display = '';
                    displayContent.innerHTML = '';
                    displayContent.appendChild(clonedElement);
                  }
                }
              }
            }, 100);
          } catch (error) {
            throw error;
          }
        })();
      ` : `
        (async function() {
          try {
            ${code}
            // Update all panels with the new HTML
            setTimeout(() => {
              const targetElement = document.querySelector('${this._targetSelector}');
              if (targetElement) {
                const runKit = document.querySelector('run-kit');
                if (runKit && runKit.shadowRoot) {
                  // Update HTML source panel
                  const outputPanel = runKit.shadowRoot.querySelector('.output pre');
                  if (outputPanel) {
                    // Pretty print first, then set as text content (browser handles escaping)
                    outputPanel.textContent = runKit.prettyPrintHtml(targetElement.outerHTML);
                  }
                  // Update display panel
                  const displayContent = runKit.shadowRoot.querySelector('.display-content');
                  if (displayContent) {
                    const clonedElement = targetElement.cloneNode(true);
                    clonedElement.style.display = '';
                    displayContent.innerHTML = '';
                    displayContent.appendChild(clonedElement);
                  }
                }
              }
            }, 100);
          } catch (error) {
            throw error;
          }
        })();
      `;
      
      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = scriptContent;
      
      // Add error handler
      window.addEventListener('error', this.handleError.bind(this), { once: true });
      
      document.body.appendChild(script);
      document.body.removeChild(script);
      
    } catch (error) {
      this.displayError(error);
    }
  }

  handleError(event) {
    this.displayError(event.error || new Error(event.message));
    event.preventDefault();
  }

  displayError(error) {
    const output = this.shadowRoot.querySelector('.output');
    const display = this.shadowRoot.querySelector('.display');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = `Error: ${error.message}\n${error.stack || ''}`;
    
    if (output) {
      output.appendChild(errorDiv);
    } else if (display) {
      display.appendChild(errorDiv);
    }
  }

  async saveScript() {
    const editor = this.shadowRoot.querySelector('.editor');
    const code = editor ? editor.value : this._scripts[this._activeTab].code;
    
    try {
      // Use DOM primitives PUT method to save the script
      if (this.PUT) {
        const scriptElements = this.querySelectorAll('script[type="text/plain"]');
        const currentScript = scriptElements[this._activeTab];
        if (currentScript) {
          const title = this._scripts[this._activeTab].title;
          const newContent = `<script type="text/plain"${title !== `Script ${this._activeTab + 1}` ? ` title="${title}"` : ''}>\n${code.split('\n').map(line => '          ' + line).join('\n')}\n        </script>`;
          await this.PUT(newContent, `script[type="text/plain"]:nth-of-type(${this._activeTab + 1})`);
        }
        
        const output = this.shadowRoot.querySelector('.output');
        const display = this.shadowRoot.querySelector('.display');
        const success = document.createElement('div');
        success.className = 'success';
        success.textContent = '✓ Saved to server';
        
        if (output) {
          output.appendChild(success);
        } else if (display) {
          display.appendChild(success);
        }
        
        setTimeout(() => success.remove(), 2000);
      } else {
        throw new Error('DOM primitives not loaded - cannot save to server');
      }
    } catch (error) {
      this.displayError(error);
    }
  }

  resetScript() {
    const editor = this.shadowRoot.querySelector('.editor');
    const activeScript = this._scripts[this._activeTab];
    
    // Reset to original code
    activeScript.code = activeScript.originalCode;
    if (editor) {
      editor.value = activeScript.originalCode;
    }
    
    // Re-render the original target HTML
    const targetElement = document.querySelector(this._targetSelector);
    if (targetElement) {
      // Update HTML source panel
      const outputPre = this.shadowRoot.querySelector('.output pre');
      if (outputPre) {
        outputPre.textContent = this.prettyPrintHtml(targetElement.outerHTML);
      }
      
      // Update display panel
      const displayContent = this.shadowRoot.querySelector('.display-content');
      if (displayContent) {
        const clonedElement = targetElement.cloneNode(true);
        clonedElement.style.display = '';
        displayContent.innerHTML = '';
        displayContent.appendChild(clonedElement);
      }
    }
    
    // Clear any errors
    const errors = this.shadowRoot.querySelectorAll('.error, .success');
    errors.forEach(err => err.remove());
  }

  escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
  
  prettyPrintHtml(html) {
    let formatted = '';
    let indent = 0;
    
    // Simple regex-based approach to format HTML
    // First, normalize whitespace between tags
    html = html.replace(/>\s+</g, '><').trim();
    
    // Process character by character
    let i = 0;
    while (i < html.length) {
      if (html[i] === '<') {
        // Find the end of this tag
        let tagEnd = html.indexOf('>', i);
        if (tagEnd === -1) break;
        
        const tag = html.substring(i, tagEnd + 1);
        
        if (tag.startsWith('</')) {
          // Closing tag
          indent = Math.max(0, indent - 1);
          // Check if we just had text (no newline before closing tag)
          if (formatted.length > 0 && !formatted.endsWith('\n')) {
            formatted += tag + '\n';
          } else {
            formatted += '  '.repeat(indent) + tag + '\n';
          }
        } else {
          // Opening or self-closing tag
          const isSelfClosing = tag.endsWith('/>') || tag.match(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s|\/|>)/i);
          
          // Look ahead for text content
          const nextContentStart = tagEnd + 1;
          let nextTagStart = html.indexOf('<', nextContentStart);
          if (nextTagStart === -1) nextTagStart = html.length;
          
          const textContent = html.substring(nextContentStart, nextTagStart).trim();
          
          if (textContent && !isSelfClosing) {
            // Has inline text content - keep on same line
            formatted += '  '.repeat(indent) + tag + textContent;
            indent++;
            i = nextTagStart - 1;
          } else {
            // No text content or self-closing
            formatted += '  '.repeat(indent) + tag + '\n';
            if (!isSelfClosing) indent++;
            i = tagEnd;
          }
        }
      }
      i++;
    }
    
    return formatted.trim();
  }
}

// network-inspector component for monitoring network traffic
class NetworkInspector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.requests = [];
    this.isMinimized = false;
    this.originalFetch = null;
    this.originalXHROpen = null;
    this.originalXHRSend = null;
  }

  connectedCallback() {
    this.render();
    this.setupInterception();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    this.restoreOriginalMethods();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          bottom: 0;
          right: 20px;
          width: 800px;
          max-height: 400px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px 8px 0 0;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .header {
          background: #2d3748;
          color: white;
          padding: 10px 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: move;
          border-radius: 8px 8px 0 0;
        }
        
        .title {
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .badge {
          background: #667eea;
          color: white;
          border-radius: 10px;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 500;
        }
        
        .controls {
          display: flex;
          gap: 10px;
        }
        
        .control-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .control-btn:hover {
          opacity: 0.8;
        }
        
        .content {
          max-height: 350px;
          overflow-y: auto;
          display: block;
        }
        
        .content.minimized {
          display: none;
        }
        
        .request-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .request-item {
          border-bottom: 1px solid #e2e8f0;
          padding: 10px 15px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .request-item:hover {
          background: #f7fafc;
        }
        
        .request-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        
        .method {
          font-weight: 600;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 3px;
          text-transform: uppercase;
        }
        
        .method.GET { background: #48bb78; color: white; }
        .method.POST { background: #ed8936; color: white; }
        .method.PUT { background: #9f7aea; color: white; }
        .method.DELETE { background: #f56565; color: white; }
        .method.OPTIONS { background: #4299e1; color: white; }
        
        .url {
          flex: 1;
          font-size: 12px;
          color: #4a5568;
          margin: 0 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .status {
          font-size: 12px;
          font-weight: 600;
        }
        
        .status.success { color: #48bb78; }
        .status.error { color: #f56565; }
        .status.pending { color: #ed8936; }
        
        .details {
          font-size: 11px;
          color: #718096;
          margin-top: 4px;
        }
        
        .expanded-details {
          background: #f7fafc;
          padding: 10px;
          margin-top: 10px;
          border-radius: 4px;
          font-size: 11px;
          display: none;
        }
        
        .expanded-details.show {
          display: block;
        }
        
        .detail-section {
          margin-bottom: 10px;
        }
        
        .detail-label {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 4px;
        }
        
        .detail-content {
          font-family: 'Monaco', 'Courier New', monospace;
          background: white;
          color: #2d3748;
          padding: 6px;
          border-radius: 3px;
          white-space: pre-wrap;
          word-break: break-all;
          text-align: left;
        }
        
        .empty-state {
          padding: 40px;
          text-align: center;
          color: #718096;
          font-size: 13px;
        }
      </style>
      
      <div class="header">
        <div class="title">
          Network Inspector
          <span class="badge">${this.requests.length}</span>
        </div>
        <div class="controls">
          <button class="control-btn clear-btn" title="Clear">🗑</button>
          <button class="control-btn minimize-btn" title="Minimize">${this.isMinimized ? '▲' : '▼'}</button>
        </div>
      </div>
      
      <div class="content ${this.isMinimized ? 'minimized' : ''}">
        ${this.requests.length === 0 ? 
          '<div class="empty-state">No network requests yet</div>' :
          '<ul class="request-list"></ul>'
        }
      </div>
    `;
    
    if (this.requests.length > 0) {
      this.updateRequestList();
    }
  }

  setupEventListeners() {
    const minimizeBtn = this.shadowRoot.querySelector('.minimize-btn');
    const clearBtn = this.shadowRoot.querySelector('.clear-btn');
    
    minimizeBtn.addEventListener('click', () => {
      this.isMinimized = !this.isMinimized;
      const content = this.shadowRoot.querySelector('.content');
      content.classList.toggle('minimized');
      minimizeBtn.textContent = this.isMinimized ? '▲' : '▼';
    });
    
    clearBtn.addEventListener('click', () => {
      this.requests = [];
      this.render();
      this.setupEventListeners();
    });
  }

  setupInterception() {
    // Intercept fetch
    const self = this;
    const originalFetch = window.fetch.bind(window);
    this.originalFetch = originalFetch;
    
    window.fetch = async (...args) => {
      const [resource, config = {}] = args;
      
      // Convert headers to plain object
      let requestHeaders = {};
      if (config.headers) {
        if (config.headers instanceof Headers) {
          config.headers.forEach((value, key) => {
            requestHeaders[key] = value;
          });
        } else {
          requestHeaders = config.headers;
        }
      }
      
      const request = {
        id: Date.now() + Math.random(),
        method: config.method || 'GET',
        url: resource.toString(),
        headers: requestHeaders,
        body: config.body,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      self.addRequest(request);
      
      try {
        const response = await originalFetch(...args);
        const clonedResponse = response.clone();
        
        request.status = response.status;
        request.statusText = response.statusText;
        request.responseHeaders = {};
        response.headers.forEach((value, key) => {
          request.responseHeaders[key] = value;
        });
        
        // Try to capture response body
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            request.responseBody = await clonedResponse.json();
          } else if (contentType && contentType.includes('text')) {
            request.responseBody = await clonedResponse.text();
          }
        } catch (e) {
          // Ignore body parsing errors
        }
        
        request.duration = Date.now() - request.id;
        self.updateRequest(request);
        
        return response;
      } catch (error) {
        request.status = 'error';
        request.error = error.message;
        self.updateRequest(request);
        throw error;
      }
    };
    
    // Intercept XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._networkInspector = {
        method,
        url,
        timestamp: new Date().toISOString()
      };
      return originalOpen.call(this, method, url, ...rest);
    };
    
    XMLHttpRequest.prototype.send = function(body) {
      if (this._networkInspector) {
        const request = {
          id: Date.now() + Math.random(),
          ...this._networkInspector,
          body,
          status: 'pending'
        };
        
        self.addRequest(request);
        
        this.addEventListener('load', function() {
          request.status = this.status;
          request.statusText = this.statusText;
          request.responseBody = this.responseText;
          request.duration = Date.now() - request.id;
          self.updateRequest(request);
        });
        
        this.addEventListener('error', function() {
          request.status = 'error';
          self.updateRequest(request);
        });
      }
      
      return originalSend.call(this, body);
    };
  }

  restoreOriginalMethods() {
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
  }

  addRequest(request) {
    this.requests.unshift(request);
    if (this.requests.length > 50) {
      this.requests = this.requests.slice(0, 50);
    }
    this.updateBadge();
    this.updateRequestList();
  }

  updateRequest(request) {
    const index = this.requests.findIndex(r => r.id === request.id);
    if (index !== -1) {
      this.requests[index] = request;
      this.updateRequestList();
    }
  }

  updateBadge() {
    const badge = this.shadowRoot.querySelector('.badge');
    if (badge) {
      badge.textContent = this.requests.length;
    }
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  updateRequestList() {
    const content = this.shadowRoot.querySelector('.content');
    if (this.requests.length === 0) {
      content.innerHTML = '<div class="empty-state">No network requests yet</div>';
      return;
    }
    
    let listHTML = '<ul class="request-list">';
    this.requests.forEach(req => {
      const statusClass = req.status === 'error' ? 'error' : 
                          req.status === 'pending' ? 'pending' : 
                          req.status >= 200 && req.status < 300 ? 'success' : 'error';
      
      listHTML += `
        <li class="request-item" data-id="${req.id}">
          <div class="request-header">
            <span class="method ${req.method}">${req.method}</span>
            <span class="url">${req.url}</span>
            <span class="status ${statusClass}">${req.status === 'pending' ? '...' : req.status}</span>
          </div>
          <div class="details">
            ${req.duration ? `${req.duration}ms • ` : ''}
            ${new Date(req.timestamp).toLocaleTimeString()}
          </div>
          <div class="expanded-details">
            ${req.headers && Object.keys(req.headers).length > 0 ? `
              <div class="detail-section">
                <div class="detail-label">Request Headers:</div>
                <div class="detail-content">${JSON.stringify(req.headers, null, 2)}</div>
              </div>
            ` : ''}
            ${req.body ? `
              <div class="detail-section">
                <div class="detail-label">Request Body:</div>
                <div class="detail-content">${typeof req.body === 'string' ? this.escapeHtml(req.body) : JSON.stringify(req.body, null, 2)}</div>
              </div>
            ` : ''}
            ${req.responseHeaders ? `
              <div class="detail-section">
                <div class="detail-label">Response Headers:</div>
                <div class="detail-content">${JSON.stringify(req.responseHeaders, null, 2)}</div>
              </div>
            ` : ''}
            ${req.responseBody ? `
              <div class="detail-section">
                <div class="detail-label">Response Body:</div>
                <div class="detail-content">${typeof req.responseBody === 'string' ? this.escapeHtml(req.responseBody) : JSON.stringify(req.responseBody, null, 2)}</div>
              </div>
            ` : ''}
          </div>
        </li>
      `;
    });
    listHTML += '</ul>';
    
    content.innerHTML = listHTML;
    
    // Add click handlers for expanding details
    content.querySelectorAll('.request-item').forEach(item => {
      item.addEventListener('click', () => {
        const details = item.querySelector('.expanded-details');
        details.classList.toggle('show');
      });
    });
  }
}

// Register the custom elements
customElements.define('run-kit', RunKit);
customElements.define('network-inspector', NetworkInspector);
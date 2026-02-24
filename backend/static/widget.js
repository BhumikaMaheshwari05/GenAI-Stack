/**
 * Intelliflow — Embeddable Chat Widget
 * 
 * Usage:
 *   <script src="http://YOUR_SERVER:8000/widget.js" data-stack-id="YOUR_STACK_ID"></script>
 * 
 * Optional attributes:
 *   data-server="http://YOUR_SERVER:8000"  (defaults to script's origin)
 *   data-position="bottom-right"           (bottom-right | bottom-left)
 *   data-theme="dark"                      (dark | light)
 *   data-title="AI Assistant"              (chat window title)
 */
(function () {
  'use strict';

  // --- Configuration ---
  const script = document.currentScript;
  const STACK_ID = script.getAttribute('data-stack-id');
  const SERVER = script.getAttribute('data-server') || script.src.replace(/\/widget\.js.*$/, '');
  const POSITION = script.getAttribute('data-position') || 'bottom-right';
  const THEME = script.getAttribute('data-theme') || 'dark';
  const TITLE = script.getAttribute('data-title') || 'AI Assistant';

  if (!STACK_ID) {
    console.error('[GenAI Widget] Missing data-stack-id attribute on the script tag.');
    return;
  }

  // --- Theme Colors ---
  const themes = {
    dark: {
      primary: '#6C63FF',
      primaryHover: '#5A52E0',
      bg: '#1a1a2e',
      chatBg: '#16213e',
      userMsg: '#6C63FF',
      aiMsg: '#0f3460',
      text: '#e0e0e0',
      textSecondary: '#a0a0b0',
      inputBg: '#1a1a2e',
      inputBorder: '#2a2a4a',
      headerBg: 'linear-gradient(135deg, #6C63FF, #e94560)',
      shadow: '0 10px 40px rgba(108, 99, 255, 0.3)',
      bubbleShadow: '0 4px 20px rgba(108, 99, 255, 0.5)',
    },
    light: {
      primary: '#6C63FF',
      primaryHover: '#5A52E0',
      bg: '#ffffff',
      chatBg: '#f8f9fa',
      userMsg: '#6C63FF',
      aiMsg: '#e9ecef',
      text: '#212529',
      textSecondary: '#6c757d',
      inputBg: '#ffffff',
      inputBorder: '#dee2e6',
      headerBg: 'linear-gradient(135deg, #6C63FF, #e94560)',
      shadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
      bubbleShadow: '0 4px 20px rgba(108, 99, 255, 0.4)',
    },
  };

  const t = themes[THEME] || themes.dark;
  const isRight = POSITION === 'bottom-right';

  // --- Inject Styles ---
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

    #genai-widget-bubble {
      position: fixed;
      bottom: 24px;
      ${isRight ? 'right: 24px;' : 'left: 24px;'}
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${t.primary};
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: ${t.bubbleShadow};
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
      font-family: 'Inter', sans-serif;
    }
    #genai-widget-bubble:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 28px rgba(108, 99, 255, 0.6);
    }
    #genai-widget-bubble svg {
      width: 28px;
      height: 28px;
      transition: transform 0.3s ease;
    }
    #genai-widget-bubble.open svg {
      transform: rotate(90deg);
    }

    #genai-widget-panel {
      position: fixed;
      bottom: 100px;
      ${isRight ? 'right: 24px;' : 'left: 24px;'}
      width: 400px;
      max-width: calc(100vw - 48px);
      height: 550px;
      max-height: calc(100vh - 140px);
      background: ${t.bg};
      border-radius: 20px;
      box-shadow: ${t.shadow};
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 99998;
      font-family: 'Inter', sans-serif;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    #genai-widget-panel.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    .genai-header {
      background: ${t.headerBg};
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .genai-header-icon {
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.2);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .genai-header-icon svg {
      width: 20px;
      height: 20px;
      fill: white;
    }
    .genai-header-title {
      color: white;
      font-weight: 600;
      font-size: 16px;
    }
    .genai-header-sub {
      color: rgba(255,255,255,0.75);
      font-size: 12px;
    }

    .genai-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: ${t.chatBg};
    }
    .genai-messages::-webkit-scrollbar {
      width: 5px;
    }
    .genai-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    .genai-messages::-webkit-scrollbar-thumb {
      background: ${t.inputBorder};
      border-radius: 10px;
    }

    .genai-msg {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.5;
      word-break: break-word;
      animation: genai-fadeIn 0.3s ease;
    }
    @keyframes genai-fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .genai-msg.user {
      background: ${t.userMsg};
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .genai-msg.ai {
      background: ${t.aiMsg};
      color: ${t.text};
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .genai-msg.ai p { margin: 0 0 8px 0; }
    .genai-msg.ai p:last-child { margin-bottom: 0; }
    .genai-msg.ai strong { font-weight: 600; }
    .genai-msg.ai ul, .genai-msg.ai ol { margin: 4px 0; padding-left: 20px; }
    .genai-msg.ai li { margin-bottom: 2px; }
    .genai-msg.ai code {
      background: rgba(108, 99, 255, 0.15);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }
    .genai-msg.ai pre {
      background: #0d1117;
      color: #c9d1d9;
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 8px 0;
      font-size: 13px;
    }
    .genai-msg.ai pre code {
      background: none;
      padding: 0;
      color: inherit;
    }

    .genai-welcome {
      text-align: center;
      padding: 40px 20px;
      color: ${t.textSecondary};
    }
    .genai-welcome-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }
    .genai-welcome h3 {
      color: ${t.text};
      font-size: 16px;
      margin: 0 0 6px 0;
    }
    .genai-welcome p {
      font-size: 13px;
      margin: 0;
    }

    .genai-typing {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
      align-self: flex-start;
    }
    .genai-typing span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${t.textSecondary};
      animation: genai-bounce 1.4s infinite ease-in-out;
    }
    .genai-typing span:nth-child(1) { animation-delay: 0s; }
    .genai-typing span:nth-child(2) { animation-delay: 0.2s; }
    .genai-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes genai-bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }

    .genai-input-bar {
      display: flex;
      padding: 12px 16px;
      gap: 8px;
      background: ${t.bg};
      border-top: 1px solid ${t.inputBorder};
      flex-shrink: 0;
    }
    .genai-input-bar input {
      flex: 1;
      padding: 10px 16px;
      border-radius: 24px;
      border: 1px solid ${t.inputBorder};
      background: ${t.inputBg};
      color: ${t.text};
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      outline: none;
      transition: border-color 0.2s ease;
    }
    .genai-input-bar input::placeholder {
      color: ${t.textSecondary};
    }
    .genai-input-bar input:focus {
      border-color: ${t.primary};
    }
    .genai-input-bar button {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: ${t.primary};
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.2s ease, transform 0.15s ease;
    }
    .genai-input-bar button:hover {
      background: ${t.primaryHover};
    }
    .genai-input-bar button:active {
      transform: scale(0.92);
    }
    .genai-input-bar button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .genai-powered {
      text-align: center;
      padding: 6px;
      font-size: 10px;
      color: ${t.textSecondary};
      background: ${t.bg};
    }

    @media (max-width: 480px) {
      #genai-widget-panel {
        width: calc(100vw - 16px);
        height: calc(100vh - 100px);
        bottom: 80px;
        ${isRight ? 'right: 8px;' : 'left: 8px;'}
        border-radius: 16px;
      }
      #genai-widget-bubble {
        bottom: 16px;
        ${isRight ? 'right: 16px;' : 'left: 16px;'}
      }
    }
  `;
  document.head.appendChild(style);

  // --- Create Chat Bubble ---
  const bubble = document.createElement('button');
  bubble.id = 'genai-widget-bubble';
  bubble.title = 'Chat with AI';
  bubble.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
  document.body.appendChild(bubble);

  // --- Create Chat Panel ---
  const panel = document.createElement('div');
  panel.id = 'genai-widget-panel';
  panel.innerHTML = `
    <div class="genai-header">
      <div class="genai-header-icon">
        <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      </div>
      <div>
        <div class="genai-header-title">${TITLE}</div>
        <div class="genai-header-sub">Powered by Intelliflow</div>
      </div>
    </div>
    <div class="genai-messages" id="genai-messages">
      <div class="genai-welcome">
        <div class="genai-welcome-icon">⚡</div>
        <h3>Hi there!</h3>
        <p>Ask me anything. I'm here to help.</p>
      </div>
    </div>
    <div class="genai-input-bar">
      <input type="text" id="genai-input" placeholder="Type your message..." autocomplete="off" />
      <button id="genai-send" title="Send">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    </div>
    <div class="genai-powered">⚡ Built with Intelliflow</div>
  `;
  document.body.appendChild(panel);

  // --- Refs ---
  const messagesEl = document.getElementById('genai-messages');
  const inputEl = document.getElementById('genai-input');
  const sendBtn = document.getElementById('genai-send');
  let isOpen = false;
  let isLoading = false;

  // --- Toggle ---
  bubble.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    bubble.classList.toggle('open', isOpen);
    if (isOpen) {
      setTimeout(() => inputEl.focus(), 300);
    }
  });

  // --- Simple Markdown Renderer ---
  function renderMarkdown(text) {
    if (!text) return '';
    let html = text
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Unordered lists
      .replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>')
      // Ordered lists
      .replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // Wrap consecutive <li>s in <ul>
    html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');

    // Paragraphs: split by double newlines
    html = html
      .split(/\n{2,}/)
      .map(block => {
        block = block.trim();
        if (!block) return '';
        if (block.startsWith('<pre>') || block.startsWith('<ul>') || block.startsWith('<ol>')) return block;
        return `<p>${block.replace(/\n/g, '<br>')}</p>`;
      })
      .join('');

    return html;
  }

  // --- Add Message ---
  function addMessage(text, sender) {
    // Remove welcome message if present
    const welcome = messagesEl.querySelector('.genai-welcome');
    if (welcome) welcome.remove();

    const msg = document.createElement('div');
    msg.className = `genai-msg ${sender}`;
    if (sender === 'ai') {
      msg.innerHTML = renderMarkdown(text);
    } else {
      msg.textContent = text;
    }
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'genai-typing';
    el.id = 'genai-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('genai-typing');
    if (el) el.remove();
  }

  // --- Send Message ---
  async function sendMessage() {
    const query = inputEl.value.trim();
    if (!query || isLoading) return;

    addMessage(query, 'user');
    inputEl.value = '';
    isLoading = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const res = await fetch(`${SERVER}/stacks/${STACK_ID}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      hideTyping();
      addMessage(data.result || 'No response received.', 'ai');
    } catch (err) {
      hideTyping();
      addMessage('Sorry, something went wrong. Please try again.', 'ai');
      console.error('[GenAI Widget] Error:', err);
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

})();

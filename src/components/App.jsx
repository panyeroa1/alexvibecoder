/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useCallback, useRef, useEffect } from 'react';
import useStore from '../lib/store';
import { startChat, continueChat } from '../lib/actions';
import Intro from './Intro';
import FeedItem from './FeedItem';

export default function App() {
  const messages = useStore((s) => s.messages);
  const isGenerating = useStore((s) => s.isGenerating);
  const chat = useStore((s) => s.chat);

  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState(null); // { name, data }
  const [isRecording, setIsRecording] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  // INITIAL THEME
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(saved || (prefersDark ? 'dark' : 'light'));
  }, []);

  // APPLY THEME
  useEffect(() => {
    document.body.toggleAttribute('data-light', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((p) => (p === 'light' ? 'dark' : 'light'));

  // SPEECH RECOGNITION
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setPrompt((p) => (p ? `${p} ${t}` : t));
      autoGrow();
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
  }, []);

  const autoGrow = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(220, ta.scrollHeight) + 'px';
  };

  const handlePromptSubmit = useCallback(async () => {
    const current = prompt.trim();
    if ((current || image) && !isGenerating) {
      if (chat) await continueChat(current, image?.data);
      else await startChat(current, image?.data);
      setPrompt('');
      setImage(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = '52px';
      }
    }
  }, [prompt, image, isGenerating, chat]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handlePromptSubmit();
      }
    },
    [handlePromptSubmit]
  );

  const handleMicClick = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (isRecording) {
      rec.stop();
      setIsRecording(false);
    } else {
      rec.start();
      setIsRecording(true);
    }
  };

  // ZIP (unchanged base64 payload)
  const ZIP_B64 =
    'UEsDBBQAAAAIAMUrT1tznCLEKAAAACsAAAAJAAAAUkVBRE1FLm1kU1ZwTSotys9TcK0oyC8q4eIKycgsUEsDBBQAAAAIAcUrT1uQ1z5cVgAAABUAAAARAAAAaW5kZXguaHRtbDwhZG9jdHlwZSBodG1sPjxodG1sPjxoZWFkPjxtZXRhIGNoYXJzZXQ9InV0Zi04Ij48dGl0bGU+RWJ1cm9uPC90aXRsZT48L2hlYWQ+PGJvZHk+PGgxPkVidXJvbjwvaDE+PHA+U3RhcnRlciBleHBvcnQ8L3A+PC9ib2R5PjwvaHRtbD5QSwMEFAAAAAgBxCtPWf1b3WJcAAAAEwAAAA8AAABwdWJsaWMvcGxhY2Vob2xkZXIudHh0cGxhY2Vob2xkZXJQSwECFAAUAAAACAFLK09bc5wiRCgAAAArAAAACQAAAAAAAAAAAAAAAACAAQAAAABSRUFETS5tZFBLAQIUAxQAAAAIAcUrT1uQ1z5cVgAAABUAAAARAAAAAAAAAAAAAAAAAKABNQAAAGluZGV4Lmh0bWxQSwECFAMUAAAACAHFK09Z/VvdYlwAAAATAAAADwAAAAAAAAAAAAAAAACgAU4AAHB1YmxpYy9wbGFjZWhvbGRlci50eHRQSwUGAAAAAAMAAwCnAAAAxAAAAAAA';

  const downloadZip = () => {
    try {
      const byteChars = atob(ZIP_B64);
      const bytes = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'eburon-starter.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Unable to prepare ZIP on this browser.');
    }
  };

  const openPreview = () => setIsPreviewOpen(true);
  const closePreview = () => setIsPreviewOpen(false);

  const onAddFile = () => fileInputRef.current?.click();
  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith('image/')) {
      const r = new FileReader();
      r.onloadend = () => setImage({ name: f.name, data: r.result });
      r.readAsDataURL(f);
    }
    e.target.value = null;
  };

  return (
    <div className="app-container">
      <header className="app-header" role="banner">
        <div className="header-left">
          <button className="hamburger" aria-label="Menu">
            <span />
            <span />
            <span />
          </button>
          <div className="header-logo" aria-label="App title">Eburon</div>
        </div>

        <div className="header-right">
          <button className="header-button" onClick={downloadZip} aria-label="Download code ZIP" title="Download code ZIP">
            <span className="icon">code</span>
            <span className="hide-sm">Code</span>
          </button>

          <button className="header-button" onClick={openPreview} aria-label="Open live preview" title="Open live preview">
            <span className="icon">play_circle</span>
            <span className="hide-sm">Live</span>
          </button>

          <button
            onClick={toggleTheme}
            className="header-button theme-toggle-button"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span className="icon">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
          </button>

          <div className="avatar" aria-label="Account" title="Account">
            <span className="icon">person</span>
          </div>
        </div>
      </header>

      <main className="app-main" role="main">
        {messages.length === 0 ? (
          <Intro onSuggestionClick={(s) => setPrompt(s)} />
        ) : (
          <div className="chat-feed" role="feed" aria-live="polite">
            {messages.map((msg, i) => {
              if (msg.role === 'user') {
                const modelMessage = messages[i + 1];
                if (modelMessage) {
                  return (
                    <FeedItem
                      key={msg.id ?? i}
                      userPrompt={msg.content}
                      userImage={msg.image}
                      modelResponse={modelMessage.content}
                      isGenerating={isGenerating && i === messages.length - 2}
                    />
                  );
                }
              }
              return null;
            })}
          </div>
        )}
      </main>

      {/* MESSAGE PROMPT: redesigned */}
      <footer className="prompt-footer" role="contentinfo">
        <div className="composer-shell">
          {image && (
            <div className="attach-chip" title={image.name}>
              <img src={image.data} alt="Attached" />
              <button className="chip-x" onClick={() => setImage(null)} aria-label="Remove image">
                <span className="icon">close</span>
              </button>
            </div>
          )}

          <div className={`composer ${isRecording ? 'is-recording' : ''}`}>
            <button className="tool-btn" onClick={onAddFile} aria-label="Attach">
              <span className="icon">attach_file</span>
            </button>

            <textarea
              ref={textareaRef}
              className="composer-input"
              placeholder="Describe what you want to build…  (Enter = send, Shift+Enter = newline)"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                autoGrow();
              }}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              rows={1}
              spellCheck="true"
              autoCorrect="on"
              autoComplete="on"
            />

            <div className="right-tools">
              <button
                className={`tool-btn ${isRecording ? 'armed' : ''}`}
                onClick={handleMicClick}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                title={isRecording ? 'Stop recording' : 'Start recording'}
              >
                <span className="icon">mic</span>
              </button>

              <button
                className="send-btn"
                onClick={handlePromptSubmit}
                disabled={(!prompt.trim() && !image) || isGenerating}
                aria-label="Send"
                title="Send"
              >
                <span className="icon">arrow_upward</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="hint-row">
            <span>Powered by Aquilles</span>
            <span className="kbd">Enter</span> to send · <span className="kbd">Shift</span> + <span className="kbd">Enter</span> for newline
          </div>
        </div>
      </footer>

      {isPreviewOpen && (
        <div className="preview-backdrop" role="dialog" aria-modal="true" aria-label="Live Preview">
          <div className="preview-card">
            <div className="preview-bar">
              <div className="preview-title">
                <span className="icon">play_circle</span>
                <span>Live Preview</span>
              </div>
              <button className="preview-close" onClick={closePreview} aria-label="Close preview">
                <span className="icon">close</span>
              </button>
            </div>
            <div className="preview-body">
              <div className="preview-viewport">
                <div className="preview-screen">
                  <h2>Eburon</h2>
                  <p>Lightweight live preview surface.</p>
                  <ul>
                    <li>Generate UI/code with the composer below.</li>
                    <li>Export ZIP via <strong>Code</strong> button.</li>
                    <li>Close panel to return to chat.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ---------- THEME ---------- */
        .app-container {
          min-height: 100dvh;
          display: grid;
          grid-template-rows: auto 1fr auto;
          background: var(--bg);
          color: var(--fg);
        }
        :global(:root) {
          /* DARK */
          --bg: #0b0d12;
          --panel: #10131b;
          --panel-elev: #121623;
          --muted: #97a0b5;
          --border: #1b2130;
          --fg: #e8ebf3;
          --accent: #8ab4ff;
          --ring: 0 0 0 2px rgba(138,180,255,0.20);
          --shadow-lg: 0 12px 30px rgba(0,0,0,0.35);
        }
        :global(body[data-light]) {
          /* NEW LIGHT: softer, not ugly */
          --bg: #f4f6fb;               /* warm gray-blue */
          --panel: #ffffff;            /* true white panels */
          --panel-elev: #f9fafc;       /* subtle elevated */
          --muted: #5e6b85;            /* calmer text */
          --border: #dfe5f0;           /* soft border */
          --fg: #0f1a2b;               /* deep navy text */
          --accent: #3757ff;           /* rich blue accent */
          --ring: 0 0 0 2px rgba(55,87,255,0.18);
          --shadow-lg: 0 16px 40px rgba(14, 31, 64, 0.10);
        }

        /* ---------- HEADER ---------- */
        .app-header {
          position: sticky;
          top: 0;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--panel);
          border-bottom: 1px solid var(--border);
          z-index: 20;
        }
        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .header-logo { font-weight: 800; letter-spacing: .2px; font-size: 1.05rem; }
        .hamburger {
          width: 40px; height: 34px; padding: 6px 8px;
          display: inline-flex; flex-direction: column; justify-content: space-between;
          border-radius: 10px; background: transparent; border: 1px solid var(--border);
          cursor: pointer;
        }
        .hamburger span { height: 2px; background: var(--fg); border-radius: 2px; }
        .header-button {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: .92rem; padding: 8px 12px; border-radius: 10px;
          background: transparent; border: 1px solid var(--border); color: var(--fg);
          cursor: pointer;
        }
        .icon {
          font-family: 'Material Symbols Outlined', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          font-size: 18px; line-height: 1;
        }
        .hide-sm { display: inline; }
        @media (max-width: 520px) { .hide-sm { display: none; } }
        .avatar {
          width: 36px; height: 36px; border-radius: 50%;
          display: grid; place-items: center;
          background: linear-gradient(180deg, var(--panel-elev), var(--panel));
          border: 1px solid var(--border);
        }

        /* ---------- MAIN ---------- */
        .app-main { padding: .75rem; max-width: 1200px; margin: 0 auto; width: 100%; }
        .chat-feed { display: grid; gap: .75rem; }

        /* ---------- COMPOSER (MESSAGE PROMPT) ---------- */
        .prompt-footer {
          position: sticky; bottom: 0;
          background: linear-gradient(0deg, rgba(0,0,0,0.05), rgba(0,0,0,0.00)) , var(--panel);
          border-top: 1px solid var(--border);
          padding: .9rem .75rem 1.1rem;
        }
        .composer-shell {
          width: 100%;
          max-width: 1180px;              /* WIDER */
          margin: 0 auto;
        }
        .attach-chip {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px dashed var(--border); border-radius: 12px;
          padding: 6px 8px; margin-bottom: 8px; background: var(--panel-elev);
          box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset;
        }
        .attach-chip img {
          width: 36px; height: 36px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border);
        }
        .chip-x {
          width: 30px; height: 30px; display: grid; place-items: center;
          border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--muted);
          cursor: pointer;
        }

        .composer {
          display: grid; grid-template-columns: auto 1fr auto;
          align-items: end; gap: 10px;
          padding: 10px;
          border-radius: 18px;
          background: var(--panel-elev);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          transition: box-shadow .15s ease, transform .15s ease;
        }
        .composer:focus-within {
          box-shadow: var(--shadow-lg), var(--ring);
          transform: translateY(-1px);
        }
        .composer.is-recording { outline: 2px dashed rgba(239,68,68,0.35); outline-offset: 2px; }

        .tool-btn {
          width: 38px; height: 38px; display: grid; place-items: center;
          border-radius: 12px; border: 1px solid var(--border); background: transparent; color: var(--fg);
          cursor: pointer;
        }
        .tool-btn.armed { outline: 2px solid rgba(239,68,68,0.35); outline-offset: 2px; }

        .composer-input {
          width: 100%;
          max-height: 220px;
          min-height: 52px;
          resize: none;
          padding: 12px 10px;
          border-radius: 14px;
          border: 1px solid transparent;   /* keep clean, focus handled by parent */
          background: transparent;
          color: var(--fg);
          outline: none;
          font-size: 0.98rem;
          line-height: 1.35;
        }

        .right-tools { display: inline-flex; gap: 8px; align-items: center; }
        .send-btn {
          width: 40px; height: 40px; border-radius: 14px;
          display: grid; place-items: center;
          border: 1px solid var(--border);
          background: linear-gradient(180deg, var(--panel), var(--panel-elev));
          color: var(--fg);
          cursor: pointer;
        }
        .send-btn:disabled { opacity: .55; cursor: not-allowed; }

        .hint-row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 12px; color: var(--muted);
          padding: 8px 4px 0;
        }
        .kbd {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
          font-size: 11px;
          padding: 2px 6px;
          border: 1px solid var(--border);
          border-bottom-width: 2px;
          border-radius: 6px;
          background: var(--panel);
          color: var(--fg);
          margin: 0 2px;
        }

        /* ---------- PREVIEW MODAL ---------- */
        .preview-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(2px); display: grid; place-items: center; z-index: 50; }
        .preview-card {
          width: min(960px, 92vw); height: min(640px, 84vh);
          background: var(--panel); border: 1px solid var(--border);
          border-radius: 16px; overflow: hidden; display: grid; grid-template-rows: auto 1fr;
        }
        .preview-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid var(--border); background: var(--panel-elev); }
        .preview-title { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
        .preview-close { border: 1px solid var(--border); background: transparent; color: var(--fg); border-radius: 10px; width: 32px; height: 32px; display: grid; place-items: center; cursor: pointer; }
        .preview-body { padding: 0; display: grid; }
        .preview-viewport { padding: 16px; width: 100%; height: 100%; overflow: auto; }
        .preview-screen { border: 1px solid var(--border); border-radius: 12px; padding: 16px; background: var(--panel-elev); }

        /* ---------- RESPONSIVE ---------- */
        @media (max-width: 1024px) {
          .app-header { grid-template-columns: 1fr auto; }
        }
        @media (max-width: 768px) {
          .app-header { grid-template-columns: 1fr auto; grid-auto-flow: row; gap: .5rem .75rem; }
          .header-logo { font-size: 1rem; }
          .app-main { padding: .5rem; }
          .composer-shell { max-width: 100%; }
        }
        @media (max-width: 420px) {
          .hamburger { width: 36px; height: 32px; }
          .tool-btn { width: 36px; height: 36px; }
          .send-btn { width: 38px; height: 38px; }
        }
      `}</style>
    </div>
  );
}
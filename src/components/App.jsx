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
  const [theme, setTheme] = useState('dark'); // kept in case Intro/other parts use it
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  /* ---------- THEME ---------- */
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(saved || (prefersDark ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme'); // default dark
    localStorage.setItem('theme', theme);
  }, [theme]);

  /* ---------- SPEECH ---------- */
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

  /* ---------- SEND ---------- */
  const handlePromptSubmit = useCallback(async () => {
    const current = prompt.trim();
    if ((current || image) && !isGenerating) {
      if (chat) await continueChat(current, image?.data);
      else await startChat(current, image?.data);
      setPrompt('');
      setImage(null);
      if (textareaRef.current) textareaRef.current.style.height = '52px';
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

  /* ---------- FILE ---------- */
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

  /* ---------- PREVIEW / ZIP ---------- */
  const openPreview = () => setIsPreviewOpen(true);
  const closePreview = () => setIsPreviewOpen(false);
  const downloadZip = () => alert('ZIP export wired later.');

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

        {/* HEADER: only Code and Preview icons */}
        <div className="header-right">
          <button className="header-button" onClick={downloadZip} aria-label="Download code ZIP" title="Download code ZIP">
            <span className="icon">code</span>
          </button>
          <button className="header-button" onClick={openPreview} aria-label="Open live preview" title="Open live preview">
            <span className="icon">play_circle</span>
          </button>
        </div>
      </header>

      <main className="app-main" role="main">
        {/* Make Intro heading smaller via global CSS below */}
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

      {/* PROMPT: “clipbox” style, elevated, 50% transparent bg, placeholder “Describe here…” */}
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

          <div className={`composer clipbox ${isRecording ? 'is-recording' : ''}`}>
            <button className="tool-btn" onClick={onAddFile} aria-label="Attach">
              <span className="icon">attach_file</span>
            </button>

            <div className="input-wrap">
              <textarea
                ref={textareaRef}
                className="composer-input"
                placeholder="Describe here..."
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
            </div>

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

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="footer-brand">Powered by Aquilles</div>
        </div>
      </footer>

      {/* Minimal Preview */}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ---------------- THEME TOKENS ---------------- */
        :global(:root) {
          /* DARK */
          --bg: #0b0d12;
          --panel: #0f1219;
          --panel-elev: #121623;
          --muted: #98a2b6;
          --border: #1b2232;
          --fg: #edf1f9;
          --accent: #8ab4ff;
          --ring: 0 0 0 2px rgba(138,180,255,.22);
          --shadow-lg: 0 12px 30px rgba(0,0,0,.35);
          --placeholder: #8b94a8;
          --clip-alpha: 0.5; /* 50% transparency base */
        }
        :global([data-theme="light"]) {
          /* LIGHT */
          --bg: #f6f7fb;
          --panel: #ffffff;
          --panel-elev: #f9fbff;
          --muted: #5b6680;
          --border: #e3e8f2;
          --fg: #0f1a2b;
          --accent: #3757ff;
          --ring: 0 0 0 2px rgba(55,87,255,.18);
          --shadow-lg: 0 16px 40px rgba(14,31,64,.10);
          --placeholder: #8a93a6;
          --clip-alpha: 0.5;
        }

        .app-container {
          min-height: 100dvh;
          display: grid;
          grid-template-rows: auto 1fr auto;
          background: var(--bg);
          color: var(--fg);
        }

        /* ---------------- HEADER ---------------- */
        .app-header {
          position: sticky; top: 0;
          display: grid; grid-template-columns: 1fr auto;
          align-items: center; gap: .25rem;
          padding: .5rem .75rem;
          background: var(--panel);
          border-bottom: 1px solid var(--border);
          z-index: 10;
        }
        .header-left, .header-right { display: flex; align-items: center; gap: .35rem; }
        .header-logo { font-weight: 800; font-size: 1rem; letter-spacing: .2px; }
        .hamburger {
          width: 36px; height: 32px; padding: 6px 8px;
          display: inline-flex; flex-direction: column; justify-content: space-between;
          border-radius: 10px; background: transparent; border: 1px solid var(--border);
        }
        .hamburger span { height: 2px; background: var(--fg); border-radius: 2px; }
        .header-button {
          width: 38px; height: 38px; display: grid; place-items: center;
          border-radius: 10px; background: transparent; border: 1px solid var(--border); color: var(--fg);
        }
        .icon {
          font-family: 'Material Symbols Outlined', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          font-size: 20px; line-height: 1;
        }

        /* ---------------- MAIN ---------------- */
        .app-main { padding: .75rem; max-width: 1100px; margin: 0 auto; width: 100%; }
        .chat-feed { display: grid; gap: .75rem; }

        /* Smaller Intro heading on all screens */
        :global(.intro-root h1) {
          font-size: clamp(22px, 5.4vw, 40px);
          line-height: 1.08;
          letter-spacing: -0.015em;
        }

        /* ---------------- COMPOSER ---------------- */
        .prompt-footer {
          position: sticky; bottom: 0;
          background: linear-gradient(0deg, rgba(0,0,0,.05), transparent), var(--panel);
          border-top: 1px solid var(--border);
          padding: .55rem .5rem calc(0.85rem + env(safe-area-inset-bottom));
        }
        .composer-shell { width: 100%; max-width: 1180px; margin: 0 auto; }

        .attach-chip {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px dashed var(--border); border-radius: 12px;
          padding: 6px 8px; margin-bottom: 8px; background: var(--panel-elev);
        }
        .attach-chip img {
          width: 36px; height: 36px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border);
        }
        .chip-x {
          width: 30px; height: 30px; display: grid; place-items: center;
          border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--muted);
        }

        /* Clipbox: frosted, elevated, rounded */
        .composer.clipbox {
          display: grid;
          grid-template-columns: 42px 1fr 42px 42px;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border-radius: 18px;
          background: color-mix(in oklab, var(--panel-elev) calc(var(--clip-alpha) * 100%), transparent);
          border: 1px solid color-mix(in oklab, var(--border) 80%, transparent);
          box-shadow: var(--shadow-lg);
          backdrop-filter: saturate(140%) blur(10px);
          -webkit-backdrop-filter: saturate(140%) blur(10px);
          overflow: clip; /* true clipping for inner elements */
        }
        .composer.clipbox:focus-within { box-shadow: var(--shadow-lg), var(--ring); }
        .composer.is-recording { outline: 2px dashed rgba(239,68,68,.35); outline-offset: 2px; }

        .tool-btn, .send-btn {
          width: 42px; height: 42px; display: grid; place-items: center;
          border-radius: 12px; border: 1px solid var(--border); background: transparent; color: var(--fg);
        }
        .tool-btn.armed { outline: 2px solid rgba(239,68,68,.35); outline-offset: 2px; }
        .send-btn { background: linear-gradient(180deg, color-mix(in oklab, var(--panel) 70%, transparent), var(--panel-elev)); }

        .input-wrap {
          min-width: 0;
          display: flex; align-items: center;
        }
        .composer-input {
          width: 100%;
          max-height: 220px;
          min-height: 52px;
          resize: none;
          padding: 12px 10px;
          border: 0;
          background: transparent;
          color: var(--fg);
          caret-color: var(--fg);
          outline: none;
          font-size: 16px;
          line-height: 1.35;
        }
        .composer-input::placeholder { color: var(--fg); opacity: .5; } /* 50% transparent text */

        .footer-brand {
          margin-top: 8px;
          text-align: center;
          font-size: 12px;
          color: var(--muted);
        }

        /* ---------------- PREVIEW ---------------- */
        .preview-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(2px); display: grid; place-items: center; z-index: 50; }
        .preview-card {
          width: min(960px, 92vw); height: min(640px, 84vh);
          background: var(--panel); border: 1px solid var(--border);
          border-radius: 16px; overflow: hidden; display: grid; grid-template-rows: auto 1fr;
        }
        .preview-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid var(--border); background: var(--panel-elev); }
        .preview-title { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
        .preview-close { border: 1px solid var(--border); background: transparent; color: var(--fg); border-radius: 10px; width: 32px; height: 32px; display: grid; place-items: center; }

        /* ---------------- RESPONSIVE ---------------- */
        @media (max-width: 768px) {
          .app-main { padding: .5rem; }
          .composer-shell { max-width: 100%; }
        }
        @media (max-width: 380px) {
          .composer.clipbox { grid-template-columns: 38px 1fr 38px 38px; }
          .tool-btn, .send-btn { width: 38px; height: 38px; }
          .composer-input { min-height: 46px; }
        }
      `}</style>
    </div>
  );
}
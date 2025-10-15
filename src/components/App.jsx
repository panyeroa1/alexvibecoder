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

  // INIT THEME
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

  // SPEECH
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

  // ZIP
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
    } catch {
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
          </button>
          <button className="header-button" onClick={openPreview} aria-label="Open live preview" title="Open live preview">
            <span className="icon">play_circle</span>
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

      {/* MESSAGE PROMPT — MOBILE-FIRST, CLEANER */}
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
              placeholder="Describe what you want to build…"
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
            <div className="hints">
              <span className="kbd">Enter</span> send
              <span className="sep">·</span>
              <span className="kbd">Shift</span>+<span className="kbd">Enter</span> newline
            </div>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* THEME — tuned for nicer light + better mobile contrast */
        .app-container {
          min-height: 100dvh;
          display: grid;
          grid-template-rows: auto 1fr auto;
          background: var(--bg);
          color: var(--fg);
        }
        :global(:root) {
          --bg: #0b0d12;
          --panel: #0f1219;
          --panel-elev: #121623;
          --muted: #99a3b8;
          --border: #1c2231;
          --fg: #edf1f9;
          --accent: #8ab4ff;
          --ring: 0 0 0 2px rgba(138,180,255,.22);
          --shadow-lg: 0 12px 30px rgba(0,0,0,.35);
          --placeholder: #8b94a8;
        }
        :global(body[data-light]) {
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
        }

        /* HEADER */
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
        .header-logo { font-weight: 800; letter-spacing: .2px; font-size: 1rem; }
        .hamburger {
          width: 36px; height: 32px; padding: 6px 8px;
          display: inline-flex; flex-direction: column; justify-content: space-between;
          border-radius: 10px; background: transparent; border: 1px solid var(--border);
        }
        .hamburger span { height: 2px; background: var(--fg); border-radius: 2px; }
        .header-button {
          width: 36px; height: 36px; display: grid; place-items: center;
          border-radius: 10px; background: transparent; border: 1px solid var(--border); color: var(--fg);
        }
        .icon {
          font-family: 'Material Symbols Outlined', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          font-size: 20px; line-height: 1;
        }
        .avatar {
          width: 36px; height: 36px; border-radius: 50%;
          display: grid; place-items: center;
          background: linear-gradient(180deg, var(--panel-elev), var(--panel));
          border: 1px solid var(--border);
        }

        /* MAIN */
        .app-main { padding: .75rem; max-width: 1100px; margin: 0 auto; width: 100%; }
        .chat-feed { display: grid; gap: .75rem; }

        /* Make Intro mobile heading sane without touching Intro.jsx */
        :global(.intro-root h1) {
          font-size: clamp(28px, 7.5vw, 64px);
          line-height: 1.05;
          letter-spacing: -0.02em;
        }
        :global(.intro-root .suggestions) {
          gap: 10px;
        }
        :global(.intro-root .suggestions button) {
          padding: 10px 14px;
          border-radius: 22px;
          border: 1px solid var(--border);
          background: var(--panel-elev);
        }

        /* COMPOSER */
        .prompt-footer {
          position: sticky; bottom: 0;
          background: linear-gradient(0deg, rgba(0,0,0,.05), transparent), var(--panel);
          border-top: 1px solid var(--border);
          padding: .6rem .5rem calc(1rem + env(safe-area-inset-bottom));
        }
        .composer-shell {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
        }
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

        .composer {
          display: grid; grid-template-columns: auto 1fr auto;
          align-items: end; gap: 8px;
          padding: 8px;
          border-radius: 18px;
          background: var(--panel-elev);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
        }
        .composer:focus-within { box-shadow: var(--shadow-lg), var(--ring); }
        .composer.is-recording { outline: 2px dashed rgba(239,68,68,.35); outline-offset: 2px; }

        .tool-btn {
          width: 40px; height: 40px; display: grid; place-items: center;
          border-radius: 12px; border: 1px solid var(--border); background: transparent; color: var(--fg);
        }
        .tool-btn.armed { outline: 2px solid rgba(239,68,68,.35); outline-offset: 2px; }

        .composer-input {
          width: 100%;
          max-height: 220px;
          min-height: 52px;
          resize: none;
          padding: 12px 10px;
          border-radius: 14px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--fg);
          caret-color: var(--fg);
          outline: none;
          font-size: 16px;
          line-height: 1.35;
        }
        .composer-input::placeholder { color: var(--placeholder); opacity: .9; }

        .right-tools { display: inline-flex; gap: 8px; align-items: center; }
        .send-btn {
          width: 42px; height: 42px; border-radius: 14px;
          display: grid; place-items: center;
          border: 1px solid var(--border);
          background: linear-gradient(180deg, var(--panel), var(--panel-elev));
          color: var(--fg);
        }
        .send-btn:disabled { opacity: .55; }

        .hint-row {
          margin-top: 8px;
          display: flex; justify-content: space-between; align-items: center;
          font-size: 12px; color: var(--muted);
          padding: 0 2px;
        }
        .hints { display: inline-flex; gap: 6px; align-items: center; }
        .sep { opacity: .6; }
        .kbd {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
          font-size: 11px; padding: 2px 6px;
          border: 1px solid var(--border); border-bottom-width: 2px;
          border-radius: 6px; background: var(--panel); color: var(--fg);
        }

        /* PREVIEW */
        .preview-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(2px); display: grid; place-items: center; z-index: 50; }
        .preview-card {
          width: min(960px, 92vw); height: min(640px, 84vh);
          background: var(--panel); border: 1px solid var(--border);
          border-radius: 16px; overflow: hidden; display: grid; grid-template-rows: auto 1fr;
        }
        .preview-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid var(--border); background: var(--panel-elev); }
        .preview-title { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
        .preview-close { border: 1px solid var(--border); background: transparent; color: var(--fg); border-radius: 10px; width: 32px; height: 32px; display: grid; place-items: center; }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .app-main { padding: .5rem; }
          .header-logo { font-size: .95rem; }
          .composer-shell { max-width: 100%; }
        }
        @media (max-width: 420px) {
          .hamburger { width: 34px; height: 30px; }
          .tool-btn { width: 38px; height: 38px; }
          .send-btn { width: 40px; height: 40px; }
        }
      `}</style>
    </div>
  );
}
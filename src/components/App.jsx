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

  const downloadZip = () => {
    // stub for zip download
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
          <div className="header-logo">Eburon</div>
        </div>
        <div className="header-right">
          <button className="header-button" onClick={downloadZip}>
            <span className="icon">code</span>
          </button>
          <button className="header-button" onClick={openPreview}>
            <span className="icon">play_circle</span>
          </button>
          <button onClick={toggleTheme} className="header-button theme-toggle-button">
            <span className="icon">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
          </button>
          <div className="avatar">
            <span className="icon">person</span>
          </div>
        </div>
      </header>

      <main className="app-main" role="main">
        {messages.length === 0 ? (
          <Intro onSuggestionClick={(s) => setPrompt(s)} />
        ) : (
          <div className="chat-feed">
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

      <footer className="prompt-footer">
        <div className="composer-shell">
          {image && (
            <div className="attach-chip">
              <img src={image.data} alt="Attached" />
              <button className="chip-x" onClick={() => setImage(null)}>
                <span className="icon">close</span>
              </button>
            </div>
          )}

          <div className={`composer ${isRecording ? 'is-recording' : ''}`}>
            <button className="tool-btn" onClick={onAddFile}>
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
            />

            <div className="right-tools">
              <button
                className={`tool-btn ${isRecording ? 'armed' : ''}`}
                onClick={handleMicClick}
              >
                <span className="icon">mic</span>
              </button>
              <button
                className="send-btn"
                onClick={handlePromptSubmit}
                disabled={(!prompt.trim() && !image) || isGenerating}
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

          {/* ONLY KEEP POWERED BY AQUILLES */}
          <div className="footer-brand">Powered by Aquilles</div>
        </div>
      </footer>

      <style jsx>{`
        .footer-brand {
          margin-top: 8px;
          text-align: center;
          font-size: 12px;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}
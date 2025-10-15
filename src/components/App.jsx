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
  const messages = useStore((state) => state.messages);
  const isGenerating = useStore((state) => state.isGenerating);
  const chat = useStore((state) => state.chat);
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState(null); // { name: string, data: base64 string }
  const [isRecording, setIsRecording] = useState(false);
  const [theme, setTheme] = useState('dark');

  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Effect to set initial theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Effect to apply theme to body and save to localStorage
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Speech recognition (optional)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setPrompt((p) => (p ? `${p} ${transcript}` : transcript));
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const handlePromptSubmit = useCallback(async () => {
    const currentPrompt = prompt.trim();
    if ((currentPrompt || image) && !isGenerating) {
      if (chat) {
        await continueChat(currentPrompt, image?.data);
      } else {
        await startChat(currentPrompt, image?.data);
      }
      setPrompt('');
      setImage(null);
    }
  }, [prompt, image, isGenerating, chat]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setPrompt(suggestion);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handlePromptSubmit();
      }
    },
    [handlePromptSubmit]
  );

  const handleAddFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({ name: file.name, data: reader.result });
      };
      reader.readAsDataURL(file);
    }
    event.target.value = null; // Reset file input
  };

  const handleMicClick = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
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

        <div className="header-center">
          <button className="header-button">
            Select chat <span className="icon">expand_more</span>
          </button>
        </div>

        <div className="header-right">
          <button
            onClick={toggleTheme}
            className="header-button theme-toggle-button"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span className="icon">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
          </button>
          <div className="avatar" aria-label="Account">
            <span className="icon">spark</span>
          </div>
        </div>
      </header>

      <main className="app-main" role="main">
        {messages.length === 0 ? (
          <Intro onSuggestionClick={handleSuggestionClick} />
        ) : (
          <div className="chat-feed" role="feed" aria-live="polite">
            {messages.map((msg, index) => {
              if (msg.role === 'user') {
                const modelMessage = messages[index + 1];
                if (modelMessage) {
                  return (
                    <FeedItem
                      key={msg.id ?? index}
                      userPrompt={msg.content}
                      userImage={msg.image}
                      modelResponse={modelMessage.content}
                      isGenerating={isGenerating && index === messages.length - 2}
                    />
                  );
                }
              }
              return null;
            })}
          </div>
        )}
      </main>

      <footer className="prompt-footer" role="contentinfo">
        {image && (
          <div className="image-preview-wrapper">
            <img src={image.data} alt="Preview" className="image-preview" />
            <span className="image-preview-text">{image.name}</span>
            <button
              className="remove-image-btn"
              onClick={() => setImage(null)}
              aria-label="Remove image"
            >
              <span className="icon">close</span>
            </button>
          </div>
        )}

        <div className="prompt-input-wrapper">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />

          <div className="prompt-input-icons left">
            <button
              className="prompt-icon-button"
              onClick={handleAddFileClick}
              aria-label="Add file"
            >
              <span className="icon">add</span>
            </button>
          </div>

          <textarea
            rows="1"
            className="prompt-input"
            placeholder="Describe what you want to build..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            style={{ height: 'auto', maxHeight: '200px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
          />

          <div className="prompt-input-icons right">
            <button
              className={`prompt-icon-button ${isRecording ? 'is-recording' : ''}`}
              onClick={handleMicClick}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <span className="icon">mic</span>
            </button>

            <button
              className="prompt-icon-button prompt-submit-button"
              onClick={handlePromptSubmit}
              disabled={(!prompt.trim() && !image) || isGenerating}
              aria-label="Submit prompt"
            >
              <span className="icon">arrow_upward</span>
            </button>
          </div>
        </div>

        <p className="footer-text">Powered by Aquilles</p>
      </footer>

      {/* Scoped styles for responsive layout */}
      <style jsx>{`
        .app-container {
          min-height: 100dvh;
          display: grid;
          grid-template-rows: auto 1fr auto;
          background: var(--bg, #0b0b0f);
          color: var(--fg, #eaeaf0);
        }
        :global(body.light-theme) .app-container {
          --bg: #f7f7fb;
          --panel: #ffffff;
          --muted: #6b7280;
          --border: #e5e7eb;
          --fg: #0f172a;
          --accent: #111827;
        }
        :global(:root) {
          --bg: #0b0b0f;
          --panel: #121219;
          --muted: #8b90a5;
          --border: #1f2230;
          --fg: #eaeaf0;
          --accent: #cbd5e1;
        }

        /* Header */
        .app-header {
          position: sticky;
          top: 0;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--panel);
          border-bottom: 1px solid var(--border);
          z-index: 20;
        }
        .header-left,
        .header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .header-center {
          display: flex;
          justify-content: center;
        }
        .header-logo {
          font-weight: 700;
          letter-spacing: 0.4px;
          font-size: 1.125rem;
        }
        .hamburger {
          width: 40px;
          height: 34px;
          padding: 6px 8px;
          display: inline-flex;
          flex-direction: column;
          justify-content: space-between;
          border-radius: 10px;
          background: transparent;
          border: 1px solid var(--border);
          cursor: pointer;
        }
        .hamburger span {
          display: block;
          height: 2px;
          background: var(--fg);
          border-radius: 2px;
        }
        .header-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          padding: 8px 12px;
          border-radius: 10px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--fg);
          cursor: pointer;
        }
        .icon {
          font-family: 'Material Symbols Outlined', system-ui, -apple-system, Segoe UI, Roboto,
            sans-serif;
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          font-size: 18px;
          line-height: 1;
        }
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(180deg, #2a2f45, #171a28);
          border: 1px solid var(--border);
        }

        /* Main */
        .app-main {
          padding: 0.75rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .chat-feed {
          display: grid;
          gap: 0.75rem;
        }

        /* Footer / Prompt bar */
        .prompt-footer {
          border-top: 1px solid var(--border);
          background: var(--panel);
          padding: 0.75rem 0.75rem 1rem;
          position: sticky;
          bottom: 0;
        }
        .image-preview-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          margin: 0 0 8px;
          border: 1px dashed var(--border);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.02);
        }
        .image-preview {
          width: 32px;
          height: 32px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid var(--border);
        }
        .remove-image-btn {
          border: 0;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
        }
        .prompt-input-wrapper {
          position: relative;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: end;
          gap: 8px;
          max-width: 900px;
          margin: 0 auto;
        }
        .prompt-input {
          width: 100%;
          resize: none;
          padding: 12px 44px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: var(--panel);
          color: var(--fg);
          outline: none;
        }
        .prompt-input:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .prompt-input-icons {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .prompt-input-icons.left {
          position: absolute;
          left: 8px;
          bottom: 10px;
        }
        .prompt-input-icons.right {
          position: absolute;
          right: 8px;
          bottom: 10px;
        }
        .prompt-icon-button {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--fg);
          cursor: pointer;
        }
        .prompt-submit-button {
          width: 36px;
          height: 36px;
          border-radius: 12px;
        }
        .prompt-icon-button.is-recording {
          outline: 2px solid #ef4444;
          outline-offset: 2px;
        }
        .footer-text {
          text-align: center;
          margin-top: 8px;
          font-size: 12px;
          color: var(--muted);
        }

        /* Responsive tweaks */
        @media (max-width: 1024px) {
          .app-header {
            grid-template-columns: 1fr auto auto;
          }
          .header-center {
            justify-content: flex-start;
          }
        }
        @media (max-width: 768px) {
          .app-header {
            grid-template-columns: 1fr auto;
            grid-auto-flow: row;
            gap: 0.5rem 0.75rem;
          }
          .header-center {
            grid-column: 1 / -1;
            order: 3;
            justify-content: stretch;
          }
          .header-button {
            width: 100%;
            justify-content: center;
          }
          .header-logo {
            font-size: 1rem;
          }
          .app-main {
            padding: 0.5rem;
          }
          .prompt-input-wrapper {
            margin: 0 0.25rem;
          }
        }
        @media (max-width: 420px) {
          .hamburger {
            width: 36px;
            height: 32px;
          }
          .prompt-input {
            padding: 12px 40px;
          }
          .prompt-input-icons.left {
            left: 6px;
          }
          .prompt-input-icons.right {
            right: 6px;
          }
        }
      `}</style>
    </div>
  );
}

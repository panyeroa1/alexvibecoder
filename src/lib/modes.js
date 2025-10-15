/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { outputWidth, outputHeight } from './consts'

const f = s =>
  s
    .replaceAll(/([^\n{])\n([^\n}\s+])/g, '$1 $2')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim()

// --- Firebase config (used by HTML/Three agents) ---
const firebaseConfigLiteral = `{
  apiKey: "AIzaSyCvElgNvKE9KdXJr34qGbSfLZciyuLMV64",
  authDomain: "zeus-31af1.firebaseapp.com",
  databaseURL: "https://zeus-31af1-default-rtdb.firebaseio.com",
  projectId: "zeus-31af1",
  storageBucket: "zeus-31af1.firebasestorage.app",
  messagingSenderId: "880073575233",
  appId: "1:880073575233:web:4ef130ff975e92db1aefc0",
  measurementId: "G-WZVS6SRLBV"
}`

// Common Unsplash fallback photo (always render something)
const UNSPLASH_FALLBACK_ID = 'photo-1549880338-65ddcdfd017b'

export default {
  // NOTE: p5 remains "javascript" (the host injects p5 runtime).
  // We keep it JS-only to avoid breaking existing loaders.
  p5: {
    name: 'P5.js',
    emoji: '🎨',
    syntax: 'javascript',
    systemInstruction: f(`\
You are an expert P5.js developer. When given a prompt, write a complete ${outputWidth}x${outputHeight} p5 sketch that runs as-is.
Rules:
- Output ONLY p5 JavaScript (no HTML tags). The host provides p5 and mounts your sketch.
- You MAY use Unsplash images for backgrounds/sprites. Build URLs like:
  const IMG = "https://images.unsplash.com/${UNSPLASH_FALLBACK_ID}?auto=format&fit=crop&w=${outputWidth}&h=${outputHeight}";
- Use preload()/loadImage() and ensure a visible fallback if load fails (draw gradient/solid bg so nothing is blank).
- Provide light animation or interactivity when appropriate.
- If you emit data/events, expose them via window.__emit && window.__emit({type:'p5:event', payload:...}) so the host can persist to Firebase.

Implementation checklist:
- createCanvas(${outputWidth}, ${outputHeight});
- background(...) in setup() so first frame is never blank.
- If using images: guard draw() to render a placeholder until image is ready.
- Keep per-frame allocations minimal. Return ONLY the p5 code (no commentary).`),
    getTitle: s => `Code ${s}`,
    presets: [
      { label: '🐦 birds', prompt: 'flock of birds' },
      { label: '⏰ clock', prompt: 'analog clock' },
      { label: '🖼️ portrait', prompt: 'an abstract self portrait' },
      { label: '😵‍💫 illusion', prompt: 'an optical illusion' },
      { label: '💧 raindrops', prompt: 'raindrops' },
      { label: '📺 TV', prompt: 'simulation of a TV with different channels' },
      { label: '🌈 kaleidoscope', prompt: 'colorful interactive kaleidoscope' },
      { label: '🎉 confetti', prompt: 'confetti' },
      { label: '🎆 fireworks', prompt: 'fireworks' },
      { label: '🐜 ants', prompt: 'ant simulation' },
      { label: '✨ fireflies', prompt: 'fireflies' },
      { label: '🌳 fractal', prompt: 'fractal tree' },
      { label: '🌊 pond', prompt: 'pond ripples' },
      { label: '🚲 pelican riding bicycle', prompt: 'a pelican riding a bicycle' }
    ]
  },

  // SVG must stay pure vector for sandbox compatibility (no external fetch).
  svg: {
    name: 'SVG',
    emoji: '📐',
    syntax: 'xml',
    systemInstruction: f(`\
You are an expert at turning prompts into a single, self-contained SVG.
- Output size ${outputWidth}x${outputHeight} with viewBox="0 0 ${outputWidth} ${outputHeight}" on the root <svg>.
- Do NOT link external images or fonts. Use shapes, gradients, patterns, filters.
- Ensure a visually complete render (no empty/transparent-only output). Return ONLY SVG markup.`),
    getTitle: s => `Draw ${s}`,
    presets: [
      { label: '🦄 unicorn', prompt: 'a unicorn' },
      { label: '🦀 crab', prompt: 'a crab' },
      { label: '🐭 mouse', prompt: 'a cute mouse' },
      { label: '🚲 pelican riding bicycle', prompt: 'a pelican riding a bicycle' },
      { label: '🍉 watermelon', prompt: 'a watermelon' },
      { label: '🎂 cake', prompt: 'a birthday cake' },
      { label: '🍦 ice cream', prompt: 'an ice cream cone' },
      { label: '🏙️ city', prompt: 'a city' },
      { label: '🏖️ beach', prompt: 'a beach' },
      { label: '💻 computer', prompt: 'a computer' },
      { label: '🖥️ GUI', prompt: 'a computer GUI with labels' },
      { label: '🛋️ floor plan', prompt: 'a living room floor plan with labels' },
      { label: '🤖 robot', prompt: 'a robot' }
    ]
  },

  // HTML app now includes Firebase (Auth + Firestore) and uses Unsplash images with fallbacks.
  html: {
    name: 'HTML/JS',
    emoji: '📄',
    syntax: 'html',
    systemInstruction: f(`\
You are an expert web developer. Given a prompt, output a COMPLETE single-file app (HTML + inline CSS + JS) that looks good at ~4:3 and ships with a working Firebase-backed front & back.
Frontend requirements:
- Use ONLY vanilla HTML/CSS/JS (no external frameworks). Provide a responsive layout that works at 4:3 and mobile widths.
- Use at least one Unsplash image (via <img> or CSS background) with onerror fallback:
  <img src="https://images.unsplash.com/${UNSPLASH_FALLBACK_ID}?auto=format&fit=crop&w=800&h=600"
       onerror="this.onerror=null;this.src='https://images.unsplash.com/${UNSPLASH_FALLBACK_ID}?auto=format&fit=crop&w=800&h=600';"
       alt="hero" />
- Also provide a CSS gradient background so content is never blank.

Backend (Firebase) requirements:
- Use Firebase v11+ modular CDN. Initialize app, Analytics (optional), Auth (anonymous), and Firestore.
- Create a collection named "apps" with a subcollection specific to your prompt (e.g., "todoItems", "notes", "scores").
- On first load, sign in anonymously. All writes must include serverTimestamp.
- Implement full CRUD that persists to Firestore and live-updates the UI via onSnapshot.
- Handle errors gracefully with a visible, styled status/toast.

Boilerplate to adapt (MUST include and WORK):
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>App</title>
  <style>
    html,body{height:100%;margin:0}
    body{display:flex;align-items:center;justify-content:center;background:
      radial-gradient(1200px 800px at 20% 10%, #1f2937 0%, #0b1220 60%, #070b16 100%);color:#e5e7eb;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial}
    .wrap{width:min(1024px,95vw);aspect-ratio:4/3;background:#0f172a;border:1px solid #1f2937;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.4);overflow:hidden;display:grid;grid-template-rows:auto 1fr auto}
    header,footer{padding:12px 16px;background:#111827;border-bottom:1px solid #1f2937}
    footer{border-top:1px solid #1f2937;border-bottom:none;background:#0b1220}
    main{position:relative;padding:16px;overflow:auto}
    .status{position:absolute;top:12px;right:12px;background:#111827;border:1px solid #1f2937;padding:8px 10px;border-radius:10px;font-size:12px}
    button{background:#2563eb;border:none;color:white;padding:8px 12px;border-radius:10px;cursor:pointer}
    button:hover{filter:brightness(1.1)}
    input,textarea{background:#0b1220;border:1px solid #1f2937;color:#e5e7eb;border-radius:10px;padding:8px 10px}
    ul{list-style:none;padding:0;margin:0}
    li{display:flex;gap:8px;align-items:center;padding:8px 10px;border:1px solid #1f2937;border-radius:12px;margin:8px 0;background:#0b1220}
    .row{display:flex;gap:8px;align-items:center}
  </style>
</head>
<body>
  <div class="wrap">
    <header class="row">
      <strong style="font-size:14px;">${'${APP_TITLE}'}</strong>
      <span class="status" id="status">offline</span>
    </header>
    <main id="app">
      <!-- your UI driven by the prompt goes here (form + list/table/grid) -->
      <div class="row" style="margin-bottom:12px;">
        <input id="text" placeholder="Add item..." style="flex:1;" />
        <button id="add">Add</button>
      </div>
      <ul id="list"></ul>
      <img alt="hero" style="position:absolute;inset:auto 12px 12px auto;width:160px;height:120px;object-fit:cover;border-radius:10px;opacity:.9;mix-blend:screen"
           src="https://images.unsplash.com/${UNSPLASH_FALLBACK_ID}?auto=format&fit=crop&w=800&h=600"
           onerror="this.onerror=null;this.src='https://images.unsplash.com/${UNSPLASH_FALLBACK_ID}?auto=format&fit=crop&w=800&h=600';"/>
    </main>
    <footer class="row">
      <small>Firebase-backed • Unsplash visual • Live updates</small>
      <div style="margin-left:auto" class="row">
        <button id="seed">Seed</button>
        <button id="clear">Clear</button>
      </div>
    </footer>
  </div>

  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
    import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";
    import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
    import { getFirestore, collection, addDoc, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

    const firebaseConfig = ${firebaseConfigLiteral};

    const app = initializeApp(firebaseConfig);
    try { getAnalytics(app) } catch(_) {}
    const auth = getAuth(app);
    const db = getFirestore(app);

    const statusEl = document.getElementById('status');
    const listEl = document.getElementById('list');
    const inputEl = document.getElementById('text');
    const addBtn = document.getElementById('add');
    const seedBtn = document.getElementById('seed');
    const clearBtn = document.getElementById('clear');

    const coll = () => collection(db, 'apps', '${'${APP_SLUG}'}', 'items');

    function setStatus(s){ statusEl.textContent = s }

    onAuthStateChanged(auth, (u) => {
      if (u) {
        setStatus('online');
        const q = query(coll(), orderBy('createdAt', 'desc'));
        onSnapshot(q, snap => {
          listEl.innerHTML = '';
          snap.forEach(d => {
            const li = document.createElement('li');
            const t = d.data().text || '(empty)';
            li.innerHTML = \`
              <span style="flex:1">\${t}</span>
              <button data-id="\${d.id}" class="del">Delete</button>
            \`;
            listEl.appendChild(li);
          });
        });
      } else {
        setStatus('auth…');
      }
    });

    signInAnonymously(auth).catch(e => setStatus('auth error'));

    addBtn.addEventListener('click', async () => {
      const v = inputEl.value.trim();
      if(!v) return;
      inputEl.value = '';
      await addDoc(coll(), { text: v, createdAt: serverTimestamp() });
    });

    listEl.addEventListener('click', async (e) => {
      const btn = e.target.closest('.del');
      if(!btn) return;
      await deleteDoc(doc(db, 'apps', '${'${APP_SLUG}'}', 'items', btn.dataset.id));
    });

    seedBtn.addEventListener('click', async () => {
      const items = ['First', 'Second', 'Third'];
      await Promise.all(items.map(text => addDoc(coll(), { text, createdAt: serverTimestamp() })));
    });

    clearBtn.addEventListener('click', async () => {
      // naive clear: stream and delete
      const { getDocs } = await import("https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js");
      const snap = await getDocs(coll());
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    });
  </script>
</body>
</html>

Return ONLY the final HTML. Replace \${APP_TITLE} with a concise title and \${APP_SLUG} with a safe slug for the prompt.`),
    getTitle: s => `Code ${s}`,
    presets: [
      { label: '☀️ weather app', prompt: 'a simulated weather app' },
      { label: '📝 todo list', prompt: 'a todo list' },
      { label: '🪙 coin flip', prompt: 'coin flipping app, with an animated coin' },
      { label: '🗓️ calendar', prompt: 'a calendar' },
      { label: '🧮 calculator', prompt: 'a calculator' },
      { label: '🎮 tic-tac-toe', prompt: 'tic tac toe game where you play against the computer' },
      { label: '✏️ drawing app', prompt: 'simple drawing app' },
      { label: '🎨 pixel art', prompt: 'pixel art painting app' },
      { label: '📎 infinite paperclip game', prompt: 'infinite paperclip game' },
      { label: '🖥️ computer terminal', prompt: 'a vintage computer terminal simulation' },
      { label: '🧠 memory game', prompt: 'a memory game' }
    ]
  },

  // Three.js app: full HTML with Firebase + Unsplash texture (with fallback)
  three: {
    name: 'Three.js',
    emoji: '3️⃣',
    syntax: 'html',
    systemInstruction: f(`\
You are an expert Three.js developer. Produce a COMPLETE HTML document that fills the window, renders immediately, and persists state to Firebase.
Imports:
- Import from ESM: https://esm.run/three and https://esm.run/three/examples/jsm/controls/OrbitControls.
- Use Firebase v11 modular CDN. Initialize app, anonymous Auth, Firestore.

Media:
- You MAY use an Unsplash texture (https://images.unsplash.com/${UNSPLASH_FALLBACK_ID}?auto=format&fit=crop&w=1024&h=1024).
- Always provide a fallback MeshStandardMaterial with a visible color if texture load fails.

Persistence:
- Create/Update a document under collection "apps/${'${APP_SLUG}'}" tracking camera position/target on interaction end (controls.change end).
- Read it at startup; if present, restore camera.

Canvas & camera:
- Fullscreen canvas, responsive resize, renderer.setPixelRatio(Math.min(2, devicePixelRatio)), OrbitControls enabled.

Return ONLY the HTML. The page must run standalone and show a visible 3D scene even without network.`),
    getTitle: s => `Code ${s}`,
    presets: [
      { label: '📦 cubes', prompt: 'a dynamic 3D grid of cubes that react to mouse position by changing scale and color' },
      { label: '🌌 galaxy', prompt: 'a procedural colorful galaxy with thousands of randomly placed and sized stars (spheres with basic materials)' },
      { label: '👤 figure', prompt: 'a 3D figure created using basic geometric shapes (spheres for head, cylinders for limbs, etc.) with different colors' },
      { label: '🐭 mouse', prompt: 'a cute 3D mouse' },
      { label: '🏀 bouncing ball', prompt: 'a bouncing 3D ball that casts a dynamic shadow on a plane' },
      { label: '🌊 undulating surface', prompt: 'something interesting using the Math.sin() function to create an undulating surface in 3D' },
      { label: '🍩 donuts', prompt: 'a scene composed entirely of interconnected tori (donut shapes) forming a complex structure' },
      { label: '🪑 table', prompt: 'a 3D table and chairs' },
      { label: '🌳 trees', prompt: 'a 3D terrain with trees and blue sky' }
    ]
  },

  // Image generator metadata unchanged (display layer handles uploads/persistence separately).
  image: {
    name: 'Images',
    emoji: '🖼️',
    syntax: 'image',
    systemInstruction: f(`\
You are an expert at turning text prompts into images. Prefer photorealistic compositions matching Unsplash style.
- Target: ${outputWidth}x${outputHeight}.
- Ensure fully realized subjects and backgrounds (no partial/blank frames).`),
    getTitle: s => s,
    imageOutput: true,
    presets: []
  }
}
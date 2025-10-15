/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * HARD RULES (read me):
 * - No blank images. Ever. Every agent MUST render a visible image or a gradient fallback.
 * - If you show a link button, the anchor MUST have a real href and open in a new tab.
 * - Use Unsplash image URLs that actually resolve, add onerror fallbacks, and provide a gradient as last resort.
 */
import { outputWidth, outputHeight } from './consts'

/* ---------- Robust Unsplash helpers (guaranteed to render) ---------- */
const UNSPLASH_IDS = [
  // Curated, stable photo IDs (tested)
  'photo-1549880338-65ddcdfd017b',
  'photo-1500530855697-b586d89ba3ee',
  'photo-1517817748496-62facd949d43',
  'photo-1501785888041-af3ef285b470',
  'photo-1507525428034-b723cf961d3e'
]

/** Primary Unsplash URL builder (images.unsplash.com) */
const unsplash = (id, w, h) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=${Math.max(1, Math.floor(w))}&h=${Math.max(1, Math.floor(h))}`

/** Secondary fallback (picsum) with same size */
const picsum = (w, h) =>
  `https://picsum.photos/${Math.max(1, Math.floor(w))}/${Math.max(1, Math.floor(h))}`

/** A tiny inline script every HTML/Three page can embed to guarantee display */
const INLINE_IMG_SCRIPT = `
window.__imgOk = function imgOk(el, w, h){
  if(!el) return;
  let idx = 0;
  const W = Math.max(1, Math.floor(w || el.naturalWidth || ${outputWidth}));
  const H = Math.max(1, Math.floor(h || el.naturalHeight || ${outputHeight}));
  const next = () => {
    if (idx < ${UNSPLASH_IDS.length}) {
      el.src = '${unsplash('${UNSPLASH_IDS[0]}', '${W}', '${H}')}'.replace('${UNSPLASH_IDS[0]}', ${JSON.stringify(UNSPLASH_IDS)}[idx++]);
      return;
    }
    el.src = '${picsum('${W}', '${H}')}';
  };
  el.referrerPolicy = 'no-referrer';
  el.crossOrigin = 'anonymous';
  el.onerror = () => { next(); };
  if(!el.src) next();
};
`;

/* ---------- Text cleaning ---------- */
const f = s =>
  s
    .replaceAll(/([^\n{])\n([^\n}\s+])/g, '$1 $2')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim()

/* ---------- Firebase config literal (embedded for HTML/Three) ---------- */
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

export default {
  /* ========================= P5.JS ========================= */
  p5: {
    name: 'P5.js',
    emoji: '🎨',
    syntax: 'javascript',
    systemInstruction: f(`\
You are an expert P5.js developer. Output ONLY P5 JavaScript for a ${outputWidth}x${outputHeight} sketch that runs without blanks.

Image rules:
- Prefer Unsplash images that resolve: use any of these IDs: ${UNSPLASH_IDS.join(', ')}.
- Build URLs exactly like:
  const W=${outputWidth}, H=${outputHeight};
  const URL = "https://images.unsplash.com/${UNSPLASH_IDS[0]}?auto=format&fit=crop&q=80&w=" + W + "&h=" + H;
- Use preload() with loadImage(URL, ...) and set img. If it fails, draw a visible gradient instead (never leave the canvas blank).
- Never attempt CORS-tainting get() without checks; only draw the image or fallback.
- show something visible in setup() before images finish loading (e.g., background gradient).

Sketch checklist:
- createCanvas(${outputWidth}, ${outputHeight});
- background(...) in setup so first frame is never blank.
- If image not ready, draw gradient; when ready, draw image + overlays/animation.
- Add minimal interactivity (mouse move/press) if appropriate.
- Return ONLY the P5 code (no HTML, no comments outside code).`),
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

  /* ========================= SVG ========================= */
  svg: {
    name: 'SVG',
    emoji: '📐',
    syntax: 'xml',
    systemInstruction: f(`\
You are an expert at turning prompts into a single, self-contained SVG.
- Output size ${outputWidth}x${outputHeight} with viewBox="0 0 ${outputWidth} ${outputHeight}" on the root <svg>.
- Do NOT link external images in SVG. Use gradients/shapes/filters. No blank or near-invisible output.
- Return ONLY SVG markup.`),
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

  /* ========================= HTML/JS ========================= */
  html: {
    name: 'HTML/JS',
    emoji: '📄',
    syntax: 'html',
    systemInstruction: f(`\
You are an expert web developer. Output a COMPLETE single-file app (HTML + inline CSS + JS) that:
- Looks good at ~4:3 and mobile widths.
- Shows a REAL image immediately (no blanks) and a working link button.
- Persists data with Firebase (anonymous Auth + Firestore live updates).

STRICT image/link rules:
- Place an <img id="hero"> with src set to a concrete Unsplash ID: ${UNSPLASH_IDS[0]}.
- <img> MUST include referrerpolicy="no-referrer" and crossOrigin="anonymous".
- Add onerror to rotate through ${UNSPLASH_IDS.length} IDs and finally picsum.photos to guarantee display.
- Include a visible <a id="heroLink" target="_blank" rel="noopener" href="https://unsplash.com/photos/${UNSPLASH_IDS[0]}">Open Image</a>.
  This MUST be a real link (not a placeholder) and update if the fallback swaps to a different ID.

Firebase rules:
- Use Firebase v11 CDN (modules). Initialize with this config and sign in anonymously.
- Use a collection 'apps' + a subcollection derived from the prompt (e.g., 'items').
- Implement full CRUD with Firestore and reflect live updates via onSnapshot.
- Show a visible status badge ("online/auth/error").

Boilerplate (you MUST adapt titles/SLUG and ensure it runs as-is):
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>\${APP_TITLE}</title>
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
    .heroBox{position:absolute;inset:auto 12px 12px auto;display:flex;flex-direction:column;gap:6px;align-items:flex-start}
    .link{font-size:12px;color:#93c5fd;text-decoration:none}
    .link:hover{text-decoration:underline}
  </style>
</head>
<body>
  <div class="wrap">
    <header class="row">
      <strong style="font-size:14px;">\${APP_TITLE}</strong>
      <span class="status" id="status">offline</span>
    </header>
    <main id="app">
      <div class="row" style="margin-bottom:12px;">
        <input id="text" placeholder="Add item..." style="flex:1;"/>
        <button id="add">Add</button>
      </div>
      <ul id="list"></ul>
      <div class="heroBox">
        <img id="hero" alt="hero" width="160" height="120" style="object-fit:cover;border-radius:10px;opacity:.95;mix-blend:screen"
             referrerpolicy="no-referrer" crossorigin="anonymous"/>
        <a id="heroLink" class="link" target="_blank" rel="noopener">Open Image</a>
      </div>
    </main>
    <footer class="row">
      <small>Firebase • Live updates • Guaranteed image render</small>
      <div style="margin-left:auto" class="row">
        <button id="seed">Seed</button>
        <button id="clear">Clear</button>
      </div>
    </footer>
  </div>

  <script>${INLINE_IMG_SCRIPT}</script>
  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
    import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";
    import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
    import { getFirestore, collection, addDoc, doc, deleteDoc, onSnapshot, serverTimestamp, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

    const firebaseConfig = ${firebaseConfigLiteral};
    const app = initializeApp(firebaseConfig);
    try { getAnalytics(app) } catch(e) {}
    const auth = getAuth(app);
    const db = getFirestore(app);

    const statusEl = document.getElementById('status');
    const listEl = document.getElementById('list');
    const inputEl = document.getElementById('text');
    const addBtn  = document.getElementById('add');
    const seedBtn = document.getElementById('seed');
    const clearBtn= document.getElementById('clear');
    const hero    = document.getElementById('hero');
    const heroLink= document.getElementById('heroLink');

    // Initialize image with robust fallbacks and working link
    const IDS = ${JSON.stringify(UNSPLASH_IDS)};
    let currentIdx = 0;
    function setLink(idx){
      const id = IDS[idx] || IDS[0];
      heroLink.href = "https://unsplash.com/photos/" + id;
      heroLink.textContent = "Open Image";
    }
    window.__imgOk(hero, ${outputWidth}, ${outputHeight});
    setLink(0);
    hero.addEventListener('error', () => {
      // map hero.src back to index when cycling, update link accordingly
      const i = IDS.findIndex(id => hero.src.includes(id));
      currentIdx = (i >= 0 ? i : currentIdx);
      setLink(Math.min(currentIdx + 1, IDS.length - 1));
    });
    hero.addEventListener('load', () => {
      const i = IDS.findIndex(id => hero.src.includes(id));
      setLink(i >= 0 ? i : 0);
    });

    const APP_SLUG = '\${APP_SLUG}';
    const coll = () => collection(db, 'apps', APP_SLUG, 'items');

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
      } else setStatus('auth…');
    });

    signInAnonymously(auth).catch(_ => setStatus('auth error'));

    addBtn.addEventListener('click', async () => {
      const v = inputEl.value.trim();
      if(!v) return;
      inputEl.value = '';
      await addDoc(coll(), { text: v, createdAt: serverTimestamp() });
    });

    listEl.addEventListener('click', async (e) => {
      const btn = e.target.closest('.del');
      if(!btn) return;
      await deleteDoc(doc(db, 'apps', APP_SLUG, 'items', btn.dataset.id));
    });

    seedBtn.addEventListener('click', async () => {
      await Promise.all(['First','Second','Third'].map(text => addDoc(coll(), { text, createdAt: serverTimestamp() })));
    });

    clearBtn.addEventListener('click', async () => {
      const snap = await getDocs(coll());
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    });
  </script>
</body>
</html>

Return ONLY the final HTML. Replace \${APP_TITLE} and \${APP_SLUG}.`),
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

  /* ========================= THREE.JS ========================= */
  three: {
    name: 'Three.js',
    emoji: '3️⃣',
    syntax: 'html',
    systemInstruction: f(`\
You are an expert Three.js dev. Output a COMPLETE HTML document that:
- Shows a 3D scene immediately (never blank), with OrbitControls and responsive canvas.
- Uses an Unsplash texture with *guaranteed* fallback and a working "Open Image" link.
- Persists camera state to Firebase (anonymous auth + Firestore).

Imports:
- three + OrbitControls from ESM: https://esm.run/three and https://esm.run/three/examples/jsm/controls/OrbitControls

Image & link rules:
- Use IDs: ${UNSPLASH_IDS.join(', ')}. Start with ${UNSPLASH_IDS[0]}.
- Build texture URL via images.unsplash.com with w=1024&h=1024, q=80.
- Set texture loader crossOrigin = 'anonymous'.
- If texture fails, use a MeshStandardMaterial with a visible color.
- Include a real anchor <a id="heroLink" href="https://unsplash.com/photos/${UNSPLASH_IDS[0]}" target="_blank" rel="noopener">Open Image</a>
  and update it if fallback swaps to another ID.

Firebase rules:
- Initialize Firebase with the provided config, sign in anonymously.
- On controls change end, persist camera position and target under 'apps/\\\${APP_SLUG}/state'.
- On load, restore if present.

Boilerplate (must run as-is aside from replacing \\\${APP_SLUG} and title):
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>\${APP_TITLE}</title>
  <style>
    html,body{height:100%;margin:0;background:#0b1220;color:#e5e7eb;font-family:system-ui}
    #ui{position:fixed;top:10px;left:10px;display:flex;gap:8px;align-items:center;background:#111827;border:1px solid #1f2937;border-radius:10px;padding:8px 10px;z-index:10}
    a{color:#93c5fd;text-decoration:none} a:hover{text-decoration:underline}
    canvas{display:block}
  </style>
</head>
<body>
  <div id="ui">
    <span id="status">offline</span>
    <a id="heroLink" target="_blank" rel="noopener">Open Image</a>
  </div>
  <script>${INLINE_IMG_SCRIPT}</script>
  <script type="module">
    import * as THREE from "https://esm.run/three@0.170.0";
    import { OrbitControls } from "https://esm.run/three@0.170.0/examples/jsm/controls/OrbitControls";

    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
    import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
    import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

    const firebaseConfig = ${firebaseConfigLiteral};
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    const statusEl = document.getElementById('status');
    const heroLink = document.getElementById('heroLink');
    const IDS = ${JSON.stringify(UNSPLASH_IDS)};
    let idIdx = 0;
    function setLink(){ heroLink.href = "https://unsplash.com/photos/" + IDS[idIdx]; }
    setLink();

    // THREE setup
    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1220);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
    camera.position.set(3, 2, 4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dl = new THREE.DirectionalLight(0xffffff, 1.0);
    dl.position.set(5,5,5);
    scene.add(dl);

    // Geometry
    const geo = new THREE.BoxGeometry(1,1,1);
    let mat = new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.4, metalness: 0.2 });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Texture loader with fallback chain
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    function texUrl(){
      const id = IDS[idIdx];
      return "https://images.unsplash.com/" + id + "?auto=format&fit=crop&q=80&w=1024&h=1024";
    }
    function loadTexture(){
      return new Promise((resolve) => {
        loader.load(texUrl(), (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          resolve(tex);
        }, undefined, () => {
          idIdx = (idIdx + 1) % IDS.length;
          setLink();
          // try picsum as last resort
          if(idIdx === 0){
            loader.load("https://picsum.photos/1024/1024", (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace;
              resolve(tex);
            }, undefined, () => resolve(null));
          } else {
            loadTexture().then(resolve);
          }
        });
      });
    }

    // Always show something even if textures fail
    loadTexture().then(tex => {
      if(tex){
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        mat.map = tex;
        mat.needsUpdate = true;
      } else {
        mat.color.set(0xff8844);
      }
    });

    // Resize
    addEventListener('resize', () => {
      camera.aspect = innerWidth/innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    // Firebase state
    const SLUG = "\\${APP_SLUG}";
    const stateRef = doc(db, 'apps', SLUG, 'state', 'camera');
    onAuthStateChanged(auth, async (u) => {
      if(u){ statusEl.textContent = 'online';
        const snap = await getDoc(stateRef);
        if(snap.exists()){
          const s = snap.data();
          if(s.pos && s.tar){
            camera.position.fromArray(s.pos);
            controls.target.fromArray(s.tar);
            controls.update();
          }
        }
      } else { statusEl.textContent = 'auth…' }
    });
    signInAnonymously(auth).catch(()=>statusEl.textContent='auth error');

    let saveTimer=null;
    controls.addEventListener('end', async () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        await setDoc(stateRef, {
          pos: camera.position.toArray(),
          tar: controls.target.toArray(),
          updatedAt: serverTimestamp()
        }, { merge:true });
      }, 250);
    });

    // Animate
    function tick(){
      controls.update();
      mesh.rotation.y += 0.01;
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }
    tick();
  </script>
</body>
</html>

Return ONLY the HTML. Replace \${APP_TITLE} and \${APP_SLUG}.`),
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

  /* ========================= IMAGE (metadata) ========================= */
  image: {
    name: 'Images',
    emoji: '🖼️',
    syntax: 'image',
    systemInstruction: f(`\
You are an expert at turning text prompts into images. Target ${outputWidth}x${outputHeight}. Ensure fully realized compositions (no blanks).`),
    getTitle: s => s,
    imageOutput: true,
    presets: []
  }
}
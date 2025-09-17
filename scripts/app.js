/* System Design Book — Shared behaviors
   Path: scripts/app.js
   Responsibilities:
   - Highlight current nav link by toggling aria-current (does NOT build nav)
   - Toggle mobile nav visibility
   - Toggle quiz <details> open/close within .mastery
   - Lightweight enhancements only; no external calls
*/

(function () {
  const bySel = (s, r = document) => r.querySelector(s);
  const bySelAll = (s, r = document) => Array.from(r.querySelectorAll(s));

  document.addEventListener('DOMContentLoaded', () => {
    highlightActiveNav();
    setupMobileNavToggle();
    setupQuizToggles();
  });

  /* ================
     Active Nav
     ================ */
  function highlightActiveNav() {
    const current = sanitizePath(location.pathname);
    const baseEl = bySel('base');
    const baseHref = baseEl ? baseEl.getAttribute('href') || '' : '';
    // With <base>, anchor.href becomes absolute; compare by last path segment(s)
    const links = bySelAll('.app-nav .links a');

    links.forEach(a => a.removeAttribute('aria-current'));

    let bestMatch = null;
    let bestScore = -1;

    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      const score = matchScore(current, href, baseHref);
      if (score > bestScore) { bestScore = score; bestMatch = a; }
    });

    if (bestMatch) {
      bestMatch.setAttribute('aria-current', 'page');
    }
  }

  function sanitizePath(p) {
    if (!p) return 'index.html';
    // GitHub Pages-safe default: if path ends with '/', treat as index.html
    if (p.endsWith('/')) return p + 'index.html';
    return p;
  }

  // Prefer exact suffix match of href against current path. Higher is better.
  function matchScore(currentPath, href, baseHref) {
    // Normalize to relative comparison contexts
    const curr = currentPath.split('/').filter(Boolean); // e.g., ['chapters','ch01.html']
    const ref = href.split('/').filter(Boolean);

    // Simple cases
    if (href === 'index.html' && currentPath.endsWith('index.html')) return 100;
    if (ref.length && curr.length && ref.at(-1) === curr.at(-1)) return 90;

    // Chapters vs root: consider base href
    // If link points to chapters/* and current path is inside /chapters/, boost
    const inChapters = curr.includes('chapters');
    const refChapters = ref.includes('chapters');
    if (inChapters && refChapters) return 80;

    // Partial overlap score
    let overlap = 0;
    for (let i = 0; i < Math.min(curr.length, ref.length); i++) {
      if (curr[i] === ref[i]) overlap++;
    }
    return 10 + overlap;
  }

  /* ================
     Mobile Nav Toggle
     ================ */
  function setupMobileNavToggle() {
    const nav = bySel('.app-nav');
    const toggle = bySel('[data-nav-toggle]');
    if (!nav || !toggle) return;

    const setOpen = (open) => {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', () => {
      const open = !nav.classList.contains('open');
      setOpen(open);
    });

    // Close nav when clicking outside on small screens
    document.addEventListener('click', (e) => {
      if (!nav.classList.contains('open')) return;
      const within = nav.contains(e.target);
      if (!within) setOpen(false);
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ================
     Quiz Toggles
     ================ */
  function setupQuizToggles() {
    // Button API:
    // <div class="quiz-controls">
    //   <button class="btn" data-quiz-toggle="open">Open all answers</button>
    //   <button class="btn" data-quiz-toggle="close">Close all</button>
    // </div>
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-quiz-toggle]');
      if (!btn) return;

      const intent = (btn.getAttribute('data-quiz-toggle') || '').toLowerCase();
      // Scope: nearest .mastery section, else whole document
      const scope = btn.closest('.mastery') || document;
      const panels = bySelAll('details', scope);

      if (intent === 'open') {
        panels.forEach(d => d.open = true);
      } else if (intent === 'close') {
        panels.forEach(d => d.open = false);
      } else if (intent === 'toggle') {
        const anyClosed = panels.some(d => !d.open);
        panels.forEach(d => d.open = anyClosed);
      }
    });
  }
})();

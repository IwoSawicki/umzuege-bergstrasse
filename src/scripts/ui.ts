/**
 * Globale UI-Interaktionen (framework-frei, wird von Astro gebündelt).
 * Läuft auf jeder Seite; alle Blöcke sind optional (nur aktiv, wenn die
 * jeweiligen Elemente im DOM vorhanden sind).
 */

const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  if (!menu || !btn) return;
  const set = (open: boolean) => {
    menu.hidden = !open;
    (menu as HTMLElement).style.display = open ? 'flex' : 'none';
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  };
  btn.addEventListener('click', () => set(menu.hidden));
  menu.querySelectorAll('[data-menu-close]').forEach((a) =>
    a.addEventListener('click', () => set(false)),
  );
}

function initTabs() {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.svc-tab'));
  const panel = document.querySelector<HTMLElement>('[data-tab-panel]');
  const elTitle = document.querySelector<HTMLElement>('[data-tab-title]');
  const elText = document.querySelector<HTMLElement>('[data-tab-text]');
  const elImg = document.querySelector<HTMLElement>('[data-tab-img]');
  const elLink = document.querySelector<HTMLAnchorElement>('[data-tab-link]');
  if (!tabs.length || !panel) return;

  let data: any[] = [];
  try {
    data = JSON.parse(panel.dataset.services || '[]');
  } catch {
    data = [];
  }
  let current = 0;

  const select = (i: number) => {
    const s = data[i];
    if (!s || i === current) return;
    // Richtung bestimmt, aus welcher Seite der neue Inhalt hereinkommt
    const forward = i > current;
    current = i;

    tabs.forEach((b, idx) => {
      const on = idx === i;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
    });
    if (elTitle) elTitle.textContent = s.title;
    if (elText) elText.textContent = s.text;
    if (elImg) elImg.textContent = s.imgLabel;
    if (elLink && s.href) elLink.setAttribute('href', s.href);

    if (!reduceMotion) {
      panel.style.animation = 'none';
      void panel.offsetWidth; // Reflow, damit die Animation neu startet
      panel.style.animation =
        `${forward ? 'svcInRight' : 'svcInLeft'} .5s cubic-bezier(.22,1,.36,1)`;
    }
  };

  tabs.forEach((b) =>
    b.addEventListener('click', () => select(parseInt(b.dataset.tab || '0', 10))),
  );

  // Wischen zwischen den Leistungen (Touch)
  let sx = 0;
  let sy = 0;
  panel.addEventListener(
    'touchstart',
    (e) => {
      sx = e.changedTouches[0].clientX;
      sy = e.changedTouches[0].clientY;
    },
    { passive: true },
  );
  panel.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      // nur eindeutig horizontale Gesten auswerten (kein Konflikt mit Scrollen)
      if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const next = dx < 0 ? current + 1 : current - 1;
      if (next >= 0 && next < data.length) select(next);
    },
    { passive: true },
  );

  // Pfeiltasten für Tastaturbedienung
  tabs.forEach((b) =>
    b.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = current + (e.key === 'ArrowRight' ? 1 : -1);
      if (next >= 0 && next < data.length) {
        select(next);
        tabs[next].focus();
      }
    }),
  );
}

function initFaq() {
  const container = document.querySelector<HTMLElement>('[data-faq]');
  if (!container) return;
  const items = Array.from(container.querySelectorAll<HTMLElement>('.faq-item'));
  if (!items.length) return;

  const setOpen = (item: HTMLElement, open: boolean) => {
    item.classList.toggle('is-open', open);
    const btn = item.querySelector<HTMLButtonElement>('.faq-q');
    const sign = item.querySelector<HTMLElement>('.faq-sign');
    if (btn) btn.setAttribute('aria-expanded', String(open));
    if (sign) sign.textContent = open ? '−' : '+';
  };

  items.forEach((item) => {
    setOpen(item, false); // Accordion startet geschlossen
    const btn = item.querySelector<HTMLButtonElement>('.faq-q');
    btn?.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      // Nur eine Frage gleichzeitig offen
      items.forEach((other) => { if (other !== item) setOpen(other, false); });
      setOpen(item, willOpen);
    });
  });
}

function initScrollTop() {
  document.querySelectorAll('[data-scroll-top]').forEach((btn) =>
    btn.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }),
    ),
  );
}

function initRevealAndParallax() {
  const ease = 'cubic-bezier(.22,1,.36,1)';
  const vh = () => window.innerHeight || 800;
  const revealEls: HTMLElement[] = [];

  const hide = (el: HTMLElement, delay: number) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(26px)';
    el.dataset.rd = String(delay || 0);
    revealEls.push(el);
  };
  if (!reduceMotion) {
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      if (el.getBoundingClientRect().top > vh() * 0.92) hide(el, 0);
    });
    document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((box) => {
      if (box.getBoundingClientRect().top > vh() * 0.92) {
        Array.from(box.children).forEach((c, i) =>
          hide(c as HTMLElement, Math.min(i, 10) * 80),
        );
      }
    });
  }
  const show = (el: HTMLElement) => {
    if (el.dataset.shown) return;
    el.dataset.shown = '1';
    setTimeout(() => {
      el.style.transition = `opacity .7s ${ease},transform .7s ${ease}`;
      el.style.opacity = '1';
      el.style.transform = 'none';
      setTimeout(() => {
        el.style.transition = '';
        el.style.opacity = '';
        el.style.transform = '';
      }, 780);
    }, parseInt(el.dataset.rd || '0', 10));
  };

  const parallaxEls = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));

  // Kennzahlen-Zähler
  const statsEl = document.querySelector<HTMLElement>('[data-stats]');
  const statValues = Array.from(document.querySelectorAll<HTMLElement>('[data-stat-value]'));
  let counted = false;
  const fmt = (el: HTMLElement, v: number) => {
    switch (el.dataset.statFormat) {
      case 'plus': return Math.round(v) + '+';
      case 'thousand': return Math.round(v).toLocaleString('de-DE') + '+';
      case 'rating': return v.toFixed(1).replace('.', ',') + ' ★';
      case 'percent': return Math.round(v) + ' %';
      default: return String(Math.round(v));
    }
  };
  const startCount = () => {
    if (counted) return;
    counted = true;
    if (reduceMotion) return;
    const t0 = Date.now();
    const dur = 1400;
    const iv = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      statValues.forEach((el) => {
        const target = parseFloat(el.dataset.statTarget || '0');
        el.textContent = fmt(el, target * e);
      });
      if (p >= 1) clearInterval(iv);
    }, 40);
  };

  const tick = () => {
    const h = vh();
    revealEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < h * 0.92 && r.bottom > 0) show(el);
    });
    if (!reduceMotion) {
      parallaxEls.forEach((el) => {
        const r = (el.parentElement as HTMLElement).getBoundingClientRect();
        const p = (r.top + r.height / 2 - h / 2) / h;
        el.style.transform = `translateY(${(-p * 34).toFixed(1)}px)`;
      });
    }
    if (statsEl && statsEl.getBoundingClientRect().top < h * 0.95) startCount();
  };

  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick);
  tick();
  setTimeout(() => revealEls.forEach(show), 1800); // Sicherheitsnetz
}

function init() {
  initMenu();
  initTabs();
  initFaq();
  initScrollTop();
  initRevealAndParallax();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

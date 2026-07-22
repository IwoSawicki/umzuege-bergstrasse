/* =========================================================
   Umzüge Bergstraße – Interaktion (Vanilla JS)
   Ersetzt die Design-Component-Logik (DCLogic) durch
   klassisches JavaScript: Menü, Tabs, FAQ, Formular,
   Scroll-Reveal, Parallax und animierte Kennzahlen.
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobiles Menü ---------- */
  var menu = document.getElementById('mobile-menu');
  var menuBtn = document.querySelector('[data-menu-toggle]');
  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menu.hidden = !open;
    menu.style.display = open ? 'flex' : 'none';
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      setMenu(menu.hidden);
    });
  }
  document.querySelectorAll('[data-menu-close]').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  /* ---------- Leistungs-Tabs ---------- */
  var services = [
    { title: 'Sorgenfrei umziehen', text: 'Wir gestalten Ihren Privatumzug reibungslos und angenehm – vom Verpacken über den Transport bis zum Aufbau am neuen Ort. Sie freuen sich einfach auf Ihr neues Zuhause.', imgLabel: 'Foto: Privatumzug / Kartons tragen' },
    { title: 'Firmenumzug mit System', text: 'Büro- und Betriebsumzüge planen wir so, dass Ihr Betrieb mit minimaler Ausfallzeit weiterläuft – abends, am Wochenende oder etappenweise, ganz nach Ihrem Bedarf.', imgLabel: 'Foto: Büroumzug / Arbeitsplätze' },
    { title: 'Entrümpelung & Haushaltsauflösung', text: 'Wohnungen, Keller, Dachböden oder komplette Haushaltsauflösungen – wir arbeiten diskret, zügig und übergeben besenrein. Auf Wunsch auch bei sensiblen Situationen mit besonderem Feingefühl.', imgLabel: 'Foto: Entrümpelung / Kellerraum' },
    { title: 'Fachgerechte Entsorgung', text: 'Alte Möbel, Sperrmüll und Elektrogeräte entsorgen wir fachgerecht und umweltbewusst. Verwertbares rechnen wir Ihnen an – das senkt Ihre Kosten spürbar.', imgLabel: 'Foto: Entsorgung / Transporter' }
  ];
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.svc-tab'));
  var panel = document.querySelector('[data-tab-panel]');
  var elTitle = document.querySelector('[data-tab-title]');
  var elText = document.querySelector('[data-tab-text]');
  var elImg = document.querySelector('[data-tab-img]');
  var animToggle = false;
  function selectTab(i) {
    var s = services[i];
    if (!s) return;
    tabs.forEach(function (btn, idx) {
      var on = idx === i;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (elTitle) elTitle.textContent = s.title;
    if (elText) elText.textContent = s.text;
    if (elImg) elImg.textContent = s.imgLabel;
    if (panel && !reduceMotion) {
      animToggle = !animToggle;
      panel.style.animation = 'none';
      // reflow, damit die Animation neu startet
      void panel.offsetWidth;
      panel.style.animation = (animToggle ? 'tabIn' : 'tabIn2') +
        ' .5s cubic-bezier(.22,1,.36,1) backwards';
    }
  }
  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectTab(parseInt(btn.getAttribute('data-tab'), 10));
    });
  });

  /* ---------- FAQ-Accordion ---------- */
  document.querySelectorAll('[data-faq] .faq-item').forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    var answer = item.querySelector('.faq-a');
    var sign = item.querySelector('.faq-sign');
    if (!btn || !answer) return;
    btn.addEventListener('click', function () {
      var open = item.classList.toggle('is-open');
      answer.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (sign) sign.textContent = open ? '−' : '+';
    });
  });

  /* ---------- Kontaktformular ---------- */
  var form = document.querySelector('[data-contact-form]');
  var success = document.querySelector('[data-form-success]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;
      // Hinweis: Ohne Backend erfolgt hier nur die Erfolgsanzeige.
      // Für echten Versand einen Endpunkt anbinden (z. B. Formspree,
      // eigenes Skript oder Mail-Service).
      form.style.display = 'none';
      if (success) success.hidden = false;
    });
  }

  /* ---------- Nach-oben-Button ---------- */
  var topBtn = document.querySelector('[data-scroll-top]');
  if (topBtn) {
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Scroll-Reveal + Stagger ---------- */
  var ease = 'cubic-bezier(.22,1,.36,1)';
  function vh() { return window.innerHeight || 800; }
  var revealEls = [];
  function hide(el, delay) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(26px)';
    el.dataset.rd = delay || 0;
    revealEls.push(el);
  }
  if (!reduceMotion) {
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      if (el.getBoundingClientRect().top > vh() * 0.92) hide(el, 0);
    });
    document.querySelectorAll('[data-stagger]').forEach(function (box) {
      if (box.getBoundingClientRect().top > vh() * 0.92) {
        Array.prototype.forEach.call(box.children, function (c, i) {
          hide(c, Math.min(i, 10) * 80);
        });
      }
    });
  }
  function show(el) {
    if (el.dataset.shown) return;
    el.dataset.shown = '1';
    setTimeout(function () {
      el.style.transition = 'opacity .7s ' + ease + ',transform .7s ' + ease;
      el.style.opacity = '1';
      el.style.transform = 'none';
      setTimeout(function () {
        el.style.transition = '';
        el.style.opacity = '';
        el.style.transform = '';
      }, 780);
    }, parseInt(el.dataset.rd || 0, 10));
  }

  /* ---------- Parallax ---------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));

  /* ---------- Kennzahlen-Zähler ---------- */
  var statsEl = document.querySelector('[data-stats]');
  var statValues = Array.prototype.slice.call(document.querySelectorAll('[data-stat-value]'));
  var counted = false;
  function fmt(el, v) {
    switch (el.getAttribute('data-stat-format')) {
      case 'plus': return Math.round(v) + '+';
      case 'thousand': return Math.round(v).toLocaleString('de-DE') + '+';
      case 'rating': return v.toFixed(1).replace('.', ',') + ' ★';
      case 'percent': return Math.round(v) + ' %';
      default: return String(Math.round(v));
    }
  }
  function startCount() {
    if (counted) return;
    counted = true;
    if (reduceMotion) return; // Endwerte stehen bereits im HTML
    var t0 = Date.now(), dur = 1400;
    var iv = setInterval(function () {
      var p = Math.min(1, (Date.now() - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      statValues.forEach(function (el) {
        var target = parseFloat(el.getAttribute('data-stat-target'));
        el.textContent = fmt(el, target * e);
      });
      if (p >= 1) clearInterval(iv);
    }, 40);
  }

  /* ---------- Scroll-Loop ---------- */
  function tick() {
    var h = vh();
    revealEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < h * 0.92 && r.bottom > 0) show(el);
    });
    if (!reduceMotion) {
      parallaxEls.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        var p = (r.top + r.height / 2 - h / 2) / h;
        el.style.transform = 'translateY(' + (-p * 34).toFixed(1) + 'px)';
      });
    }
    if (statsEl && statsEl.getBoundingClientRect().top < h * 0.95) startCount();
  }
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick);
  tick();
  // Sicherheitsnetz: nach 1,8 s garantiert alles einblenden
  setTimeout(function () { revealEls.forEach(show); }, 1800);

  /* ---------- Kontaktdaten verlinken (sobald gepflegt) ----------
     Trägt automatisch tel:- und mailto:-Links ein, sobald in den
     [data-contact]-Feldern echte Werte statt der Platzhalter stehen. */
  (function linkContacts() {
    var phoneEl = document.querySelector('[data-contact="phone"]');
    var telLink = document.querySelector('[data-contact-tel]');
    if (phoneEl && telLink) {
      var phone = phoneEl.textContent.trim();
      if (phone && phone.indexOf('[') === -1) {
        telLink.setAttribute('href', 'tel:' + phone.replace(/[^\d+]/g, ''));
      }
    }
  })();
})();

(function () {
  'use strict';

  /* ---------- menu ---------- */
  var b = document.getElementById('burger'), n = document.getElementById('nav');
  function zamknij() {
    if (!n) return;
    n.classList.remove('otwarte');
    document.body.classList.remove('menu-otwarte');
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-label', 'Otwórz menu');
  }
  if (b && n) {
    b.addEventListener('click', function () {
      var o = n.classList.toggle('otwarte');
      document.body.classList.toggle('menu-otwarte', o);
      b.setAttribute('aria-expanded', o ? 'true' : 'false');
      b.setAttribute('aria-label', o ? 'Zamknij menu' : 'Otwórz menu');
    });
    n.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a && a.getAttribute('href').indexOf('#') !== -1) zamknij();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') zamknij(); });
    n.querySelectorAll('.pod-przel').forEach(function (p) {
      p.addEventListener('click', function () {
        var li = p.closest('li'), o = li.classList.toggle('pod-otwarte');
        p.setAttribute('aria-expanded', o ? 'true' : 'false');
      });
    });
  }

  /* ---------- dolny pasek po przewinięciu za przycisk w pierwszym ekranie ---------- */
  var mob = document.getElementById('mob'), cta = document.getElementById('hero-cta');
  if (mob) {
    if (cta && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (w) {
        var e = w[0];
        mob.classList.toggle('widac', !e.isIntersecting && e.boundingClientRect.top < 0);
      }).observe(cta);
    } else {
      var spr = function () { mob.classList.toggle('widac', window.scrollY > 400); };
      window.addEventListener('scroll', spr, { passive: true }); spr();
    }
  }

  /* ---------- karuzele: palec (natywnie), mysz (przeciąganie), strzałki, klawiatura ---------- */
  // zdjęcia karuzeli doczytywane, gdy karuzela zbliża się do ekranu (przeglądarki leniwie ładują obrazki w przewijanych kontenerach)
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (wpisy) {
      wpisy.forEach(function (w) {
        if (!w.isIntersecting) return;
        w.target.querySelectorAll('img[loading="lazy"]').forEach(function (im) { im.loading = 'eager'; });
        obs.unobserve(w.target);
      });
    }, { rootMargin: '400px 0px' });
    document.querySelectorAll('[data-karuzela]').forEach(function (k) { obs.observe(k); });
  }

  document.querySelectorAll('[data-karuzela]').forEach(function (k) {
    var tor = k.querySelector('.k-tor');
    var slajdy = tor.querySelectorAll('.k-slajd');
    var licz = k.querySelector('.k-licznik span');
    if (slajdy.length < 2) return;

    function biezacy() {
      var x = tor.scrollLeft, best = 0, d = Infinity;
      slajdy.forEach(function (s, i) {
        var dd = Math.abs(s.offsetLeft - tor.offsetLeft - x);
        if (dd < d) { d = dd; best = i; }
      });
      return best;
    }
    function idz(i) {
      i = Math.max(0, Math.min(slajdy.length - 1, i));
      tor.scrollTo({ left: slajdy[i].offsetLeft - tor.offsetLeft, behavior: 'smooth' });
    }
    var raf;
    tor.addEventListener('scroll', function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        var i = biezacy();
        if (licz) licz.textContent = i + 1;
        k.classList.toggle('na-poczatku', tor.scrollLeft < 4);
        k.classList.toggle('na-koncu', tor.scrollLeft + tor.clientWidth >= tor.scrollWidth - 4);
      });
    }, { passive: true });
    k.classList.add('na-poczatku');

    var pop = k.querySelector('.k-pop'), nast = k.querySelector('.k-nast');
    if (pop) pop.addEventListener('click', function () { idz(biezacy() - 1); });
    if (nast) nast.addEventListener('click', function () { idz(biezacy() + 1); });
    tor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); idz(biezacy() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); idz(biezacy() - 1); }
    });

    // przeciąganie myszą; przesunięcie nie otwiera linku
    var start = null, przesun = false;
    tor.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      start = { x: e.clientX, l: tor.scrollLeft, i: biezacy() };
      przesun = false;
    });
    window.addEventListener('pointermove', function (e) {
      if (!start) return;
      var dx = e.clientX - start.x;
      if (!przesun && Math.abs(dx) > 6) {
        przesun = true;
        tor.classList.add('ciagniety');
      }
      if (przesun) { tor.scrollLeft = start.l - dx; e.preventDefault(); }
    });
    window.addEventListener('pointerup', function (e) {
      if (!start) return;
      if (przesun) {
        var dx = e.clientX - start.x, i = start.i;
        if (dx < -40) i = start.i + 1; else if (dx > 40) i = start.i - 1;
        tor.classList.remove('ciagniety');
        idz(i);
      }
      start = null;
    });
    tor.addEventListener('click', function (e) {
      if (przesun) { e.preventDefault(); e.stopPropagation(); przesun = false; }
    }, true);
    tor.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });

  /* ---------- formularz wyceny ---------- */
  var f = document.getElementById('formularz');
  if (f) {
    var info = document.getElementById('form-info');
    var sel = f.querySelector('#f-rodzaj');
    var q = new URLSearchParams(location.search).get('rodzaj');
    if (q && sel && sel.querySelector('option[value="' + q.replace(/[^a-z0-9-]/g, '') + '"]')) sel.value = q;
    if (location.search.indexOf('wycena=') !== -1 && info && info.textContent.trim()) info.classList.add('widoczne');

    f.addEventListener('submit', function (e) {
      var ok = true;
      ['imie', 'tel', 'tresc'].forEach(function (k) {
        var el = f.elements[k];
        var zle = !el.value.trim() || (k === 'tel' && el.value.replace(/\D/g, '').length < 9);
        el.classList.toggle('zle', zle);
        el.setAttribute('aria-invalid', zle ? 'true' : 'false');
        if (zle) ok = false;
      });
      if (!ok) {
        e.preventDefault();
        info.textContent = 'Uzupełnij imię, telefon (9 cyfr) i opis.';
        info.className = 'form-info widoczne blad';
        var pierwszy = f.querySelector('.zle'); if (pierwszy) pierwszy.focus();
        return;
      }
      if (f.dataset.tryb === 'pokaz') {
        // wersja testowa bez serwera: wiadomość przygotowana w programie pocztowym
        e.preventDefault();
        var temat = 'Zapytanie o wycenę: ' + sel.options[sel.selectedIndex].text;
        var tresc = f.elements.tresc.value.trim() + '\n\nMiejscowość: ' + (f.elements.miejsce.value.trim() || '-') + '\n' + f.elements.imie.value.trim() + ', tel. ' + f.elements.tel.value.trim() + (f.elements.email.value.trim() ? ', ' + f.elements.email.value.trim() : '');
        var mail = 'mailto:' + f.dataset.email + '?subject=' + encodeURIComponent(temat) + '&body=' + encodeURIComponent(tresc);
        info.innerHTML = 'To wersja testowa strony: po uruchomieniu na galoppergroup.pl zapytanie trafi prosto na ' + f.dataset.email + '. Teraz możesz <a href="' + mail + '">wysłać je z programu pocztowego</a>.';
        info.className = 'form-info widoczne';
        return;
      }
      if (window.fetch && window.FormData) {
        e.preventDefault();
        var btn = f.querySelector('button[type=submit]');
        btn.disabled = true; btn.textContent = 'Wysyłanie...';
        fetch(f.getAttribute('action'), { method: 'POST', body: new FormData(f), headers: { 'X-Requested-With': 'fetch' }, credentials: 'same-origin' })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            info.textContent = d.wiadomosc;
            info.className = 'form-info widoczne' + (d.ok ? ' sukces' : ' blad');
            if (d.ok) f.reset();
          })
          .catch(function () {
            info.textContent = 'Nie udało się wysłać. Zadzwoń, proszę.';
            info.className = 'form-info widoczne blad';
          })
          .then(function () { btn.disabled = false; btn.textContent = 'Wyślij zapytanie'; });
      }
    });
  }
})();

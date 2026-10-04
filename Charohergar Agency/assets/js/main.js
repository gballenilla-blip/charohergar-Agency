/* ==========================================================================
   CHAROHERGAR — main.js
   Sin dependencias. Todo degrada con elegancia si algo falla.
   ========================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var d = document;

  /* ------------------------------------------------------------------
     1. Revelar elementos al hacer scroll (IntersectionObserver)
     ------------------------------------------------------------------ */
  function initReveal() {
    var items = d.querySelectorAll('.reveal');
    if (!items.length) return;

    // Sin soporte o movimiento reducido: mostrar todo de inmediato.
    if (!('IntersectionObserver' in window) || reduced) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    // Aplicar el retardo definido en data-delay para escalonar.
    items.forEach(function (el) {
      var delay = el.getAttribute('data-delay');
      if (delay) el.style.setProperty('--d', delay);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);   // una sola vez
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { io.observe(el); });

    // Red de seguridad: el contenido NUNCA debe quedar invisible.
    // Si el observer no dispara (pestaña oculta, navegador raro, error),
    // revelamos todo. Sin coste en el caso normal.
    function revealAll() {
      items.forEach(function (el) { el.classList.add('is-in'); });
    }

    setTimeout(function () {
      if (!document.querySelector('.reveal.is-in')) revealAll();
    }, 2500);

    // Si tras 6s sigue sin haber aparecio nada visible, forzar.
    setTimeout(function () {
      var pending = [].slice.call(items).filter(function (el) {
        var r = el.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      });
      pending.forEach(function (el) { el.classList.add('is-in'); });
    }, 6000);
  }

  /* ------------------------------------------------------------------
     2. Parallax en los fondos
     ------------------------------------------------------------------ */
  function initParallax() {
    var layers = d.querySelectorAll('[data-parallax]');
    if (!layers.length) return;

    if (reduced) return;

    var ticking = false;

    function update() {
      var vh = window.innerHeight;

      layers.forEach(function (layer) {
        var host = layer.parentElement;
        var rect = host.getBoundingClientRect();

        // Solo cuando la sección está en pantalla.
        if (rect.bottom < 0 || rect.top > vh) return;

        var speed = parseFloat(layer.getAttribute('data-parallax')) || 0.25;
        // -1..1 respecto al centro del viewport
        var center = (rect.top + rect.height / 2) - (vh / 2);
        var offset = -center * speed;

        layer.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px,0)';
      });

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------
     3. Navegación: sombra al hacer scroll + menú móvil
     ------------------------------------------------------------------ */
  function initNav() {
    var nav = d.getElementById('nav');
    var burger = d.getElementById('burger');
    var menu = d.getElementById('menu-movil');

    if (nav) {
      var onScroll = function () {
        nav.classList.toggle('is-stuck', window.scrollY > 24);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    if (burger && menu) {
      burger.addEventListener('click', function () {
        var open = menu.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      });

      // Cerrar al pulsar un enlace.
      menu.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
          menu.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
        }
      });

      // Cerrar al pulsar Escape.
      d.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) {
          menu.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
          burger.focus();
        }
      });
    }
  }

  /* ------------------------------------------------------------------
     4. Contadores animados de las estadísticas
     ------------------------------------------------------------------ */
  function initCounters() {
    var nums = d.querySelectorAll('[data-count]');
    if (!nums.length) return;

    function animate(el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var suffix = el.getAttribute('data-suffix') || '';

      if (reduced) {
        el.textContent = target + suffix;
        return;
      }

      var dur = 1400;
      var start = null;

      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        // easeOutExpo
        var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      }

      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      nums.forEach(animate);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          animate(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { io.observe(el); });

    // Red de seguridad: un contador en "0" parece roto. Si tras 3s
    // no se ha animado ninguno, mostramos el valor final directamente.
    setTimeout(function () {
      nums.forEach(function (el) {
        if (el.textContent === '0' || el.textContent === '0' + el.getAttribute('data-suffix')) {
          el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
        }
      });
    }, 3000);
  }

  /* ------------------------------------------------------------------
     5. Reproductor de vídeo
     ------------------------------------------------------------------ */
  function initPlayer() {
    var btn = d.getElementById('player-btn');
    var video = d.getElementById('player-video');
    if (!btn || !video) return;

    btn.addEventListener('click', function () {
      btn.hidden = true;
      video.controls = true;
      video.play().catch(function () {
        // Si el navegador bloquea, mostrar los controles para que el
        // usuario pueda pulsar reproducir.
        video.controls = true;
      });
    });

    video.addEventListener('play', function () { btn.hidden = true; });
    video.addEventListener('pause', function () { btn.hidden = false; });
  }

  /* ------------------------------------------------------------------
     6. Pausar el vídeo del hero cuando no se ve
        (ahorra CPU y batería en móviles)
     ------------------------------------------------------------------ */
  function initHeroVideo() {
    var video = d.querySelector('.hero video');
    if (!video) return;

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            if (video.paused) video.play().catch(function () {});
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.05 });
      io.observe(video);
    }

    // Fallback si el vídeo no puede reproducirse: mostrar la imagen.
    video.addEventListener('error', function () {
      var fb = d.querySelector('.parallax__fallback');
      if (fb) fb.style.display = 'block';
      video.style.display = 'none';
    });
  }

  /* ------------------------------------------------------------------
     7. Formulario: validacion + envio real a Formspree
     ------------------------------------------------------------------ */
  function initForm() {
    var form = d.getElementById('form');
    var ok = d.getElementById('form-ok');
    var err = d.getElementById('form-error');
    var submit = d.getElementById('form-submit');
    if (!form) return;

    // Configuracion (viene de formspree-config.js)
    var CFG = window.CHAROHERGAR || {};
    var FORM_ID = CFG.FORM_ID || '';
    var ENDPOINT = FORM_ID && FORM_ID.indexOf('PEGA_AQUI') === -1
      ? 'https://formspree.io/f/' + FORM_ID
      : '';

    function show(node) { if (node) node.hidden = false; }
    function hide(node) { if (node) node.hidden = true; }

    // Marcar error al salir del campo
    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.addEventListener('blur', function () {
        field.setAttribute('aria-invalid',
          (field.checkValidity() && field.value) ? 'false' : 'true');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      hide(ok);
      hide(err);

      if (!form.checkValidity()) {
        form.reportValidity();
        var first = form.querySelector(':invalid');
        if (first) first.focus();
        return;
      }

      // Trampa para bots: campo oculto que un humano no llena.
      var trap = form.querySelector('input[name="_gotcha"]');
      if (trap && trap.value) { return; }   // bot: salir en silencio

      // Si falta el ID, avisar en vez de fingir que se envio.
      if (!ENDPOINT) {
        show(err);
        if (err) {
          err.textContent = 'El formulario no está configurado todavía. Escribinos directamente a ' +
            (CFG.EMAIL || 'charo@hergaragency.es') + '.';
        }
        return;
      }

      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Enviando…';
      }

      var datos = new FormData(form);

      fetch(ENDPOINT, {
        method: 'POST',
        body: datos,
        headers: { Accept: 'application/json' }
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (!res.ok) { throw new Error(res.body && res.body.errors ? res.body.errors[0].message : 'Error ' + res.ok); }
          form.reset();
          form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.removeAttribute('aria-invalid'); });
          show(ok);
          if (ok) ok.focus && ok.focus();
        })
        .catch(function (err) {
          show(err);
          if (err) {
            var msg = document.createElement('span');
            msg.textContent = 'No pudimos enviar el mensaje. Escribinos directamente a ';
            var a = d.createElement('a');
            a.href = 'mailto:' + (CFG.EMAIL || 'charo@hergaragency.es');
            a.textContent = CFG.EMAIL || 'charo@hergaragency.es';
            err.appendChild(msg);
            err.appendChild(a);
            err.appendChild(document.createTextNode('.'));
          }
        })
        .finally(function () {
          if (submit) {
            submit.disabled = false;
            submit.textContent = 'Enviar mensaje';
          }
        });
    });
  }

  /* ------------------------------------------------------------------
     8. Smooth scroll con compensation del header
     ------------------------------------------------------------------ */
  function initSmoothScroll() {
    if (reduced) return;

    d.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;

      var id = link.getAttribute('href');
      if (!id || id === '#') return;

      var target = d.querySelector(id);
      if (!target) return;

      e.preventDefault();

      var navH = (d.getElementById('nav') || {}).offsetHeight || 72;
      var top = target.getBoundingClientRect().top + window.scrollY - navH - 12;

      window.scrollTo({ top: top, behavior: 'smooth' });

      // Mover el foco para accesibilidad.
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  function init() {
    initReveal();
    initParallax();
    initNav();
    initCounters();
    initPlayer();
    initHeroVideo();
    initForm();
    initSmoothScroll();
  }

  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Quitar la clase no-js si el JS funciona.
  d.documentElement.classList.remove('no-js');
}());

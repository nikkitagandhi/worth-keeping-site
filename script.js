(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll reveal ---------- */
  const revealables = document.querySelectorAll('[data-reveal]');
  if (reduceMotion) {
    revealables.forEach((el) => el.classList.add('is-in'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealables.forEach((el) => observer.observe(el));
  }

  /* ---------- Parallax drift on collage photography ---------- */
  const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
  let ticking = false;

  function applyParallax() {
    const viewportH = window.innerHeight;
    parallaxEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > viewportH + 200) return;
      const strength = parseFloat(el.dataset.parallax) || 0.1;
      // Distance of element centre from viewport centre, normalised
      const offset = (rect.top + rect.height / 2 - viewportH / 2) * -strength;
      el.style.setProperty('--py', offset.toFixed(2) + 'px');
      const base = el.dataset.baseTransform || '';
      el.style.transform = `${base} translate3d(0, ${offset.toFixed(2)}px, 0)`;
    });
    ticking = false;
  }

  if (!reduceMotion && parallaxEls.length) {
    // Preserve any rotation already applied by a utility class
    parallaxEls.forEach((el) => {
      const t = getComputedStyle(el).transform;
      el.dataset.baseTransform = t && t !== 'none' ? t : '';
    });
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(applyParallax);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    applyParallax();
  }

  /* ---------- Header condense on scroll ---------- */
  const header = document.querySelector('[data-header]');
  const onHeaderScroll = () => {
    header.classList.toggle('is-stuck', window.scrollY > 60);
  };
  window.addEventListener('scroll', onHeaderScroll, { passive: true });
  onHeaderScroll();

  /* ---------- Nav overlay ---------- */
  const overlay = document.getElementById('nav-overlay');
  const toggles = document.querySelectorAll('[data-nav-toggle]');
  let navOpen = false;

  function openNav() {
    navOpen = true;
    overlay.hidden = false;
    // Force a reflow so the opacity transition has a start frame to animate from.
    // (A rAF callback would never fire in a background tab, stranding the overlay.)
    void overlay.offsetHeight;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    toggles.forEach((b) => b.setAttribute('aria-expanded', 'true'));
  }

  function closeNav() {
    navOpen = false;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    toggles.forEach((b) => b.setAttribute('aria-expanded', 'false'));
    setTimeout(() => { if (!navOpen) overlay.hidden = true; }, 500);
  }

  toggles.forEach((btn) => {
    btn.addEventListener('click', () => (navOpen ? closeNav() : openNav()));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navOpen) closeNav();
  });

  /* ---------- Smooth in-page navigation ---------- */
  function scrollToTarget(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  const jumps = [
    ['[data-go-home]', 'top'],
    ['[data-go-about]', 'about'],
    ['[data-go-collections]', 'collections'],
  ];

  jumps.forEach(([selector, id]) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        closeNav();
        if (id === 'top') {
          window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        } else {
          scrollToTarget(id);
        }
      });
    });
  });

  /* ---------- Newsletter (submits to Formspree - see index.html for setup) ---------- */
  const signup = document.querySelector('[data-signup]');
  const note = document.querySelector('[data-signup-note]');
  const signupButton = signup.querySelector('button[type="submit"]');

  signup.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = signup.querySelector('input[type="email"]');
    const value = input.value.trim();

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      note.textContent = 'A valid email, please.';
      return;
    }
    if (signup.action.includes('YOUR_FORM_ID')) {
      note.textContent = 'Signup isn’t connected yet - set up Formspree in index.html.';
      return;
    }

    signupButton.disabled = true;
    const originalLabel = signupButton.textContent;
    signupButton.textContent = 'SENDING…';
    note.textContent = '';

    try {
      const response = await fetch(signup.action, {
        method: 'POST',
        body: new FormData(signup),
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        input.value = '';
        note.textContent = 'Thank you - something worth opening is on its way.';
      } else {
        const data = await response.json().catch(() => null);
        note.textContent = data?.errors?.[0]?.message || 'Something went wrong - please try again.';
      }
    } catch {
      note.textContent = 'Network error - please try again.';
    } finally {
      signupButton.disabled = false;
      signupButton.textContent = originalLabel;
    }
  });

  /* ---------- Question flip cards ---------- */
  document.querySelectorAll('.question-card').forEach((card) => {
    card.addEventListener('click', () => {
      const flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-expanded', flipped ? 'true' : 'false');
    });
  });
})();

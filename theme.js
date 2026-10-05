/* Light / dark theme toggle. Remembers the choice; follows the system until one is made. */
(() => {
  'use strict';
  const KEY = 'theme';
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const mq = window.matchMedia('(prefers-color-scheme: dark)');

  const current = () => {
    const set = root.getAttribute('data-theme');
    if (set === 'light' || set === 'dark') return set;
    return mq.matches ? 'dark' : 'light';
  };
  const label = (t) => { if (btn) btn.textContent = t === 'dark' ? 'Light' : 'Dark'; };

  function apply(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem(KEY, t); } catch (e) {}
    label(t);
  }

  if (btn) {
    label(current());
    btn.addEventListener('click', () => apply(current() === 'dark' ? 'light' : 'dark'));
  }

  const onChange = () => { if (!root.getAttribute('data-theme')) label(mq.matches ? 'dark' : 'light'); };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
})();

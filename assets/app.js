import strings from './strings.hu.js';
import { loadAll, staleness } from './data.js';
import { formatRelative } from './format.js';
import * as now from './views/now.js';
import * as members from './views/members.js';
import * as growth from './views/growth.js';

const VIEWS = ['now', 'members', 'growth'];

function applyStaticStrings() {
  document.querySelector('[data-str="siteTagline"]').textContent = strings.siteTagline;
  for (const btn of document.querySelectorAll('.tab')) {
    btn.textContent = strings.tabs[btn.dataset.view];
  }
}

function revealOnScroll(root) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px' }
  );
  for (const el of root.querySelectorAll('.reveal')) observer.observe(el);
}

function selectTab(name) {
  for (const btn of document.querySelectorAll('.tab')) {
    btn.setAttribute('aria-selected', String(btn.dataset.view === name));
  }
  history.replaceState(null, '', `#${name}`);
}

function boot({ views, data }) {
  applyStaticStrings();
  const root = document.getElementById('view');

  function show(name) {
    const view = views[name];
    root.innerHTML = view.render(data);
    view.mount?.(root, data);
    selectTab(name);
    revealOnScroll(root);
  }

  for (const btn of document.querySelectorAll('.tab')) {
    btn.addEventListener('click', () => show(btn.dataset.view));
  }

  const fromHash = location.hash.slice(1);
  show(VIEWS.includes(fromHash) ? fromHash : 'now');
}

function renderFooter(data) {
  const at = new Date();
  const state = staleness(data.meta, 'traffic', at);
  const last = data.meta?.traffic?.last_success;
  const when = formatRelative(last, at) || '—';

  const line = state.isStale
    ? strings.footer.stale.replace('{when}', when)
    : strings.footer.updated.replace('{when}', when);

  document.getElementById('footer').innerHTML =
    `<p>${line}</p><p>${strings.footer.independent}</p><p>${strings.footer.sources}</p>`;

  const badge = document.getElementById('live-badge');
  badge.textContent = strings.live;
  badge.hidden = state.isStale;
}

function renderLoadError(message) {
  applyStaticStrings();
  document.getElementById('view').innerHTML =
    `<section class="section"><p class="note note--warning">` +
    `Az adat betöltése nem sikerült: ${message}</p></section>`;
  document.getElementById('live-badge').hidden = true;
}

try {
  const data = await loadAll((url) => fetch(url));
  boot({ views: { now, members, growth }, data });
  renderFooter(data);
} catch (err) {
  renderLoadError(err.message);
}

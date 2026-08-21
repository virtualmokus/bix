import strings from './strings.en.js';
import { loadAll, staleness } from './data.js';
import { formatRelative } from './format.js';
import * as overview from './views/overview.js';
import * as members from './views/members.js';
import * as mapView from './views/map.js';
import * as legal from './views/legal.js';

const VIEWS = ['overview', 'members', 'map', 'legal'];

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

  // A láblécből is át lehet ugrani a jogi oldalra.
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-goto-legal]');
    if (!link) return;
    event.preventDefault();
    show('legal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const fromHash = location.hash.slice(1);
  show(VIEWS.includes(fromHash) ? fromHash : 'overview');
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
    `<p>${line}</p><p>${strings.footer.independent}</p>` +
    `<p>${strings.footer.sources} <a href="#legal" data-goto-legal>${strings.footer.legalLink}</a></p>`;

  const badge = document.getElementById('live-badge');
  badge.textContent = strings.live;
  badge.hidden = state.isStale;
}

function renderLoadError(message) {
  applyStaticStrings();
  const safe = String(message).replace(/[<>&]/g, '');
  document.getElementById('view').innerHTML =
    `<section class="section"><p class="note note--warning">` +
    `Could not load the data: ${safe}</p></section>`;
  document.getElementById('live-badge').hidden = true;
}

try {
  const data = await loadAll((url) => fetch(url));
  boot({ views: { overview, members, map: mapView, legal }, data });
  renderFooter(data);
} catch (err) {
  renderLoadError(err.message);
}

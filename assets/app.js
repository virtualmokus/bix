import strings, { LOCALES, locale, setLocale } from './i18n.js';
import { loadAll, staleness } from './data.js';
import { formatRelative } from './format.js';
import { parseHash } from './app-routing.js';
import * as overview from './views/overview.js';
import * as members from './views/members.js';
import * as mapView from './views/map.js';
import * as legal from './views/legal.js';
import * as exchange from './views/exchange.js';

const VIEWS = ['overview', 'members', 'map', 'legal'];

function applyStaticStrings() {
  document.documentElement.lang = locale;
  document.querySelector('[data-str="siteTagline"]').textContent = strings.siteTagline;
  for (const btn of document.querySelectorAll('.tab')) {
    btn.textContent = strings.tabs[btn.dataset.view];
  }
  renderLanguageSwitch();
}

function renderLanguageSwitch() {
  const host = document.getElementById('lang-switch');
  if (!host) return;
  host.innerHTML = LOCALES.map((l) =>
    `<button type="button" class="lang-btn" data-lang="${l.code}"` +
    ` aria-pressed="${l.code === locale}" title="${l.name}">${l.label}</button>`
  ).join('');
  for (const btn of host.querySelectorAll('.lang-btn')) {
    btn.addEventListener('click', () => setLocale(btn.dataset.lang));
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

function selectTab(name, param) {
  // Az IX-adatlap a térképhez tartozik, ezért a Világtérkép fül marad aktív.
  const active = name === 'ix' ? 'map' : name;
  for (const btn of document.querySelectorAll('.tab')) {
    btn.setAttribute('aria-selected', String(btn.dataset.view === active));
  }
  history.replaceState(null, '', param ? `#${name}/${param}` : `#${name}`);
}

function boot({ views, data }) {
  applyStaticStrings();
  const root = document.getElementById('view');

  function show(name, param = null) {
    // A térkép teljes képernyős állapota a body-n is hagy nyomot; nézetváltáskor
    // ezt le kell szedni, különben a görgetés tiltva marad a többi fülön is.
    document.body.classList.remove('has-fullscreen-map');

    const view = views[name] ?? views.overview;
    root.innerHTML = view.render(data, param);
    view.mount?.(root, data, param);
    selectTab(name, param);
    revealOnScroll(root);
    window.scrollTo({ top: 0 });
  }

  // Nézőpontváltás: az egész oldal újraszámol, ezért újratöltéssel megy —
  // ugyanaz a minta, mint a nyelvváltásnál, és nem hagy félig frissült állapotot.
  function setHome(id) {
    const url = new URL(location.href);
    if (Number(id) === 55) url.searchParams.delete('home');
    else url.searchParams.set('home', id);
    location.href = url.toString();
  }

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-home]');
    if (!btn) return;
    event.preventDefault();
    setHome(btn.dataset.home);
  });

  document.addEventListener('change', (event) => {
    if (event.target.id === 'map-home') setHome(event.target.value);
  });

  // Bárhonnan meg lehet nyitni egy csomópont adatlapját.
  document.addEventListener('click', (event) => {
    const open = event.target.closest('[data-open-ix]');
    if (open) {
      event.preventDefault();
      show('ix', open.dataset.openIx);
      return;
    }
    const goto = event.target.closest('[data-goto-view]');
    if (goto) {
      event.preventDefault();
      show(goto.dataset.gotoView);
    }
  });

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

  const initial = parseHash(location.hash, VIEWS);
  show(initial.name, initial.param);
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
  const homeId = new URLSearchParams(location.search).get('home');
  const data = await loadAll((url) => fetch(url), 'data', homeId);
  boot({ views: { overview, members, map: mapView, legal, ix: exchange }, data });
  renderFooter(data);
} catch (err) {
  renderLoadError(err.message);
}

import strings from '../i18n.js';
import { escapeHtml } from '../chart.js';

const s = strings.legal;

export function render() {
  return (
    `<section class="section legal">` +
    `<p class="eyebrow">${escapeHtml(s.eyebrow)}</p>` +
    `<h2 class="section-title">${escapeHtml(s.title)}</h2>` +
    `<p class="hint">${escapeHtml(s.updated)}</p>` +
    `<div class="legal-body">` +
    s.sections
      .map(
        (section, i) =>
          `<article class="legal-section reveal" style="--index:${i}">` +
          `<h3>${escapeHtml(section.heading)}</h3>` +
          `<p>${escapeHtml(section.body)}</p>` +
          `</article>`
      )
      .join('') +
    `</div>` +
    `</section>`
  );
}

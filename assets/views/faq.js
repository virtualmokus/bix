import strings from '../i18n.js';
import { escapeHtml } from '../chart.js';

const s = strings.faq;

/**
 * A GYIK szándékosan nem tartalmaz új állítást: ugyanazokat a fenntartásokat
 * mondja el, amiket a diagramok és a jogi oldal a helyükön már kiírnak. Így
 * nem lesz belőle második igazságforrás, ami elcsúszhat a felülettől.
 */
export function render() {
  return (
    `<section class="section faq">` +
    `<p class="eyebrow">${escapeHtml(s.eyebrow)}</p>` +
    `<h2 class="section-title">${escapeHtml(s.title)}</h2>` +
    `<p class="hint">${escapeHtml(s.intro)}</p>` +
    `<div class="faq-body">` +
    s.items
      .map(
        (item, i) =>
          `<details class="faq-item reveal" style="--index:${i}">` +
          `<summary>${escapeHtml(item.q)}</summary>` +
          item.a
            .split(/\n{2,}/)
            .map((p) => `<p>${escapeHtml(p)}</p>`)
            .join('') +
          `</details>`
      )
      .join('') +
    `</div>` +
    `<p class="hint faq-footer">${escapeHtml(strings.footer.sources)} ` +
    `<a href="#legal" data-goto-legal>${escapeHtml(strings.footer.legalLink)}</a></p>` +
    `</section>`
  );
}

// Emoji helyett inline SVG — a minimalist-ui rendszer tiltja az emojikat.
// Egységes 1.5px vonalvastagság, Phosphor-szerű geometria.
const wrap = (body) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export default {
  stream: wrap('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M10 9.5v5l4-2.5z"/>'),
  storage: wrap(
    '<ellipse cx="12" cy="6" rx="8" ry="3"/>' +
      '<path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/>' +
      '<path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'
  ),
  network: wrap(
    '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/>' +
      '<path d="M12 7.5v4M12 11.5 6.5 17M12 11.5 17.5 17"/>'
  ),
  info: wrap('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  warning: wrap('<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>'),
};

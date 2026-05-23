/**
 * Lightweight leaf confetti (no heavy deps)
 */

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** @param {number} count */
export function spawnLeafConfetti(count = 24) {
  if (prefersReduced() || typeof document === 'undefined') return;

  const layer = document.createElement('div');
  layer.className = 'leaf-confetti-layer';
  layer.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < count; i++) {
    const leaf = document.createElement('span');
    leaf.className = 'leaf-confetti';
    const left = Math.random() * 100;
    const tx = `${(Math.random() - 0.5) * 120}px`;
    const rot = `${180 + Math.random() * 540}deg`;
    const dur = `${2 + Math.random() * 1.8}s`;
    const delay = `${Math.random() * 0.4}s`;
    const hue = 140 + Math.random() * 40;
    leaf.style.cssText = `left:${left}%;--tx:${tx};--rot:${rot};--dur:${dur};animation-delay:${delay};background:hsl(${hue} 45% 55%)`;
    layer.appendChild(leaf);
  }

  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 4500);
}

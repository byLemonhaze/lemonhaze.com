import { reducedMotion } from './motion.js';

// Bring the new surface into focus over an opaque preview, never through paper.
// Only the artwork is filtered; its frame and metadata remain perfectly still.
export function revealInFocus(node, { pixel = false, onFinish = () => {} } = {}) {
    if (pixel || !node.animate || reducedMotion()) { onFinish(); return () => {}; }
    const animation = node.animate([
        { opacity: 0, filter: 'blur(1.2px) contrast(.94)', offset: 0 },
        { opacity: 1, filter: 'blur(1px) contrast(.95)', offset: .18 },
        { opacity: 1, filter: 'blur(0px) contrast(1)', offset: 1 },
    ], { duration: 360, easing: 'cubic-bezier(.22,.65,.3,1)', fill: 'both' });
    let cancelled = false;
    animation.finished.then(() => {
        if (!cancelled) { onFinish(); animation.cancel(); }
    }).catch(() => {});
    return () => { cancelled = true; animation.cancel(); };
}

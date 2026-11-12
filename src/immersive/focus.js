import { reducedMotion } from './motion.js';

// Bring the new surface into focus over an opaque preview, never through paper.
// Only the artwork is filtered; its frame and metadata remain perfectly still.
export function revealInFocus(node, { pixel = false, onFinish = () => {} } = {}) {
    if (!node.animate || reducedMotion()) { onFinish(); return () => {}; }
    const animation = node.animate([
        { opacity: 0, filter: pixel ? 'none' : 'blur(4px)', offset: 0 },
        { opacity: 1, filter: pixel ? 'none' : 'blur(1.6px)', offset: .4 },
        { opacity: 1, filter: pixel ? 'none' : 'blur(0px)', offset: 1 },
    ], { duration: pixel ? 320 : 1000, easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'both' });
    let cancelled = false;
    animation.finished.then(() => {
        if (!cancelled) { onFinish(); animation.cancel(); }
    }).catch(() => {});
    return () => { cancelled = true; animation.cancel(); };
}

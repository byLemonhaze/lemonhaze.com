const _state = {
    artworks: [],
    currentFilter: 'Home',
    isMobileMenuOpen: false,
    homeInterval: null,
    activeSectionKey: null,
    activeArtworkId: null,
    activeCollectorAddress: null,
    isApplyingUrlState: false,
};

const _listeners = new Set();

export const appState = _state;

export const getState = () => ({ ..._state });

export const setState = (patch = {}) => {
    Object.assign(_state, patch);
    _listeners.forEach((fn) => fn(_state));
};

export const subscribe = (fn) => {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
};

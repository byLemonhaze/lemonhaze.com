const _state = {
    artworks: [],
    parentIds: new Set(),
    currentFilter: 'Home',
    isMobileMenuOpen: false,
    homeInterval: null,
    activeSectionKey: null,
    activeArtworkId: null,
    isApplyingUrlState: false,
    collapsedYears: new Set(),
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

export const initCollapsedYears = (years) => {
    // Keep the chronology quiet on first load; visitors expand only the year they want.
    _state.collapsedYears = new Set(years.map((year) => String(year)));
};

export const toggleYearCollapse = (year) => {
    const key = String(year);
    if (_state.collapsedYears.has(key)) {
        _state.collapsedYears.delete(key);
    } else {
        _state.collapsedYears.add(key);
    }
};

export const getCollapsedYears = () => _state.collapsedYears;

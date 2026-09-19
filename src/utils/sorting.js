// Missing values stay last in either direction; a known zero remains sortable.
export function compareValues(a, b, direction = 'asc') {
    const missing = value => value == null || (typeof value === 'number' && !Number.isFinite(value));
    if (missing(a) || missing(b)) return missing(a) === missing(b) ? 0 : missing(a) ? 1 : -1;
    const order = typeof a === 'string' && typeof b === 'string'
        ? a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })
        : a - b;
    return direction === 'desc' ? -order : order;
}

export function sortedRows(rows, sort, getters, fallback = row => row.name || row.key || row.id || '') {
    const [field, direction] = sort.split(':');
    const getter = getters[field] || getters.name;
    return [...rows].sort((a, b) => compareValues(getter(a), getter(b), direction)
        || compareValues(fallback(a), fallback(b)));
}

export function dateValue(value) {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : null;
}

interface AssetsBinding {
    fetch(request: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface Env {
    ASSETS: AssetsBinding;
}

const LEGACY_APP_ENTRY_PATHS = new Set([
    '/collection.html',
    '/modal.html',
    '/collector.html',
]);

const NON_SPA_PREFIXES = [
    '/api/',
    '/assets/',
];

const shouldBypassSpaFallback = (pathname: string) => {
    if (NON_SPA_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
    return pathname.includes('.');
};

const serveAppShell = (context: EventContext<Env, string, unknown>) => {
    const requestUrl = new URL(context.request.url);
    const indexUrl = new URL('/index.html', requestUrl);
    indexUrl.search = requestUrl.search;
    indexUrl.hash = requestUrl.hash;
    return context.env.ASSETS.fetch(new Request(indexUrl, context.request));
};

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request } = context;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return context.next();
    }

    const url = new URL(request.url);
    if (LEGACY_APP_ENTRY_PATHS.has(url.pathname)) {
        return serveAppShell(context);
    }

    const response = await context.next();
    if (response.status !== 404) return response;
    if (shouldBypassSpaFallback(url.pathname)) return response;

    return serveAppShell(context);
};

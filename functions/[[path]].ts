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

const LEGACY_REDIRECT_PATHS = new Map([
    ['/marketplace', '/supply'],
    ['/marketplace/', '/supply'],
    ['/marketplace.html', '/supply'],
    ['/supply.html', '/supply'],
    ['/lab/design-bank', '/lab'],
    ['/lab/design-bank/', '/lab'],
]);

const NON_SPA_PREFIXES = [
    '/api/',
    '/assets/',
    '/lab/',
];

const shouldBypassSpaFallback = (pathname: string) => {
    if (NON_SPA_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
    return pathname.includes('.');
};

const serveAppShell = async (context: EventContext<Env, string, unknown>) => {
    const requestUrl = new URL(context.request.url);
    const shellUrl = new URL('/index.html', requestUrl);
    shellUrl.search = requestUrl.search;
    shellUrl.hash = requestUrl.hash;
    return context.env.ASSETS.fetch(new Request(shellUrl, context.request));
};

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request } = context;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return context.next();
    }

    const url = new URL(request.url);
    const legacyRedirectTarget = LEGACY_REDIRECT_PATHS.get(url.pathname);
    if (legacyRedirectTarget) {
        const redirectUrl = new URL(legacyRedirectTarget, url);
        redirectUrl.search = url.search;
        return Response.redirect(redirectUrl.toString(), 307);
    }

    if (LEGACY_APP_ENTRY_PATHS.has(url.pathname)) {
        return await serveAppShell(context);
    }

    const response = await context.next();
    if (response.status !== 404) return response;
    if (shouldBypassSpaFallback(url.pathname)) return response;

    return await serveAppShell(context);
};

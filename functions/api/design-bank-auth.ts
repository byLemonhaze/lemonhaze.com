/**
 * POST /api/design-bank-auth
 * Password gate for the Design Bank.
 * Protected by DESIGN_BANK_PASSWORD env var (Cloudflare secret).
 */

interface Env {
    DESIGN_BANK_PASSWORD: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    const password = request.headers.get('x-db-password') ?? '';

    if (!env.DESIGN_BANK_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (password === env.DESIGN_BANK_PASSWORD) {
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
    });
};

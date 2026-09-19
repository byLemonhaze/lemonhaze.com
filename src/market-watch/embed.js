// Native lifecycle lets the site's existing router dispose of React and in-flight scans.
if (!customElements.get('lemonhaze-market-watch')) {
    customElements.define('lemonhaze-market-watch', class extends HTMLElement {
        async connectedCallback() {
            const connection = this.connection = {};
            try {
                const {mountMarketWatch} = await import('./mount.tsx');
                if (!this.isConnected || this.connection !== connection) return;
                this.root = mountMarketWatch(this);
            } catch {
                if (this.isConnected && this.connection === connection) this.textContent = 'Market Watch is temporarily unavailable. Reload to try again.';
            }
        }
        disconnectedCallback() {
            this.connection = null;
            this.root?.unmount();
            this.root = null;
        }
    });
}

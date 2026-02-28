export function createTesterController({
    testerModal,
    testerInput,
    testerIframe,
    testerStatusDot,
    testerStatusText,
}) {
    const setTesterStatus = (state, msg) => {
        if (!testerStatusDot || !testerStatusText) return;

        testerStatusDot.className = 'w-2 h-2 rounded-full inline-block mr-2 transition-colors duration-300';
        if (state === 'ready') {
            testerStatusDot.classList.add('bg-neutral-600');
            testerStatusText.textContent = msg || 'READY';
            testerStatusText.className = 'text-[10px] uppercase font-mono text-white/40';
        } else if (state === 'loading') {
            testerStatusDot.classList.add('bg-yellow-500', 'animate-pulse');
            testerStatusText.textContent = 'TESTING...';
            testerStatusText.className = 'text-[10px] uppercase font-mono text-yellow-500';
        } else if (state === 'success') {
            testerStatusDot.classList.add('bg-green-500');
            testerStatusText.textContent = 'LIKELY ALLOWED';
            testerStatusText.className = 'text-[10px] uppercase font-mono text-green-500';
        } else if (state === 'error') {
            testerStatusDot.classList.add('bg-red-500');
            testerStatusText.textContent = 'BLOCKED / ERROR';
            testerStatusText.className = 'text-[10px] uppercase font-mono text-red-500';
        }
    };

    const toggleTester = () => {
        if (!testerModal) return;

        if (testerModal.classList.contains('hidden')) {
            testerModal.classList.remove('hidden');
            if (testerInput) testerInput.focus();
        } else {
            testerModal.classList.add('hidden');
            if (testerIframe) testerIframe.src = 'about:blank';
            setTesterStatus('ready');
        }
    };

    const runTester = () => {
        if (!testerInput || !testerIframe) return;

        let url = testerInput.value.trim();
        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
            testerInput.value = url;
        }

        setTesterStatus('loading');
        testerIframe.src = 'about:blank';
        setTimeout(() => {
            testerIframe.src = url;
            setTesterStatus('success', 'CHECK PREVIEW');

            testerIframe.onload = () => {
                console.log('Tester iframe loaded');
            };
            testerIframe.onerror = () => {
                setTesterStatus('error');
            };
        }, 100);
    };

    return {
        setTesterStatus,
        toggleTester,
        runTester,
    };
}

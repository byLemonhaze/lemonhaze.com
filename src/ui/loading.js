export function setLoadingIndicator(loadingIndicator, isLoading) {
    if (!loadingIndicator) return;
    if (isLoading) {
        loadingIndicator.classList.remove('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
    }
}

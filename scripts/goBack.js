   function goBack() {
        const urlParams = new URLSearchParams(window.location.search);
        const referrer = urlParams.get('ref');

        if (referrer) {
            window.location.href = referrer + '.html';}
             else {
            window.location.href = 'summary.html'; // Fallback page
        }
    }
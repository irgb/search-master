// Forward suggestions request to Google
const query = new URLSearchParams(window.location.search).get('q');
if (query) {
    fetch(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            document.write(JSON.stringify(data));
        })
        .catch(() => {
            document.write(JSON.stringify([query, []]));
        });
} else {
    document.write(JSON.stringify(['', []]));
}

function continuous_poll() {
    setTimeout(poll, 30000+(Math.random()*(10000-10000)-10000))
};

async function poll() {
    fetch('/proxy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: '/api/data',  // Requesting data from your own backend
            method: 'GET'      // HTTP method to use
        })
    })
    .then(response => response.json())
    .then(data => console.log('Data from own backend:', data))
    .catch(error => console.error('Error:', error));
}

window.addEventListener('DOMContentLoaded', continuous_poll);
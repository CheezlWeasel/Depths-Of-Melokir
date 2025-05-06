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
    .then(async response => {
        const text = await response.text(); // get raw body
        console.log('Raw response text:', text); // inspect it
        if (!text) {
            throw new Error('Empty response body');
        }
        return JSON.parse(text); // manually parse so we can inspect first
    })
    .then(data => console.log('Data from own backend:', data))
    .catch(error => console.error('Error:', error));
}

window.addEventListener('DOMContentLoaded', continuous_poll);
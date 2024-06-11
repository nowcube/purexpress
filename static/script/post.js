async function main() {
    const url = window.location.href;
    const uuid = getUrlUUID(url);
    const response = await fetch('/api/posts/' + uuid + '/content')
    const raw = await response.text()
    document.getElementById('content').innerHTML = marked.parse(raw);
}

function getUrlUUID(url) {
    const urlObject = new URL(url);
    const pathname = urlObject.pathname;
    const uuidPrefix = '/posts/';
    const uuid = pathname.slice(uuidPrefix.length);
    return uuid;
}

main();
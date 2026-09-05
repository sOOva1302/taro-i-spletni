self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('taro-i-spletni-v1').then((cache) => {
            return cache.addAll([
                '/taro-i-spletni/',
                '/taro-i-spletni/index.html',
                '/taro-i-spletni/style.css',
                '/taro-i-spletni/app.js',
                '/taro-i-spletni/manifest.json'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

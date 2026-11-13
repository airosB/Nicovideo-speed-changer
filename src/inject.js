// ページコンテキストで動作 — ニコニコ側の playbackRate 変更を無効化する
;(function () {
    const _desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate')
    let _rate = null

    // setter を上書きして、ロック中は外部からの変更を無視する
    Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
        get() { return _desc.get.call(this) },
        set(v) {
            if (_rate !== null) return
            _desc.set.call(this, v)
        },
        configurable: true,
    })

    // コンテンツスクリプトから速度を受け取り、全 video 要素に反映する
    window.addEventListener('__nvsc:set', ({ detail: { rate } }) => {
        _rate = rate
        document.querySelectorAll('video').forEach((v) => {
            _desc.set.call(v, rate)
        })
    })
})()

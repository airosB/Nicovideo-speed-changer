/**
 * 各種設定値
 */
const refreshRateMilliSecond = 50
const rateChangeStep = 0.1
let playbackRate = 1.6 // デフォルト値としても作用する

/**
 * 再生速度コントローラーのHTML
 * @type {string}
 */
const controllerHtml = `
    <div class="nvsc-controller" style="top:5px; left:7px; position:relative; display:inline-block; opacity:0.6; font-size:10px; z-index:10; color:white; background:black; border-radius:4px; padding:2px 5px;">
        <span class="nvsc-current-rate"></span>
    </div>
`

/**
 * 0.1単位で丸める
 */
const _round2 = (number) => Math.round(number * 10) / 10

/**
 * 0.1刻みの数値フォーマット
 */
const _numberFormat = (number) => {
    if (number % 1 === 0) return `${number}.0`
    return `${number}`
}

// inject.js（ページコンテキスト）に目標速度を送る
const _sendRate = () => {
    window.dispatchEvent(new CustomEvent('__nvsc:set', { detail: { rate: playbackRate } }))
}

// 処理済みのvideo要素を管理して二重適用を防ぐ
const processedVideos = new WeakSet()

/**
 * video要素にコントローラー表示を挿入し、速度を即時適用する
 */
const applyToVideo = (video) => {
    if (processedVideos.has(video)) return
    processedVideos.add(video)

    video.insertAdjacentHTML('beforebegin', controllerHtml)
    _sendRate()
}

// 速度の維持と表示の更新ループ
// inject.js 側でプロトタイプを上書きしているため、これはニコニコ側に上書きされない
setInterval(() => {
    _sendRate()
    document.querySelectorAll('.nvsc-current-rate').forEach((meter) => {
        meter.innerText = _numberFormat(playbackRate)
    })
}, refreshRateMilliSecond)

/**
 * 追加されたノードとその子孫からvideo要素を探して適用
 */
const scanAndApply = (node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return
    if (node.tagName === 'VIDEO') applyToVideo(node)
    node.querySelectorAll('video').forEach(applyToVideo)
}

/**
 * video要素の追加をDOM全体で監視
 * SPA遷移時に新しいvideo要素が追加されたときも自動で拾える
 */
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(scanAndApply)
    })
})

/**
 * ショートカットキーのイベント登録
 */
const registerShortcutKeys = () => {
    let prevRate
    window.addEventListener('keydown', (e) => {
        if (e.key === 's') {
            playbackRate = _round2(Math.max(0.1, playbackRate - rateChangeStep))
            _sendRate()
            e.preventDefault()
        } else if (e.key === 'd') {
            playbackRate = _round2(Math.min(16, playbackRate + rateChangeStep))
            _sendRate()
            e.preventDefault()
        } else if (e.key === 'r') {
            if (playbackRate !== 1) {
                prevRate = _round2(playbackRate)
                playbackRate = 1
            } else {
                playbackRate = _round2(prevRate)
            }
            _sendRate()

            // ctrl+r のリロードのみ貫通させる
            if (!e.ctrlKey) {
                e.preventDefault()
            }
        }
    }, true)
}

/**
 * 監視を開始して既存のvideo要素にも適用
 */
const init = () => {
    observer.observe(document.body, { childList: true, subtree: true })
    document.querySelectorAll('video').forEach(applyToVideo)
}

// DOMContentLoaded前に実行された場合はイベント待ち
if (document.body) {
    init()
} else {
    document.addEventListener('DOMContentLoaded', init)
}

registerShortcutKeys()

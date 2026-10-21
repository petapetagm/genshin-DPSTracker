// ゲームデータ（キャラ・武器・聖遺物）を data/*.json から読み込む
// 新キャラ・新武器・新聖遺物は JSON に1件追加するだけで反映されます。
let CHARACTERS_DATA = [];
let WEAPONS_DATA = [];
let ARTIFACTS_DATA = [];

async function fetchJson(path) {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${path} を読み込めませんでした (HTTP ${res.status})`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error(`${path} は配列(JSON配列)である必要があります`);
    return data;
}

async function loadGameData() {
    const [chars, weapons, artifacts] = await Promise.all([
        fetchJson('data/characters.json'),
        fetchJson('data/weapons.json'),
        fetchJson('data/artifacts.json')
    ]);
    CHARACTERS_DATA = chars;
    WEAPONS_DATA = weapons.slice().sort((a, b) => b.rarity - a.rarity);
    ARTIFACTS_DATA = artifacts.slice().sort((a, b) => b.rarity - a.rarity);
}

function showDataLoadError(err) {
    const hint = location.protocol === 'file:'
        ? 'ファイルを直接開く方法(file://)では、ブラウザがJSONの読み込みを禁止します。フォルダ内で「python -m http.server」を実行し、http://localhost:8000 で開いてください。'
        : 'data フォルダと JSON ファイルの場所・書式を確認してください。';
    const box = document.createElement('div');
    box.className = 'max-w-3xl mx-auto mt-6 p-4 rounded-xl border border-rose-500/50 bg-rose-950/40 text-sm text-rose-200';
    box.innerHTML = `<p class="font-bold mb-1">データの読み込みに失敗しました</p><p>${escapeHtml(err.message)}</p><p class="mt-2 text-rose-300/80">${hint}</p>`;
    document.body.prepend(box);
}

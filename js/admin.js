// データ管理ツール: data/*.json をフォームで追加・編集・削除する
const ELEMENTS = { pyro: '炎', hydro: '水', anemo: '風', electro: '雷', dendro: '草', cryo: '氷', geo: '岩' };
const WEAPON_TYPES = { sword: '片手剣', claymore: '両手剣', polearm: '長柄武器', bow: '弓', catalyst: '法器' };
const RARITY = { 5: '★5', 4: '★4' };

const TABS = {
    characters: {
        label: 'キャラクター', imageDir: 'Character', addLabel: '１．キャラ追加', file: 'characters.json', key: 'id',
        fields: [
            { name: 'id', label: 'ID（半角英小文字・数字・_）', pattern: /^[a-z0-9_]+$/ },
            { name: 'name', label: '名前' },
            { name: 'element', label: '元素', options: ELEMENTS },
            { name: 'weaponType', label: '武器種', options: WEAPON_TYPES },
            { name: 'rarity', label: 'レアリティ', options: RARITY, number: true },
            { name: 'icon', label: 'アイコン画像（空欄なら自動）', optional: true }
        ],
        autoIcon: e => `images/Character/${e.id}_icon.webp`
    },
    weapons: {
        label: '武器', imageDir: 'Weapon', addLabel: '２．武器追加', file: 'weapons.json', key: 'name',
        fields: [
            { name: 'name', label: '武器名' },
            { name: 'type', label: '武器種', options: WEAPON_TYPES },
            { name: 'rarity', label: 'レアリティ', options: RARITY, number: true },
            { name: 'icon', label: 'アイコン画像（任意）', optional: true }
        ]
    },
    artifacts: {
        label: '聖遺物', imageDir: 'Artifact', addLabel: '３．聖遺物追加', file: 'artifacts.json', key: 'name',
        fields: [
            { name: 'name', label: '聖遺物セット名' },
            { name: 'rarity', label: 'レアリティ', options: RARITY, number: true },
            { name: 'icon', label: 'アイコン画像（任意）', optional: true }
        ]
    }
};

const data = { characters: [], weapons: [], artifacts: [] };
let tab = 'characters';
let formOpen = false;     // 入力フォームを表示中か
let editIndex = null;      // 編集中の行（null なら新規追加）
let dirty = false;
let rootHandle = null;     // 選択したプロジェクトフォルダ（画像の保存用）
let dirHandle = null;      // data フォルダ（JSONの直接保存用）
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function setStatus(text, isDirty = dirty) {
    $('status').textContent = text;
    $('status').className = isDirty ? 'dirty' : '';
}
function markDirty() { dirty = true; setStatus('未保存の変更があります'); }

/* ---------- 読み込み ---------- */
async function loadFromFetch() {
    try {
        for (const [k, t] of Object.entries(TABS)) {
            const res = await fetch(`data/${t.file}`, { cache: 'no-cache' });
            if (!res.ok) throw new Error(res.status);
            data[k] = await res.json();
        }
        setStatus('data/ から読み込みました（保存はダウンロードになります）');
        return true;
    } catch { return false; }
}

async function pickFolder() {
    if (!window.showDirectoryPicker) { alert('このブラウザはフォルダへの直接保存に未対応です（Chrome / Edge で利用できます）。保存時はファイルをダウンロードします。'); return; }
    try {
        rootHandle = await showDirectoryPicker({ mode: 'readwrite' });
        try { dirHandle = await rootHandle.getDirectoryHandle('data'); }
        catch {
            // data フォルダ自体が選ばれた場合（画像は手動配置になる）
            try { await rootHandle.getFileHandle('characters.json'); } catch { rootHandle = null; alert('プロジェクトフォルダ（data フォルダを含むフォルダ）を選んでください'); return; }
            dirHandle = rootHandle; rootHandle = null;
        }
        for (const [k, t] of Object.entries(TABS)) {
            try {
                const file = await (await dirHandle.getFileHandle(t.file)).getFile();
                data[k] = JSON.parse(await file.text());
            } catch { data[k] = []; }
        }
        dirty = false;
        setStatus(rootHandle ? 'プロジェクトフォルダに接続しました（JSON・画像を直接保存）' : 'dataフォルダに接続しました（画像は手動で配置）');
        render();
    } catch (e) { if (e.name !== 'AbortError') alert('フォルダを開けませんでした: ' + e.message); }
}

/* ---------- 保存 ---------- */
const toJson = arr => '[\n' + arr.map(o => '  ' + JSON.stringify(o)).join(',\n') + '\n]\n';

async function save() {
    try {
        for (const [k, t] of Object.entries(TABS)) {
            const text = toJson(data[k]);
            if (dirHandle) {
                const w = await (await dirHandle.getFileHandle(t.file, { create: true })).createWritable();
                await w.write(text);
                await w.close();
            } else {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
                a.download = t.file;
                a.click();
                URL.revokeObjectURL(a.href);
            }
        }
        dirty = false;
        setStatus(dirHandle ? '保存しました' : 'JSONをダウンロードしました。data/ フォルダに上書きしてください');
    } catch (e) { alert('保存に失敗しました: ' + e.message); }
}

/* ---------- フォーム ---------- */
function renderTabs() {
    $('tabs').innerHTML = Object.entries(TABS).map(([k, t]) =>
        `<button type="button" data-tab="${k}" class="${formOpen && k === tab ? 'active' : ''}">${t.addLabel}</button>`).join('');
}

function renderForm() {
    const t = TABS[tab];
    const editing = editIndex !== null;
    $('formTitle').textContent = `${t.label}を${editing ? '編集' : '追加'}`;
    const cur = editing ? data[tab][editIndex] : {};
    $('entryForm').innerHTML = t.fields.map(f => {
        const v = cur[f.name] ?? '';
        if (f.name === 'icon') return iconField(f, v);
        const input = f.options
            ? `<select name="${f.name}">${Object.entries(f.options).map(([val, lab]) => `<option value="${val}" ${String(v) === val ? 'selected' : ''}>${lab}</option>`).join('')}</select>`
            : `<input name="${f.name}" value="${esc(v)}" ${f.optional ? '' : 'required'} autocomplete="off">`;
        return `<label>${f.label}${input}</label>`;
    }).join('') +
        `<div><button type="submit" class="primary">${editing ? '更新' : '追加'}</button>` +
        (editing ? ' <button type="button" id="cancelEdit">キャンセル</button>' : '') + '</div>';
    $('formError').textContent = '';
}

/* ---------- 画像（ドロップ → images/ に保存） ---------- */
function iconField(f, v) {
    const msg = rootHandle ? 'ここに画像をドロップ（またはクリックして選択）' : '先に上の「プロジェクトフォルダを選択」を押してください';
    return `<label class="wide">${f.label}
        <div id="drop" class="drop" tabindex="0"><img id="iconPreview" alt="" src="${esc(v)}" ${v ? '' : 'style="display:none"'} onerror="this.style.display='none'"><span>${msg}</span></div>
        <input name="icon" value="${esc(v)}" placeholder="images/${TABS[tab].imageDir}/..." autocomplete="off"></label>
        <input type="file" id="iconFile" accept="image/*" hidden>`;
}

// 256px以内に縮小して webp に変換（読み込みを軽くするため）
async function toWebp(file) {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 256 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise(r => c.toBlob(r, 'image/webp', 0.9));
}

async function handleImage(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const t = TABS[tab], err = m => { $('formError').textContent = m; };
    if (!rootHandle) return err('画像を保存するには、上の「プロジェクトフォルダを選択」で DPSTracker フォルダを選んでください');
    let name;
    if (t.autoIcon) {
        const id = $('entryForm').elements['id'].value.trim();
        if (!/^[a-z0-9_]+$/.test(id)) return err('先にIDを入力してください（画像名に使います）');
        name = `${id}_icon.webp`;
    } else {
        const base = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
        name = `${base || 'item_' + Date.now()}.webp`;
    }
    try {
        const dir = await (await rootHandle.getDirectoryHandle('images', { create: true })).getDirectoryHandle(t.imageDir, { create: true });
        let exists = true;
        try { await dir.getFileHandle(name); } catch { exists = false; }
        if (exists && !confirm(`${name} はすでにあります。上書きしますか？`)) return;
        const blob = await toWebp(file);
        const w = await (await dir.getFileHandle(name, { create: true })).createWritable();
        await w.write(blob);
        await w.close();
        $('entryForm').elements['icon'].value = `images/${t.imageDir}/${name}`;
        const img = $('iconPreview');
        img.src = URL.createObjectURL(blob); img.style.display = '';
        err('');
    } catch (e) { err('画像の保存に失敗しました: ' + e.message); }
}

function submitForm(e) {
    e.preventDefault();
    const t = TABS[tab];
    const fd = new FormData($('entryForm'));
    const entry = {};
    for (const f of t.fields) {
        let v = String(fd.get(f.name) ?? '').trim();
        if (f.number) v = Number(v);
        if (f.optional && !v) continue;
        if (f.pattern && !f.pattern.test(v)) { $('formError').textContent = `${f.label} の形式が正しくありません`; return; }
        entry[f.name] = v;
    }
    if (t.autoIcon && !entry.icon) entry.icon = t.autoIcon(entry);
    const dup = data[tab].findIndex((x, i) => x[t.key] === entry[t.key] && i !== editIndex);
    if (dup >= 0) { $('formError').textContent = `「${entry[t.key]}」はすでに登録されています`; return; }
    if (editIndex !== null) data[tab][editIndex] = entry; else data[tab].push(entry);
    editIndex = null;
    markDirty();
    render();
    $('jsonPreview').textContent = JSON.stringify(entry, null, 2);
    $('result').hidden = false;
}

/* ---------- 一覧 ---------- */
function renderList() {
    const t = TABS[tab];
    const q = $('listSearch').value.trim().toLowerCase();
    $('listTitle').textContent = `登録済み${t.label}`;
    const head = t.fields.map(f => `<th>${f.label.replace(/（.*）/, '')}</th>`).join('') + '<th></th>';
    const rows = data[tab].map((item, i) => ({ item, i }))
        .filter(({ item }) => !q || JSON.stringify(item).toLowerCase().includes(q))
        .map(({ item, i }) => '<tr class="' + (i === editIndex ? 'editing' : '') + '">' +
            t.fields.map(f => {
                const v = item[f.name] ?? '';
                const label = f.options ? (f.options[v] ?? v) : v;
                return `<td>${esc(label)}</td>`;
            }).join('') +
            `<td class="act"><button type="button" data-edit="${i}">編集</button> <button type="button" class="danger" data-del="${i}">削除</button></td></tr>`).join('');
    $('listTable').innerHTML = `<thead><tr>${head}</tr></thead><tbody>${rows}</tbody>`;
}

function render() { renderTabs(); renderForm(); renderList(); $('formPanel').hidden = !formOpen; }

/* ---------- イベント ---------- */
$('tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    tab = b.dataset.tab; formOpen = true; editIndex = null; $('listSearch').value = ''; $('result').hidden = true;
    render();
});
$('entryForm').addEventListener('submit', submitForm);
$('entryForm').addEventListener('click', e => { if (e.target.id === 'cancelEdit') { editIndex = null; render(); } });
$('entryForm').addEventListener('click', e => { if (e.target.closest('#drop')) $('iconFile').click(); });
$('entryForm').addEventListener('dragover', e => { if (e.target.closest('#drop')) e.preventDefault(); });
$('entryForm').addEventListener('drop', e => { if (!e.target.closest('#drop')) return; e.preventDefault(); handleImage(e.dataTransfer.files[0]); });
$('entryForm').addEventListener('change', e => { if (e.target.id === 'iconFile') { handleImage(e.target.files[0]); e.target.value = ''; } });
$('listSearch').addEventListener('input', renderList);
$('listTable').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    if (ed) { editIndex = Number(ed.dataset.edit); formOpen = true; $('result').hidden = true; render(); $('entryForm').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    if (del) {
        const item = data[tab][Number(del.dataset.del)];
        if (!confirm(`「${item[TABS[tab].key]}」を削除しますか？`)) return;
        data[tab].splice(Number(del.dataset.del), 1);
        editIndex = null; markDirty(); render();
    }
});
$('pickFolderBtn').addEventListener('click', pickFolder);
$('saveBtn').addEventListener('click', save);
$('copyJson').addEventListener('click', async () => {
    await navigator.clipboard.writeText($('jsonPreview').textContent);
    $('copyJson').textContent = 'コピーしました';
    setTimeout(() => { $('copyJson').textContent = 'コピー'; }, 1500);
});
window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

render();
loadFromFetch().then(ok => {
    if (ok) render(); else setStatus('「dataフォルダを選択」から data フォルダを開いてください');
});

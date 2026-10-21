// キャラクター・武器・聖遺物 それぞれのピッカー設定
const findWeapon = name => WEAPONS_DATA.find(x => x.name === name) || { name, rarity: 4 };
const findArtifact = name => ARTIFACTS_DATA.find(x => x.name === name) || { name, rarity: 4 };

const CUSTOM_INPUT_CLASS = 'flex-1 min-w-0 bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1.5 text-gray-200 focus:outline-none focus:border-amber-400';
const SMALL_BTN_CLASS = 'px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-gray-300 hover:border-amber-400 hover:text-amber-300 transition';

/** キャラクター */
function openCharSelectModal(slotIndex) {
    currentEditingSlot = slotIndex;
    Picker.open({
        title: 'キャラクターを選択', icon: 'fa-user-plus', searchPlaceholder: 'キャラクター名で検索...',
        items: CHARACTERS_DATA, dimSelected: true,
        filters: [{ value: 'all', label: 'すべて' }, ...Object.entries(ELEMENT_MAP).map(([k, v]) => ({ value: k, label: v.name }))],
        matchFilter: (c, f) => c.element === f,
        isSelected: c => selectedCharsForForm.includes(c.id),
        renderItem: (c, sel) => `
            ${createCharacterAvatarHTML(c, "w-14 h-14")}
            <span class="text-xs text-gray-200 mt-1.5 text-center font-medium truncate w-full">${c.name}</span>
            <span class="text-[10px] text-gray-400">${ELEMENT_MAP[c.element].name} / ${c.weaponType}</span>
            ${sel ? '<span class="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[9px] font-bold px-1 rounded">編成中</span>' : ''}`,
        onPick: c => {
            selectedCharsForForm[currentEditingSlot] = c.id;
            updateFormSlotsUI();
            Picker.close();
        }
    });
}

/** 武器（選択中キャラの武器種で初期絞り込み） */
function openWeaponSelectModal(i) {
    const char = CHARACTERS_DATA.find(c => c.id === selectedCharsForForm[i]);
    Picker.open({
        title: '武器を選択', icon: 'fa-khanda', searchPlaceholder: '武器名で検索...',
        items: WEAPONS_DATA,
        initialFilter: char ? char.weaponType : 'all',
        filters: [{ value: 'all', label: 'すべて' }, ...Object.entries(WEAPON_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))],
        matchFilter: (x, f) => x.type === f,
        isSelected: x => selectedBuildsForForm[i].weapon === x.name,
        renderItem: x => `
            ${createItemIconHTML(x)}
            <span class="text-xs text-gray-200 mt-1.5 text-center font-medium w-full leading-tight line-clamp-2">${escapeHtml(x.name)}</span>
            <span class="text-[10px] text-gray-400">★${x.rarity} / ${WEAPON_TYPE_LABELS[x.type]}</span>`,
        onPick: x => {
            selectedBuildsForForm[i].weapon = x.name;
            renderBuildSettings();
            Picker.close();
        },
        renderFooter: () => `
            <div class="flex gap-2">
                <input type="text" id="customItemInput" placeholder="リストにない武器名を手入力" class="${CUSTOM_INPUT_CLASS}">
                <button type="button" data-custom class="${SMALL_BTN_CLASS}">この名前で設定</button>
            </div>`,
        onFooterClick: e => {
            if (!e.target.closest('[data-custom]')) return;
            const name = document.getElementById('customItemInput').value.trim();
            if (!name) return;
            selectedBuildsForForm[i].weapon = name;
            renderBuildSettings();
            Picker.close();
        }
    });
}

/** 聖遺物: 4セット、または2セット×2 を選べる */
function addArtifactSet(i, name, pieces) {
    const b = selectedBuildsForForm[i];
    let sets = b.artifactSets.slice();
    if (pieces === 4) {
        sets = [{ name, pieces: 4 }];
    } else {
        sets = sets.filter(s => s.pieces === 2);
        const k = sets.findIndex(s => s.name === name);
        if (k >= 0) sets.splice(k, 1);
        else { sets.push({ name, pieces: 2 }); if (sets.length > 2) sets.shift(); }
    }
    b.artifactSets = sets;
    b.artifact = formatArtifactSets(sets);
    renderBuildSettings();
}

function removeArtifactSet(i, key) {
    const b = selectedBuildsForForm[i];
    if (key === 'legacy') b.artifactSets = [];
    else b.artifactSets.splice(Number(key), 1);
    b.artifact = formatArtifactSets(b.artifactSets);
    renderBuildSettings();
}

function openArtifactSelectModal(i) {
    const chip = (label, key) => `<span class="inline-flex items-center gap-1 bg-amber-950/40 border border-amber-500/40 text-amber-200 rounded px-2 py-0.5">${escapeHtml(label)}<button type="button" data-remove="${key}" class="text-amber-400/70 hover:text-rose-400"><i class="fa-solid fa-xmark"></i></button></span>`;
    Picker.open({
        title: '聖遺物セットを選択', icon: 'fa-gem', searchPlaceholder: '聖遺物セット名で検索...',
        items: ARTIFACTS_DATA,
        filters: [{ value: 'all', label: 'すべて' }, { value: '5', label: '★5' }, { value: '4', label: '★4' }],
        matchFilter: (x, f) => String(x.rarity) === f,
        isSelected: x => selectedBuildsForForm[i].artifactSets.some(s => s.name === x.name),
        renderItem: x => `
            ${createItemIconHTML(x)}
            <span class="text-xs text-gray-200 mt-1.5 text-center font-medium w-full leading-tight line-clamp-2">${escapeHtml(x.name)}</span>
            <div class="flex gap-1 mt-1.5 w-full">
                <button type="button" data-action="4" class="flex-1 text-[10px] rounded border border-slate-700 hover:border-amber-400 hover:text-amber-300 text-gray-300 py-0.5">4セット</button>
                <button type="button" data-action="2" class="flex-1 text-[10px] rounded border border-slate-700 hover:border-amber-400 hover:text-amber-300 text-gray-300 py-0.5">2セット</button>
            </div>`,
        onPick: (x, act) => { addArtifactSet(i, x.name, act === '2' ? 2 : 4); Picker.refresh(); },
        renderFooter: () => {
            const b = selectedBuildsForForm[i];
            const chips = b.artifactSets.length
                ? b.artifactSets.map((s, k) => chip(`${s.name} ${s.pieces}セット`, k)).join('')
                : (b.artifact ? chip(b.artifact, 'legacy') : '<span class="text-gray-500">未選択</span>');
            return `
                <div class="flex flex-wrap items-center gap-1.5 mb-2 text-xs"><span class="text-gray-400">選択中:</span>${chips}</div>
                <div class="flex gap-2">
                    <input type="text" id="customItemInput" placeholder="リストにない聖遺物名を手入力" class="${CUSTOM_INPUT_CLASS}">
                    <button type="button" data-custom="4" class="${SMALL_BTN_CLASS}">4セット</button>
                    <button type="button" data-custom="2" class="${SMALL_BTN_CLASS}">2セット</button>
                    <button type="button" data-done class="genshin-btn-primary px-3 py-1.5 rounded-lg text-xs">完了</button>
                </div>`;
        },
        onFooterClick: e => {
            const rm = e.target.closest('[data-remove]');
            if (rm) { removeArtifactSet(i, rm.dataset.remove); Picker.refresh(); return; }
            const cu = e.target.closest('[data-custom]');
            if (cu) {
                const name = document.getElementById('customItemInput').value.trim();
                if (name) { addArtifactSet(i, name, Number(cu.dataset.custom)); Picker.refresh(); }
                return;
            }
            if (e.target.closest('[data-done]')) Picker.close();
        }
    });
}

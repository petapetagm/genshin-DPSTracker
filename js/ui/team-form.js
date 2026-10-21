// チーム登録フォーム: 開閉・編集・キャラ枠・ビルド設定・保存
function openCreateModal() {
    document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-plus-circle"></i><span>新規チーム登録</span>';
    document.getElementById('teamIdInput').value = '';
    document.getElementById('teamNameInput').value = '';
    document.getElementById('rotationTimeInput').value = '20';
    document.getElementById('dpsInput').value = '';
    document.getElementById('notesInput').value = '';
    
    selectedCharsForForm = [null, null, null, null];
    selectedBuildsForForm = Array.from({length: 4}, emptyBuild);
    updateFormSlotsUI();
    renderBuildSettings();

    document.getElementById('teamModal').classList.remove('hidden');
}

function editTeam(id) {
    const team = teams.find(t => t.id === id);
    if (!team) return;

    document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square"></i><span>チームデータの編集</span>';
    document.getElementById('teamIdInput').value = team.id;
    document.getElementById('teamNameInput').value = team.name;
    document.getElementById('rotationTimeInput').value = [16,18,20].includes(Number(team.rotationTime)) ? Number(team.rotationTime) : 20;
    document.getElementById('dpsInput').value = team.dps ?? '';
    document.getElementById('notesInput').value = team.notes || '';

    selectedCharsForForm = Array.from({length:4}, (_,i) => (team.charIds || [])[i] || null);
    selectedBuildsForForm = normalizeBuilds(team.builds);
    updateFormSlotsUI();
    renderBuildSettings();

    document.getElementById('teamModal').classList.remove('hidden');
}

function updateFormSlotsUI() {
    const slots = document.querySelectorAll('.char-slot');
    slots.forEach((slot, index) => {
        const charId = selectedCharsForForm[index];
        const char = CHARACTERS_DATA.find(c => c.id === charId);

        if (char) {
            const elemInfo = ELEMENT_MAP[char.element] || {};
            slot.classList.remove('border-dashed', 'border-slate-700');
            slot.classList.add('border-solid', elemInfo.borderClass || 'border-amber-400');
            
            slot.innerHTML = `
                <div class="relative w-full flex flex-col items-center">
                    <button type="button" onclick="event.stopPropagation(); removeCharFromSlot(${index})" 
                        class="absolute -top-1 -right-1 bg-rose-600/80 hover:bg-rose-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] z-20">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                    ${createCharacterAvatarHTML(char, "w-12 h-12")}
                    <span class="text-xs font-bold text-gray-200 mt-1 truncate w-full">${char.name}</span>
                </div>
            `;
        } else {
            slot.className = 'char-slot cursor-pointer border-2 border-dashed border-slate-700 hover:border-amber-400/80 rounded-xl p-2 bg-slate-900/50 flex flex-col items-center justify-center text-center transition min-h-[110px]';
            slot.innerHTML = `
                <div class="slot-content flex flex-col items-center">
                    <i class="fa-solid fa-plus text-xl text-gray-500 mb-1"></i>
                    <span class="text-[11px] text-gray-400">枠 ${index + 1}</span>
                </div>
            `;
        }
    });
    renderBuildSettings();
}

function removeCharFromSlot(index) {
    selectedCharsForForm[index] = null;
    updateFormSlotsUI();
}

/** キャラ別ビルド設定（聖遺物・武器はピッカーで選択、凸数 C0〜C6、精錬 R1〜R5） */
function buildPickButton(kind, i, content, hasValue) {
    const clear = hasValue
        ? `<button type="button" data-build-clear="${kind}" data-build-index="${i}" title="クリア" class="text-gray-500 hover:text-rose-400 px-1"><i class="fa-solid fa-xmark"></i></button>`
        : '';
    return `<div class="flex items-center gap-1.5 mb-2">
        <button type="button" data-build-pick="${kind}" data-build-index="${i}" class="flex-1 min-w-0 flex items-center gap-2 bg-slate-950 border border-slate-700 hover:border-amber-400 rounded-md px-2 py-1.5 text-left transition">${content}</button>${clear}</div>`;
}

function renderBuildSettings() {
    const container = document.getElementById('characterBuildSettings');
    if (!container) return;
    const placeholder = text => `<span class="w-8 h-8 rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-slate-500 flex-shrink-0"><i class="fa-solid fa-plus"></i></span><span class="text-xs text-gray-500">${text}</span>`;
    const toggles = (field, values, build, prefix, idx) => values.map(n =>
        `<button type="button" class="build-toggle ${Number(build[field]) === n ? 'active' : ''}" data-build-toggle="${field}" data-build-index="${idx}" data-build-value="${n}">${prefix}${n}</button>`).join('');
    container.innerHTML = selectedCharsForForm.map((charId, index) => {
        const char = CHARACTERS_DATA.find(c => c.id === charId);
        const build = selectedBuildsForForm[index] || emptyBuild();
        const title = char ? escapeHtml(char.name) : `枠 ${index + 1}（キャラ未選択）`;
        const weaponBtn = build.weapon
            ? buildPickButton('weapon', index, `${createItemIconHTML(findWeapon(build.weapon), 'w-8 h-8')}<span class="text-xs text-gray-200 truncate">${escapeHtml(build.weapon)}</span>`, true)
            : buildPickButton('weapon', index, placeholder('武器を選択'), false);
        const artifactBtn = build.artifact
            ? buildPickButton('artifact', index, `${createItemIconHTML(findArtifact((build.artifactSets[0] || {}).name || build.artifact), 'w-8 h-8')}<span class="text-xs text-gray-200 truncate" title="${escapeHtml(build.artifact)}">${escapeHtml(build.artifact)}</span>`, true)
            : buildPickButton('artifact', index, placeholder('聖遺物セットを選択'), false);
        return `
            <div class="rounded-xl border border-slate-700 bg-slate-900/50 p-3${char ? '' : ' opacity-60'}">
                <div class="flex items-center gap-2 mb-2">
                    ${char ? createCharacterAvatarHTML(char, "w-8 h-8") : '<div class="w-8 h-8 rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-slate-500"><i class="fa-solid fa-user"></i></div>'}
                    <span class="text-xs font-semibold text-gray-200">${title}</span>
                </div>
                <div class="text-[10px] text-gray-400 mb-1">聖遺物セット</div>${artifactBtn}
                <div class="text-[10px] text-gray-400 mb-1">武器</div>${weaponBtn}
                <div class="mb-2">
                    <div class="text-[10px] text-gray-400 mb-1">凸数</div>
                    <div class="grid grid-cols-7 gap-1">${toggles('constellation', [0,1,2,3,4,5,6], build, 'C', index)}</div>
                </div>
                <div>
                    <div class="text-[10px] text-gray-400 mb-1">Refinement（精錬ランク）</div>
                    <div class="grid grid-cols-5 gap-1">${toggles('refinement', [1,2,3,4,5], build, 'R', index)}</div>
                </div>
            </div>`;
    }).join('');
}

function bindBuildSettings() {
    document.getElementById('characterBuildSettings').addEventListener('click', e => {
        const t = e.target.closest('[data-build-toggle],[data-build-pick],[data-build-clear]');
        if (!t) return;
        const i = Number(t.dataset.buildIndex);
        const b = selectedBuildsForForm[i];
        if (!b) return;
        if (t.dataset.buildToggle) { b[t.dataset.buildToggle] = Number(t.dataset.buildValue); renderBuildSettings(); }
        else if (t.dataset.buildPick === 'weapon') openWeaponSelectModal(i);
        else if (t.dataset.buildPick === 'artifact') openArtifactSelectModal(i);
        else if (t.dataset.buildClear === 'weapon') { b.weapon = ''; renderBuildSettings(); }
        else if (t.dataset.buildClear === 'artifact') { b.artifact = ''; b.artifactSets = []; renderBuildSettings(); }
    });
}

function bindTeamForm() {
    document.getElementById('teamForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const teamName = document.getElementById('teamNameInput').value.trim();
        const dpsVal = parseInt(document.getElementById('dpsInput').value) || 0;
        const rotTime = Number(document.getElementById('rotationTimeInput').value);
        const notes = document.getElementById('notesInput').value.trim();
        const builds = normalizeBuilds(selectedBuildsForForm);
        const editId = document.getElementById('teamIdInput').value;

        if (!teamName) {
            alert('チーム名を入力してください。');
            return;
        }

        if (selectedCharsForForm.every(id => id === null)) {
            alert('少なくとも1人のキャラクターを選択してください。');
            return;
        }
        if (![16, 18, 20].includes(rotTime)) {
            alert('ローテーション時間は16・18・20秒から選択してください。');
            return;
        }
        if (!Number.isFinite(Number(document.getElementById('dpsInput').value)) || Number(document.getElementById('dpsInput').value) < 0) {
            alert('DPSを数値で入力してください。');
            return;
        }

        if (editId) {
            // 編集更新
            const index = teams.findIndex(t => t.id === editId);
            if (index !== -1) {
                teams[index] = {
                    ...teams[index],
                    name: teamName,
                    charIds: [...selectedCharsForForm],
                    builds,
                    rotationTime: rotTime,
                    dps: dpsVal,
                    notes: notes,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            // 新規作成
            const newTeam = {
                id: 'team-' + Date.now(),
                name: teamName,
                charIds: [...selectedCharsForForm],
                builds,
                rotationTime: rotTime,
                dps: dpsVal,
                notes: notes,
                updatedAt: new Date().toISOString()
            };
            teams.unshift(newTeam);
        }

        saveTeamsToStorage();
        renderTeamList();
        document.getElementById('teamModal').classList.add('hidden');
    });
}

// チーム一覧の描画・統計・複製・削除
function renderTeamList() {
    const container = document.getElementById('teamListContainer');
    const emptyState = document.getElementById('emptyState');
    
    // 検索とフィルター処理
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const selectedElement = document.getElementById('elementFilter').value;
    const sortBy = document.getElementById('sortBy').value;

    let filtered = teams.filter(team => {
        // キャラクターオブジェクトの配列を取得
        const teamChars = team.charIds.map(id => CHARACTERS_DATA.find(c => c.id === id)).filter(Boolean);
        
        // 検索フィルター
        const matchesName = team.name.toLowerCase().includes(searchQuery);
        const matchesCharName = teamChars.some(c => c.name.toLowerCase().includes(searchQuery));
        const matchesSearch = matchesName || matchesCharName;

        // 元素フィルター
        const matchesElem = selectedElement === 'all' || teamChars.some(c => c.element === selectedElement);

        return matchesSearch && matchesElem;
    });

    // ソート処理
    filtered.sort((a, b) => {
        if (sortBy === 'dps-desc') return b.dps - a.dps;
        if (sortBy === 'dps-asc') return a.dps - b.dps;
        if (sortBy === 'date-desc') return new Date(b.updatedAt) - new Date(a.updatedAt);
        if (sortBy === 'date-asc') return new Date(a.updatedAt) - new Date(b.updatedAt);
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
    });

    // 最高DPSの値を計算
    const maxDpsVal = teams.length > 0 ? Math.max(...teams.map(t => t.dps)) : 0;

    if (filtered.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        container.innerHTML = filtered.map((team, rankIndex) => {
            const isTop = rankIndex === 0 && Number(team.dps) > 0;
            const teamChars = team.charIds.map(id => CHARACTERS_DATA.find(c => c.id === id));
            const builds = normalizeBuilds(team.builds);
            const buildSummary = builds.map((b, i) => {
                const char = CHARACTERS_DATA.find(c => c.id === team.charIds[i]);
                if (!char) return '';
                const parts = [];
                if (b.artifact) parts.push(escapeHtml(b.artifact));
                if (b.weapon) parts.push(escapeHtml(b.weapon));
                parts.push(`C${b.constellation}`, `R${b.refinement}`);
                return `<div class="text-[10px] text-gray-400 truncate"><span class="text-gray-300">${escapeHtml(char.name)}:</span> ${parts.join(' · ')}</div>`;
            }).filter(Boolean).join('');

            return `
                <div class="genshin-card rounded-xl p-5 relative flex flex-col justify-between">
                    ${isTop ? `
                        <div class="absolute -top-2.5 right-4 top-dps-badge px-3 py-0.5 text-[11px] font-bold text-slate-950 rounded shadow-md flex items-center space-x-1">
                            <i class="fa-solid fa-crown text-amber-900"></i>
                            <span>1位 · TOP DPS</span>
                        </div>
                    ` : ''}

                    <div>
                        <!-- チームヘッダー -->
                        <div class="flex justify-between items-start mb-3 pr-12">
                            <div class="flex items-start gap-2 min-w-0">
                                <span class="rank-number flex-shrink-0" title="現在のDPS順位">#${rankIndex + 1}</span>
                                <h3 class="font-bold text-lg text-genshin-gold tracking-wide leading-snug">${escapeHtml(team.name)}</h3>
                            </div>
                        </div>

                        <!-- キャラクター4人一覧 -->
                        <div class="grid grid-cols-4 gap-2 my-4 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                            ${teamChars.map(char => {
                                if (!char) return `<div class="w-12 h-12 bg-slate-800 rounded"></div>`;
                                return `
                                    <div class="flex flex-col items-center">
                                        ${createCharacterAvatarHTML(char, "w-11 h-11 md:w-12 md:h-12")}
                                        <span class="text-[10px] text-gray-300 mt-1 truncate w-full text-center">${char.name}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        ${buildSummary ? `<div class="space-y-0.5 mb-3 px-1">${buildSummary}</div>` : ''}

                        <!-- DPS & ダメージ数値表示 -->
                        <div class="bg-amber-950/20 border border-amber-500/30 rounded-lg p-3 my-3 flex justify-between items-center">
                            <div>
                                <div class="text-[10px] uppercase tracking-wider text-amber-400/80 font-bold">Team DPS</div>
                                <div class="text-2xl font-extrabold text-amber-300 font-mono tracking-tight">${team.dps.toLocaleString()}</div>
                            </div>
                            <div class="text-right text-xs text-gray-400">
                                <div><span class="text-gray-500">周期:</span> <span class="font-mono text-gray-200">${team.rotationTime || '-'}s</span></div>
                            </div>
                        </div>

                        <!-- ノート/ローテーション説明 -->
                        ${team.notes ? `
                            <div class="text-xs text-gray-400 bg-slate-900/40 p-2.5 rounded border border-slate-800/60 mb-4 line-clamp-3">
                                <i class="fa-solid fa-align-left text-gray-500 mr-1"></i> ${escapeHtml(team.notes)}
                            </div>
                        ` : ''}
                    </div>

                    <!-- フッターアクション -->
                    <div class="flex justify-between items-center pt-3 border-t border-slate-800/80 text-xs">
                        <span class="text-[10px] text-gray-500">
                            更新: ${new Date(team.updatedAt).toLocaleDateString()}
                        </span>
                        <div class="flex space-x-2">
                            <button onclick="duplicateTeam('${team.id}')" title="複製" class="p-1.5 text-gray-400 hover:text-amber-300 hover:bg-slate-800 rounded transition">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                            <button onclick="editTeam('${team.id}')" title="編集" class="p-1.5 text-gray-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button onclick="deleteTeam('${team.id}')" title="削除" class="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-slate-800 rounded transition">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateSummaryStats();
}

// 統計情報の更新
function updateSummaryStats() {
    document.getElementById('statTotalTeams').innerText = teams.length;
    
    if (teams.length === 0) {
        document.getElementById('statMaxDps').innerText = '0';
        document.getElementById('statAvgDps').innerText = '0';
        document.getElementById('statTopChar').innerText = '-';
        return;
    }

    const maxDps = Math.max(...teams.map(t => t.dps));
    const avgDps = Math.round(teams.reduce((acc, t) => acc + t.dps, 0) / teams.length);

    document.getElementById('statMaxDps').innerText = maxDps.toLocaleString();
    document.getElementById('statAvgDps').innerText = avgDps.toLocaleString();

    // 最も使用されているキャラの検出
    const charCounts = {};
    teams.forEach(t => {
        t.charIds.forEach(id => {
            if (id) charCounts[id] = (charCounts[id] || 0) + 1;
        });
    });

    let topCharId = null;
    let maxCount = 0;
    for (const [id, count] of Object.entries(charCounts)) {
        if (count > maxCount) {
            maxCount = count;
            topCharId = id;
        }
    }

    if (topCharId) {
        const char = CHARACTERS_DATA.find(c => c.id === topCharId);
        document.getElementById('statTopChar').innerText = char ? `${char.name} (${maxCount})` : '-';
    } else {
        document.getElementById('statTopChar').innerText = '-';
    }
}

function duplicateTeam(id) {
    const team = teams.find(t => t.id === id);
    if (!team) return;

    const newTeam = {
        ...team,
        id: 'team-' + Date.now(),
        name: team.name + ' (コピー)',
        builds: normalizeBuilds(team.builds),
        updatedAt: new Date().toISOString()
    };

    teams.unshift(newTeam);
    saveTeamsToStorage();
    renderTeamList();
}

function deleteTeam(id) {
    if (confirm('このチーム登録データを削除してもよろしいですか？')) {
        teams = teams.filter(t => t.id !== id);
        saveTeamsToStorage();
        renderTeamList();
    }
}

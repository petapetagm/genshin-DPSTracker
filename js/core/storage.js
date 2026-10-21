// データの正規化・保存・読み込み・インポート/エクスポート
function formatArtifactSets(sets) {
    return sets.map(s => `${s.name} ${s.pieces}セット`).join(' + ');
}

function normalizeBuild(b = {}) {
    const c = Number(b.constellation);
    const r = Number(b.refinement);
    const sets = (Array.isArray(b.artifactSets) ? b.artifactSets : [])
        .filter(s => s && typeof s.name === 'string' && s.name)
        .slice(0, 2)
        .map(s => ({ name: s.name, pieces: s.pieces === 2 ? 2 : 4 }));
    return {
        artifact: sets.length ? formatArtifactSets(sets) : (typeof b.artifact === 'string' ? b.artifact : ''),
        artifactSets: sets,
        weapon: typeof b.weapon === 'string' ? b.weapon : '',
        constellation: Number.isFinite(c) ? Math.max(0, Math.min(MAX_CONSTELLATION, c)) : 0,
        refinement: Number.isFinite(r) ? Math.max(1, Math.min(5, r)) : 1
    };
}

function normalizeBuilds(builds) {
    return Array.from({ length: 4 }, (_, i) => normalizeBuild(builds && builds[i]));
}

function exportData() {
    const payload = { app: 'DPSTracker', version: 2, exportedAt: new Date().toISOString(), teams };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DPSTracker-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importDataFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsed = JSON.parse(String(reader.result || ''));
            const imported = Array.isArray(parsed) ? parsed : parsed.teams;
            if (!Array.isArray(imported)) throw new Error('teams配列が見つかりません');
            const validTeams = imported.filter(t =>
                t && typeof t === 'object' && typeof t.name === 'string' &&
                Array.isArray(t.charIds) && t.charIds.length <= 4
            ).map(({ totalDmg, ...t }, i) => ({
                ...t,
                id: String(t.id || `import-${Date.now()}-${i}`),
                name: t.name.trim(),
                charIds: Array.from({length:4}, (_,j) => t.charIds[j] || null),
                rotationTime: [16,18,20].includes(Number(t.rotationTime)) ? Number(t.rotationTime) : 20,
                dps: Number.isFinite(Number(t.dps)) ? Number(t.dps) : 0,
                builds: normalizeBuilds(t.builds),
                notes: typeof t.notes === 'string' ? t.notes : '',
                updatedAt: t.updatedAt || new Date().toISOString()
            }));
            const msg = validTeams.length !== imported.length
                ? `形式が正しいデータ ${validTeams.length} 件を読み込みます（不正な ${imported.length-validTeams.length} 件は除外）。現在の登録データは置き換えられます。続行しますか？`
                : `${validTeams.length} 件のデータを読み込み、現在の登録データを置き換えます。続行しますか？`;
            if (!confirm(msg)) return;
            teams = validTeams;
            saveTeamsToStorage();
            renderTeamList();
            alert(`${teams.length} 件のチームデータを読み込みました。`);
        } catch (err) {
            alert('インポートに失敗しました。DPSTrackerのJSONバックアップを選択してください。\n' + err.message);
        } finally {
            document.getElementById('importDataFile').value = '';
        }
    };
    reader.readAsText(file);
}

// 初期サンプルのインポート（初回起動時のみ）
function initSampleDataIfNeeded() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            teams = JSON.parse(saved);
            if (!Array.isArray(teams)) throw new Error('保存データが配列ではありません');
            teams = teams.map(({ totalDmg, ...t }) => ({ ...t, builds: normalizeBuilds(t.builds), rotationTime: [16,18,20].includes(Number(t.rotationTime)) ? Number(t.rotationTime) : 20 }));
            return;
        } catch (e) {
            console.error('Failed to parse localStorage data:', e);
        }
    }

    // サンプルデータ
    teams = [
        {
            id: 'sample-1',
            name: 'ヴェスナ凍結パーティ',
            charIds: ['vesna', 'vodyanitsa', 'odette', 'skirk'],
            rotationTime: 20,
            dps: 92500,
            notes: 'ヴェスナEQで拡散 -> ヴォジャニーツァEで水付着 -> スカークで氷共鳴バフ -> オデット重撃ループ。',
            updatedAt: new Date().toISOString()
        },
        {
            id: 'sample-2',
            name: 'ニコ過熱パーティ',
            charIds: ['nicole', 'nefer', 'durin', 'ineffa'],
            rotationTime: 18,
            dps: 78889,
            notes: 'ネフェル草付着からニコの炎元素追撃を発動させる高回転編成。',
            updatedAt: new Date(Date.now() - 86400000).toISOString()
        }
    ];
    saveTeamsToStorage();
}

function saveTeamsToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
}

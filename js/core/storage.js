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
            "id": "team-1792739653779",
            "name": "スカーク・凍結",
            "charIds": [
                "skirk",
                "furina",
                "escoffier",
                "vodyanitsa"
            ],
            "builds": [
                {
                    "artifact": "深廊の終曲 4セット",
                    "artifactSets": [
                        {
                            "name": "深廊の終曲",
                            "pieces": 4
                        }
                    ],
                    "weapon": "蒼耀",
                    "constellation": 0,
                    "refinement": 1
                },
                {
                    "artifact": "灰燼の都に立つ英雄の絵巻 4セット",
                    "artifactSets": [
                        {
                            "name": "灰燼の都に立つ英雄の絵巻",
                            "pieces": 4
                        }
                    ],
                    "weapon": "西風剣",
                    "constellation": 0,
                    "refinement": 5
                },
                {
                    "artifact": "黄金の劇団 4セット",
                    "artifactSets": [
                        {
                            "name": "黄金の劇団",
                            "pieces": 4
                        }
                    ],
                    "weapon": "西風長槍",
                    "constellation": 0,
                    "refinement": 5
                },
                {
                    "artifact": "千岩牢固 4セット",
                    "artifactSets": [
                        {
                            "name": "千岩牢固",
                            "pieces": 4
                        }
                    ],
                    "weapon": "龍殺しの英傑譚",
                    "constellation": 0,
                    "refinement": 5
                }
            ],
            "rotationTime": 20,
            "dps": 170000,
            "notes": "フリーナEQ->エスコフィエEQ->ヴォジャE->スカーク\nスカーク:E N5Q N5D N5D N2C N5",
            "updatedAt": "2026-10-23T07:14:13.779Z"
        },
        {
            "id": "team-1792739441760",
            "name": "ヴェスナ・星拡散",
            "charIds": [
                "vesna",
                "faruzan",
                "odette",
                "vodyanitsa"
            ],
            "builds": [
                {
                    "artifact": "紅血の証 4セット",
                    "artifactSets": [
                        {
                            "name": "紅血の証",
                            "pieces": 4
                        }
                    ],
                    "weapon": "蝶の羽化",
                    "constellation": 0,
                    "refinement": 1
                },
                {
                    "artifact": "翠緑の影 4セット",
                    "artifactSets": [
                        {
                            "name": "翠緑の影",
                            "pieces": 4
                        }
                    ],
                    "weapon": "西風猟弓",
                    "constellation": 6,
                    "refinement": 5
                },
                {
                    "artifact": "炉炎溶錬の心 4セット",
                    "artifactSets": [
                        {
                            "name": "炉炎溶錬の心",
                            "pieces": 4
                        }
                    ],
                    "weapon": "新たなる枝",
                    "constellation": 0,
                    "refinement": 5
                },
                {
                    "artifact": "千岩牢固 4セット",
                    "artifactSets": [
                        {
                            "name": "千岩牢固",
                            "pieces": 4
                        }
                    ],
                    "weapon": "龍殺しの英傑譚",
                    "constellation": 0,
                    "refinement": 5
                }
            ],
            "rotationTime": 20,
            "dps": 200000,
            "notes": "ファルザンQ->オデット(Q)E->ヴォジャE->ヴェスナE3 Q",
            "updatedAt": "2026-10-23T07:10:41.760Z"
        }
    ];
    saveTeamsToStorage();
}

function saveTeamsToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
}

// 定数: 元素マップ・ストレージキー・武器種ラベル
// 元素の日本語表記・カラーマップ
const ELEMENT_MAP = {
    pyro: { name: '炎', color: '#ef7a35', bgClass: 'bg-elem-pyro', borderClass: 'elem-pyro' },
    hydro: { name: '水', color: '#4bc8fe', bgClass: 'bg-elem-hydro', borderClass: 'elem-hydro' },
    anemo: { name: '風', color: '#74e5a2', bgClass: 'bg-elem-anemo', borderClass: 'elem-anemo' },
    electro: { name: '雷', color: '#b088e0', bgClass: 'bg-elem-electro', borderClass: 'elem-electro' },
    dendro: { name: '草', color: '#a5c83b', bgClass: 'bg-elem-dendro', borderClass: 'elem-dendro' },
    cryo: { name: '氷', color: '#99d7da', bgClass: 'bg-elem-cryo', borderClass: 'elem-cryo' },
    geo: { name: '岩', color: '#fab733', bgClass: 'bg-elem-geo', borderClass: 'elem-geo' }
};

// LocalStorageのキー
const STORAGE_KEY = 'genshin_team_dps_logs_v1';
const MAX_CONSTELLATION = 6; // 凸数の上限 (C0〜C6)
const WEAPON_TYPE_LABELS = { sword: '片手剣', claymore: '両手剣', polearm: '長柄武器', bow: '弓', catalyst: '法器' };

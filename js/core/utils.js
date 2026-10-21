// ユーティリティ: HTMLエスケープ・アイコン生成
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}

/** キャラクターアイコン（画像失敗時は元素色のイニシャル表示） */
function createCharacterAvatarHTML(char, extraClasses = "w-12 h-12") {
    if (!char) return '';
    
    const elemInfo = ELEMENT_MAP[char.element] || { color: '#94a3b8', bgClass: 'bg-slate-800' };
    const rarityClass = char.rarity === 5 ? 'rarity-5' : 'rarity-4';
    const initial = char.name.charAt(0);

    return `
        <div class="relative ${extraClasses} rounded-lg overflow-hidden ${rarityClass} flex-shrink-0 flex items-center justify-center border border-slate-600/50">
            <img src="${char.icon}" alt="${char.name}" class="w-full h-full object-cover relative z-10" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <!-- 画像がロードできない場合のフォールバックUI -->
            <div class="fallback-avatar absolute inset-0 hidden flex-col items-center justify-center text-white font-bold" style="background-color: ${elemInfo.color}33;">
                <span class="text-sm shadow-sm" style="color: ${elemInfo.color}">${initial}</span>
            </div>
            <!-- 元素インジケーター（右下の小アイコン） -->
            <div class="absolute bottom-0 right-0 px-1 py-0.2 text-[9px] font-bold rounded-tl ${elemInfo.bgClass}" style="color: ${elemInfo.color}">
                ${elemInfo.name}
            </div>
        </div>
    `;
}

/** 武器・聖遺物用アイコン。icon があれば画像、なければ頭文字を表示 */
function createItemIconHTML(item, extraClasses = "w-14 h-14") {
    const rarityClass = item.rarity === 5 ? 'rarity-5' : 'rarity-4';
    const img = item.icon ? `<img src="${item.icon}" alt="" class="w-full h-full object-cover relative z-10" onerror="this.remove()">` : '';
    return `<div class="relative ${extraClasses} rounded-lg overflow-hidden ${rarityClass} flex-shrink-0 flex items-center justify-center border border-slate-600/50">${img}<span class="absolute text-sm font-bold text-amber-100/90">${escapeHtml(item.name.charAt(0))}</span></div>`;
}

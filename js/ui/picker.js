// 汎用ピッカーモーダル（キャラクター・武器・聖遺物で共用）
// Picker.open({ title, icon, searchPlaceholder, items, filters, initialFilter, matchFilter,
//               isSelected, dimSelected, renderItem, onPick, renderFooter, onFooterClick })
const Picker = (() => {
    let cfg = null;
    let filter = 'all';
    const $ = id => document.getElementById(id);

    function open(config) {
        cfg = config;
        filter = cfg.initialFilter || 'all';
        $('pickerTitle').innerHTML = `<i class="fa-solid ${cfg.icon}"></i><span>${cfg.title}</span>`;
        $('pickerSearch').value = '';
        $('pickerSearch').placeholder = cfg.searchPlaceholder || '検索...';
        renderFilters();
        renderGrid();
        renderFooter();
        $('pickerModal').classList.remove('hidden');
    }

    function close() {
        $('pickerModal').classList.add('hidden');
        cfg = null;
    }

    function renderFilters() {
        $('pickerFilters').innerHTML = (cfg.filters || []).map(f => {
            const cls = f.value === filter ? 'bg-slate-800 border-amber-400/60 text-amber-300' : 'bg-slate-900 border-slate-700 text-gray-300';
            return `<button type="button" data-filter="${f.value}" class="px-2.5 py-1 rounded border ${cls}">${f.label}</button>`;
        }).join('');
    }

    function renderGrid() {
        const q = $('pickerSearch').value.toLowerCase();
        const html = cfg.items.map((item, i) => ({ item, i }))
            .filter(({ item }) => item.name.toLowerCase().includes(q) && (filter === 'all' || cfg.matchFilter(item, filter)))
            .map(({ item, i }) => {
                const sel = cfg.isSelected ? cfg.isSelected(item) : false;
                const selCls = sel ? 'border-amber-400/80' + (cfg.dimSelected ? ' opacity-60' : '') : 'border-slate-800 hover:border-amber-400';
                return `<div data-index="${i}" class="cursor-pointer bg-slate-900 border ${selCls} p-2 rounded-xl flex flex-col items-center transition relative">${cfg.renderItem(item, sel)}</div>`;
            }).join('');
        $('pickerGrid').innerHTML = html || '<p class="col-span-full text-center text-xs text-gray-500 py-6">該当するものがありません</p>';
    }

    function renderFooter() {
        const html = cfg.renderFooter ? cfg.renderFooter() : '';
        $('pickerFooter').innerHTML = html;
        $('pickerFooter').classList.toggle('hidden', !html);
    }

    function refresh() { if (cfg) { renderGrid(); renderFooter(); } }

    function init() {
        $('closePickerBtn').addEventListener('click', close);
        $('pickerModal').addEventListener('click', e => { if (e.target === $('pickerModal')) close(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && cfg) close(); });
        $('pickerSearch').addEventListener('input', () => cfg && renderGrid());
        $('pickerFilters').addEventListener('click', e => {
            const btn = e.target.closest('[data-filter]');
            if (!btn || !cfg) return;
            filter = btn.dataset.filter;
            renderFilters();
            renderGrid();
        });
        $('pickerGrid').addEventListener('click', e => {
            const card = e.target.closest('[data-index]');
            if (!card || !cfg) return;
            const act = e.target.closest('[data-action]');
            cfg.onPick(cfg.items[Number(card.dataset.index)], act ? act.dataset.action : null);
        });
        $('pickerFooter').addEventListener('click', e => { if (cfg && cfg.onFooterClick) cfg.onFooterClick(e); });
    }

    return { open, close, refresh, init };
})();

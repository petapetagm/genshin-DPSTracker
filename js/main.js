// エントリーポイント: 初期化とイベント登録
window.addEventListener('DOMContentLoaded', async () => {
    const $ = id => document.getElementById(id);
    const closeTeamModal = () => $('teamModal').classList.add('hidden');

    try {
        await loadGameData();
    } catch (err) {
        console.error(err);
        showDataLoadError(err);
        return;
    }

    initSampleDataIfNeeded();
    renderTeamList();
    renderBuildSettings();
    Picker.init();

    // 検索・フィルター・並び替え
    $('searchInput').addEventListener('input', renderTeamList);
    $('elementFilter').addEventListener('change', renderTeamList);
    $('sortBy').addEventListener('change', renderTeamList);

    // エクスポート / インポート
    $('exportDataBtn').addEventListener('click', exportData);
    $('importDataBtn').addEventListener('click', () => $('importDataFile').click());
    $('importDataFile').addEventListener('change', e => importDataFile(e.target.files[0]));

    // チームモーダル
    $('openCreateModalBtn').addEventListener('click', openCreateModal);
    $('emptyStateAddBtn').addEventListener('click', openCreateModal);
    $('closeTeamModalBtn').addEventListener('click', closeTeamModal);
    $('cancelTeamModalBtn').addEventListener('click', closeTeamModal);

    bindBuildSettings();
    bindTeamForm();
});

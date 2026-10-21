// アプリケーションの状態管理
function emptyBuild() {
    return { artifact: '', artifactSets: [], weapon: '', constellation: 0, refinement: 1 };
}

let teams = [];
let currentEditingSlot = null;
let selectedCharsForForm = [null, null, null, null];
let selectedBuildsForForm = Array.from({ length: 4 }, emptyBuild);

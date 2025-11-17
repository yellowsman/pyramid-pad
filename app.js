// app.js

let pyramidData = {
    id: 'root',
    content: 'ここに頂点となる主張や課題を書く',
    relationType: 'none',
    children: []
};
let nodeIdCounter = 0; 

const container = document.getElementById('pyramid-container');
const mainTitle = document.getElementById('main-title');
const saveButton = document.getElementById('saveButton');
const loadButton = document.getElementById('loadButton');
const resetButton = document.getElementById('resetButton');

// ★追加: モーダル関連のDOM要素
const loadModal = document.getElementById('load-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const loadListContainer = document.getElementById('load-list-container');

// ★追加: localStorageのキー
const STORAGE_KEY = 'pyramidToolStorage';


/**
 * 渡されたノードデータ(nodeData)を元に、HTML要素を作成して返す
 * (この関数は変更ありません)
 */
function createNodeElement(nodeData, depth = 0) {
    const nodeWrapper = document.createElement('div');
    nodeWrapper.classList.add('node-wrapper');
    nodeWrapper.dataset.id = nodeData.id;

    const node = document.createElement('div');
    node.classList.add('node');

    const relationLabel = document.createElement('span');
    relationLabel.classList.add('relation-label');
    if (nodeData.relationType === 'inductive') {
        relationLabel.textContent = '帰納的';
        relationLabel.classList.add('inductive');
    } else if (nodeData.relationType === 'deductive') {
        relationLabel.textContent = '演繹的';
        relationLabel.classList.add('deductive');
    } else {
        relationLabel.style.display = 'none'; 
    }
    node.appendChild(relationLabel);

    const contentInput = document.createElement('textarea'); 
    contentInput.classList.add('node-content');
    contentInput.value = nodeData.content;
    contentInput.rows = 2; 
    contentInput.addEventListener('input', (e) => { 
        nodeData.content = e.target.value;
        e.target.style.height = 'auto';
        e.target.style.height = (e.target.scrollHeight) + 'px';
    });
    setTimeout(() => {
        contentInput.style.height = 'auto';
        contentInput.style.height = (contentInput.scrollHeight) + 'px';
    }, 0);
    node.appendChild(contentInput);

    const controls = document.createElement('div');
    controls.classList.add('node-controls');

    const addInductiveButton = document.createElement('button');
    addInductiveButton.textContent = '＋子を追加 (帰納)';
    addInductiveButton.onclick = () => {
        if (depth >= 19) {
            alert('階層の上限（20階層）に達しました。');
            return;
        }
        addChildNode(nodeData, 'inductive');
    };

    const addDeductiveButton = document.createElement('button');
    addDeductiveButton.textContent = '＋子を追加 (演繹)';
    addDeductiveButton.onclick = () => {
        if (depth >= 19) {
            alert('階層の上限（20階層）に達しました。');
            return;
        }
        addChildNode(nodeData, 'deductive');
    };

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '削除';
    deleteButton.onclick = () => {
        deleteNode(nodeData.id);
    };
    if (nodeData.id === 'root') {
        deleteButton.disabled = true;
    }

    controls.appendChild(addInductiveButton);
    controls.appendChild(addDeductiveButton);
    controls.appendChild(deleteButton);
    node.appendChild(controls);

    nodeWrapper.appendChild(node);

    if (nodeData.children && nodeData.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.classList.add('node-children-container');
        
        if (nodeData.children.length > 1) {
             childrenContainer.classList.add('multiple-children');
        } else {
             childrenContainer.classList.add('single-child');
        }
        
        nodeData.children.forEach(childNode => {
            const childElement = createNodeElement(childNode, depth + 1);
            childrenContainer.appendChild(childElement);
        });
        nodeWrapper.appendChild(childrenContainer);
    }

    return nodeWrapper;
}

/**
 * (この関数は変更ありません)
 */
function render() {
    container.innerHTML = '';
    const rootElement = createNodeElement(pyramidData);
    container.appendChild(rootElement);
}

/**
 * (この関数は変更ありません)
 */
function addChildNode(parentNodeData, relationType) {
    if (parentNodeData.children.length > 0) {
        const existingRelationType = parentNodeData.children[0].relationType;
        if (existingRelationType !== relationType) {
            alert('1つの親ノード配下に「演繹的」と「帰納的」な子ノードを混在させることはできません。');
            return; 
        }
    }
    nodeIdCounter++;
    const newNode = {
        id: `node_${nodeIdCounter}`,
        content: '（新しいノード）',
        relationType: relationType,
        children: []
    };
    parentNodeData.children.push(newNode);
    render();
}

/**
 * (この関数は変更ありません)
 */
function deleteNode(nodeId) {
    if (!confirm('このノードと、その全ての子ノードを削除します。よろしいですか？')) { 
        return;
    }
    function findAndRemove(currentNode, targetId) {
        if (!currentNode.children) { return false; }
        const targetIndex = currentNode.children.findIndex(child => child.id === targetId);
        if (targetIndex !== -1) {
            currentNode.children.splice(targetIndex, 1);
            return true;
        } else {
            for (const child of currentNode.children) {
                if (findAndRemove(child, targetId)) { return true; }
            }
        }
        return false;
    }
    findAndRemove(pyramidData, nodeId);
    render(); 
}


// --- ★変更: 保存・読込機能 (LocalStorage) ---

/**
 * ★新設: localStorageからすべての保存データを読み込む
 * @returns {object} 保存されている全データ (例: {"title1": data1, "title2": data2})
 */
function getAllSavedData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            return JSON.parse(savedData);
        } catch (e) {
            console.error('ストレージデータのパースに失敗:', e);
            return {};
        }
    }
    return {};
}

/**
 * ★新設: localStorageにすべてのデータを書き込む
 * @param {object} allData - 保存する全データ
 */
function saveAllData(allData) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    } catch (e) {
        alert('データの保存に失敗しました。');
    }
}

// ★変更: 「現在のタイトルで保存」ボタンのロジック
saveButton.addEventListener('click', () => {
    const currentTitle = mainTitle.textContent.trim();
    if (!currentTitle || currentTitle === 'ピラミッド思考ツール') {
        alert('意味のあるタイトルを入力してください。');
        mainTitle.focus();
        return;
    }

    const allData = getAllSavedData();
    
    // 同名タイトルがあった場合は確認
    if (allData[currentTitle]) {
        if (!confirm(`「${currentTitle}」という名前のデータは既に存在します。上書き保存しますか？`)) {
            return;
        }
    }

    // 現在のデータをオブジェクトにまとめる
    const dataToSave = {
        title: currentTitle,
        pyramid: pyramidData
    };
    
    // 全データに現在のデータを追加（または上書き）
    allData[currentTitle] = dataToSave;
    
    // 全データをlocalStorageに保存
    saveAllData(allData);
    
    alert(`「${currentTitle}」としてデータを保存しました。`);
});

// ★変更: 「保存済みデータを読込」ボタンのロジック (モーダル表示)
loadButton.addEventListener('click', () => {
    renderLoadList(); // モーダル内のリストを最新化
    loadModal.style.display = 'flex'; // モーダルを表示
});

/**
 * ★新設: モーダル内のリストを描画する
 */
function renderLoadList() {
    const allData = getAllSavedData();
    const titles = Object.keys(allData);
    
    loadListContainer.innerHTML = ''; // リストを初期化
    
    if (titles.length === 0) {
        loadListContainer.innerHTML = '<li>保存されているデータはありません。</li>';
        return;
    }
    
    titles.sort(); // タイトルをソート

    titles.forEach(title => {
        const li = document.createElement('li');
        
        // タイトル部分 (クリックで読込)
        const titleSpan = document.createElement('span');
        titleSpan.textContent = title;
        titleSpan.className = 'list-title';
        // イベントリスナーで読込関数を呼ぶ
        titleSpan.addEventListener('click', () => {
            loadData(title);
        });
        li.appendChild(titleSpan);
        
        // 削除ボタン
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '削除';
        deleteBtn.className = 'delete-btn';
        // イベントリスナーで削除関数を呼ぶ
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // liの読込イベントが発火しないように
            deleteData(title);
        });
        li.appendChild(deleteBtn);
        
        loadListContainer.appendChild(li);
    });
}

/**
 * ★新設: 指定したタイトルのデータを読み込む
 * @param {string} title - 読み込むデータのタイトル
 */
function loadData(title) {
    if (!confirm(`「${title}」を読み込みますか？ 現在の編集内容は失われます。`)) {
        return;
    }
    
    const allData = getAllSavedData();
    const dataToLoad = allData[title];
    
    if (dataToLoad) {
        pyramidData = dataToLoad.pyramid;
        mainTitle.textContent = dataToLoad.title;
        nodeIdCounter = Date.now(); // IDカウンターをリセット
        render();
        alert(`「${title}」を読み込みました。`);
        closeLoadModal(); // モーダルを閉じる
    } else {
        alert('データの読み込みに失敗しました。指定されたデータが見つかりません。');
    }
}

/**
 * ★新設: 指定したタイトルのデータを削除する
 * @param {string} title - 削除するデータのタイトル
 */
function deleteData(title) {
    if (!confirm(`「${title}」を削除しますか？ この操作は元に戻せません。`)) {
        return;
    }
    
    const allData = getAllSavedData();
    
    if (allData[title]) {
        delete allData[title]; // データオブジェクトから削除
        saveAllData(allData); // 保存
        alert(`「${title}」を削除しました。`);
        renderLoadList(); // モーダルリストを再描画
    } else {
        alert('データの削除に失敗しました。指定されたデータが見つかりません。');
    }
}

/**
 * ★新設: ロードモーダルを閉じる
 */
function closeLoadModal() {
    loadModal.style.display = 'none';
}

// ★変更: モーダルの閉じるボタンと背景クリック
modalCloseBtn.addEventListener('click', closeLoadModal);
loadModal.addEventListener('click', (e) => {
    // 背景（オーバーレイ）部分をクリックした時だけ閉じる
    if (e.target === loadModal) {
        closeLoadModal();
    }
});


// ★変更: 「リセット」は現在の編集内容を初期化する動作 (localStorageは変更しない)
resetButton.addEventListener('click', () => {
    if (!confirm('現在の編集内容をリセットしますか？ (保存されたデータは消えません)')) { 
        return;
    }
    // ピラミッドデータのリセット
    pyramidData = {
        id: 'root',
        content: 'ここに頂点となる主張や課題を書く',
        relationType: 'none',
        children: []
    };
    // タイトルのリセット
    mainTitle.textContent = 'ピラミッド思考ツール';
    
    nodeIdCounter = 0;
    render();
});


// --- 初期起動 ---
render();
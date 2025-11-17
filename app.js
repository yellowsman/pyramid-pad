// app.js

// 唯一のデータ源（このデータを変更して再描画するのが基本方針）
let pyramidData = {
    id: 'root',
    content: 'ここに頂点となる主張や課題を書く',
    relationType: 'none',
    children: []
};
let nodeIdCounter = 0; // ノード追加時にユニークIDを振るためのカウンター

// --- DOM要素の取得 ---
const container = document.getElementById('pyramid-container');
const saveButton = document.getElementById('saveButton');
const loadButton = document.getElementById('loadButton');
const resetButton = document.getElementById('resetButton');

// --- メインの関数 ---

/**
 * 渡されたノードデータ(nodeData)を元に、HTML要素を作成して返す
 * @param {object} nodeData - 1つのノードのデータ
 * @param {number} depth - 現在の階層の深さ (上限チェック用)
 * @returns {HTMLElement} - 生成されたノードのHTML要素
 */
function createNodeElement(nodeData, depth = 0) {
    // 1. ノード全体のラッパーを作成
    const nodeElement = document.createElement('div');
    nodeElement.classList.add('node');
    nodeElement.dataset.id = nodeData.id; // HTML要素にIDを紐付け

    // 2. 関係性ラベルの表示
    const relationLabel = document.createElement('span');
    relationLabel.classList.add('relation-label');
    if (nodeData.relationType === 'inductive') {
        relationLabel.textContent = '帰納的';
        relationLabel.classList.add('inductive');
    } else if (nodeData.relationType === 'deductive') {
        relationLabel.textContent = '演繹的';
        relationLabel.classList.add('deductive');
    } else {
        relationLabel.style.display = 'none'; // rootノードなど
    }

    // 3. テキスト入力欄
    const contentInput = document.createElement('input');
    contentInput.type = 'text';
    contentInput.classList.add('node-content');
    contentInput.value = nodeData.content;
    // 入力が変更されたら、即座に pyramidData を更新する
    contentInput.addEventListener('change', (e) => {
        nodeData.content = e.target.value;
    });

    // 4. 操作ボタン類
    const controls = document.createElement('div');
    controls.classList.add('node-controls');

    // 4a. 子を追加（帰納的）ボタン
    const addInductiveButton = document.createElement('button');
    addInductiveButton.textContent = '＋子を追加 (帰納)';
    addInductiveButton.onclick = () => {
        if (depth >= 19) { // 階層上限チェック (0から数えて19 = 20階層目)
            alert('階層の上限（20階層）に達しました。');
            return;
        }
        addChildNode(nodeData, 'inductive');
    };

    // 4b. 子を追加（演繹的）ボタン
    const addDeductiveButton = document.createElement('button');
    addDeductiveButton.textContent = '＋子を追加 (演繹)';
    addDeductiveButton.onclick = () => {
        if (depth >= 19) {
            alert('階層の上限（20階層）に達しました。');
            return;
        }
        addChildNode(nodeData, 'deductive');
    };

    // 4c. 削除ボタン
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '削除';
    deleteButton.onclick = () => {
        deleteNode(nodeData.id);
    };
    if (nodeData.id === 'root') { // ルートノードは削除不可
        deleteButton.disabled = true;
    }

    // 5. 要素を組み立てる
    controls.appendChild(addInductiveButton);
    controls.appendChild(addDeductiveButton);
    controls.appendChild(deleteButton);
    
    nodeElement.appendChild(relationLabel);
    nodeElement.appendChild(contentInput);
    nodeElement.appendChild(controls);

    // 6. 子ノードの処理（再帰）
    if (nodeData.children && nodeData.children.length > 0) {
        const childrenContainer = document.createElement('div');
        childrenContainer.classList.add('node-children');
        
        nodeData.children.forEach(childNode => {
            // ここで再帰的に createNodeElement を呼び出す
            const childElement = createNodeElement(childNode, depth + 1);
            childrenContainer.appendChild(childElement);
        });
        nodeElement.appendChild(childrenContainer);
    }

    return nodeElement;
}

/**
 * pyramidData 全体を元に、画面を再描画する
 */
function render() {
    // コンテナの中身を一旦空にする
    container.innerHTML = '';
    
    // データのトップ（root）からHTML要素の生成を開始
    const rootElement = createNodeElement(pyramidData);
    container.appendChild(rootElement);
}

// --- データ操作関数 ---

/**
 * 指定した親ノードに、新しい子ノードを追加する
 * @param {object} parentNodeData - 親ノードのデータ
 * @param {'inductive' | 'deductive'} relationType - 関係性
 */
function addChildNode(parentNodeData, relationType) {
    nodeIdCounter++; // IDをインクリメント
    const newNode = {
        id: `node_${nodeIdCounter}`,
        content: '（新しいノード）',
        relationType: relationType,
        children: []
    };
    parentNodeData.children.push(newNode);
    
    render(); // データを変更したので画面を再描画
}

/**
 * 指定したIDのノードをデータから削除する（再帰的に検索）
 * @param {string} nodeId - 削除したいノードのID
 */
function deleteNode(nodeId) {
    // 本当に削除するか確認
    if (!confirm('このノードと、その全ての子ノードを削除します。よろしいですか？')) {
        return;
    }

    // pyramidData全体を再帰的に走査して、該当IDのノードを親のchildren配列から削除する
    function findAndRemove(currentNode, targetId) {
        if (!currentNode.children) {
            return false;
        }

        const targetIndex = currentNode.children.findIndex(child => child.id === targetId);
        
        if (targetIndex !== -1) {
            // 見つかった
            currentNode.children.splice(targetIndex, 1);
            return true;
        } else {
            // 見つからなかったので、子ノードをさらに深く探す
            for (const child of currentNode.children) {
                if (findAndRemove(child, targetId)) {
                    return true;
                }
            }
        }
        return false;
    }

    findAndRemove(pyramidData, nodeId);
    render(); // データを変更したので画面を再描画
}

// --- 保存・読込機能 (LocalStorage) ---

// オフライン稼働のためのキー機能
saveButton.addEventListener('click', () => {
    try {
        // 現在のデータをJSON文字列に変換してlocalStorageに保存
        localStorage.setItem('pyramidToolData', JSON.stringify(pyramidData));
        alert('データをブラウザに保存しました。');
    } catch (e) {
        alert('データの保存に失敗しました。');
    }
});

loadButton.addEventListener('click', () => {
    if (!confirm('保存したデータを読み込みます。現在の編集内容は失われますが、よろしいですか？')) {
        return;
    }
    
    const savedData = localStorage.getItem('pyramidToolData');
    if (savedData) {
        try {
            pyramidData = JSON.parse(savedData);
            // IDカウンターも復元（保存データ内の最大IDから再開するのが望ましいが、ここでは簡略化）
            nodeIdCounter = new Date().getTime(); // とりあえず重複しなそうな値に
            render();
            alert('データを読み込みました。');
        } catch (e) {
            alert('データの読み込みに失敗しました。');
        }
    } else {
        alert('保存されたデータが見つかりません。');
    }
});

resetButton.addEventListener('click', () => {
    if (!confirm('データをリセットします。よろしいですか？')) {
        return;
    }
    // 初期状態に戻す
    pyramidData = {
        id: 'root',
        content: 'ここに頂点となる主張や課題を書く',
        relationType: 'none',
        children: []
    };
    nodeIdCounter = 0;
    render(); // 再描画
});


// --- 初期起動 ---
// ページが読み込まれたら、最初の描画を行う
render();
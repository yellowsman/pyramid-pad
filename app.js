// app.js

let pyramidData = {
    id: 'root',
    content: 'ここに頂点となる主張や課題を書く',
    relationType: 'none',
    children: []
};
let nodeIdCounter = 0; // ノード追加時にユニークIDを振るためのカウンター

const container = document.getElementById('pyramid-container');
const saveButton = document.getElementById('saveButton');
const loadButton = document.getElementById('loadButton');
const resetButton = document.getElementById('resetButton');

/**
 * 渡されたノードデータ(nodeData)を元に、HTML要素を作成して返す
 * @param {object} nodeData - 1つのノードのデータ
 * @param {number} depth - 現在の階層の深さ (上限チェック用)
 * @returns {HTMLElement} - 生成されたノードのHTML要素
 */
function createNodeElement(nodeData, depth = 0) {
    // 各ノードとその子ノード群をまとめるラッパー（ツリー構造の線のために必要）
    const nodeWrapper = document.createElement('div');
    nodeWrapper.classList.add('node-wrapper');
    nodeWrapper.dataset.id = nodeData.id;

    // ノード本体（ボックス部分）
    const node = document.createElement('div');
    node.classList.add('node');

    // 関係性ラベル
    const relationLabel = document.createElement('span');
    relationLabel.classList.add('relation-label');
    if (nodeData.relationType === 'inductive') {
        relationLabel.textContent = '帰納的';
        relationLabel.classList.add('inductive');
    } else if (nodeData.relationType === 'deductive') {
        relationLabel.textContent = '演繹的';
        relationLabel.classList.add('deductive');
    } else {
        relationLabel.style.display = 'none'; // rootノードなどには表示しない
    }
    node.appendChild(relationLabel);

    // テキスト入力欄
    const contentInput = document.createElement('textarea'); // inputからtextareaに変更
    contentInput.classList.add('node-content');
    contentInput.value = nodeData.content;
    contentInput.rows = 2; // 初期行数
    contentInput.addEventListener('input', (e) => { // 'change'から'input'に変更して即時反映
        nodeData.content = e.target.value;
        // テキストエリアの高さ自動調整
        e.target.style.height = 'auto';
        e.target.style.height = (e.target.scrollHeight) + 'px';
    });
    // 初回描画時に高さを調整
    setTimeout(() => {
        contentInput.style.height = 'auto';
        contentInput.style.height = (contentInput.scrollHeight) + 'px';
    }, 0);
    node.appendChild(contentInput);

    // 操作ボタン類
    const controls = document.createElement('div');
    controls.classList.add('node-controls');

    const addInductiveButton = document.createElement('button');
    addInductiveButton.textContent = '＋子(帰納)';
    addInductiveButton.onclick = () => {
        if (depth >= 19) {
            alert('階層の上限（20階層）に達しました。');
            return;
        }
        addChildNode(nodeData, 'inductive');
    };

    const addDeductiveButton = document.createElement('button');
    addDeductiveButton.textContent = '＋子(演繹)';
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

    // 子ノードの処理（再帰）
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

function render() {
    container.innerHTML = '';
    const rootElement = createNodeElement(pyramidData);
    container.appendChild(rootElement);
}

function addChildNode(parentNodeData, relationType) {
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

function deleteNode(nodeId) {
    if (!confirm('このノードと、その全ての子ノードを削除します。よろしいですか？')) {
        return;
    }

    function findAndRemove(currentNode, targetId) {
        if (!currentNode.children) {
            return false;
        }

        const targetIndex = currentNode.children.findIndex(child => child.id === targetId);
        
        if (targetIndex !== -1) {
            currentNode.children.splice(targetIndex, 1);
            return true;
        } else {
            for (const child of currentNode.children) {
                if (findAndRemove(child, targetId)) {
                    return true;
                }
            }
        }
        return false;
    }

    findAndRemove(pyramidData, nodeId);
    render();
}

// --- 保存・読込機能 (LocalStorage) ---

saveButton.addEventListener('click', () => {
    try {
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
            // 保存したデータから最大のnodeIdCounterを再設定する
            // 簡略化のため、ここでは既存のノードIDをスキャンせず、新しいタイムスタンプを使用
            nodeIdCounter = Date.now(); 
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
    pyramidData = {
        id: 'root',
        content: 'ここに頂点となる主張や課題を書く',
        relationType: 'none',
        children: []
    };
    nodeIdCounter = 0;
    render();
});


// --- 初期起動 ---
render();
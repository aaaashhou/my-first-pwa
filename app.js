// ===== 变量声明 =====
const titleInput = document.getElementById('note-title');
const contentInput = document.getElementById('note-content');
const saveBtn = document.getElementById('save-btn');
const noteList = document.getElementById('note-list');

// Step2 状态切换变量
const writeSection = document.getElementById('write-section');
const readSection = document.getElementById('read-section');
const viewListBtn = document.getElementById('view-list-btn');
const goBackBtn = document.getElementById('go-back-btn');

// ===== 读取 localStorage =====
let notes = JSON.parse(localStorage.getItem('my_notes') || '[]');

// ===== 渲染列表 =====
function renderList() {
    noteList.innerHTML = '';
    notes.forEach(note => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.marginBottom = '5px';

        // 文本部分
        const span = document.createElement('span');
        span.textContent = `${note.title || '无标题'} (${note.createdAt})`;
        span.style.cursor = 'pointer';
        span.onclick = () => showDetail(note.id);

        // 删除按钮
        const delBtn = document.createElement('button');
        delBtn.textContent = '删除';
        delBtn.onclick = (e) => {
            e.stopPropagation(); // 防止触发查看详情
            deleteNote(note.id);
        };

        li.appendChild(span);
        li.appendChild(delBtn);
        noteList.appendChild(li);
    });
}

// ===== 保存笔记 =====
saveBtn.onclick = () => {
    const content = contentInput.value.trim();
    if (!content) return alert('内容不能为空');

    const newNote = {
        id: Date.now(),
        title: titleInput.value.trim(),
        content: content,
        createdAt: new Date().toLocaleString()
    };

    notes.unshift(newNote);
    localStorage.setItem('my_notes', JSON.stringify(notes));

    // 清空输入
    titleInput.value = '';
    contentInput.value = '';
    
    // 刷新列表
    renderList();
    
    // 可选：保存后自动切换到列表
    // switchToRead();
};

// ===== 显示详情 =====
function showDetail(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    document.getElementById('detail-title').textContent = note.title || '无标题';
    document.getElementById('detail-time').textContent = note.createdAt;
    document.getElementById('detail-content').textContent = note.content;
    document.getElementById('note-detail').style.display = 'block';
}

// ===== 删除功能 =====
function deleteNote(id) {
    if (!confirm('确定要删除这条笔记吗？')) return;

    notes = notes.filter(note => note.id !== id);
    localStorage.setItem('my_notes', JSON.stringify(notes));
    document.getElementById('note-detail').style.display = 'none';
    renderList();
}

// ===== 状态切换 =====
function switchToRead() {
    writeSection.style.display = 'none';
    readSection.style.display = 'block';
    viewListBtn.style.display = 'none';
    goBackBtn.style.display = 'inline-block';
    renderList();
}

function switchToWrite() {
    writeSection.style.display = 'block';
    readSection.style.display = 'none';
    viewListBtn.style.display = 'inline-block';
    goBackBtn.style.display = 'none';
}

// 绑定切换按钮
viewListBtn.onclick = switchToRead;
goBackBtn.onclick = switchToWrite;

// ===== 初始化 =====
renderList();

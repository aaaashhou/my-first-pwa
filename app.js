const titleInput = document.getElementById('note-title');
const contentInput = document.getElementById('note-content');
const saveBtn = document.getElementById('save-btn');
const noteList = document.getElementById('note-list');

// 1. 从 localStorage 读取数据，若无则初始化为空数组
let notes = JSON.parse(localStorage.getItem('my_notes') || '[]');

// 渲染列表函数
function renderList() {
    noteList.innerHTML = '';
    notes.forEach(note => {
        const li = document.createElement('li');
        li.style.cursor = 'pointer';
        li.textContent = `${note.title || '无标题'} (${note.createdAt})`;
        li.onclick = () => showDetail(note.id);
        noteList.appendChild(li);
    });
}

// 保存笔记函数
saveBtn.onclick = () => {
    const content = contentInput.value.trim();
    if (!content) return alert('内容不能为空');

    const newNote = {
        id: Date.now(),
        title: titleInput.value.trim(),
        content: content,
        createdAt: new Date().toLocaleString()
    };

    notes.unshift(newNote); // 添加到数组开头
    localStorage.setItem('my_notes', JSON.stringify(notes));
    
    // 清空输入并刷新列表
    titleInput.value = '';
    contentInput.value = '';
    renderList();
};

// 显示详情函数
function showDetail(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    document.getElementById('detail-title').textContent = note.title || '无标题';
    document.getElementById('detail-time').textContent = note.createdAt;
    document.getElementById('detail-content').textContent = note.content;
    document.getElementById('note-detail').style.display = 'block';
}

// 初始化加载
renderList();

const writeSection = document.getElementById('write-section');
const readSection = document.getElementById('read-section');
const viewListBtn = document.getElementById('view-list-btn');
const goBackBtn = document.getElementById('go-back-btn');

// 切换到阅读状态
function switchToRead() {
    writeSection.style.display = 'none';
    readSection.style.display = 'block';
    viewListBtn.style.display = 'none';
    goBackBtn.style.display = 'inline-block';
    renderList(); // 确保列表是最新的
}

// 切换到写入状态
function switchToWrite() {
    writeSection.style.display = 'block';
    readSection.style.display = 'none';
    viewListBtn.style.display = 'inline-block';
    goBackBtn.style.display = 'none';
}

// 绑定事件
viewListBtn.onclick = switchToRead;
goBackBtn.onclick = switchToWrite;

// 修改原有的 saveBtn.onclick：在保存成功后可以自动跳转或保持原样
// 如果希望保存后自动跳转到列表，可以在 renderList() 后调用 switchToRead();

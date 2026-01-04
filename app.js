const titleInput = document.getElementById('note-title');
const contentInput = document.getElementById('note-content');
const saveBtn = document.getElementById('save-btn');
const noteList = document.getElementById('note-list');
const writeSection = document.getElementById('write-section');
const readSection = document.getElementById('read-section');
const viewListBtn = document.getElementById('view-list-btn');
const goBackBtn = document.getElementById('go-back-btn');
const toast = document.getElementById('toast');

let notes = JSON.parse(localStorage.getItem('my_notes') || '[]');

function showToast(msg) {
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

function renderList() {
    noteList.innerHTML = '';
    notes.forEach(note => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="note-item-header">
                <strong style="cursor:pointer" onclick="showDetail(${note.id})">📖 ${note.title}</strong>
                <button style="width:auto; padding:4px 8px; background:#ff4d4d; font-size:12px;" onclick="deleteNote(${note.id})">删除</button>
            </div>
            <span class="note-time">📅 ${note.createdAt}</span>
        `;
        noteList.appendChild(li);
    });
}

saveBtn.onclick = () => {
    if (!titleInput.value.trim()) return showToast('请填写标题哦');
    const newNote = {
        id: Date.now(),
        title: titleInput.value.trim(),
        content: contentInput.value.trim(),
        createdAt: new Date().toLocaleString()
    };
    notes.unshift(newNote);
    localStorage.setItem('my_notes', JSON.stringify(notes));
    titleInput.value = ''; contentInput.value = '';
    showToast('已成功记录！');
};

function showDetail(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    document.getElementById('detail-title').textContent = note.title;
    document.getElementById('detail-time').textContent = '记录于: ' + note.createdAt;
    document.getElementById('detail-content').textContent = note.content || '（无具体内容）';
    document.getElementById('note-detail').style.display = 'block';
}

function deleteNote(id) {
    if (!confirm('确定删除吗？')) return;
    notes = notes.filter(n => n.id !== id);
    localStorage.setItem('my_notes', JSON.stringify(notes));
    renderList();
    showToast('已删除');
}

viewListBtn.onclick = () => { writeSection.style.display = 'none'; readSection.style.display = 'block'; renderList(); };
goBackBtn.onclick = () => { writeSection.style.display = 'block'; readSection.style.display = 'none'; };

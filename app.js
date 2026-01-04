const titleInput = document.getElementById('note-title');
const contentInput = document.getElementById('note-content');
const saveBtn = document.getElementById('save-btn');
const noteList = document.getElementById('note-list');
const writeSection = document.getElementById('write-section');
const readSection = document.getElementById('read-section');
const viewListBtn = document.getElementById('view-list-btn');
const goBackBtn = document.getElementById('go-back-btn');

let notes = JSON.parse(localStorage.getItem('my_notes') || '[]');

function renderList() {
    noteList.innerHTML = '';
    notes.forEach(note => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span style="cursor:pointer" onclick="showDetail(${note.id})">${note.title || '无标题'} (${note.createdAt})</span>
            <button onclick="deleteNote(${note.id})">删除</button>
        `;
        noteList.appendChild(li);
    });
}

saveBtn.onclick = () => {
    const title = titleInput.value.trim();
    if (!title) return alert('标题不能为空'); // 标题必填

    const newNote = {
        id: Date.now(),
        title: title,
        content: contentInput.value.trim(),
        createdAt: new Date().toLocaleString()
    };

    notes.unshift(newNote);
    localStorage.setItem('my_notes', JSON.stringify(notes));
    titleInput.value = '';
    contentInput.value = '';
    alert('保存成功！');
};

function showDetail(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    document.getElementById('detail-title').textContent = note.title;
    document.getElementById('detail-time').textContent = note.createdAt;
    document.getElementById('detail-content').textContent = note.content || '（无内容）';
    document.getElementById('note-detail').style.display = 'block';
}

function deleteNote(id) {
    if (!confirm('确定要删除吗？')) return;
    notes = notes.filter(n => n.id !== id);
    localStorage.setItem('my_notes', JSON.stringify(notes));
    renderList();
}

viewListBtn.onclick = () => {
    writeSection.style.display = 'none';
    readSection.style.display = 'block';
    renderList();
};

goBackBtn.onclick = () => {
    writeSection.style.display = 'block';
    readSection.style.display = 'none';
    document.getElementById('note-detail').style.display = 'none';
};

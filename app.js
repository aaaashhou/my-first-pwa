let notes = JSON.parse(localStorage.getItem('my_notes')) || [];
let selectedCategory = "";
let currentMediaData = null;

const titleInput = document.getElementById('titleInput');
const contentInput = document.getElementById('contentInput');
const saveBtn = document.getElementById('saveBtn');
const mediaInput = document.getElementById('mediaInput');
const addMediaBtn = document.getElementById('addMediaBtn');
const mediaPreview = document.getElementById('mediaPreview');
const notesList = document.getElementById('notesList');

// 1. 处理分类点击
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCategory = btn.innerText;
    };
});

// 2. 处理媒体选择
addMediaBtn.onclick = () => mediaInput.click();
mediaInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        currentMediaData = event.target.result;
        if (file.type.startsWith('image/')) {
            mediaPreview.innerHTML = `<img src="${currentMediaData}" style="max-width:100%; border-radius:8px; margin-bottom:10px;">`;
        } else {
            mediaPreview.innerHTML = `<video src="${currentMediaData}" controls style="max-width:100%; border-radius:8px; margin-bottom:10px;"></video>`;
        }
    };
    reader.readAsDataURL(file);
};

// 3. 渲染列表函数
function renderNotes() {
    notesList.innerHTML = notes.map(note => `
        <div class="note-card">
            <div style="display:flex; justify-content:space-between;">
                <strong>${note.title || '（无标题）'}</strong>
                <small style="color:#007bff">${note.category}</small>
            </div>
            <p style="white-space: pre-wrap;">${note.content || ''}</p>
            ${note.media ? (note.media.startsWith('data:image') ? `<img src="${note.media}" style="max-width:100%;">` : `<video src="${note.media}" controls style="max-width:100%;"></video>`) : ''}
            <div style="margin-top:10px; font-size:12px; color:#999; display:flex; justify-content:space-between;">
                <span>${note.createdAt}</span>
                <span onclick="deleteNote(${note.id})" style="color:red; cursor:pointer;">删除</span>
            </div>
        </div>
    `).join('');
}

// 4. 保存
saveBtn.onclick = () => {
    if (!titleInput.value.trim() && !contentInput.value.trim() && !currentMediaData) {
        alert('总得写点什么或传张图吧');
        return;
    }
    if (!selectedCategory) {
        alert('请选择一个分类');
        return;
    }
    const newNote = {
        id: Date.now(),
        title: titleInput.value.trim(),
        content: contentInput.value.trim(),
        media: currentMediaData,
        category: selectedCategory,
        createdAt: new Date().toLocaleString()
    };
    notes.unshift(newNote);
    localStorage.setItem('my_notes', JSON.stringify(notes));
    // 清空
    titleInput.value = ''; contentInput.value = '';
    currentMediaData = null; mediaPreview.innerHTML = '';
    renderNotes();
    alert('保存成功！');
};

// 5. 删除
window.deleteNote = (id) => {
    if(confirm('确定删除吗？')) {
        notes = notes.filter(n => n.id !== id);
        localStorage.setItem('my_notes', JSON.stringify(notes));
        renderNotes();
    }
};

// 初始加载
renderNotes();

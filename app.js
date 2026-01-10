// --- 1. 初始化数据 ---
let notes = JSON.parse(localStorage.getItem('my_notes')) || [];
let selectedCategory = "";
let currentMediaData = null;

// 获取元素
const titleInput = document.getElementById('titleInput');
const contentInput = document.getElementById('contentInput');
const saveBtn = document.getElementById('saveBtn');
const mediaInput = document.getElementById('mediaInput');
const addMediaBtn = document.getElementById('addMediaBtn');
const mediaPreview = document.getElementById('mediaPreview');
const notesList = document.getElementById('notesList'); // 假设你的列表容器叫这个

// --- 2. 媒体处理 ---
if(addMediaBtn) {
    addMediaBtn.onclick = () => mediaInput.click();
}

if(mediaInput) {
    mediaInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const rawData = event.target.result;
            if (file.type.startsWith('image/')) {
                const img = new Image();
                img.src = rawData;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const maxW = 800;
                    const scale = maxW / img.width;
                    canvas.width = maxW;
                    canvas.height = img.height * scale;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    currentMediaData = canvas.toDataURL('image/jpeg', 0.7); 
                    mediaPreview.innerHTML = `<img src="${currentMediaData}" style="max-width:100%; border-radius:8px; margin-top:10px;">`;
                };
            } else {
                currentMediaData = rawData;
                mediaPreview.innerHTML = `<video src="${currentMediaData}" controls style="max-width:100%; border-radius:8px; margin-top:10px;"></video>`;
            }
        };
        reader.readAsDataURL(file);
    };
}

// --- 3. 分类按钮点击逻辑 ---
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCategory = btn.innerText;
    };
});

// --- 4. 保存笔记 ---
saveBtn.onclick = () => {
    if (!titleInput.value.trim() && !contentInput.value.trim()) {
        alert('标题或内容总得写点什么吧');
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
    
    // 重置界面
    titleInput.value = ''; contentInput.value = '';
    currentMediaData = null;
    mediaPreview.innerHTML = '';
    renderNotes(); // 重新渲染列表
    alert('保存成功');
};

// --- 5. 渲染显示笔记列表 ---
function renderNotes() {
    if(!notesList) return;
    notesList.innerHTML = notes.map(note => `
        <div class="note-card" style="border:1px solid #eee; padding:10px; margin-bottom:10px; border-radius:8px; background:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:#333;">${note.title || '无标题'}</strong>
                <span style="font-size:12px; color:#999; background:#f0f0f0; padding:2px 6px; border-radius:4px;">${note.category}</span>
            </div>
            <p style="color:#666; font-size:14px; margin:8px 0;">${note.content}</p>
            ${note.media ? (note.media.startsWith('data:image') ? `<img src="${note.media}" style="max-width:100%; border-radius:4px;">` : `<video src="${note.media}" controls style="max-width:100%;"></video>`) : ''}
            <div style="text-align:right; margin-top:10px;">
                <small style="color:#ccc;">${note.createdAt}</small>
                <button onclick="deleteNote(${note.id})" style="border:none; background:none; color:red; margin-left:10px; cursor:pointer;">删除</button>
            </div>
        </div>
    `).join('');
}

// --- 6. 删除功能 ---
window.deleteNote = (id) => {
    if(confirm('确定要删除这条笔记吗？')) {
        notes = notes.filter(n => n.id !== id);
        localStorage.setItem('my_notes', JSON.stringify(notes));
        renderNotes();
    }
};

// 页面加载时显示一次
renderNotes();

const titleInput = document.getElementById('note-title');
const contentInput = document.getElementById('note-content');
const saveBtn = document.getElementById('save-btn');
const noteList = document.getElementById('note-list');
const toast = document.getElementById('toast');

// 区域切换变量
const writeSection = document.getElementById('write-section');
const categorySection = document.getElementById('category-section');
const readSection = document.getElementById('read-section');

let selectedCategory = ""; // 用于记录当前选了哪个分类

// 1. 处理分类按钮点击（写入时）
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCategory = btn.getAttribute('data-cat');
    };
});

let notes = JSON.parse(localStorage.getItem('my_notes') || '[]');

function showToast(msg) {
    toast.textContent = msg; toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

// 2. 保存逻辑
saveBtn.onclick = () => {
    if (!titleInput.value.trim()) return showToast('请填写标题哦');
    if (!selectedCategory) return showToast('请选择一个分类');
    
    const newNote = {
        id: Date.now(),
        title: titleInput.value.trim(),
        content: contentInput.value.trim(),
        category: selectedCategory, // 存入分类
        createdAt: new Date().toLocaleString()
    };
    
    notes.unshift(newNote);
    localStorage.setItem('my_notes', JSON.stringify(notes));
    
    // 重置输入
    titleInput.value = ''; contentInput.value = '';
    selectedCategory = "";
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    showToast('已保存到' + newNote.category);
};

// 3. 导航逻辑
document.getElementById('view-list-btn').onclick = () => {
    writeSection.style.display = 'none';
    categorySection.style.display = 'block';
};

document.getElementById('back-to-write-from-cat').onclick = () => {
    categorySection.style.display = 'none';
    writeSection.style.display = 'block';
};

function backToCategory() {
    readSection.style.display = 'none';
    categorySection.style.display = 'block';
}

// 4. 根据分类显示列表
function showListByCategory(cat) {
    categorySection.style.display = 'none';
    readSection.style.display = 'block';
    document.getElementById('list-type-title').textContent = cat + ' 的记录';
    
    const filteredNotes = notes.filter(n => n.category === cat);
    noteList.innerHTML = '';
    
    if (filteredNotes.length === 0) {
        noteList.innerHTML = '<p style="text-align:center; color:#999;">这一类还没有记录哦</p>';
        return;
    }

    filteredNotes.forEach(note => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="note-item-header">
                <strong style="cursor:pointer" onclick="showDetail(${note.id})">📖 ${note.title}</strong>
                <button class="del-btn" onclick="deleteNote(${note.id})">删除</button>
            </div>
            <div class="note-time">📅 ${note.createdAt}</div>
        `;
        noteList.appendChild(li);
    });
}

function showDetail(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    document.getElementById('detail-title').textContent = note.title;
    document.getElementById('detail-time').textContent = '分类: ' + note.category + ' | ' + note.createdAt;
    document.getElementById('detail-content').textContent = note.content || '（无具体内容）';
    
    // 关键改动：让关闭按钮知道该回哪
    const closeBtn = document.querySelector('.close-btn');
    closeBtn.onclick = () => {
        document.getElementById('note-detail').style.display = 'none';
        // 如果是从“开心推送”跳过来的，直接回主页
        if (readSection.style.display === 'block' && document.getElementById('list-type-title').textContent.includes('回顾')) {
            readSection.style.display = 'none';
            writeSection.style.display = 'block';
        }
    };
    
    document.getElementById('note-detail').style.display = 'block';
}

function deleteNote(id) {
    if (!confirm('确定删除吗？')) return;
    const noteToDelete = notes.find(n => n.id === id);
    const cat = noteToDelete.category;
    notes = notes.filter(n => n.id !== id);
    localStorage.setItem('my_notes', JSON.stringify(notes));
    showListByCategory(cat); // 刷新当前分类列表
    showToast('已删除');
}

// --- 开心推送逻辑 ---
window.onload = () => {
    const happyNotes = notes.filter(n => n.category === '开心！');
    if (happyNotes.length > 0) {
        // 随机选一条
        const randomNote = happyNotes[Math.floor(Math.random() * happyNotes.length)];
        
        const modal = document.getElementById('push-modal');
        document.getElementById('push-title').textContent = randomNote.title;
        document.getElementById('push-time').textContent = randomNote.createdAt;
        modal.style.display = 'flex';

       // 点击“看看”
        document.getElementById('push-view-btn').onclick = () => {
            modal.style.display = 'none';
            // 切换到展示区域，但标题设为“回顾”，方便上面那个判断函数识别
            writeSection.style.display = 'none';
            readSection.style.display = 'block';
            document.getElementById('list-type-title').textContent = '✨ 开心时刻回顾'; 
            showDetail(randomNote.id); 
        };

        // 点击“好的”
        document.getElementById('push-skip-btn').onclick = () => {
            modal.style.display = 'none';
        };
    }
};



const titleInput = document.getElementById('note-title');
const contentInput = document.getElementById('note-content');
const saveBtn = document.getElementById('save-btn');
const noteList = document.getElementById('note-list');
const toast = document.getElementById('toast');

const writeSection = document.getElementById('write-section');
const categorySection = document.getElementById('category-section');
const readSection = document.getElementById('read-section');

let selectedCategory = ""; 
let notes = JSON.parse(localStorage.getItem('my_notes') || '[]');

// 分类选择
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCategory = btn.getAttribute('data-cat');
    };
});

function showToast(msg) {
    toast.textContent = msg; toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

// 保存
saveBtn.onclick = () => {
    if (!titleInput.value.trim()) return showToast('请填写标题哦');
    if (!selectedCategory) return showToast('请选择一个分类');
    
    const newNote = {
        id: Date.now(),
        title: titleInput.value.trim(),
        content: contentInput.value.trim(),
        category: selectedCategory,
        createdAt: new Date().toLocaleString()
    };
    
    notes.unshift(newNote);
    localStorage.setItem('my_notes', JSON.stringify(notes));
    titleInput.value = ''; contentInput.value = '';
    selectedCategory = "";
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    showToast('已保存');
};

// 列表显示逻辑
function showListByCategory(cat) {
    categorySection.style.display = 'none';
    readSection.style.display = 'block';
    document.getElementById('list-type-title').textContent = cat;
    
    const filteredNotes = notes.filter(n => n.category === cat);
    noteList.innerHTML = '';
    
    if (filteredNotes.length === 0) {
        noteList.innerHTML = '<p style="text-align:center; color:#999;">这里空空如也</p>';
        return;
    }

    filteredNotes.forEach(note => {
        const li = document.createElement('li');
        if (cat === '不开心') {
            li.className = 'unhappy-item';
            const timeOnly = note.createdAt.split(' ')[1] || note.createdAt;
            li.innerHTML = `
                <div class="hold-progress"></div>
                <div class="note-item-header"><strong>🔒 封存的心情</strong></div>
                <div class="note-time">⏰ ${timeOnly} (连续点击开启)</div>
            `;
            // 设置点击5秒进入
            setupClickToOpen(li, note, 25); // 约25次点击
        } else {
            li.innerHTML = `
                <div class="note-item-header">
                    <strong style="cursor:pointer" onclick="showDetail(${note.id})">📖 ${note.title}</strong>
                    <button class="del-btn" onclick="deleteNote(${note.id})">删除</button>
                </div>
                <div class="note-time">📅 ${note.createdAt}</div>
            `;
        }
        noteList.appendChild(li);
    });
}

// 狂点逻辑
function setupClickToOpen(element, note, targetClicks) {
    const progressBg = element.querySelector('.hold-progress');
    let currentClicks = 0;
    let decayTimer = null;

    element.onclick = (e) => {
        currentClicks++;
        progressBg.style.width = (currentClicks / targetClicks) * 100 + '%';

        // 停止之前的衰减
        if (decayTimer) clearInterval(decayTimer);
        
        // 开启自动回退
        decayTimer = setInterval(() => {
            if (currentClicks > 0) {
                currentClicks -= 0.2;
                progressBg.style.width = (currentClicks / targetClicks) * 100 + '%';
            } else {
                clearInterval(decayTimer);
            }
        }, 100);

        if (currentClicks >= targetClicks) {
            clearInterval(decayTimer);
            progressBg.style.width = '0%';
            currentClicks = 0;
            showDetail(note.id);
        }
    };
}

// 详情页
function showDetail(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    
    const detailCard = document.getElementById('note-detail');
    document.getElementById('detail-title').textContent = note.title;
    document.getElementById('detail-time').textContent = note.createdAt;
    document.getElementById('detail-content').textContent = note.content;

    // 如果是“不开心”，显示销毁按钮，隐藏普通关闭按钮
    const destroySection = `
        <div class="destroy-group" style="display:flex; gap:10px; margin-top:15px;">
            <button onclick="transferToTrash(${note.id}, '🔥')">🔥 烧掉</button>
            <button onclick="transferToTrash(${note.id}, '🔨')">🔨 砸碎</button>
            <button onclick="transferToTrash(${note.id}, '✂️')">✂️ 剪开</button>
        </div>
    `;
    
    if (note.category === '不开心') {
        document.getElementById('normal-close').style.display = 'none';
        // 动态添加销毁组
        let existingGroup = detailCard.querySelector('.destroy-group');
        if (existingGroup) existingGroup.remove();
        detailCard.insertAdjacentHTML('beforeend', destroySection);
    } else {
        document.getElementById('normal-close').style.display = 'block';
        let existingGroup = detailCard.querySelector('.destroy-group');
        if (existingGroup) existingGroup.remove();
    }
    
    detailCard.style.display = 'block';
}

// 转移到垃圾桶逻辑
function transferToTrash(id, action) {
    const noteIndex = notes.findIndex(n => n.id === id);
    if (noteIndex !== -1) {
        notes[noteIndex].category = '垃圾桶';
        localStorage.setItem('my_notes', JSON.stringify(notes));
        showToast('已将其 ' + action);
        document.getElementById('note-detail').style.display = 'none';
        showListByCategory('不开心');
    }
}

// 基础导航
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
function deleteNote(id) {
    if (!confirm('确定删除吗？')) return;
    notes = notes.filter(n => n.id !== id);
    localStorage.setItem('my_notes', JSON.stringify(notes));
    showListByCategory(document.getElementById('list-type-title').textContent);
}

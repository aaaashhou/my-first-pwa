// --- 基础元素获取 ---
const titleInput = document.getElementById('note-title');
const contentInput = document.getElementById('note-content');
const saveBtn = document.getElementById('save-btn');
const addImageBtn = document.getElementById('add-image-btn');
const imageInput = document.getElementById('image-input');
const removeImageBtn = document.getElementById('remove-image-btn');
const imagePreview = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');

let selectedImageData = null;

addImageBtn.onclick = () => {
    imageInput.click();
};

imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            selectedImageData = event.target.result;
            previewImg.src = selectedImageData;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

removeImageBtn.onclick = () => {
    selectedImageData = null;
    imagePreview.style.display = 'none';
    imageInput.value = '';
};

const noteList = document.getElementById('note-list');
const toast = document.getElementById('toast');
const writeSection = document.getElementById('write-section');
const categorySection = document.getElementById('category-section');
const readSection = document.getElementById('read-section');

let selectedCategory = ""; 
let notes = JSON.parse(localStorage.getItem('my_notes') || '[]');
let trash = JSON.parse(localStorage.getItem('my_trash') || 'null');
let decayTimer = null;

// --- 弹窗提示 ---
function showToast(msg) {
    toast.textContent = msg; toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

// --- 分类按钮点击 ---
document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCategory = btn.getAttribute('data-cat');
    };
});

// --- 保存笔记 ---
saveBtn.onclick = () => {
    // 检查标题和内容是否都为空
    if (!titleInput.value.trim() && !contentInput.value.trim()) {
        return showToast('标题或内容总得写点什么吧');
    }
    if (!selectedCategory) return showToast('请选择一个分类');
    
    const newNote = {
        id: Date.now(),
        title: titleInput.value.trim(),
        content: contentInput.value.trim(),
        category: selectedCategory,
        createdAt: new Date().toLocaleString(),
        image: selectedImageData,
    };
    
    notes.unshift(newNote);
    localStorage.setItem('my_notes', JSON.stringify(notes));
    titleInput.value = ''; 
    contentInput.value = '';
    selectedCategory = "";
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    showToast('保存成功');
    localStorage.setItem('my_notes', JSON.stringify(notes));
    selectedImageData = null;
    imagePreview.style.display = 'none';
    imageInput.value = '';
};

// --- 列表展示逻辑 ---
function showListByCategory(cat) {
    categorySection.style.display = 'none';
    readSection.style.display = 'block';
    document.getElementById('list-type-title').textContent = cat;
    
    const filteredNotes = notes.filter(n => n.category === cat);
    noteList.innerHTML = '';
    
    // --- 如果是日常列表，处理垃圾桶伪装 ---
    if (cat === '日常' && trash && trash.trashedRecords.length > 0) {
        // 生成伪装标题
        if (filteredNotes.length > 0) {
            const randomDaily = filteredNotes[Math.floor(Math.random() * filteredNotes.length)];
            trash.disguiseTitle = randomDaily.title;
        } else {
            trash.disguiseTitle = '日常记录';
        }
        
        // 生成不重复的伪装时间
        let disguiseTime = new Date().toLocaleString();
        while (filteredNotes.some(n => n.createdAt === disguiseTime)) {
            disguiseTime = new Date(Date.now() - Math.random() * 86400000).toLocaleString();
        }
        trash.disguiseTime = disguiseTime;
        localStorage.setItem('my_trash', JSON.stringify(trash));
        
        // 创建垃圾桶伪装项（看起来像日常记录）
        const trashLi = document.createElement('li');
        trashLi.className = 'unhappy-item';
        trashLi.innerHTML = `
            <div class="hold-progress"></div>
            <div class="note-item-header">
                <strong style="cursor:pointer">📖 ${trash.disguiseTitle}</strong>
            </div>
            <div class="note-time">📅 ${trash.disguiseTime}</div>
        `;
        setupClickToOpen(trashLi, {id: 'trash_bin'}, 30); // 10秒约50次
        noteList.appendChild(trashLi);
    }
    
    // --- 显示真实的笔记 ---
    filteredNotes.forEach(note => {
        const li = document.createElement('li');
        
        if (cat === '不开心' || cat === '垃圾桶') {
            // 不开心 / 垃圾桶列表的样式
            li.className = 'unhappy-item';
            const timeDisplay = cat === '不开心' ? (note.createdAt.split(' ')[1] || note.createdAt) : '已放逐的内容';
            li.innerHTML = `
                <div class="hold-progress"></div>
                <div class="note-item-header"><strong>🔒 ${cat === '不开心' ? '封存的心情' : '待处理的碎片'}</strong></div>
                <div class="note-time">⏰ ${timeDisplay} (连续点击开启)</div>
            `;
            setupClickToOpen(li, note, 25); // 5秒约25次
        } else {
            // 日常 / 开心列表的样式
            let imageHtml = '';
            if (note.image) {
                imageHtml = `<img src="${note.image}" style="max-width:100%; margin-top:10px; border-radius:8px; cursor:pointer;" onclick="showDetail(${note.id})">`;
            }
            li.innerHTML = `
                <div class="note-item-header">
                    <strong style="cursor:pointer" onclick="showDetail(${note.id})">📖 ${note.title}</strong>
                    <button class="del-btn" onclick="deleteNote(${note.id})">删除</button>
                </div>
                <div class="note-time">📅 ${note.createdAt}</div>
                ${imageHtml}
            `;
        }
        
        noteList.appendChild(li);
    });
}

// --- 核心狂点逻辑 ---
function setupClickToOpen(element, note, targetClicks) {
    const progressBg = element.querySelector('.hold-progress');
    let currentClicks = 0;

    element.onclick = (e) => {
        e.preventDefault();
        currentClicks++;
        progressBg.style.width = (currentClicks / targetClicks) * 100 + '%';

        if (decayTimer) clearInterval(decayTimer);
        decayTimer = setInterval(() => {
            if (currentClicks > 0) {
                currentClicks -= 0.3;
                progressBg.style.width = (currentClicks / targetClicks) * 100 + '%';
            } else { clearInterval(decayTimer); }
        }, 150);

       if (currentClicks >= targetClicks) {
            clearInterval(decayTimer);
            progressBg.style.width = '0%';
            currentClicks = 0;
            if (note.id === 'trash_bin') {
                showTrashList();
            } else {
                showDetail(note.id);
            }
        }
    };
}

// --- 显示垃圾桶列表 ---
function showTrashList() {
    categorySection.style.display = 'none';
    readSection.style.display = 'block';
    document.getElementById('list-type-title').textContent = '🗑️ 垃圾桶';
    
    noteList.innerHTML = '';
    
    if (!trash || trash.trashedRecords.length === 0) {
        noteList.innerHTML = '<li style="text-align:center; padding:20px;">垃圾桶是空的</li>';
        return;
    }
    
    trash.trashedRecords.forEach(note => {
        const li = document.createElement('li');
        li.className = 'unhappy-item';
        const timeDisplay = note.createdAt.split(' ')[1] || note.createdAt;
        li.innerHTML = `
            <div class="hold-progress"></div>
            <div class="note-item-header"><strong>🔒 封存的心情</strong></div>
            <div class="note-time">⏰ ${timeDisplay} (连续点击开启)</div>
        `;
        setupClickToOpen(li, note, 25); // 5秒约25次
        noteList.appendChild(li);
    });
}

// --- 详情展示 ---
function showDetail(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    
    document.getElementById('detail-title').textContent = note.title;
    document.getElementById('detail-time').textContent = note.createdAt;
    document.getElementById('detail-content').textContent = note.content;
    if (note.image) {
        document.getElementById('detail-content').innerHTML += `<br><img src="${note.image}" style="max-width:100%; margin-top:15px; border-radius:10px;">`;
    }

    const footer = document.getElementById('detail-footer');
    footer.innerHTML = ''; 

    if (note.category === '不开心') {
        footer.innerHTML = `
            <div class="destroy-group" style="display:flex; gap:10px; width:100%;">
                <button onclick="transferToTrash(${note.id}, '🔥')">🔥</button>
                <button onclick="transferToTrash(${note.id}, '🔨')">🔨</button>
                <button onclick="transferToTrash(${note.id}, '✂️')">✂️</button>
            </div>
            <button onclick="closeDetail()" style="margin-top:20px; background:#ccc; width:100%;">暂不销毁</button>
        `;
} else if (note.category === '垃圾桶' || (trash && trash.trashedRecords.some(n => n.id === id))) {
        // 启动10秒倒计时自动删除
        let countdown = 10;
        const countdownEl = document.createElement('div');
        countdownEl.style.cssText = 'text-align:center; color:#ff4d4d; font-size:20px; font-weight:bold; margin-top:20px;';
        countdownEl.textContent = `${countdown}秒后自动粉碎`;
        
        const timer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                countdownEl.textContent = `${countdown}秒后自动粉碎`;
            } else {
                clearInterval(timer);
                finalDelete(id);
            }
        }, 1000);
        
        footer.innerHTML = `
            <button class="final-del-btn" onclick="finalDelete(${id})">立即粉碎</button>
            <button onclick="closeDetail()" style="margin-top:20px; background:#ccc; width:100%;">还没想好</button>
        `;
        footer.appendChild(countdownEl);
    } else {
        footer.innerHTML = `<button class="close-btn" onclick="closeDetail()" style="width:100%;">关闭详情</button>`;
    }
    document.getElementById('note-detail').style.display = 'flex';
}

// --- 转移到垃圾桶 ---
function transferToTrash(id, action) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    
    // 如果还没有垃圾桶，就创建一个
    if (!trash) {
        trash = {
            id: 'trash_bin',
            disguiseTitle: '日常记录',
            disguiseTime: new Date().toLocaleString(),
            trashedRecords: []
        };
    }
    
    // 把不开心记录加入垃圾桶
    trash.trashedRecords.push(note);
    
    // 从笔记列表删除
    notes = notes.filter(n => n.id !== id);
    
    // 保存到 localStorage
    localStorage.setItem('my_notes', JSON.stringify(notes));
    localStorage.setItem('my_trash', JSON.stringify(trash));
    
    showToast('已将其 ' + action);
    
    document.getElementById('note-detail').style.display = 'none';
    readSection.style.display = 'none';
    writeSection.style.display = 'block';
}

// --- 彻底删除 ---
function finalDelete(id) {
    // 从垃圾桶里删除
    if (trash && trash.trashedRecords.length > 0) {
        trash.trashedRecords = trash.trashedRecords.filter(n => n.id !== id);
        localStorage.setItem('my_trash', JSON.stringify(trash));
        
        // 如果垃圾桶空了，清空它
        if (trash.trashedRecords.length === 0) {
            trash = null;
            localStorage.removeItem('my_trash');
        }
    }
    
    document.getElementById('note-detail').style.display = 'none';
    readSection.style.display = 'none';
    writeSection.style.display = 'block';
    showToast('已彻底粉碎');
}

// --- 关闭详情 ---
function closeDetail() {
    document.getElementById('note-detail').style.display = 'none';
    if (document.getElementById('list-type-title').textContent.includes('回顾')) {
        readSection.style.display = 'none';
        writeSection.style.display = 'block';
    }
}

// --- 导航按钮 ---
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

// --- 开心推送 ---
window.onload = () => {
    const happy = notes.filter(n => n.category === '开心！');
    if (happy.length > 0) {
        const rand = happy[Math.floor(Math.random() * happy.length)];
        document.getElementById('push-title').textContent = rand.title;
        document.getElementById('push-time').textContent = rand.createdAt;
        document.getElementById('push-modal').style.display = 'flex';
        document.getElementById('push-view-btn').onclick = () => {
            document.getElementById('push-modal').style.display = 'none';
            writeSection.style.display = 'none';
            readSection.style.display = 'block';
            document.getElementById('list-type-title').textContent = '✨ 开心时刻回顾';
            showDetail(rand.id);
        };
        document.getElementById('push-skip-btn').onclick = () => { 
            document.getElementById('push-modal').style.display = 'none'; 
        };
    }
};




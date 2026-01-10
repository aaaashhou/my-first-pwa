// --- 初始化数据 ---
let notes = JSON.parse(localStorage.getItem('my_notes')) || [];
let selectedCategory = "";
let currentMediaData = null; // 临时存放图片/视频

// 获取页面上的元素
const titleInput = document.getElementById('titleInput');
const contentInput = document.getElementById('contentInput');
const saveBtn = document.getElementById('saveBtn');
const mediaInput = document.getElementById('mediaInput');
const addMediaBtn = document.getElementById('addMediaBtn');
const mediaPreview = document.getElementById('mediaPreview');

// --- 媒体处理（核心功能） ---
addMediaBtn.onclick = () => mediaInput.click();

mediaInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const rawData = event.target.result;
        
        // 如果是图片，进行压缩处理
        if (file.type.startsWith('image/')) {
            const img = new Image();
            img.src = rawData;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                // 压缩到最大宽度 800 像素
                const scale = 800 / img.width;
                canvas.width = 800;
                canvas.height = img.height * scale;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                // 变成更小的字符串存起来
                currentMediaData = canvas.toDataURL('image/jpeg', 0.7); 
                mediaPreview.innerHTML = `<img src="${currentMediaData}" style="max-width:100%; border-radius:8px; margin-top:10px;">`;
            };
        } else {
            // 视频暂时不压缩，直接存预览地址
            currentMediaData = rawData;
            mediaPreview.innerHTML = `<video src="${currentMediaData}" controls style="max-width:100%; border-radius:8px; margin-top:10px;"></video>`;
        }
    };
    reader.readAsDataURL(file);
};

// --- 保存笔记 ---
saveBtn.onclick = () => {
    // 改动：标题和内容不能同时为空
    if (!titleInput.value.trim() && !contentInput.value.trim()) {
        return alert('标题或内容总得写点什么吧');
    }
    if (!selectedCategory) return alert('请选择一个分类');

    const newNote = {
        id: Date.now(),
        title: titleInput.value.trim(),
        content: contentInput.value.trim(),
        media: currentMediaData, // 存入图片/视频
        category: selectedCategory,
        createdAt: new Date().toLocaleString()
    };

    notes.unshift(newNote);
    localStorage.setItem('my_notes', JSON.stringify(notes));
    
    // 清空输入框和预览
    titleInput.value = ''; 
    contentInput.value = '';
    currentMediaData = null;
    mediaPreview.innerHTML = '';
    alert('保存成功！');
    location.reload(); // 刷新页面看到新笔记
}

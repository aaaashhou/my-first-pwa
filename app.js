const noteInput = document.getElementById('noteInput');
const saveBtn = document.getElementById('saveBtn');
const noteDisplay = document.getElementById('noteDisplay');

window.addEventListener('load', function() {
    const savedNote = localStorage.getItem('myNote');
    if (savedNote) {
        noteDisplay.textContent = savedNote;
    }
});

saveBtn.addEventListener('click', function() {
    const userText = noteInput.value;
    if (userText.trim() !== '') {
        localStorage.setItem('myNote', userText);
        noteDisplay.textContent = userText;
        noteInput.value = '';
        alert('✅ 保存成功！');
    } else {
        alert('⚠️ 请先写点什么再保存哦~');
    }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

---

## 📂 现在你的文件夹
```
📁 我的第一个PWA
   📄 index.html
   📄 style.css
   📄 app.js
   📄 manifest.json  ← 新加
   📄 sw.js          ← 新加
   🖼️ icon.png       ← 可选
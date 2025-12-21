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


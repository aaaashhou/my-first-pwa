// ========== 数据结构 ==========
let data = {
    bagsTaken: 0,
    cashTaken: {},
    bagRecords: [],
    cashRecords: []
};

const DENOMINATIONS = ['0.1', '0.5', '1', '5', '10', '20', '50', '100'];
let currentMode = 'setup';
let currentCodeMode = 'login';
let selectedCash = {};

// ========== 页面加载 ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成');
    initCashBox('setup');
    bindAllEvents();
    showScreen('setup');
});

function bindAllEvents() {
    // 开银确认按钮
    const setupBtn = document.getElementById('setup-confirm-btn');
    if (setupBtn) {
        setupBtn.addEventListener('click', confirmSetup);
    }
    
    // 上班按钮
    document.getElementById('btn-a').addEventListener('click', () => showScreen('detail-a'));
    document.getElementById('btn-b').addEventListener('click', () => showScreen('detail-b'));
    document.getElementById('btn-c').addEventListener('click', () => showScreen('detail-c'));
    
    // 下班按钮 - 修复：同时绑定两个元素
    const workTime = document.getElementById('work-time');
    const logoutBtn = document.getElementById('logout-btn');
    if (workTime) {
        workTime.addEventListener('click', confirmLogout);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', confirmLogout);
    }
    
    // 会员码切换
    document.getElementById('toggle-code-btn').addEventListener('click', toggleCode);
    
    // B区按钮
    document.getElementById('edit-taken-btn').addEventListener('click', editTaken);
    document.getElementById('sell-one-btn').addEventListener('click', sellOne);
    
    // C区按钮 - 修复：确保按钮正确绑定
    const entryCashBtn = document.getElementById('entry-cash-btn');
    if (entryCashBtn) {
        entryCashBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('打开钱箱按钮被点击');
            openCashModal('entry');
        });
    }
    document.getElementById('entry-confirm-btn').addEventListener('click', confirmEntry);
    
    // 钱箱模态窗
    document.getElementById('cash-modal-confirm').addEventListener('click', confirmCashModal);
    document.getElementById('cash-modal-close').addEventListener('click', closeCashModal);
    
    // 编辑模态窗
    document.getElementById('edit-confirm').addEventListener('click', confirmEdit);
    document.getElementById('edit-cancel').addEventListener('click', cancelEdit);
    document.getElementById('edit-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') confirmEdit();
    });
    
    // 确认模态窗
    document.getElementById('confirm-yes').addEventListener('click', confirmYes);
    document.getElementById('confirm-no').addEventListener('click', confirmNo);
    
    // 结账按钮
    document.getElementById('view-details-btn').addEventListener('click', () => showScreen('details'));
    document.getElementById('confirm-summary-btn').addEventListener('click', finalConfirm);
    
    // 返回按钮
    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', goBack);
    });
    
    console.log('所有事件已绑定');
}

// ========== 初始化函数 ==========
function initCashBox(context) {
    const box = document.getElementById(`${context}-cash-box`);
    if (!box) return;
    
    box.innerHTML = '';
    DENOMINATIONS.forEach(denom => {
        const item = document.createElement('div');
        item.className = 'cash-item';
        item.innerHTML = `
            <label>¥${denom}</label>
            <input type="number" class="cash-input" data-denom="${denom}" value="0" min="0">
        `;
        box.appendChild(item);
    });
    
    const inputs = box.querySelectorAll('.cash-input');
    inputs.forEach(input => {
        input.addEventListener('input', () => updateCashTotal(context));
    });
}

function updateCashTotal(context) {
    const inputs = document.querySelectorAll(`#${context}-cash-box .cash-input`);
    let total = 0;
    inputs.forEach(input => {
        const denom = parseFloat(input.dataset.denom);
        const qty = parseInt(input.value) || 0;
        total += denom * qty;
    });
    document.getElementById(`${context}-cash-total`).textContent = `总计：¥${total.toFixed(2)}`;
}

// ========== 屏幕切换 ==========
function showScreen(screen) {
    // 隐藏所有屏幕
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.detail').forEach(d => d.style.display = 'none');
    
    // 显示对应屏幕
    if (screen === 'setup') {
        document.getElementById('setup-section').style.display = 'block';
        currentMode = 'setup';
    } else if (screen === 'work') {
        document.getElementById('work-section').style.display = 'block';
        currentMode = 'work';
        startWorkTime();
        updateBagBadge();
    } else if (screen === 'detail-a') {
        document.getElementById('detail-a').style.display = 'block';
        currentMode = 'detail-a';
    } else if (screen === 'detail-b') {
        document.getElementById('detail-b').style.display = 'block';
        currentMode = 'detail-b';
        refreshBDetail();
    } else if (screen === 'detail-c') {
        document.getElementById('detail-c').style.display = 'block';
        currentMode = 'detail-c';
        refreshCDetail();
    } else if (screen === 'summary') {
        document.getElementById('summary-section').style.display = 'block';
        currentMode = 'summary';
        refreshSummary();
    } else if (screen === 'details') {
        document.getElementById('details-section').style.display = 'block';
        currentMode = 'details';
        refreshDetailsScreen();
    }
}

// ========== 开银逻辑 ==========
function confirmSetup() {
    const bagsTaken = parseInt(document.getElementById('setup-bags').value) || 0;
    if (bagsTaken === 0) {
        alert('请输入购物袋数量');
        return;
    }
    
   data.bagsTaken = 0;  // 改成0，所有数量都通过记录累加
const time = getCurrentTime();
data.bagRecords = [{ time, amount: bagsTaken }];  // 把初始领取作为第一条记录
    
    const cashInputs = document.querySelectorAll('#setup-cash-box .cash-input');
    DENOMINATIONS.forEach((denom, idx) => {
        data.cashTaken[denom] = parseInt(cashInputs[idx].value) || 0;
    });
    
    data.cashRecords = [];
    
    showScreen('work');
}

// ========== 上班界面 ==========
let workTimer = null;

function startWorkTime() {
    if (workTimer) clearInterval(workTimer);
    
    function updateTime() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('work-time').textContent = `在岗 ${h}:${m}`;
    }
    
    updateTime();
    workTimer = setInterval(updateTime, 60000);
}

function confirmLogout() {
    console.log('confirmLogout 被调用');
    showConfirmModal('确认下班？', () => {
        clearInterval(workTimer);
        showScreen('summary');
    });
}

// ========== A区 ==========
function toggleCode() {
    currentCodeMode = currentCodeMode === 'login' ? 'qrcode' : 'login';
    const text = currentCodeMode === 'login' ? '会员登陆码' : '办卡码';
    document.querySelector('.code-content').textContent = text;
}

// ========== B区 ==========
function editTaken() {
    showEditModal('新增领取购物袋', 0, function(newVal) {
        if (newVal <= 0) {
            alert('请输入有效数量');
            return;
        }
        
        data.bagsTaken += newVal;  // 原来的总数加上新增的
        
        const time = getCurrentTime();
        data.bagRecords.push({ time, amount: newVal });  // 记录新增
        
        refreshBDetail();
        updateBagBadge();
    });
}

function sellOne() {
    const time = getCurrentTime();
    data.bagRecords.push({ time, amount: -1 });
    refreshBDetail();
    updateBagBadge();
}

function refreshBDetail() {
    const initialTaken = data.bagsTaken;
    const sold = data.bagRecords.reduce((sum, r) => sum + (r.amount < 0 ? Math.abs(r.amount) : 0), 0);
    const added = data.bagRecords.reduce((sum, r) => sum + (r.amount > 0 ? r.amount : 0), 0);
    const totalTaken = initialTaken + added;
    const remaining = totalTaken - sold;
    
    document.getElementById('b-taken').textContent = totalTaken;
    document.getElementById('b-sold').textContent = sold;
    document.getElementById('b-remaining').textContent = remaining;
    
    const recordList = document.getElementById('b-records');
    recordList.innerHTML = '';
    data.bagRecords.forEach((record, idx) => {
        const li = document.createElement('li');
        li.className = 'record-item';
        const sign = record.amount > 0 ? '+' : '';
        li.innerHTML = `
            <span class="record-time">${record.time}</span>
            <span class="record-content">${sign}${record.amount}</span>
            <div class="record-actions">
                <button class="btn-edit" onclick="editBRecord(${idx})">编辑</button>
                <button class="btn-delete" onclick="deleteBRecord(${idx})">删除</button>
            </div>
        `;
        recordList.appendChild(li);
    });
}

function editBRecord(idx) {
    const current = data.bagRecords[idx].amount;
    showEditModal('编辑数量', Math.abs(current), function(newVal) {
        data.bagRecords[idx].amount = current > 0 ? newVal : -newVal;
        refreshBDetail();
        updateBagBadge();
    });
}

function deleteBRecord(idx) {
    data.bagRecords.splice(idx, 1);
    refreshBDetail();
    updateBagBadge();
}

function updateBagBadge() {
    const taken = data.bagsTaken;
    const sold = data.bagRecords.reduce((sum, r) => sum + (r.amount < 0 ? Math.abs(r.amount) : 0), 0);
    const added = data.bagRecords.reduce((sum, r) => sum + (r.amount > 0 ? r.amount : 0), 0);
    const remaining = taken + added - sold;
    document.getElementById('bag-count').textContent = remaining;
}

// ========== C区 ==========
function openCashModal(context) {
    console.log('openCashModal 被调用，context:', context);
    const modal = document.getElementById('cash-modal');
    const box = document.getElementById('cash-modal-box');
    
    box.innerHTML = '';
    DENOMINATIONS.forEach(denom => {
        const item = document.createElement('div');
        item.className = 'cash-item';
        const currentVal = selectedCash[denom] || 0;
        item.innerHTML = `
            <label>¥${denom}</label>
            <input type="number" class="cash-input" data-denom="${denom}" value="${currentVal}" min="0">
        `;
        box.appendChild(item);
    });
    
    const inputs = box.querySelectorAll('.cash-input');
    inputs.forEach(input => {
        input.addEventListener('input', updateCashModalTotal);
    });
    
    updateCashModalTotal();
    modal.style.display = 'flex';
    console.log('钱箱模态窗已打开');
}

function updateCashModalTotal() {
    const box = document.getElementById('cash-modal-box');
    const inputs = box.querySelectorAll('.cash-input');
    let total = 0;
    inputs.forEach(input => {
        const denom = parseFloat(input.dataset.denom);
        const qty = parseInt(input.value) || 0;
        total += denom * qty;
    });
    document.getElementById('cash-modal-total').textContent = `总计：¥${total.toFixed(2)}`;
}

function confirmCashModal() {
    const box = document.getElementById('cash-modal-box');
    const inputs = box.querySelectorAll('.cash-input');
    selectedCash = {};
    inputs.forEach(input => {
        const denom = input.dataset.denom;
        const qty = parseInt(input.value) || 0;
        if (qty > 0) selectedCash[denom] = qty;
    });
    closeCashModal();
}

function closeCashModal() {
    document.getElementById('cash-modal').style.display = 'none';
}

function confirmEntry() {
    const amount = parseFloat(document.getElementById('entry-amount').value);
    
    if (isNaN(amount) || amount <= 0) {
        alert('请输入有效的金额');
        return;
    }
    
    let detail = null;
    if (Object.keys(selectedCash).length > 0) {
        const cashTotal = calcCashTotal(selectedCash);
        if (Math.abs(cashTotal - amount) > 0.01) {
            document.getElementById('entry-status').className = 'warning';
            document.getElementById('entry-status').textContent = `⚠️ 钱箱总计(¥${cashTotal.toFixed(2)})与进账(¥${amount.toFixed(2)})不符！`;
            return;
        }
        detail = { ...selectedCash };
    }
    
    const time = getCurrentTime();
    data.cashRecords.push({ time, amount, detail });
    
    document.getElementById('entry-amount').value = '';
    document.getElementById('entry-status').className = '';
    document.getElementById('entry-status').textContent = '';
    selectedCash = {};
    
    refreshCDetail();
}

function refreshCDetail() {
    const recordList = document.getElementById('c-records');
    recordList.innerHTML = '';
    data.cashRecords.forEach((record, idx) => {
        const li = document.createElement('li');
        li.className = 'record-item';
        li.innerHTML = `
            <span class="record-time">${record.time}</span>
            <span class="record-content">¥${record.amount.toFixed(2)}</span>
            <div class="record-actions">
                <button class="btn-edit" data-idx="${idx}">编辑</button>
                <button class="btn-delete" data-idx="${idx}">删除</button>
            </div>
        `;
        recordList.appendChild(li);
    });
    
    // 修复：重新绑定编辑和删除按钮
    recordList.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.getAttribute('data-idx'));
            editCRecord(idx);
        });
    });
    
    recordList.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.getAttribute('data-idx'));
            deleteCRecord(idx);
        });
    });
}

function editCRecord(idx) {
    const record = data.cashRecords[idx];
    showEditModal('编辑金额', record.amount, function(newVal) {
        data.cashRecords[idx].amount = newVal;
        refreshCDetail();
    });
}

function deleteCRecord(idx) {
    data.cashRecords.splice(idx, 1);
    refreshCDetail();
}

// ========== 结账汇总 ==========
function refreshSummary() {
    const taken = data.bagsTaken;
    const sold = data.bagRecords.reduce((sum, r) => sum + (r.amount < 0 ? Math.abs(r.amount) : 0), 0);
    const added = data.bagRecords.reduce((sum, r) => sum + (r.amount > 0 ? r.amount : 0), 0);
    const remaining = taken + added - sold;
    
    let cashRemaining = 0;
    DENOMINATIONS.forEach(denom => {
        const taken = data.cashTaken[denom] || 0;
        const spent = data.cashRecords.reduce((sum, record) => {
            if (record.detail && record.detail[denom]) {
                return sum + record.detail[denom];
            }
            return sum;
        }, 0);
        cashRemaining += (taken - spent) * parseFloat(denom);
    });
    
    document.getElementById('summary-bags').textContent = remaining;
    document.getElementById('summary-cash').textContent = `¥${cashRemaining.toFixed(2)}`;
}

function refreshDetailsScreen() {
    const detailsB = document.getElementById('details-b');
    detailsB.innerHTML = '';
    const taken = data.bagsTaken;
    const sold = data.bagRecords.reduce((sum, r) => sum + (r.amount < 0 ? Math.abs(r.amount) : 0), 0);
    const added = data.bagRecords.reduce((sum, r) => sum + (r.amount > 0 ? r.amount : 0), 0);
    const remaining = taken + added - sold;
    
    const li = document.createElement('li');
    li.className = 'record-item';
    li.innerHTML = `
        <span class="record-content">领取：${taken} | 增加：${added} | 售出：${sold} | 剩余：${remaining}</span>
    `;
    detailsB.appendChild(li);
    
    const detailsC = document.getElementById('details-c');
    detailsC.innerHTML = '';
    let totalCash = 0;
    data.cashRecords.forEach(record => {
        totalCash += record.amount;
        const li = document.createElement('li');
        li.className = 'record-item';
        li.innerHTML = `
            <span class="record-time">${record.time}</span>
            <span class="record-content">¥${record.amount.toFixed(2)}</span>
        `;
        detailsC.appendChild(li);
    });
    
    const liTotal = document.createElement('li');
    liTotal.className = 'record-item';
    liTotal.innerHTML = `<span class="record-content" style="font-weight:bold;">总计：¥${totalCash.toFixed(2)}</span>`;
    detailsC.appendChild(liTotal);
}

function finalConfirm() {
    showConfirmModal('确认完成汇总？', () => {
        data = {
            bagsTaken: 0,
            cashTaken: {},
            bagRecords: [],
            cashRecords: []
        };
        currentCodeMode = 'login';
        clearInterval(workTimer);
        showScreen('setup');
        
        document.getElementById('setup-bags').value = '';
        document.querySelectorAll('#setup-cash-box .cash-input').forEach(input => {
            input.value = '0';
        });
        updateCashTotal('setup');
    });
}

// ========== 导航 ==========
function goBack() {
    if (currentMode === 'details') {
        showScreen('summary');
    } else if (currentMode.startsWith('detail')) {
        showScreen('work');
    } else if (currentMode === 'summary') {
        showScreen('work');
    }
}

// ========== 模态窗 ==========
let editCallback = null;

function showEditModal(title, currentVal, callback) {
    document.getElementById('edit-modal-title').textContent = title;
    document.getElementById('edit-input').value = currentVal;
    document.getElementById('edit-input').focus();
    document.getElementById('edit-modal').style.display = 'flex';
    editCallback = callback;
}

function confirmEdit() {
    const newVal = parseFloat(document.getElementById('edit-input').value);
    if (isNaN(newVal) || newVal < 0) {
        alert('请输入有效的数字');
        return;
    }
    document.getElementById('edit-modal').style.display = 'none';
    if (editCallback) editCallback(newVal);
}

function cancelEdit() {
    document.getElementById('edit-modal').style.display = 'none';
}

let confirmCallback = null;

function showConfirmModal(text, callback) {
    document.getElementById('confirm-modal-text').textContent = text;
    document.getElementById('confirm-modal').style.display = 'flex';
    confirmCallback = callback;
}

function confirmYes() {
    document.getElementById('confirm-modal').style.display = 'none';
    if (confirmCallback) confirmCallback();
}

function confirmNo() {
    document.getElementById('confirm-modal').style.display = 'none';
}

// ========== 工具函数 ==========
function getCurrentTime() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

function calcCashTotal(cashObj) {
    let total = 0;
    DENOMINATIONS.forEach(denom => {
        const qty = cashObj[denom] || 0;
        total += parseFloat(denom) * qty;
    });
    return total;
}

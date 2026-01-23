// ========== 数据结构 ==========
let data = {
    bagsTaken: 0,
    cashTaken: {}, // { '0.1': 0, '0.5': 0, ... }
    bagRecords: [], // [ { time: 'HH:MM', amount: +5 或 -1 } ]
    cashRecords: [], // [ { time: 'HH:MM', amount: 100.50, detail: {...} } ]
};

const DENOMINATIONS = ['0.1', '0.5', '1', '5', '10', '20', '50', '100'];
let currentMode = 'setup'; // setup, work, detail-a, detail-b, detail-c, summary, details
let currentCodeMode = 'login'; // login 或 qrcode
let codeImages = {
    login: 'https://via.placeholder.com/300x150?text=会员登陆码',
    qrcode: 'https://via.placeholder.com/300x150?text=办卡码'
};

// ========== 初始化 ==========
window.onload = () => {
    initCashBox('setup');
    attachEventListeners();
    showScreen('setup');
};

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
    
    // 监听钱箱输入变化
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
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.detail').forEach(d => d.classList.remove('active'));
    
    if (screen === 'setup') {
        document.getElementById('setup-section').style.display = 'block';
        currentMode = 'setup';
    } else if (screen === 'work') {
        document.getElementById('work-section').style.display = 'block';
        currentMode = 'work';
        startWorkTime();
    } else if (screen === 'detail-a') {
        document.getElementById('detail-a').classList.add('active');
        currentMode = 'detail-a';
    } else if (screen === 'detail-b') {
        document.getElementById('detail-b').classList.add('active');
        currentMode = 'detail-b';
        refreshBDetail();
    } else if (screen === 'detail-c') {
        document.getElementById('detail-c').classList.add('active');
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
document.getElementById('setup-confirm-btn').addEventListener('click', () => {
    const bagsTaken = parseInt(document.getElementById('setup-bags').value) || 0;
    if (bagsTaken === 0) {
        alert('请输入购物袋数量');
        return;
    }
    
    data.bagsTaken = bagsTaken;
    data.bagRecords = [];
    
    // 读取钱箱数据
    const cashInputs = document.querySelectorAll('#setup-cash-box .cash-input');
    DENOMINATIONS.forEach((denom, idx) => {
        data.cashTaken[denom] = parseInt(cashInputs[idx].value) || 0;
    });
    
    data.cashRecords = [];
    
    showScreen('work');
});

// ========== 上班界面 ==========
let workTimer = null;
function startWorkTime() {
    if (workTimer) clearInterval(workTimer);
    
    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('work-time').textContent = `在岗 ${hours}:${minutes}`;
    }
    
    updateTime();
    workTimer = setInterval(updateTime, 10000); // 每10秒更新
}

document.getElementById('btn-a').addEventListener('click', () => showScreen('detail-a'));
document.getElementById('btn-b').addEventListener('click', () => showScreen('detail-b'));
document.getElementById('btn-c').addEventListener('click', () => showScreen('detail-c'));

document.getElementById('work-time').addEventListener('click', () => {
    showConfirm('确认下班？', () => {
        clearInterval(workTimer);
        showScreen('summary');
    });
});

document.getElementById('logout-btn').addEventListener('click', () => {
    showConfirm('确认下班？', () => {
        clearInterval(workTimer);
        showScreen('summary');
    });
});

// ========== A区 ==========
document.getElementById('toggle-code-btn').addEventListener('click', () => {
    currentCodeMode = currentCodeMode === 'login' ? 'qrcode' : 'login';
    const text = currentCodeMode === 'login' ? '会员登陆码' : '办卡码';
    document.querySelector('.code-content').textContent = text;
});

// ========== B区 ==========
document.getElementById('edit-taken-btn').addEventListener('click', () => {
    showEditModal('编辑领取数量', data.bagsTaken, (newVal) => {
        const increase = newVal - data.bagsTaken;
        data.bagsTaken = newVal;
        
        if (increase > 0) {
            const time = getCurrentTime();
            data.bagRecords.push({ time, amount: increase });
        }
        
        refreshBDetail();
        updateBagBadge();
    });
});

document.getElementById('sell-one-btn').addEventListener('click', () => {
    const time = getCurrentTime();
    data.bagRecords.push({ time, amount: -1 });
    refreshBDetail();
    updateBagBadge();
});

function refreshBDetail() {
    const taken = data.bagsTaken;
    const sold = data.bagRecords.reduce((sum, r) => sum + (r.amount < 0 ? Math.abs(r.amount) : 0), 0);
    const added = data.bagRecords.reduce((sum, r) => sum + (r.amount > 0 ? r.amount : 0), 0);
    const remaining = taken + added - sold;
    
    document.getElementById('b-taken').textContent = taken;
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
    showEditModal('编辑数量', Math.abs(current), (newVal) => {
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
let selectedCash = {}; // 当前选中的钱箱数据

document.getElementById('entry-cash-btn').addEventListener('click', () => {
    showCashModal('entry', 'entry');
});

document.getElementById('entry-confirm-btn').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('entry-amount').value);
    
    if (isNaN(amount) || amount <= 0) {
        alert('请输入有效的金额');
        return;
    }
    
    // 验证钱箱（如果用户选了的话）
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
    
    // 清空表单
    document.getElementById('entry-amount').value = '';
    document.getElementById('entry-status').className = '';
    document.getElementById('entry-status').textContent = '';
    selectedCash = {};
    
    refreshCDetail();
});

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
                <button class="btn-edit" onclick="editCRecord(${idx})">编辑</button>
                <button class="btn-delete" onclick="deleteCRecord(${idx})">删除</button>
            </div>
        `;
        recordList.appendChild(li);
    });
}

function editCRecord(idx) {
    showCashModal('detail', idx);
}

function deleteCRecord(idx) {
    data.cashRecords.splice(idx, 1);
    refreshCDetail();
}

function showCashModal(context, param) {
    const modal = document.getElementById('cash-modal');
    const box = document.getElementById('cash-modal-box');
    
    box.innerHTML = '';
    DENOMINATIONS.forEach(denom => {
        const item = document.createElement('div');
        item.className = 'cash-item';
        
        let currentVal = 0;
        if (context === 'entry') {
            currentVal = selectedCash[denom] || 0;
        } else if (context === 'detail' && data.cashRecords[param].detail) {
            currentVal = data.cashRecords[param].detail[denom] || 0;
        }
        
        item.innerHTML = `
            <label>¥${denom}</label>
            <input type="number" class="cash-input" data-denom="${denom}" value="${currentVal}" min="0">
        `;
        box.appendChild(item);
    });
    
    document.getElementById('cash-modal-confirm').onclick = () => {
        const inputs = box.querySelectorAll('.cash-input');
        selectedCash = {};
        inputs.forEach(input => {
            const denom = input.dataset.denom;
            const qty = parseInt(input.value) || 0;
            if (qty > 0) selectedCash[denom] = qty;
        });
        
        if (context === 'detail') {
            // 更新记录详情
            data.cashRecords[param].detail = { ...selectedCash };
        }
        
        modal.classList.remove('active');
        refreshCDetail();
    };
    
    document.getElementById('cash-modal-close').onclick = () => {
        modal.classList.remove('active');
    };
    
    // 更新钱箱总计
    const inputs = box.querySelectorAll('.cash-input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            let total = 0;
            inputs.forEach(inp => {
                const denom = parseFloat(inp.dataset.denom);
                const qty = parseInt(inp.value) || 0;
                total += denom * qty;
            });
            document.getElementById('cash-modal-total').textContent = `总计：¥${total.toFixed(2)}`;
        });
    });
    
    modal.classList.add('active');
}

// ========== 返回按钮 ==========
document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
        if (currentMode.startsWith('detail')) {
            showScreen('work');
        } else if (currentMode === 'details') {
            showScreen('summary');
        }
    });
});

// ========== 结账汇总 ==========
document.getElementById('view-details-btn').addEventListener('click', () => {
    showScreen('details');
});

document.getElementById('confirm-summary-btn').addEventListener('click', () => {
    showConfirm('确认完成汇总？', () => {
        // 清空数据
        data = {
            bagsTaken: 0,
            cashTaken: {},
            bagRecords: [],
            cashRecords: []
        };
        currentCodeMode = 'login';
        clearInterval(workTimer);
        showScreen('setup');
        
        // 重置表单
        document.getElementById('setup-bags').value = '';
        document.querySelectorAll('#setup-cash-box .cash-input').forEach(input => {
            input.value = '0';
        });
        updateCashTotal('setup');
    });
});

function refreshSummary() {
    const taken = data.bagsTaken;
    const sold = data.bagRecords.reduce((sum, r) => sum + (r.amount < 0 ? Math.abs(r.amount) : 0), 0);
    const added = data.bagRecords.reduce((sum, r) => sum + (r.amount > 0 ? r.amount : 0), 0);
    const remaining = taken + added - sold;
    
    let cashRemaining = 0;
    DENOMINATIONS.forEach(denom => {
        const taken = data.cashTaken[denom] || 0;
        const spent = (data.cashRecords || []).reduce((sum, record) => {
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
    // B明细
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
    
    // C明细
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

function showEditModal(title, currentVal, callback) {
    const modal = document.getElementById('edit-modal');
    document.getElementById('edit-modal-title').textContent = title;
    const input = document.getElementById('edit-input');
    input.value = currentVal;
    input.focus();
    
    const onConfirm = () => {
        const newVal = parseInt(input.value);
        if (isNaN(newVal) || newVal < 0) {
            alert('请输入有效的数字');
            return;
        }
        modal.classList.remove('active');
        callback(newVal);
    };
    
    document.getElementById('edit-confirm').onclick = onConfirm;
    document.getElementById('edit-cancel').onclick = () => {
        modal.classList.remove('active');
    };
    input.onkeypress = (e) => {
        if (e.key === 'Enter') onConfirm();
    };
    
    modal.classList.add('active');
}

function showConfirm(text, callback) {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-modal-text').textContent = text;
    
    document.getElementById('confirm-yes').onclick = () => {
        modal.classList.remove('active');
        callback();
    };
    
    document.getElementById('confirm-no').onclick = () => {
        modal.classList.remove('active');
    };
    
    modal.classList.add('active');
}

function attachEventListeners() {
    // 确保事件绑定
if (document.getElementById('setup-confirm-btn')) {
    console.log('按钮找到了');
} else {
    console.log('按钮没找到！');
}
    // 初始化完成
}

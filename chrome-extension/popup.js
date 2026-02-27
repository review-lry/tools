// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);
    initTabs();
    initQuickButtons();
    initTools();
});

// ===== 时间更新 =====
function updateTime() {
    const now = new Date();
    const el = document.getElementById('nowTime');
    el.innerHTML = now.toLocaleString('zh-CN') + '<small>时间戳: ' + Math.floor(now.getTime()/1000) + '</small>';
}

// ===== TAB切换 =====
function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        });
    });
}

// ===== 快捷按钮 =====
function initQuickButtons() {
    // 格式化页面JSON
    document.getElementById('btn-format').addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: formatPageJSON
        });
    });

    // 复制选中内容
    document.getElementById('btn-copy').addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString()
        });
        if (result) {
            navigator.clipboard.writeText(result);
            showToast('已复制!');
        } else {
            showToast('未选中内容');
        }
    });

    // 当前时间戳
    document.getElementById('btn-timestamp').addEventListener('click', () => {
        const ts = Math.floor(Date.now() / 1000);
        navigator.clipboard.writeText(ts.toString());
        showToast('已复制: ' + ts);
    });

    // 生成UUID
    document.getElementById('btn-uuid').addEventListener('click', () => {
        const uuid = generateUUID();
        navigator.clipboard.writeText(uuid);
        showToast('已复制: ' + uuid);
    });
}

function formatPageJSON() {
    try {
        const text = document.body.innerText;
        const json = JSON.parse(text);
        const formatted = JSON.stringify(json, null, 2);
        document.body.innerHTML = '<pre style="background:#1e1e1e;color:#d4d4d4;padding:20px;font-family:Monaco,Consolas,monospace;font-size:13px;white-space:pre-wrap;word-break:break-all;min-height:100vh;margin:0;">' + 
            formatted.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</pre>';
        document.body.style.margin = '0';
    } catch (e) {
        alert('页面内容不是有效的JSON: ' + e.message);
    }
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:8px 16px;border-radius:4px;font-size:12px;z-index:9999;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ===== 工具初始化 =====
function initTools() {
    // 时间戳转换
    document.getElementById('btn-ts-convert').addEventListener('click', convertTimestamp);
    document.getElementById('btn-ts-now').addEventListener('click', () => {
        document.getElementById('tsIn').value = Math.floor(Date.now()/1000);
        convertTimestamp();
    });

    // 日期转时间戳
    document.getElementById('btn-date-convert').addEventListener('click', dateToTimestamp);

    // Base64
    document.getElementById('btn-b64-enc').addEventListener('click', () => {
        try {
            showResult('b64Out', btoa(unescape(encodeURIComponent(getVal('b64In')))));
        } catch(e) { showResult('b64Out', '<span class="error">编码失败</span>', true); }
    });
    document.getElementById('btn-b64-dec').addEventListener('click', () => {
        try {
            showResult('b64Out', decodeURIComponent(escape(atob(getVal('b64In').trim()))));
        } catch(e) { showResult('b64Out', '<span class="error">解码失败</span>', true); }
    });

    // URL
    document.getElementById('btn-url-enc').addEventListener('click', () => showResult('urlOut', encodeURIComponent(getVal('urlIn'))));
    document.getElementById('btn-url-dec').addEventListener('click', () => {
        try { showResult('urlOut', decodeURIComponent(getVal('urlIn'))); }
        catch(e) { showResult('urlOut', '<span class="error">解码失败</span>', true); }
    });

    // HTML
    document.getElementById('btn-html-enc').addEventListener('click', () => {
        const el = document.createElement('div');
        el.textContent = getVal('htmlIn');
        showResult('htmlOut', el.innerHTML);
    });
    document.getElementById('btn-html-dec').addEventListener('click', () => {
        const el = document.createElement('div');
        el.innerHTML = getVal('htmlIn');
        showResult('htmlOut', el.textContent);
    });

    // JSON
    document.getElementById('btn-json-fmt').addEventListener('click', formatJSON);
    document.getElementById('btn-json-min').addEventListener('click', () => {
        try {
            showResult('jsonOut', JSON.stringify(JSON.parse(getVal('jsonIn'))));
        } catch(e) { showResult('jsonOut', '<span class="error">无效JSON</span>', true); }
    });
    document.getElementById('btn-json-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('jsonOut').innerText);
        showToast('已复制!');
    });

    // JWT
    document.getElementById('btn-jwt').addEventListener('click', parseJWT);

    // 文本统计
    document.getElementById('btn-stat').addEventListener('click', () => {
        const t = getVal('statIn');
        showResult('statOut', `字符: ${t.length} | 无空格: ${t.replace(/\s/g,'').length} | 中文: ${(t.match(/[\u4e00-\u9fa5]/g)||[]).length} | 单词: ${t.trim()?t.trim().split(/\s+/).length:0} | 行: ${t.split('\n').length}`);
    });

    // 大小写
    document.getElementById('btn-upper').addEventListener('click', () => showResult('caseOut', getVal('caseIn').toUpperCase()));
    document.getElementById('btn-lower').addEventListener('click', () => showResult('caseOut', getVal('caseIn').toLowerCase()));
    document.getElementById('btn-cap').addEventListener('click', () => showResult('caseOut', getVal('caseIn').replace(/\b\w/g, c => c.toUpperCase())));

    // 排序去重
    document.getElementById('btn-sort').addEventListener('click', () => {
        const lines = getVal('sortIn').split('\n').filter(l => l.trim());
        lines.sort((a, b) => a.localeCompare(b, 'zh-CN'));
        showResult('sortOut', lines.join('\n'));
    });
    document.getElementById('btn-uniq').addEventListener('click', () => {
        const lines = getVal('sortIn').split('\n').filter(l => l.trim());
        showResult('sortOut', [...new Set(lines)].join('\n'));
    });

    // UUID
    document.getElementById('btn-uuid-gen').addEventListener('click', () => {
        const n = parseInt(getVal('uuidN')) || 1;
        const uuids = [];
        for (let i = 0; i < Math.min(n, 10); i++) uuids.push(generateUUID());
        showResult('uuidOut', uuids.join('\n'));
    });

    // 密码
    document.getElementById('btn-pwd').addEventListener('click', () => {
        const len = parseInt(getVal('pwdL')) || 16;
        let chars = '';
        if (document.getElementById('c1').checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (document.getElementById('c2').checked) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (document.getElementById('c3').checked) chars += '0123456789';
        if (document.getElementById('c4').checked) chars += '!@#$%^&*()_+-=';
        let pwd = '';
        for (let i = 0; i < len; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        showResult('pwdOut', pwd);
    });

    // 二维码
    document.getElementById('btn-qr').addEventListener('click', () => {
        const content = getVal('qrIn').trim();
        if (!content) return showResult('qrOut', '<span class="error">请输入内容</span>', true);
        document.getElementById('qrOut').innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=' + encodeURIComponent(content) + '" style="max-width:100px">';
    });

    // 哈希
    document.getElementById('btn-hash').addEventListener('click', generateHash);
    document.getElementById('btn-hash-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('hashOut').innerText);
        showToast('已复制!');
    });
}

// ===== 工具函数 =====
function getVal(id) { return document.getElementById(id).value; }
function showResult(id, content, isError = false) { 
    document.getElementById(id).innerHTML = isError ? content : content; 
}

function convertTimestamp() {
    let ts = parseInt(getVal('tsIn'));
    if (isNaN(ts)) return showResult('tsOut', '<span class="error">请输入有效时间戳</span>', true);
    if (ts < 10000000000) ts *= 1000;
    const d = new Date(ts);
    showResult('tsOut', `本地: ${d.toLocaleString('zh-CN')}<br>UTC: ${d.toISOString()}<br>秒: ${Math.floor(ts/1000)}<br>毫秒: ${ts}`);
}

function dateToTimestamp() {
    const input = getVal('dateIn');
    if (!input) return showResult('dateOut', '<span class="error">请输入日期</span>', true);
    const d = new Date(input.replace(/[年月日]/g, c => ({'年':'-','月':'-','日':' '}[c] || c)));
    if (isNaN(d.getTime())) return showResult('dateOut', '<span class="error">格式错误</span>', true);
    showResult('dateOut', `秒: ${Math.floor(d.getTime()/1000)}<br>毫秒: ${d.getTime()}`);
}

function formatJSON() {
    const input = getVal('jsonIn').trim();
    if (!input) return showResult('jsonOut', '<span class="error">请输入JSON</span>', true);
    try {
        const json = JSON.parse(input);
        showResult('jsonOut', '<pre>' + JSON.stringify(json, null, 2) + '</pre>');
    } catch(e) {
        showResult('jsonOut', '<span class="error">无效JSON: ' + e.message + '</span>', true);
    }
}

function parseJWT() {
    const token = getVal('jwtIn').trim();
    if (!token) return showResult('jwtOut', '<span class="error">请输入JWT</span>', true);
    const parts = token.split('.');
    if (parts.length !== 3) return showResult('jwtOut', '<span class="error">无效JWT</span>', true);
    try {
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        showResult('jwtOut', '<strong>Header:</strong><br><pre>' + JSON.stringify(header, null, 2) + 
            '</pre><strong>Payload:</strong><br><pre>' + JSON.stringify(payload, null, 2) + '</pre>');
    } catch(e) {
        showResult('jwtOut', '<span class="error">解析失败</span>', true);
    }
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

async function generateHash() {
    const input = getVal('hashIn');
    if (!input) return showResult('hashOut', '<span class="error">请输入文本</span>', true);
    
    const type = getVal('hashT');
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    let algorithm = type === 'SHA-256' ? 'SHA-256' : type === 'SHA-512' ? 'SHA-512' : null;
    
    if (algorithm) {
        const hash = await crypto.subtle.digest(algorithm, data);
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        showResult('hashOut', hashHex);
    } else {
        // MD5 - 使用简单的实现
        showResult('hashOut', '<span class="error">MD5需要额外的库支持，请使用SHA</span>', true);
    }
}

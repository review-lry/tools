// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    setInterval(updateTime, 1000);
    initTabs();
    initQuickButtons();
    initTools();
    initDynamicLoader();
});

// ===== 动态模块加载器 =====
const DynamicLoader = {
    cache: new Map(),
    CONFIG_URL: 'https://review-lry.github.io/tools/modules/config.json',
    
    async init() {
        try {
            const cached = localStorage.getItem('dev_toolbox_modules');
            if (cached) {
                const data = JSON.parse(cached);
                Object.entries(data).forEach(([key, value]) => {
                    this.cache.set(key, value);
                });
            }
        } catch (e) {}
        this.checkUpdates();
    },
    
    async checkUpdates() {
        try {
            const response = await fetch(this.CONFIG_URL + '?t=' + Date.now());
            const config = await response.json();
            if (config.message) this.showNotification(config.message);
            for (const [name, module] of Object.entries(config.modules || {})) {
                const cached = this.cache.get(name);
                if (!cached || cached.version !== module.version) {
                    await this.loadModule(name, module);
                }
            }
            this.saveCache();
        } catch (e) {}
    },
    
    async loadModule(name, module) {
        try {
            const response = await fetch(module.url);
            const code = await response.text();
            this.cache.set(name, { ...module, code, loadedAt: Date.now() });
        } catch (e) {}
    },
    
    getModule(name) { return this.cache.get(name); },
    
    saveCache() {
        const data = {};
        this.cache.forEach((value, key) => { data[key] = value; });
        localStorage.setItem('dev_toolbox_modules', JSON.stringify(data));
    },
    
    showNotification(msg) {
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#4CAF50;color:white;padding:8px 16px;border-radius:4px;font-size:12px;z-index:99999;';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

function initDynamicLoader() { DynamicLoader.init(); }

// ===== 时间更新 =====
function updateTime() {
    const now = new Date();
    document.getElementById('nowTime').innerHTML = now.toLocaleString('zh-CN') + '<small>时间戳: ' + Math.floor(now.getTime()/1000) + '</small>';
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
    document.getElementById('btn-format').addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({ target: { tabId: tab.id }, function: smartFormatPage });
    });

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

    document.getElementById('btn-timestamp').addEventListener('click', () => {
        const ts = Math.floor(Date.now() / 1000);
        navigator.clipboard.writeText(ts.toString());
        showToast('已复制: ' + ts);
    });

    document.getElementById('btn-uuid').addEventListener('click', () => {
        const uuid = generateUUID();
        navigator.clipboard.writeText(uuid);
        showToast('已复制: ' + uuid);
    });
}

// ===== 智能格式化 =====
function smartFormatPage() {
    const text = document.body.innerText.trim();
    
    function detectType(content) {
        const t = content.trim();
        if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
            try { JSON.parse(t); return 'json'; } catch (e) {}
        }
        if (t.startsWith('<') && t.endsWith('>')) return 'xml';
        if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE)/i.test(t)) return 'sql';
        return 'json';
    }
    
    try {
        const type = detectType(text);
        let formatted;
        if (type === 'json') formatted = JSON.stringify(JSON.parse(text), null, 2);
        else formatted = text;
        
        const escaped = formatted.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        document.body.innerHTML = `<pre style="background:#1e1e1e;color:#d4d4d4;padding:20px;font-family:Monaco,Consolas,monospace;font-size:13px;white-space:pre-wrap;word-break:break-all;min-height:100vh;margin:0;">${escaped}</pre>`;
    } catch (e) {
        alert('格式化失败: ' + e.message);
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
    // === 时间工具 ===
    document.getElementById('btn-ts-convert').addEventListener('click', convertTimestamp);
    document.getElementById('btn-ts-now').addEventListener('click', () => {
        document.getElementById('tsIn').value = Math.floor(Date.now()/1000);
        convertTimestamp();
    });
    document.getElementById('btn-ts-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('tsOut').innerText.split('\n')[0]);
        showToast('已复制!');
    });
    document.getElementById('btn-date-convert').addEventListener('click', dateToTimestamp);

    // === Base64 ===
    document.getElementById('btn-b64-enc').addEventListener('click', () => {
        try {
            const input = getVal('b64In');
            const bytes = new TextEncoder().encode(input);
            showResult('b64Out', btoa(String.fromCharCode(...bytes)));
        } catch(e) { showResult('b64Out', '<span class="error">编码失败</span>'); }
    });
    document.getElementById('btn-b64-dec').addEventListener('click', () => {
        try {
            const input = getVal('b64In').trim();
            const bytes = Uint8Array.from(atob(input), c => c.charCodeAt(0));
            showResult('b64Out', new TextDecoder().decode(bytes));
        } catch(e) { showResult('b64Out', '<span class="error">解码失败</span>'); }
    });
    document.getElementById('btn-b64-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('b64Out').innerText);
        showToast('已复制!');
    });

    // === URL ===
    document.getElementById('btn-url-enc').addEventListener('click', () => showResult('urlOut', encodeURIComponent(getVal('urlIn'))));
    document.getElementById('btn-url-dec').addEventListener('click', () => {
        try { showResult('urlOut', decodeURIComponent(getVal('urlIn'))); }
        catch(e) { showResult('urlOut', '<span class="error">解码失败</span>'); }
    });

    // === HTML ===
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

    // === 进制转换 ===
    document.getElementById('btn-num-conv').addEventListener('click', () => {
        const num = getVal('numIn').trim();
        const from = parseInt(getVal('numFrom'));
        const to = parseInt(getVal('numTo'));
        if (!num) return showResult('numOut', '<span class="error">请输入数字</span>');
        try {
            const decimal = parseInt(num, from);
            showResult('numOut', decimal.toString(to).toUpperCase());
        } catch(e) { showResult('numOut', '<span class="error">转换失败</span>'); }
    });

    // === JSON ===
    document.getElementById('btn-json-fmt').addEventListener('click', () => {
        try {
            showResult('jsonOut', JSON.stringify(JSON.parse(getVal('jsonIn')), null, 2));
        } catch(e) { showResult('jsonOut', '<span class="error">无效JSON</span>'); }
    });
    document.getElementById('btn-json-min').addEventListener('click', () => {
        try { showResult('jsonOut', JSON.stringify(JSON.parse(getVal('jsonIn')))); }
        catch(e) { showResult('jsonOut', '<span class="error">无效JSON</span>'); }
    });
    document.getElementById('btn-json-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('jsonOut').innerText);
        showToast('已复制!');
    });

    // === JWT ===
    document.getElementById('btn-jwt').addEventListener('click', () => {
        const token = getVal('jwtIn').trim();
        if (!token) return showResult('jwtOut', '<span class="error">请输入JWT</span>');
        const parts = token.split('.');
        if (parts.length !== 3) return showResult('jwtOut', '<span class="error">无效JWT</span>');
        try {
            const decode = s => JSON.parse(atob(s.replace(/-/g, '+').replace(/_/g, '/')));
            const header = decode(parts[0]);
            const payload = decode(parts[1]);
            let expire = '';
            if (payload.exp) {
                const d = new Date(payload.exp * 1000);
                expire = d < new Date() ? '<br>⚠️ 已过期' : '<br>✅ 有效';
            }
            showResult('jwtOut', `Header:\n${JSON.stringify(header, null, 2)}\n\nPayload:\n${JSON.stringify(payload, null, 2)}${expire}`);
        } catch(e) { showResult('jwtOut', '<span class="error">解析失败</span>'); }
    });

    // === 文本统计 ===
    document.getElementById('btn-stat').addEventListener('click', () => {
        const t = getVal('statIn');
        showResult('statOut', `字符: ${t.length} | 中文: ${(t.match(/[\u4e00-\u9fa5]/g)||[]).length} | 单词: ${t.trim()?t.trim().split(/\s+/).length:0} | 行: ${t.split('\n').length}`);
    });

    // === 大小写 ===
    document.getElementById('btn-upper').addEventListener('click', () => showResult('caseOut', getVal('caseIn').toUpperCase()));
    document.getElementById('btn-lower').addEventListener('click', () => showResult('caseOut', getVal('caseIn').toLowerCase()));
    document.getElementById('btn-cap').addEventListener('click', () => showResult('caseOut', getVal('caseIn').replace(/\b\w/g, c => c.toUpperCase())));
    document.getElementById('btn-camel').addEventListener('click', () => {
        const s = getVal('caseIn').toLowerCase().replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase());
        showResult('caseOut', s);
    });

    // === 排序去重 ===
    document.getElementById('btn-sort').addEventListener('click', () => {
        const lines = getVal('sortIn').split('\n').filter(l => l.trim());
        lines.sort((a, b) => a.localeCompare(b, 'zh-CN'));
        showResult('sortOut', lines.join('\n'));
    });
    document.getElementById('btn-uniq').addEventListener('click', () => {
        const lines = getVal('sortIn').split('\n').filter(l => l.trim());
        showResult('sortOut', [...new Set(lines)].join('\n'));
    });
    document.getElementById('btn-reverse').addEventListener('click', () => {
        const lines = getVal('sortIn').split('\n');
        showResult('sortOut', lines.reverse().join('\n'));
    });

    // === 正则测试 ===
    document.getElementById('btn-regex').addEventListener('click', () => {
        const pattern = getVal('regexPattern');
        const text = getVal('regexText');
        if (!pattern) return showResult('regexOut', '<span class="error">请输入正则</span>');
        try {
            let flags = '';
            if (document.getElementById('regexG').checked) flags += 'g';
            if (document.getElementById('regexI').checked) flags += 'i';
            if (document.getElementById('regexM').checked) flags += 'm';
            const regex = new RegExp(pattern, flags);
            const matches = text.match(regex);
            if (matches) {
                showResult('regexOut', `匹配 ${matches.length} 个:\n${matches.join('\n')}`);
            } else {
                showResult('regexOut', '无匹配');
            }
        } catch(e) { showResult('regexOut', '<span class="error">正则错误</span>'); }
    });

    // === UUID ===
    document.getElementById('btn-uuid-gen').addEventListener('click', () => {
        const n = Math.min(Math.max(parseInt(getVal('uuidN')) || 1, 1), 10);
        const uuids = Array.from({length: n}, () => generateUUID());
        showResult('uuidOut', uuids.join('\n'));
    });

    // === 密码 ===
    document.getElementById('btn-pwd').addEventListener('click', () => {
        const len = Math.min(Math.max(parseInt(getVal('pwdL')) || 16, 4), 64);
        let chars = '';
        if (document.getElementById('c1').checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (document.getElementById('c2').checked) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (document.getElementById('c3').checked) chars += '0123456789';
        if (document.getElementById('c4').checked) chars += '!@#$%^&*()_+-=';
        if (!chars) chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const array = new Uint32Array(len);
        crypto.getRandomValues(array);
        let pwd = '';
        for (let i = 0; i < len; i++) pwd += chars.charAt(array[i] % chars.length);
        showResult('pwdOut', pwd);
    });
    document.getElementById('btn-pwd-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('pwdOut').innerText);
        showToast('已复制!');
    });

    // === 二维码 ===
    document.getElementById('btn-qr').addEventListener('click', () => {
        const content = getVal('qrIn').trim();
        const size = parseInt(getVal('qrSize')) || 150;
        if (!content) return showResult('qrOut', '<span class="error">请输入内容</span>');
        document.getElementById('qrOut').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(content)}">`;
    });
    document.getElementById('btn-qr-download').addEventListener('click', () => {
        const img = document.querySelector('#qrOut img');
        if (img) {
            const a = document.createElement('a');
            a.href = img.src;
            a.download = 'qrcode.png';
            a.click();
        } else {
            showToast('请先生成二维码');
        }
    });

    // === Lorem ===
    document.getElementById('btn-lorem').addEventListener('click', () => {
        const n = parseInt(getVal('loremN')) || 3;
        const type = getVal('loremType');
        const words = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua'];
        let result = '';
        if (type === 'word') {
            result = Array.from({length: n}, () => words[Math.floor(Math.random() * words.length)]).join(' ');
        } else if (type === 'sent') {
            for (let i = 0; i < n; i++) {
                const sent = Array.from({length: 8 + Math.floor(Math.random() * 8)}, () => words[Math.floor(Math.random() * words.length)]).join(' ');
                result += sent.charAt(0).toUpperCase() + sent.slice(1) + '. ';
            }
        } else {
            for (let i = 0; i < n; i++) {
                const para = Array.from({length: 20 + Math.floor(Math.random() * 30)}, () => words[Math.floor(Math.random() * words.length)]).join(' ');
                result += para.charAt(0).toUpperCase() + para.slice(1) + '.\n\n';
            }
        }
        showResult('loremOut', result.trim());
    });

    // === 颜色转换 ===
    document.getElementById('btn-color').addEventListener('click', () => {
        const input = getVal('colorIn').trim();
        let hex = '', rgb = '', hsl = '';
        
        if (input.startsWith('#')) {
            hex = input;
            const r = parseInt(input.slice(1, 3), 16);
            const g = parseInt(input.slice(3, 5), 16);
            const b = parseInt(input.slice(5, 7), 16);
            rgb = `rgb(${r}, ${g}, ${b})`;
            document.getElementById('colorPreview').style.background = hex;
        } else if (input.startsWith('rgb')) {
            const match = input.match(/(\d+)/g);
            if (match && match.length >= 3) {
                const [r, g, b] = match.map(Number);
                rgb = `rgb(${r}, ${g}, ${b})`;
                hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
                document.getElementById('colorPreview').style.background = hex;
            }
        }
        
        if (hex || rgb) {
            showResult('colorOut', `HEX: ${hex}\nRGB: ${rgb}`);
        } else {
            showResult('colorOut', '<span class="error">格式错误</span>');
        }
    });

    // === 单位转换 ===
    document.getElementById('btn-unit').addEventListener('click', () => {
        const value = parseFloat(getVal('unitValue'));
        const from = getVal('unitFrom');
        const to = getVal('unitTo');
        const base = parseFloat(getVal('baseSize')) || 16;
        
        if (isNaN(value)) return showResult('unitOut', '<span class="error">请输入数值</span>');
        
        let px;
        if (from === 'px') px = value;
        else if (from === 'rem' || from === 'em') px = value * base;
        
        let result;
        if (to === 'px') result = px + 'px';
        else if (to === 'rem') result = (px / base).toFixed(4) + 'rem';
        else if (to === 'em') result = (px / base).toFixed(4) + 'em';
        
        showResult('unitOut', result);
    });

    // === JSON ↔ CSV ===
    document.getElementById('btn-json-csv').addEventListener('click', () => {
        try {
            const json = JSON.parse(getVal('jsonCsvIn'));
            if (!Array.isArray(json) || json.length === 0) throw new Error();
            const keys = Object.keys(json[0]);
            let csv = keys.join(',') + '\n';
            json.forEach(row => {
                csv += keys.map(k => JSON.stringify(row[k] || '')).join(',') + '\n';
            });
            showResult('jsonCsvOut', csv);
        } catch(e) { showResult('jsonCsvOut', '<span class="error">无效JSON数组</span>'); }
    });
    document.getElementById('btn-csv-json').addEventListener('click', () => {
        try {
            const lines = getVal('jsonCsvIn').trim().split('\n');
            if (lines.length < 2) throw new Error();
            const keys = lines[0].split(',');
            const json = lines.slice(1).map(line => {
                const values = line.split(',');
                const obj = {};
                keys.forEach((k, i) => obj[k] = values[i] || '');
                return obj;
            });
            showResult('jsonCsvOut', JSON.stringify(json, null, 2));
        } catch(e) { showResult('jsonCsvOut', '<span class="error">无效CSV</span>'); }
    });

    // === 哈希 ===
    document.getElementById('btn-hash').addEventListener('click', async () => {
        const input = getVal('hashIn');
        if (!input) return showResult('hashOut', '<span class="error">请输入文本</span>');
        const type = getVal('hashT');
        const data = new TextEncoder().encode(input);
        const hash = await crypto.subtle.digest(type, data);
        const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        showResult('hashOut', hex);
    });
    document.getElementById('btn-hash-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('hashOut').innerText);
        showToast('已复制!');
    });
}

// ===== 工具函数 =====
function getVal(id) { return document.getElementById(id).value; }
function showResult(id, content) { document.getElementById(id).innerHTML = content; }

function convertTimestamp() {
    let ts = parseInt(getVal('tsIn'));
    if (isNaN(ts)) return showResult('tsOut', '<span class="error">请输入时间戳</span>');
    if (ts < 10000000000) ts *= 1000;
    const d = new Date(ts);
    showResult('tsOut', `${Math.floor(ts/1000)}\n本地: ${d.toLocaleString('zh-CN')}\nUTC: ${d.toISOString()}`);
}

function dateToTimestamp() {
    const input = getVal('dateIn').trim();
    if (!input) return showResult('dateOut', '<span class="error">请输入日期</span>');
    const d = new Date(input.replace(/[年月]/g, '-').replace(/日/g, ' '));
    if (isNaN(d.getTime())) return showResult('dateOut', '<span class="error">格式错误</span>');
    showResult('dateOut', `秒: ${Math.floor(d.getTime()/1000)}\n毫秒: ${d.getTime()}`);
}

function generateUUID() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    array[6] = (array[6] & 0x0f) | 0x40;
    array[8] = (array[8] & 0x3f) | 0x80;
    const hex = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
// ===== 补充缺失的函数 =====

function detectBrowser(ua) {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Opera')) return 'Opera';
    return 'Unknown';
}

function detectOS(ua) {
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
}

function rgbToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        s = l > 0.5 ? (max - l) / (1 - l) : (l - min) / max;
        if (r === max) h = (g - b) / (max - min) / 6;
        else if (g === max) h = 2 + (b - r) / (max - min) / 6;
        else h = 4 + (r - g) / (max - min) / 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function calcTimeDiff() {
    const startStr = getVal('timeStart');
    const endStr = getVal('timeEnd');
    if (!startStr || !endStr) return showResult('timeDiffOut', '<span class="error">请选择时间</span>');
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diff = end - start;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    showResult('timeDiffOut', `相差: ${days}天 ${hours}小时 ${minutes}分钟\n秒: ${seconds}\n总毫秒: ${diff}`);
}


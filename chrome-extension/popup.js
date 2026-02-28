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
    // 智能格式化页面内容（支持 JSON/XML/YAML/CSV 等）
    document.getElementById('btn-format').addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: smartFormatPage
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

// ===== 智能格式化页面内容 =====
function smartFormatPage() {
    const text = document.body.innerText.trim();
    
    // 检测内容类型
    function detectContentType(content) {
        const trimmed = content.trim();
        
        // JSON 检测
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                JSON.parse(trimmed);
                return 'json';
            } catch (e) {}
        }
        
        // XML/HTML 检测
        if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
            if (/^<\?xml/i.test(trimmed) || /^<[\w:]+[\s>]/i.test(trimmed)) {
                return 'xml';
            }
        }
        
        // YAML 检测
        if (/^[\w-]+:\s/.test(trimmed) && /\n[\w-]+:\s/.test(trimmed)) {
            return 'yaml';
        }
        
        // CSV 检测
        const lines = trimmed.split('\n');
        if (lines.length > 1) {
            const firstLineCols = (lines[0].match(/,/g) || []).length;
            const secondLineCols = (lines[1].match(/,/g) || []).length;
            if (firstLineCols > 0 && firstLineCols === secondLineCols) {
                return 'csv';
            }
        }
        
        // SQL 检测
        if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i.test(trimmed)) {
            return 'sql';
        }
        
        return 'unknown';
    }
    
    // 格式化 JSON
    function formatJSON(content) {
        const json = JSON.parse(content);
        return JSON.stringify(json, null, 2);
    }
    
    // 格式化 XML
    function formatXML(content) {
        let formatted = '';
        let indent = '';
        const nodes = content.replace(/>\s*</g, '><').split(/(<[^>]+>)/);
        
        for (let node of nodes) {
            if (!node.trim()) continue;
            
            if (node.match(/^<\/\w/)) {
                // 闭合标签，减少缩进
                indent = indent.substring(2);
            }
            
            formatted += indent + node + '\n';
            
            if (node.match(/^<\w[^>]*[^\/]>$/)) {
                // 开始标签，增加缩进
                indent += '  ';
            }
        }
        
        return formatted.trim();
    }
    
    // 格式化 SQL
    function formatSQL(content) {
        const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'ON', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE'];
        
        let formatted = content.toUpperCase();
        
        // 在关键字前换行
        for (let kw of keywords) {
            const regex = new RegExp(`\\b${kw}\\b`, 'gi');
            formatted = formatted.replace(regex, '\n' + kw);
        }
        
        // 清理多余空格和换行
        formatted = formatted.replace(/^\s*\n/gm, '').trim();
        
        return formatted;
    }
    
    // 格式化 CSV（转表格显示）
    function formatCSV(content) {
        const lines = content.split('\n');
        const rows = lines.map(line => {
            // 处理带引号的 CSV
            const cells = [];
            let current = '';
            let inQuotes = false;
            
            for (let char of line) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    cells.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            cells.push(current.trim());
            return cells;
        });
        
        // 生成 Markdown 表格
        let result = '';
        if (rows.length > 0) {
            // 表头
            result += '| ' + rows[0].join(' | ') + ' |\n';
            result += '|' + rows[0].map(() => '---').join('|') + '|\n';
            
            // 数据行
            for (let i = 1; i < rows.length; i++) {
                result += '| ' + rows[i].join(' | ') + ' |\n';
            }
        }
        
        return result;
    }
    
    try {
        const type = detectContentType(text);
        let formatted;
        let langClass;
        
        switch (type) {
            case 'json':
                formatted = formatJSON(text);
                langClass = 'language-json';
                break;
            case 'xml':
                formatted = formatXML(text);
                langClass = 'language-xml';
                break;
            case 'sql':
                formatted = formatSQL(text);
                langClass = 'language-sql';
                break;
            case 'csv':
                formatted = formatCSV(text);
                langClass = 'language-markdown';
                break;
            case 'yaml':
                formatted = text; // YAML 格式保持原样
                langClass = 'language-yaml';
                break;
            default:
                // 尝试作为 JSON 格式化
                try {
                    formatted = formatJSON(text);
                    langClass = 'language-json';
                } catch (e) {
                    alert('无法识别内容格式，请确保是 JSON/XML/SQL/CSV 格式');
                    return;
                }
        }
        
        // 显示格式化结果
        const escaped = formatted
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        document.body.innerHTML = `<pre style="background:#1e1e1e;color:#d4d4d4;padding:20px;font-family:Monaco,Consolas,monospace;font-size:13px;white-space:pre-wrap;word-break:break-all;min-height:100vh;margin:0;"><span style="color:#569cd6;font-size:11px;">[检测为: ${type.toUpperCase()}]</span>\n\n${escaped}</pre>`;
        document.body.style.margin = '0';
        
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
    // 时间戳转换
    document.getElementById('btn-ts-convert').addEventListener('click', convertTimestamp);
    document.getElementById('btn-ts-now').addEventListener('click', () => {
        document.getElementById('tsIn').value = Math.floor(Date.now()/1000);
        convertTimestamp();
    });

    // 日期转时间戳
    document.getElementById('btn-date-convert').addEventListener('click', dateToTimestamp);

    // Base64 - 修复废弃的 unescape
    document.getElementById('btn-b64-enc').addEventListener('click', () => {
        try {
            const input = getVal('b64In');
            // 使用现代 API 替代废弃的 unescape
            const bytes = new TextEncoder().encode(input);
            const base64 = btoa(String.fromCharCode(...bytes));
            showResult('b64Out', base64);
        } catch(e) { showResult('b64Out', '<span class="error">编码失败: ' + e.message + '</span>', true); }
    });
    document.getElementById('btn-b64-dec').addEventListener('click', () => {
        try {
            const input = getVal('b64In').trim();
            // 使用现代 API 替代废弃的 escape
            const bytes = Uint8Array.from(atob(input), c => c.charCodeAt(0));
            const decoded = new TextDecoder().decode(bytes);
            showResult('b64Out', decoded);
        } catch(e) { showResult('b64Out', '<span class="error">解码失败: ' + e.message + '</span>', true); }
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

    // JSON - 修复输出格式
    document.getElementById('btn-json-fmt').addEventListener('click', formatJSON);
    document.getElementById('btn-json-min').addEventListener('click', () => {
        try {
            const json = JSON.parse(getVal('jsonIn'));
            showResult('jsonOut', JSON.stringify(json));
        } catch(e) { showResult('jsonOut', '<span class="error">无效JSON: ' + e.message + '</span>', true); }
    });
    document.getElementById('btn-json-copy').addEventListener('click', () => {
        const result = document.getElementById('jsonOut').innerText;
        navigator.clipboard.writeText(result);
        showToast('已复制!');
    });

    // JWT - 修复 Base64 URL 编码
    document.getElementById('btn-jwt').addEventListener('click', parseJWT);

    // 文本统计
    document.getElementById('btn-stat').addEventListener('click', () => {
        const t = getVal('statIn');
        const chars = t.length;
        const noSpace = t.replace(/\s/g,'').length;
        const chinese = (t.match(/[\u4e00-\u9fa5]/g)||[]).length;
        const words = t.trim() ? t.trim().split(/\s+/).length : 0;
        const lines = t.split('\n').length;
        showResult('statOut', `字符: ${chars} | 无空格: ${noSpace} | 中文: ${chinese} | 单词: ${words} | 行: ${lines}`);
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
        const n = Math.min(Math.max(parseInt(getVal('uuidN')) || 1, 1), 10);
        const uuids = [];
        for (let i = 0; i < n; i++) uuids.push(generateUUID());
        showResult('uuidOut', uuids.join('\n'));
    });

    // 密码 - 修复无限循环 bug
    document.getElementById('btn-pwd').addEventListener('click', () => {
        const len = Math.min(Math.max(parseInt(getVal('pwdL')) || 16, 4), 64);
        let chars = '';
        if (document.getElementById('c1').checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (document.getElementById('c2').checked) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (document.getElementById('c3').checked) chars += '0123456789';
        if (document.getElementById('c4').checked) chars += '!@#$%^&*()_+-=';
        
        // 防呆：如果没选任何字符集，默认使用所有
        if (!chars) {
            chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
            showToast('未选择字符集，使用默认');
        }
        
        let pwd = '';
        const array = new Uint32Array(len);
        crypto.getRandomValues(array);
        for (let i = 0; i < len; i++) {
            pwd += chars.charAt(array[i] % chars.length);
        }
        showResult('pwdOut', pwd);
    });

    // 二维码
    document.getElementById('btn-qr').addEventListener('click', () => {
        const content = getVal('qrIn').trim();
        if (!content) return showResult('qrOut', '<span class="error">请输入内容</span>', true);
        document.getElementById('qrOut').innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=' + encodeURIComponent(content) + '" style="max-width:100px">';
    });

    // 哈希 - 移除 MD5 选项的误导性错误
    document.getElementById('btn-hash').addEventListener('click', generateHash);
    document.getElementById('btn-hash-copy').addEventListener('click', () => {
        const result = document.getElementById('hashOut').innerText;
        if (result && !result.includes('错误')) {
            navigator.clipboard.writeText(result);
            showToast('已复制!');
        }
    });
}

// ===== 工具函数 =====
function getVal(id) { return document.getElementById(id).value; }
function showResult(id, content, isError = false) { 
    document.getElementById(id).innerHTML = content;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function convertTimestamp() {
    const input = getVal('tsIn').trim();
    if (!input) return showResult('tsOut', '<span class="error">请输入时间戳</span>', true);
    
    let ts = parseInt(input);
    if (isNaN(ts)) return showResult('tsOut', '<span class="error">请输入有效数字</span>', true);
    if (ts < 10000000000) ts *= 1000;
    
    const d = new Date(ts);
    showResult('tsOut', `本地: ${d.toLocaleString('zh-CN')}<br>UTC: ${d.toISOString()}<br>秒: ${Math.floor(ts/1000)}<br>毫秒: ${ts}`);
}

function dateToTimestamp() {
    const input = getVal('dateIn').trim();
    if (!input) return showResult('dateOut', '<span class="error">请输入日期</span>', true);
    
    // 支持多种日期格式
    let dateStr = input
        .replace(/[年月]/g, '-')
        .replace(/日/g, ' ')
        .replace(/\//g, '-');
    
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return showResult('dateOut', '<span class="error">无法解析日期，请使用 YYYY-MM-DD HH:mm:ss 格式</span>', true);
    
    showResult('dateOut', `秒: ${Math.floor(d.getTime()/1000)}<br>毫秒: ${d.getTime()}`);
}

function formatJSON() {
    const input = getVal('jsonIn').trim();
    if (!input) return showResult('jsonOut', '<span class="error">请输入JSON</span>', true);
    try {
        const json = JSON.parse(input);
        // 直接输出纯文本，让 CSS 处理格式
        showResult('jsonOut', JSON.stringify(json, null, 2));
    } catch(e) {
        showResult('jsonOut', '<span class="error">无效JSON: ' + e.message + '</span>', true);
    }
}

function parseJWT() {
    const token = getVal('jwtIn').trim();
    if (!token) return showResult('jwtOut', '<span class="error">请输入JWT</span>', true);
    
    const parts = token.split('.');
    if (parts.length !== 3) return showResult('jwtOut', '<span class="error">无效JWT格式（需要3段）</span>', true);
    
    try {
        // 处理 Base64 URL 编码（替换 - 和 _）
        const decodeBase64Url = (str) => {
            const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
            const pad = base64.length % 4;
            const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
            return atob(padded);
        };
        
        const header = JSON.parse(decodeBase64Url(parts[0]));
        const payload = JSON.parse(decodeBase64Url(parts[1]));
        
        // 计算过期时间
        let expireInfo = '';
        if (payload.exp) {
            const expDate = new Date(payload.exp * 1000);
            const now = new Date();
            if (expDate < now) {
                expireInfo = '<br><span style="color:#f44336;">⚠️ 已过期: ' + expDate.toLocaleString('zh-CN') + '</span>';
            } else {
                expireInfo = '<br><span style="color:#4caf50;">✅ 有效期至: ' + expDate.toLocaleString('zh-CN') + '</span>';
            }
        }
        
        showResult('jwtOut', 
            '<strong>Header:</strong><br><pre style="margin:5px 0;">' + JSON.stringify(header, null, 2) + '</pre>' +
            '<strong>Payload:</strong><br><pre style="margin:5px 0;">' + JSON.stringify(payload, null, 2) + '</pre>' +
            '<strong>Signature:</strong> ' + parts[2].substring(0, 20) + '...' + expireInfo
        );
    } catch(e) {
        showResult('jwtOut', '<span class="error">解析失败: ' + e.message + '</span>', true);
    }
}

function generateUUID() {
    // 使用 crypto API 生成更安全的 UUID
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    // 设置版本和变体
    array[6] = (array[6] & 0x0f) | 0x40; // version 4
    array[8] = (array[8] & 0x3f) | 0x80; // variant 1
    
    const hex = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

async function generateHash() {
    const input = getVal('hashIn');
    if (!input) return showResult('hashOut', '<span class="error">请输入文本</span>', true);
    
    const type = getVal('hashT');
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    if (type === 'MD5') {
        // MD5 需要外部库，提示用户使用 SHA
        showResult('hashOut', '<span class="error">⚠️ MD5 已不安全，请使用 SHA-256</span>', true);
        return;
    }
    
    try {
        const hash = await crypto.subtle.digest(type, data);
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        showResult('hashOut', hashHex);
    } catch(e) {
        showResult('hashOut', '<span class="error">哈希计算失败: ' + e.message + '</span>', true);
    }
}

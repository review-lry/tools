// ===== 补充缺失的工具函数 =====

function detectBrowser(ua) {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Opera')) return 'Opera';
    return 'Unknown';
}

function detectOS(ua) {
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac') && !ua.includes('like Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
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
    showResult('timeDiffOut', `相差: ${days}天 ${hours}小时 ${minutes}分钟\n秒数: ${seconds}\n总毫秒: ${diff}`);
}

// 链接生成二维码（已有功能，确保正常）
// 已在 initTools() 中实现

function numberToChinese(num) {
    const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const units = ['', '十', '百', '千', '万', '亿'];
    const str = num.toString();
    const len = str.length;
    
    if (len === 1) return digits[num];
    if (len === 2) return (str[0] === '1' ? '' : digits[str[0]]) + '十' + digits[str[1]];
    if (len === 3) return digits[str[0]] + '百' + (str[1] === '0' ? '' : digits[str[1]]) + '十' + digits[str[2]];
    if (len === 4) return digits[str[0]] + '千' + (str[1] === '0' ? '' : digits[str[1]]) + '百' + (str[2] === '0' ? '' : digits[str[2]]) + '十' + digits[str[3]];
    if (len === 5) return digits[str[0]] + '万' + (str[1] === '0' ? '' : digits[str[1]]) + '千' + (str[2] === '0' ? '' : digits[str[2]]) + '百' + (str[3] === '0' ? '' : digits[str[3]]) + '十' + digits[str[4]];
    if (len === 6) return digits[str[0]] + '十' + digits[str[1]] + '万' + (str[2] === '0' ? '' : digits[str[2]]) + '千' + (str[3] === '0' ? '' : digits[str[3]]) + '百' + (str[4] === '0' ? '' : digits[str[4]]) + '十' + digits[str[5]];
    return num;
}

// Base62 编码（短链接用）
function encodeBase62(num) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let encoded = '';
    if (num === 0) return chars[0];
    while (num > 0) {
        encoded = chars[num % 62] + encoded;
        num = Math.floor(num / 62);
    }
    return encoded;
}

// 解码 URL Safe Base64
function decodeBase64Url(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = 4 - (base64.length % 4);
    if (pad !== 4) base64 += '='.repeat(pad);
    try {
        return atob(base64);
    } catch (e) {
        throw new Error('无效 Base64');
    }
}

// Unix 时间戳格式化
function formatUnixTimestamp(ts) {
    const d = new Date(ts * 1000);
    return d.toLocaleString('zh-CN') + ' (' + Math.floor(ts / 86400) + '天前)';
}

// IP 地址验证
function isValidIP(ip) {
    const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
    if (ipv4) return true;
    const ipv6 = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ip);
    return ipv6;
}

// MAC 地址格式化
function formatMAC(mac) {
    return mac.replace(/:/g, '').toUpperCase().match(/.{2}/g).join(':');
}

// URL 构建器
function buildURL(base, params) {
    const url = new URL(base);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
}

// 提取域名
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch(e) {
        return url;
    }
}

// 判断是否为内部IP
function isPrivateIP(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    const first = parseInt(parts[0]);
    return first === 10 || first === 127 || first === 192 || first === 172;
}

// 端口常用服务查询
const commonPorts = {
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    3306: 'MySQL',
    3389: 'Postgres',
    5432: 'PostgreSQL',
    6379: 'IIS',
    8080: 'Apache Tomcat',
    8443: 'HTTPS Alt',
    8888: 'Nginx Alt',
    9200: 'Apache',
    27017: 'Kafka',
    27018: 'Kafka UI',
};

function getPortService(port) {
    return commonPorts[port] || '未知';
}

// MIME 类型
const mimeTypes = {
    'json': 'application/json',
    'html': 'text/html',
    'txt': 'text/plain',
    'xml': 'application/xml',
    'pdf': 'application/pdf',
    'zip': 'application/zip',
    'jpg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'css': 'text/css',
    'js': 'text/javascript',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg',
};

function getMimeType(ext) {
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

// 生成随机字符串
function randomString(length, charset) {
    const chars = charset || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        result += chars.charAt(array[i] % chars.length);
    }
    return result;
}

// HTML 实体编码
function encodeHTMLEntities(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
    };
    return text.replace(/[&<>]/g, m => map[m]);
}

// URL Base64 编码（用于参数传递）
function encodeBase64Url(str) {
    return btoa(str).replace(/\+/g, '-').replace(/=/g, '=').replace(/=/g, '');
}

// 计算字符串哈希（简单）
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash >>> 0;
}

// 调试输出（开发用）
function debugLog(...args) {
    console.log('[Dev Toolbox]', ...args);
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        detectBrowser,
        detectOS,
        rgbToHsl,
        calcTimeDiff,
        numberToChinese,
        encodeBase62,
        decodeBase64Url,
        formatUnixTimestamp,
        isValidIP,
        formatMAC,
        buildURL,
        extractDomain,
        isPrivateIP,
        getPortService,
        getMimeType,
        randomString,
        encodeHTMLEntities,
        encodeBase64Url,
        simpleHash,
        debugLog
    };
}

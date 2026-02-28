    // === JSON ↔ CSV ===
    document.getElementById('btn-json-csv').addEventListener('click', () => {
        try {
            const json = JSON.parse(getVal('jsonCsvIn'));
            if (!Array.isArray(json) || json.length === 0) throw new Error();
            const keys = Object.keys(json[0]);
            let csv = keys.join(',') + '\n';
            json.forEach(row => csv += keys.map(k => JSON.stringify(row[k] || '')).join(',') + '\n');
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

    // === 图片Base64 ===
    document.getElementById('btn-img-base64').addEventListener('click', () => {
        const file = document.getElementById('imgFile').files[0];
        if (!file) return showResult('imgBase64Out', '<span class="error">请选择图片</span>');
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result.split(',')[1] || '';
            const size = file.size || 0;
            const mime = file.type || 'unknown';
            showResult('imgBase64ImgBase64Out', `data:${mime};base64,${base64.substring(0, 50)}...\n\n大小: ${size} bytes\n类型: ${mime}`);
        };
        reader.readAsDataURL(file);
    });

    // === 数字格式化 ===
    document.getElementById('btn-num-format').addEventListener('click', () => {
        const num = getVal('numFormatIn').trim();
        if (!num) return showResult('numFormatOut', '<span class="error">请输入数字</span>');
        const parsed = parseFloat(num.replace(/,/g, ''));
        showResult('numFormatOut', `原始: ${num}\n格式化: ${parsed.toLocaleString('zh-CN'}`);
    });
    document.getElementById('btn-num-cn').addEventListener('click', () => {
        const num = getVal('numFormatIn').trim();
        const parsed = parseFloat(num.replace(/,/g, ''));
        const digit = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
        const units = ['', '十', '百', '千', '万', '亿'];
        let result = '';
        const str = parsed.toString();
        const len = str.length;
        
        if (len <= 5) {
            result = digit[parsed] + '度';
        } else if (len === 6) {
            const wan = digit[str[0]] + '万';
            const rest = digit[str.slice(1)] + '度';
            result = wan + rest;
        } else {
            result = str + '度';
        }
        
        showResult('numFormatOut', `${parsed.toLocaleString('zh-CN')} (${result})`);
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
        const text = document.getElementById('hashOut').innerText;
        if (text && !text.includes('错误') && !text.includes('请输入')) {
            navigator.clipboard.writeText(text);
            showToast('已复制');
        } else {
            showToast('先生成哈希');
        }
    });
}

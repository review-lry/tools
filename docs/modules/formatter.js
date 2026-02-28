/**
 * 智能格式化模块
 * 版本: 1.2.0
 * 自动识别 JSON/XML/YAML/CSV/SQL 并格式化
 */

(function() {
    'use strict';
    
    const Formatter = {
        // 检测内容类型
        detectType: function(content) {
            const trimmed = content.trim();
            
            // JSON
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                try {
                    JSON.parse(trimmed);
                    return 'json';
                } catch (e) {}
            }
            
            // XML
            if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
                if (/^<\?xml/i.test(trimmed) || /^<[\w:]+[\s>]/i.test(trimmed)) {
                    return 'xml';
                }
            }
            
            // SQL
            if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i.test(trimmed)) {
                return 'sql';
            }
            
            // YAML
            if (/^[\w-]+:\s/.test(trimmed) && /\n[\w-]+:\s/.test(trimmed)) {
                return 'yaml';
            }
            
            // CSV
            const lines = trimmed.split('\n');
            if (lines.length > 1) {
                const firstCols = (lines[0].match(/,/g) || []).length;
                const secondCols = (lines[1].match(/,/g) || []).length;
                if (firstCols > 0 && firstCols === secondCols) {
                    return 'csv';
                }
            }
            
            return 'unknown';
        },
        
        // 格式化 JSON
        formatJSON: function(content) {
            const json = JSON.parse(content);
            return JSON.stringify(json, null, 2);
        },
        
        // 格式化 XML
        formatXML: function(content) {
            let formatted = '';
            let indent = '';
            const nodes = content.replace(/>\s*</g, '><').split(/(<[^>]+>)/);
            
            for (let node of nodes) {
                if (!node.trim()) continue;
                
                if (node.match(/^<\/\w/)) {
                    indent = indent.substring(2);
                }
                
                formatted += indent + node + '\n';
                
                if (node.match(/^<\w[^>]*[^\/]>$/)) {
                    indent += '  ';
                }
            }
            
            return formatted.trim();
        },
        
        // 格式化 SQL
        formatSQL: function(content) {
            const keywords = [
                'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY',
                'HAVING', 'LIMIT', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
                'ON', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM'
            ];
            
            let formatted = content;
            
            for (let kw of keywords) {
                const regex = new RegExp(`\\b${kw}\\b`, 'gi');
                formatted = formatted.replace(regex, '\n' + kw);
            }
            
            return formatted.replace(/^\s*\n/gm, '').trim();
        },
        
        // 格式化 CSV 为表格
        formatCSV: function(content) {
            const lines = content.split('\n');
            const rows = lines.map(line => {
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
            
            let result = '';
            if (rows.length > 0) {
                result += '| ' + rows[0].join(' | ') + ' |\n';
                result += '|' + rows[0].map(() => '---').join('|') + '|\n';
                
                for (let i = 1; i < rows.length; i++) {
                    result += '| ' + rows[i].join(' | ') + ' |\n';
                }
            }
            
            return result;
        },
        
        // 主入口
        format: function(content) {
            const type = this.detectType(content);
            let result;
            
            switch (type) {
                case 'json':
                    result = this.formatJSON(content);
                    break;
                case 'xml':
                    result = this.formatXML(content);
                    break;
                case 'sql':
                    result = this.formatSQL(content);
                    break;
                case 'csv':
                    result = this.formatCSV(content);
                    break;
                case 'yaml':
                    result = content; // YAML 保持原样
                    break;
                default:
                    // 尝试作为 JSON
                    try {
                        result = this.formatJSON(content);
                    } catch (e) {
                        throw new Error('无法识别内容格式');
                    }
            }
            
            return {
                type: type,
                content: result
            };
        }
    };
    
    // 导出
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Formatter;
    } else {
        window.Formatter = Formatter;
    }
})();

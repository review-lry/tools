/**
 * JWT 解析器模块
 * 版本: 1.1.0
 * 支持 Base64 URL 编码，过期时间检查
 */

(function() {
    'use strict';
    
    const JWTParser = {
        // 解码 Base64 URL
        decodeBase64Url: function(str) {
            let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
            const pad = base64.length % 4;
            if (pad) {
                base64 += '='.repeat(4 - pad);
            }
            return atob(base64);
        },
        
        // 解析 JWT
        parse: function(token) {
            const parts = token.split('.');
            
            if (parts.length !== 3) {
                throw new Error('无效的 JWT 格式（需要 3 段）');
            }
            
            try {
                const header = JSON.parse(this.decodeBase64Url(parts[0]));
                const payload = JSON.parse(this.decodeBase64Url(parts[1]));
                
                // 计算过期状态
                let expireStatus = null;
                if (payload.exp) {
                    const expDate = new Date(payload.exp * 1000);
                    const now = new Date();
                    
                    if (expDate < now) {
                        expireStatus = {
                            expired: true,
                            message: '已过期',
                            date: expDate.toLocaleString('zh-CN')
                        };
                    } else {
                        const diff = expDate - now;
                        const hours = Math.floor(diff / 3600000);
                        const days = Math.floor(hours / 24);
                        
                        expireStatus = {
                            expired: false,
                            message: days > 0 ? `${days} 天后过期` : `${hours} 小时后过期`,
                            date: expDate.toLocaleString('zh-CN')
                        };
                    }
                }
                
                return {
                    valid: true,
                    header: header,
                    payload: payload,
                    signature: parts[2],
                    expireStatus: expireStatus
                };
                
            } catch (e) {
                throw new Error('JWT 解析失败: ' + e.message);
            }
        },
        
        // 格式化输出
        format: function(token) {
            const parsed = this.parse(token);
            
            let output = 'Header:\n' + JSON.stringify(parsed.header, null, 2) + '\n\n';
            output += 'Payload:\n' + JSON.stringify(parsed.payload, null, 2) + '\n\n';
            output += 'Signature: ' + parsed.signature.substring(0, 30) + '...';
            
            if (parsed.expireStatus) {
                output += '\n\n' + (parsed.expireStatus.expired ? '⚠️ ' : '✅ ');
                output += parsed.expireStatus.message;
                output += ' (' + parsed.expireStatus.date + ')';
            }
            
            return output;
        }
    };
    
    // 导出
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = JWTParser;
    } else {
        window.JWTParser = JWTParser;
    }
})();

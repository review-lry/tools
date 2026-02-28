/**
 * 哈希生成器模块
 * 版本: 1.0.0
 * 支持 SHA-256 和 SHA-512
 */

(function() {
    'use strict';
    
    const HashGenerator = {
        // 生成哈希
        generate: async function(text, algorithm = 'SHA-256') {
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            
            try {
                const hashBuffer = await crypto.subtle.digest(algorithm, data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                
                return {
                    algorithm: algorithm,
                    hash: hashHex,
                    length: hashHex.length
                };
            } catch (e) {
                throw new Error('哈希生成失败: ' + e.message);
            }
        },
        
        // 生成多种哈希
        generateAll: async function(text) {
            const algorithms = ['SHA-256', 'SHA-512'];
            const results = {};
            
            for (const algo of algorithms) {
                try {
                    results[algo] = await this.generate(text, algo);
                } catch (e) {
                    results[algo] = { error: e.message };
                }
            }
            
            return results;
        }
    };
    
    // 导出
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = HashGenerator;
    } else {
        window.HashGenerator = HashGenerator;
    }
})();

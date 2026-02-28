/**
 * 密码生成器模块
 * 版本: 1.0.0
 * 安全随机密码生成
 */

(function() {
    'use strict';
    
    const PasswordGenerator = {
        // 字符集
        charsets: {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        },
        
        // 生成密码
        generate: function(length = 16, options = {}) {
            const {
                uppercase = true,
                lowercase = true,
                numbers = true,
                symbols = true
            } = options;
            
            let chars = '';
            if (uppercase) chars += this.charsets.uppercase;
            if (lowercase) chars += this.charsets.lowercase;
            if (numbers) chars += this.charsets.numbers;
            if (symbols) chars += this.charsets.symbols;
            
            if (!chars) {
                chars = this.charsets.lowercase + this.charsets.numbers;
            }
            
            // 使用 crypto API 生成安全随机数
            const array = new Uint32Array(length);
            crypto.getRandomValues(array);
            
            let password = '';
            for (let i = 0; i < length; i++) {
                password += chars.charAt(array[i] % chars.length);
            }
            
            return password;
        },
        
        // 生成多个密码
        generateMultiple: function(count = 5, length = 16, options = {}) {
            const passwords = [];
            for (let i = 0; i < count; i++) {
                passwords.push(this.generate(length, options));
            }
            return passwords;
        },
        
        // 检查密码强度
        checkStrength: function(password) {
            let score = 0;
            
            if (password.length >= 8) score++;
            if (password.length >= 12) score++;
            if (password.length >= 16) score++;
            if (/[a-z]/.test(password)) score++;
            if (/[A-Z]/.test(password)) score++;
            if (/[0-9]/.test(password)) score++;
            if (/[^a-zA-Z0-9]/.test(password)) score++;
            
            let level = '弱';
            if (score >= 5) level = '中';
            if (score >= 6) level = '强';
            if (score >= 7) level = '非常强';
            
            return { score, level };
        }
    };
    
    // 导出
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PasswordGenerator;
    } else {
        window.PasswordGenerator = PasswordGenerator;
    }
})();

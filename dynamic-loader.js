// ===== 动态模块加载器 =====
// 从 GitHub Pages 加载功能模块，实现部分动态更新

const DynamicLoader = {
    // 模块缓存
    cache: new Map(),
    
    // 模块配置地址（GitHub Pages 或其他 CDN）
    CONFIG_URL: 'https://review-lry.github.io/tools/modules/config.json',
    
    // 初始化
    async init() {
        // 从本地存储加载缓存
        const cached = localStorage.getItem('module_cache');
        if (cached) {
            const data = JSON.parse(cached);
            Object.entries(data).forEach(([key, value]) => {
                this.cache.set(key, value);
            });
        }
        
        // 后台检查更新
        this.checkUpdates();
    },
    
    // 检查模块更新
    async checkUpdates() {
        try {
            const response = await fetch(this.CONFIG_URL + '?t=' + Date.now());
            const config = await response.json();
            
            for (const [name, module] of Object.entries(config.modules)) {
                const cached = this.cache.get(name);
                
                // 版本比较，需要更新
                if (!cached || cached.version !== module.version) {
                    console.log(`更新模块: ${name} v${module.version}`);
                    await this.loadModule(name, module.url);
                }
            }
            
            // 保存缓存
            this.saveCache();
            
            if (config.message) {
                this.showNotification(config.message);
            }
            
        } catch (e) {
            console.log('检查更新失败，使用缓存:', e.message);
        }
    },
    
    // 加载模块
    async loadModule(name, url) {
        try {
            const response = await fetch(url);
            const code = await response.text();
            
            this.cache.set(name, {
                url,
                code,
                loadedAt: Date.now()
            });
            
            return true;
        } catch (e) {
            console.error(`加载模块失败: ${name}`, e);
            return false;
        }
    },
    
    // 执行模块
    execute(name, ...args) {
        const module = this.cache.get(name);
        if (!module) {
            console.error(`模块未加载: ${name}`);
            return null;
        }
        
        try {
            // 使用 Function 构造器执行（注意安全）
            const fn = new Function('args', module.code);
            return fn(args);
        } catch (e) {
            console.error(`执行模块失败: ${name}`, e);
            return null;
        }
    },
    
    // 安全执行（沙箱模式）
    executeSafe(name, input) {
        const module = this.cache.get(name);
        if (!module) return null;
        
        // 创建隔离的执行环境
        const sandbox = {
            input,
            result: null,
            console: { log: () => {}, error: () => {} }
        };
        
        try {
            const fn = new Function('sandbox', `
                with(sandbox) {
                    ${module.code}
                }
            `);
            fn(sandbox);
            return sandbox.result;
        } catch (e) {
            return { error: e.message };
        }
    },
    
    // 保存缓存到本地
    saveCache() {
        const data = {};
        this.cache.forEach((value, key) => {
            data[key] = value;
        });
        localStorage.setItem('module_cache', JSON.stringify(data));
    },
    
    // 显示通知
    showNotification(msg) {
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            z-index: 99999;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },
    
    // 获取模块列表
    getModules() {
        return Array.from(this.cache.keys());
    },
    
    // 清除缓存
    clearCache() {
        this.cache.clear();
        localStorage.removeItem('module_cache');
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    DynamicLoader.init();
});

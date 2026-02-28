# Chrome 插件安装和更新指南

## 📦 安装方式

### 方式一：开发者模式加载（推荐）

1. 下载最新版本：[dev-toolbox.zip](https://review-lry.github.io/tools/dev-toolbox.zip)
2. 解压到本地目录
3. 打开 Chrome：`chrome://extensions/`
4. 开启右上角 **开发者模式**
5. 点击 **加载已解压的扩展程序**
6. 选择解压后的目录

### 方式二：直接拖拽安装

Chrome 可能阻止，建议使用方式一。

---

## 🔄 自动更新配置

### 开启自动更新

1. 打开 `chrome://extensions/`
2. 找到 **开发者工具箱**
3. 点击 **详细信息**
4. 确保 **允许自动更新** 已开启

### 更新检查

Chrome 会自动检查更新（通常每 5 小时）

手动检查更新：
1. `chrome://extensions/`
2. 点击左上角 **更新** 按钮

---

## 🛠️ 开发者：发布新版本

### 1. 修改代码
```bash
cd chrome-extension
# 修改代码...
```

### 2. 更新版本号
修改 `manifest.json` 中的 `version` 字段

### 3. 提交并推送
```bash
git add .
git commit -m "feat: 新功能描述"
git push origin main
```

### 4. 自动部署
GitHub Actions 会自动：
- 打包插件
- 更新 `updates.xml`
- 部署到 GitHub Pages
- 创建 GitHub Release

---

## 📋 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.1.0 | 2026-02-28 | 智能格式化、bug修复 |
| 1.0.0 | 2026-02-27 | 初始版本 |

---

## ❓ 常见问题

### 更新失败？
1. 检查网络连接
2. 确认 GitHub Pages 可访问
3. 手动下载最新版本

### 安装失败？
1. 确保使用开发者模式
2. 检查 Chrome 版本（需要 88+）
3. 尝试重新解压后加载

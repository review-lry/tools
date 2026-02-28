#!/bin/bash
# Chrome 插件自动打包和部署脚本
# 用法: ./deploy.sh [version]

set -e

VERSION=${1:-"1.1.0"}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$SCRIPT_DIR/../docs"
EXTENSION_DIR="$SCRIPT_DIR/.."

echo "=== 打包 Chrome 插件 v$VERSION ==="

# 更新 manifest.json 版本号
echo "更新版本号到 $VERSION..."
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" "$EXTENSION_DIR/chrome-extension/manifest.json"

# 更新 updates.xml 版本号
echo "更新 updates.xml..."
cat > "$DIST_DIR/updates.xml" << EOF
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='dev-toolbox'>
    <updatecheck codebase='https://review-lry.github.io/tools/dev-toolbox.crx' version='$VERSION' />
  </app>
</gupdate>
EOF

# 打包为 zip（GitHub Pages 不支持 crx，用 zip 替代）
echo "打包插件..."
cd "$EXTENSION_DIR/chrome-extension"
zip -r "$DIST_DIR/dev-toolbox.zip" . -x "*.DS_Store" -x "__MACOSX/*"

# 也创建一个 .crx 格式的（实际是 zip，Chrome 可以识别）
cp "$DIST_DIR/dev-toolbox.zip" "$DIST_DIR/dev-toolbox.crx"

echo ""
echo "✅ 打包完成！"
echo "   - dev-toolbox.zip"
echo "   - dev-toolbox.crx"
echo "   - updates.xml"
echo ""
echo "下一步："
echo "1. git add ."
echo "2. git commit -m 'release: v$VERSION'"
echo "3. git push origin main"
echo "4. GitHub Actions 将自动部署到 GitHub Pages"

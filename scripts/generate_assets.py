#!/usr/bin/env python3
"""
生成 Chrome Web Store 所需的图片素材
- 宣传图: 440 x 280
- 截图: 1280 x 800
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_promo_image():
    """创建宣传图 440x280"""
    img = Image.new('RGB', (440, 280), color='#1e3c72')
    draw = ImageDraw.Draw(img)
    
    # 渐变背景效果
    for i in range(280):
        r = int(30 + (42 - 30) * i / 280)
        g = int(60 + (82 - 60) * i / 280)
        b = int(114 + (152 - 114) * i / 280)
        draw.line([(0, i), (440, i)], fill=(r, g, b))
    
    # 图标（大扳手 emoji）
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 80)
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
        font_desc = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
    except:
        font_large = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_desc = ImageFont.load_default()
    
    # 标题
    draw.text((220, 60), "🛠️", font=font_large, fill='white', anchor='mm')
    draw.text((220, 140), "开发者工具箱", font=font_title, fill='white', anchor='mm')
    
    # 描述
    desc = "JSON格式化 | 时间戳转换 | Base64编解码"
    draw.text((220, 180), desc, font=font_desc, fill='#aaaaaa', anchor='mm')
    
    # 功能标签
    tags = ["JSON", "时间戳", "Base64", "JWT", "UUID", "哈希"]
    x_start = 70
    y = 220
    for i, tag in enumerate(tags):
        x = x_start + i * 55
        draw.rounded_rectangle([(x, y), (x + 50, y + 24)], radius=12, fill='#2a5298')
        draw.text((x + 25, y + 12), tag, font=font_desc, fill='white', anchor='mm')
    
    return img

def create_screenshot():
    """创建截图 1280x800"""
    img = Image.new('RGB', (1280, 800), color='#f5f7fa')
    draw = ImageDraw.Draw(img)
    
    try:
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
        font_normal = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11)
        font_code = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 10)
    except:
        font_title = ImageFont.load_default()
        font_normal = ImageFont.load_default()
        font_code = ImageFont.load_default()
    
    # 头部
    draw.rectangle([(0, 0), (1280, 50)], fill='#1e3c72')
    draw.text((20, 15), "🛠️ 开发者工具箱", font=font_title, fill='white')
    
    # 快捷按钮区
    y = 60
    draw.text((20, y), "快捷操作", font=font_title, fill='#1e3c72')
    
    buttons = ["✨ 智能格式化", "📋 复制选中", "🕐 当前时间戳", "🆔 生成UUID"]
    for i, btn in enumerate(buttons):
        x = 20 + i * 145
        draw.rounded_rectangle([(x, y + 25), (x + 135, y + 70)], radius=8, fill='white', outline='#e0e0e0')
        draw.text((x + 67, y + 47), btn, font=font_normal, fill='#333', anchor='mm')
    
    # 功能演示区 - JSON 格式化
    y = 150
    draw.rounded_rectangle([(20, y), (620, y + 300)], radius=8, fill='white', outline='#e0e0e0')
    draw.text((30, y + 10), "📝 JSON 格式化", font=font_title, fill='#1e3c72')
    
    # 输入框
    draw.rectangle([(30, y + 40), (610, y + 130)], fill='#f8f9fa', outline='#ddd')
    json_input = '{"name":"test","age":25,"items":[1,2,3]}'
    draw.text((35, y + 50), json_input, font=font_code, fill='#333')
    
    # 按钮
    draw.rounded_rectangle([(30, y + 140), (90, y + 165)], radius=4, fill='#1e3c72')
    draw.text((60, y + 152), "格式化", font=font_normal, fill='white', anchor='mm')
    
    # 输出
    draw.rectangle([(30, y + 175), (610, y + 280)], fill='#1e1e1e')
    json_output = '''{
  "name": "test",
  "age": 25,
  "items": [1, 2, 3]
}'''
    draw.text((35, y + 185), json_output, font=font_code, fill='#d4d4d4')
    
    # JWT 解析演示
    draw.rounded_rectangle([(640, y), (1260, y + 300)], radius=8, fill='white', outline='#e0e0e0')
    draw.text((650, y + 10), "🎫 JWT 解析", font=font_title, fill='#1e3c72')
    
    draw.rectangle([(650, y + 40), (1250, y + 100)], fill='#f8f9fa', outline='#ddd')
    draw.text((655, y + 50), "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", font=font_code, fill='#333')
    
    draw.rounded_rectangle([(650, y + 110), (710, y + 135)], radius=4, fill='#1e3c72')
    draw.text((680, y + 122), "解析", font=font_normal, fill='white', anchor='mm')
    
    # JWT 结果
    draw.rectangle([(650, y + 145), (1250, y + 280)], fill='#f8f9fa', outline='#ddd')
    jwt_result = '''Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "sub": "1234567890",
  "name": "Test User"
}

✅ 有效期至: 2026-03-01 12:00:00'''
    draw.text((655, y + 155), jwt_result, font=font_code, fill='#333')
    
    # 底部功能列表
    y = 470
    features = [
        ("⏰ 时间工具", "时间戳转换、日期计算"),
        ("🔐 编解码", "Base64、URL、HTML"),
        ("📝 格式化", "JSON、JWT、智能识别"),
        ("📄 文本", "统计、大小写、去重"),
        ("🎲 生成器", "UUID、密码、二维码"),
        ("🔒 安全", "SHA-256、SHA-512"),
    ]
    
    for i, (title, desc) in enumerate(features):
        x = 20 + (i % 3) * 420
        row_y = y + (i // 3) * 80
        draw.rounded_rectangle([(x, row_y), (x + 400, row_y + 70)], radius=8, fill='white', outline='#e0e0e0')
        draw.text((x + 15, row_y + 15), title, font=font_title, fill='#1e3c72')
        draw.text((x + 15, row_y + 40), desc, font=font_normal, fill='#666')
    
    # 底部
    draw.rectangle([(0, 770), (1280, 800)], fill='#1e3c72')
    draw.text((640, 785), "按 Ctrl+Shift+D 快速打开 | 所有数据本地处理，保护隐私", font=font_normal, fill='white', anchor='mm')
    
    return img

def main():
    output_dir = '/root/.openclaw/workspace/chrome-ext-tools/docs/assets'
    os.makedirs(output_dir, exist_ok=True)
    
    print("生成宣传图 (440x280)...")
    promo = create_promo_image()
    promo.save(os.path.join(output_dir, 'promo-440x280.png'))
    
    print("生成截图 (1280x800)...")
    screenshot = create_screenshot()
    screenshot.save(os.path.join(output_dir, 'screenshot-1280x800.png'))
    
    print("完成！文件保存在:", output_dir)
    print("- promo-440x280.png")
    print("- screenshot-1280x800.png")

if __name__ == '__main__':
    main()

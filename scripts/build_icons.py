#!/usr/bin/env python3
"""
기존 src/assets/icon.png(정사각 디자인)을 macOS 스타일 squircle 마스크와
투명 패딩을 적용해 1024×1024로 재구성하고, .icns / .ico까지 함께 빌드한다.
"""
from PIL import Image, ImageDraw, ImageChops, ImageFilter
import math
import os
import shutil
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC_PNG = os.path.join(ROOT, 'src/assets/icon.png')
OUT_PNG = SRC_PNG
OUT_ICNS = os.path.join(ROOT, 'src/assets/icon.icns')
OUT_ICO = os.path.join(ROOT, 'src/assets/icon.ico')

SIZE = 1024
CONTENT = 824  # macOS Big Sur 기준 컨테이너
PADDING = (SIZE - CONTENT) // 2
N = 5.0        # squircle 지수 (Apple에 가까운 형태)

def make_squircle_mask(size, n):
    """수퍼샘플링으로 안티에일리어싱된 squircle 알파 마스크 생성."""
    ss = 4
    big = Image.new('L', (size * ss, size * ss), 0)
    draw = ImageDraw.Draw(big)
    r = size * ss / 2
    steps = 720
    pts = []
    for i in range(steps):
        t = 2 * math.pi * i / steps
        c, s = math.cos(t), math.sin(t)
        x = math.copysign(abs(c) ** (2 / n), c) * r
        y = math.copysign(abs(s) ** (2 / n), s) * r
        pts.append((r + x, r + y))
    draw.polygon(pts, fill=255)
    return big.resize((size, size), Image.LANCZOS)

def _vertical_gradient(size, curve, opacity, invert=False):
    """상→하 그라디언트 알파 마스크. invert=True면 하→상."""
    col = Image.new('L', (1, size))
    for y in range(size):
        t = y / max(1, size - 1)
        v = t if invert else (1 - t)
        col.putpixel((0, y), int((v ** curve) * 255 * opacity))
    return col.resize((size, size))

def apply_glass(canvas,
                ambient_opacity=0.14,
                ambient_curve=1.6,
                rim_erosion=9,
                rim_blur=1.5,
                rim_opacity=1.0,
                rim_curve=2.2,
                shadow_opacity=0.55,
                shadow_curve=2.4):
    """
    macOS Sequoia 스타일 글래스모피즘:
      - 상단 은은한 앰비언트 라이트 (전체 표면에 옅게)
      - 상단 가장자리의 얇은 밝은 림(rim) 하이라이트
      - 하단 가장자리의 은은한 다크 림 그림자
    """
    size = canvas.size[0]
    icon_alpha = canvas.split()[-1]

    # 1) 앰비언트 상단 광 (아이콘 전체에 옅게 얹음)
    ambient_grad = _vertical_gradient(size, ambient_curve, ambient_opacity)
    ambient_alpha = ImageChops.multiply(ambient_grad, icon_alpha)
    ambient = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    ambient.putalpha(ambient_alpha)

    # 2) 얇은 rim (아이콘 알파 - 침식된 알파)
    eroded = icon_alpha.filter(ImageFilter.MinFilter(rim_erosion))
    rim = ImageChops.subtract(icon_alpha, eroded)
    if rim_blur > 0:
        rim = rim.filter(ImageFilter.GaussianBlur(rim_blur))

    # 상단만 강조된 밝은 림
    top_grad = _vertical_gradient(size, rim_curve, rim_opacity)
    rim_top_alpha = ImageChops.multiply(rim, top_grad)
    rim_top = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    rim_top.putalpha(rim_top_alpha)

    # 하단만 강조된 어두운 림
    bot_grad = _vertical_gradient(size, shadow_curve, shadow_opacity, invert=True)
    rim_bot_alpha = ImageChops.multiply(rim, bot_grad)
    rim_bot = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    rim_bot.putalpha(rim_bot_alpha)

    out = canvas.copy()
    out.alpha_composite(ambient)
    out.alpha_composite(rim_bot)
    out.alpha_composite(rim_top)
    return out

def build_master():
    src = Image.open(SRC_PNG).convert('RGBA')
    content = src.resize((CONTENT, CONTENT), Image.LANCZOS)
    mask = make_squircle_mask(CONTENT, N)
    # 기존 알파와 곱해 마스크 적용
    combined = ImageChops.multiply(content.split()[-1], mask)
    content.putalpha(combined)

    canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    canvas.paste(content, (PADDING, PADDING), content)
    canvas = apply_glass(canvas)
    canvas.save(OUT_PNG, format='PNG')
    print(f'✓ {OUT_PNG} ({SIZE}×{SIZE}) + glass')
    return canvas

def build_icns(master):
    tmp = os.path.join(ROOT, 'src/assets/icon.iconset')
    if os.path.exists(tmp):
        shutil.rmtree(tmp)
    os.makedirs(tmp)
    variants = [
        (16, 'icon_16x16.png'),
        (32, 'icon_16x16@2x.png'),
        (32, 'icon_32x32.png'),
        (64, 'icon_32x32@2x.png'),
        (128, 'icon_128x128.png'),
        (256, 'icon_128x128@2x.png'),
        (256, 'icon_256x256.png'),
        (512, 'icon_256x256@2x.png'),
        (512, 'icon_512x512.png'),
        (1024, 'icon_512x512@2x.png'),
    ]
    for px, name in variants:
        master.resize((px, px), Image.LANCZOS).save(os.path.join(tmp, name), 'PNG')
    subprocess.run(['iconutil', '-c', 'icns', tmp, '-o', OUT_ICNS], check=True)
    shutil.rmtree(tmp)
    print(f'✓ {OUT_ICNS}')

def build_ico(master):
    sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    master.save(OUT_ICO, format='ICO', sizes=sizes)
    print(f'✓ {OUT_ICO}')

def main():
    master = build_master()
    build_icns(master)
    build_ico(master)

if __name__ == '__main__':
    sys.exit(main() or 0)

# ⚡ Quick Asset Generation Scripts

## 1. Generate QR Code (Python - 30 seconds)

```python
# File: generate_qr.py
import qrcode

# Generate QR for demo page
qr = qrcode.QRCode(version=1, box_size=10, border=4)
qr.add_data('https://normaldance.com/grave/demo')
qr.make(fit=True)

img = qr.make_image(fill_color="#0088CC", back_color="white")
img.save('demo_qr_code.png')
print("✅ QR Code generated: demo_qr_code.png")
```

**Run:**
```bash
pip install qrcode[pil]
python generate_qr.py
```

---

## 2. Generate Budget Pie Chart (Python - 1 minute)

```python
# File: generate_pie.py
import matplotlib.pyplot as plt

labels = ['Development\n80%\n$12K', 'Marketing\n13%\n$2K', 'Legal\n7%\n$1K']
sizes = [80, 13, 7]
colors = ['#0088CC', '#00CC88', '#FF8800']
explode = (0.05, 0, 0)

plt.figure(figsize=(8, 8))
plt.pie(sizes, explode=explode, labels=labels, colors=colors,
        autopct='', shadow=True, startangle=90, textprops={'fontsize': 14})
plt.title('Phase 1 Budget Allocation ($15K)', fontsize=16, fontweight='bold')
plt.axis('equal')
plt.savefig('budget_breakdown.png', transparent=False, dpi=300, bbox_inches='tight')
print("✅ Pie chart generated: budget_breakdown.png")
```

**Run:**
```bash
pip install matplotlib
python generate_pie.py
```

---

## 3. Generate Timeline Graph (Python - 2 minutes)

```python
# File: generate_timeline.py
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from datetime import datetime

fig, ax = plt.subplots(figsize=(14, 4))

# Timeline data
milestones = [
    {'date': 'Jan 2025', 'label': 'Start\n$15K Phase 1', 'x': 1},
    {'date': 'May 2025', 'label': 'Mainnet\nDeploy', 'x': 5},
    {'date': 'Jul 2025', 'label': '1K Candles\nLit 🕯️', 'x': 7},
    {'date': 'Dec 2025', 'label': '$100K\nRevenue 💰', 'x': 12}
]

# Draw timeline
ax.plot([0, 13], [0.5, 0.5], 'k-', linewidth=3, color='#0088CC')

# Draw milestones
for m in milestones:
    ax.plot(m['x'], 0.5, 'o', markersize=15, color='#0088CC')
    ax.text(m['x'], 0.7, m['date'], ha='center', fontsize=10, fontweight='bold')
    ax.text(m['x'], 0.2, m['label'], ha='center', fontsize=9, 
            bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.7))

ax.set_xlim(0, 13)
ax.set_ylim(0, 1)
ax.axis('off')
ax.set_title('G.rave 2.0 Roadmap - 2025', fontsize=16, fontweight='bold', pad=20)

plt.tight_layout()
plt.savefig('timeline_roadmap.png', dpi=300, bbox_inches='tight', transparent=False)
print("✅ Timeline generated: timeline_roadmap.png")
```

**Run:**
```bash
python generate_timeline.py
```

---

## 4. Record 3D Vinyl GIF (ScreenToGif - 3 minutes)

**Option A: Using ScreenToGif (Windows)**

1. Download: https://www.screentogif.com/
2. Install and open
3. Click "Recorder"
4. Position window over vinyl at http://localhost:3000/grave/demo
5. Click "Record"
6. Wait 3 seconds (vinyl spins)
7. Click "Stop"
8. Click "File" → "Save As" → GIF
9. Optimize: reduce to 20 FPS, 800x600px
10. Save as: `grave_vinyl_demo.gif`

**Option B: Using OBS Studio + ffmpeg**

```bash
# 1. Record with OBS Studio (3 seconds)
# Output: grave_demo.mp4

# 2. Convert to GIF with ffmpeg
ffmpeg -i grave_demo.mp4 -vf "fps=30,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 grave_vinyl_demo.gif

# 3. Optimize size
ffmpeg -i grave_vinyl_demo.gif -vf "scale=800:-1" -gifflags +transdiff grave_vinyl_demo_optimized.gif
```

**Option C: Online Tool**

1. Go to: https://ezgif.com/video-to-gif
2. Upload recorded MP4
3. Set: 800px width, 30 FPS
4. Click "Convert"
5. Download optimized GIF

---

## All-in-One Script (Python)

```python
# File: generate_all_assets.py
import subprocess
import sys

def install_packages():
    """Install required packages"""
    packages = ['qrcode[pil]', 'matplotlib']
    for package in packages:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])

def generate_qr():
    """Generate QR code"""
    import qrcode
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data('https://normaldance.com/grave/demo')
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0088CC", back_color="white")
    img.save('demo_qr_code.png')
    print("✅ QR Code: demo_qr_code.png")

def generate_pie():
    """Generate budget pie chart"""
    import matplotlib.pyplot as plt
    labels = ['Development\n80%\n$12K', 'Marketing\n13%\n$2K', 'Legal\n7%\n$1K']
    sizes = [80, 13, 7]
    colors = ['#0088CC', '#00CC88', '#FF8800']
    explode = (0.05, 0, 0)
    
    plt.figure(figsize=(8, 8))
    plt.pie(sizes, explode=explode, labels=labels, colors=colors,
            autopct='', shadow=True, startangle=90, textprops={'fontsize': 14})
    plt.title('Phase 1 Budget Allocation ($15K)', fontsize=16, fontweight='bold')
    plt.axis('equal')
    plt.savefig('budget_breakdown.png', dpi=300, bbox_inches='tight')
    print("✅ Pie Chart: budget_breakdown.png")

def generate_timeline():
    """Generate timeline roadmap"""
    import matplotlib.pyplot as plt
    
    fig, ax = plt.subplots(figsize=(14, 4))
    milestones = [
        {'date': 'Jan 2025', 'label': 'Start\n$15K Phase 1', 'x': 1},
        {'date': 'May 2025', 'label': 'Mainnet\nDeploy', 'x': 5},
        {'date': 'Jul 2025', 'label': '1K Candles\nLit', 'x': 7},
        {'date': 'Dec 2025', 'label': '$100K\nRevenue', 'x': 12}
    ]
    
    ax.plot([0, 13], [0.5, 0.5], 'k-', linewidth=3, color='#0088CC')
    for m in milestones:
        ax.plot(m['x'], 0.5, 'o', markersize=15, color='#0088CC')
        ax.text(m['x'], 0.7, m['date'], ha='center', fontsize=10, fontweight='bold')
        ax.text(m['x'], 0.2, m['label'], ha='center', fontsize=9,
                bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.7))
    
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 1)
    ax.axis('off')
    ax.set_title('G.rave 2.0 Roadmap - 2025', fontsize=16, fontweight='bold', pad=20)
    plt.tight_layout()
    plt.savefig('timeline_roadmap.png', dpi=300, bbox_inches='tight')
    print("✅ Timeline: timeline_roadmap.png")

if __name__ == '__main__':
    print("📦 Installing packages...")
    install_packages()
    
    print("\n🎨 Generating assets...")
    generate_qr()
    generate_pie()
    generate_timeline()
    
    print("\n✅ All assets generated!")
    print("\n⚠️  Manual step: Record 3D vinyl GIF using ScreenToGif or OBS")
    print("   1. Open http://localhost:3000/grave/demo")
    print("   2. Record 3 seconds of spinning vinyl")
    print("   3. Export as grave_vinyl_demo.gif")
```

**Run all at once:**
```bash
python generate_all_assets.py
```

---

## 🚀 Fastest Method (5 minutes total)

### Step-by-Step:

1. **Install Python packages** (30 sec)
   ```bash
   pip install qrcode[pil] matplotlib
   ```

2. **Generate all static assets** (1 min)
   ```bash
   python generate_all_assets.py
   ```

3. **Record GIF** (3 min)
   - Download ScreenToGif: https://www.screentogif.com/
   - Open demo page: `npm run dev` → http://localhost:3000/grave/demo
   - Record 3 seconds
   - Export as GIF

4. **Verify all files** (30 sec)
   ```bash
   ls -lh *.png *.gif
   ```

**Expected output:**
```
✅ demo_qr_code.png          (50 KB)
✅ budget_breakdown.png      (150 KB)
✅ timeline_roadmap.png      (200 KB)
✅ grave_vinyl_demo.gif      (1.5 MB)
```

---

## File Checklist

```
grants/assets/
├── ✅ demo_qr_code.png          (QR to demo)
├── ✅ budget_breakdown.png      (Pie chart)
├── ✅ timeline_roadmap.png      (Roadmap)
└── ✅ grave_vinyl_demo.gif      (3D vinyl animation)
```

**All 4 assets ready for Executive Summary!** 🎉

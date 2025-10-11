#!/usr/bin/env python3
"""
Generate all visual assets for TON Grant Executive Summary
Total time: ~30 seconds to generate 3 assets
"""

import subprocess
import sys
import os

def install_packages():
    """Install required packages"""
    print("[*] Installing required packages...")
    packages = ['qrcode[pil]', 'matplotlib']
    
    for package in packages:
        try:
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install', 
                package, '--quiet', '--disable-pip-version-check'
            ])
            print(f"  [OK] {package}")
        except Exception as e:
            print(f"  [FAIL] Failed to install {package}: {e}")
            return False
    return True

def generate_qr():
    """Generate QR code for demo page"""
    print("\n[*] Generating QR Code...")
    try:
        import qrcode
        
        # Create QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data('https://normaldance.com/grave/demo')
        qr.make(fit=True)
        
        # Generate image
        img = qr.make_image(fill_color="#0088CC", back_color="white")
        img.save('demo_qr_code.png')
        
        print("  [OK] Saved: demo_qr_code.png")
        print("       Test: Scan with phone camera")
        return True
    except Exception as e:
        print(f"  [FAIL] Error: {e}")
        return False

def generate_pie():
    """Generate budget pie chart"""
    print("\n[*] Generating Budget Pie Chart...")
    try:
        import matplotlib.pyplot as plt
        
        # Data
        labels = ['Development\n80%\n$12,000', 'Marketing\n13%\n$2,000', 'Legal\n7%\n$1,000']
        sizes = [80, 13, 7]
        colors = ['#0088CC', '#00CC88', '#FF8800']
        explode = (0.05, 0, 0)  # Explode 1st slice
        
        # Create figure
        plt.figure(figsize=(10, 10))
        plt.pie(sizes, explode=explode, labels=labels, colors=colors,
                autopct='', shadow=True, startangle=90, 
                textprops={'fontsize': 16, 'weight': 'bold'})
        
        plt.title('Phase 1 Budget Allocation ($15,000)', 
                 fontsize=20, fontweight='bold', pad=20)
        plt.axis('equal')
        
        # Save
        plt.savefig('budget_breakdown.png', dpi=300, bbox_inches='tight', 
                   facecolor='white', edgecolor='none')
        plt.close()
        
        print("  [OK] Saved: budget_breakdown.png")
        print("       Preview: Open file to verify colors")
        return True
    except Exception as e:
        print(f"  [FAIL] Error: {e}")
        return False

def generate_timeline():
    """Generate timeline roadmap"""
    print("\n[*] Generating Timeline Roadmap...")
    try:
        import matplotlib.pyplot as plt
        import matplotlib.patches as mpatches
        
        # Create figure
        fig, ax = plt.subplots(figsize=(16, 5))
        fig.patch.set_facecolor('white')
        
        # Timeline data
        milestones = [
            {'date': 'Jan 2025', 'label': 'Start\n$15K Phase 1', 'x': 1, 'color': '#0088CC'},
            {'date': 'May 2025', 'label': 'Mainnet\nDeploy', 'x': 5, 'color': '#00CC88'},
            {'date': 'Jul 2025', 'label': '1K Candles\nLit', 'x': 7, 'color': '#FF8800'},
            {'date': 'Dec 2025', 'label': '$100K\nRevenue', 'x': 12, 'color': '#CC0088'}
        ]
        
        # Draw main timeline
        ax.plot([0, 13], [0.5, 0.5], 'k-', linewidth=4, color='#333333', zorder=1)
        
        # Draw milestones
        for i, m in enumerate(milestones):
            # Marker
            ax.plot(m['x'], 0.5, 'o', markersize=20, color=m['color'], 
                   markeredgewidth=3, markeredgecolor='white', zorder=3)
            
            # Date label (above)
            ax.text(m['x'], 0.75, m['date'], ha='center', va='bottom',
                   fontsize=14, fontweight='bold', color='#333333')
            
            # Milestone label (below)
            ax.text(m['x'], 0.25, m['label'], ha='center', va='top',
                   fontsize=12, fontweight='normal',
                   bbox=dict(boxstyle='round,pad=0.5', facecolor=m['color'], 
                            alpha=0.3, edgecolor=m['color'], linewidth=2))
            
            # Connector lines
            ax.plot([m['x'], m['x']], [0.5, 0.7], 'k--', linewidth=1, 
                   color='#CCCCCC', zorder=0)
            ax.plot([m['x'], m['x']], [0.5, 0.3], 'k--', linewidth=1, 
                   color='#CCCCCC', zorder=0)
        
        # Styling
        ax.set_xlim(0, 13)
        ax.set_ylim(0, 1)
        ax.axis('off')
        ax.set_title('G.rave 2.0 Roadmap - 2025', 
                    fontsize=22, fontweight='bold', pad=30, color='#333333')
        
        # Save
        plt.tight_layout()
        plt.savefig('timeline_roadmap.png', dpi=300, bbox_inches='tight',
                   facecolor='white', edgecolor='none')
        plt.close()
        
        print("  [OK] Saved: timeline_roadmap.png")
        print("       Check: Verify dates are readable")
        return True
    except Exception as e:
        print(f"  [FAIL] Error: {e}")
        return False

def check_files():
    """Check which files were created"""
    print("\n[*] Checking generated files...")
    
    files = [
        'demo_qr_code.png',
        'budget_breakdown.png',
        'timeline_roadmap.png'
    ]
    
    success_count = 0
    for filename in files:
        if os.path.exists(filename):
            size = os.path.getsize(filename)
            print(f"  [OK] {filename} ({size//1024} KB)")
            success_count += 1
        else:
            print(f"  [FAIL] {filename} - NOT FOUND")
    
    print(f"\n[*] Generated: {success_count}/3 assets")
    return success_count

def main():
    """Main execution"""
    print("=" * 60)
    print("G.rave 2.0 - Visual Assets Generator")
    print("=" * 60)
    
    # Install packages
    if not install_packages():
        print("\n[FAIL] Failed to install packages. Exiting.")
        return
    
    # Generate assets
    results = []
    results.append(generate_qr())
    results.append(generate_pie())
    results.append(generate_timeline())
    
    # Check results
    success_count = check_files()
    
    # Summary
    print("\n" + "=" * 60)
    if success_count == 3:
        print("[SUCCESS] All 3 assets generated!")
        print("\n[*] Next steps:")
        print("  1. Record 3D vinyl GIF manually (use ScreenToGif)")
        print("  2. Insert all 4 visuals into Executive Summary PDF")
        print("  3. Test QR code with phone camera")
        print("  4. Submit to TON Foundation!")
    else:
        print(f"[WARNING] Generated {success_count}/3 assets")
        print("   Check error messages above")
    
    print("=" * 60)
    
    # Keep window open on Windows
    if sys.platform == 'win32':
        input("\nPress Enter to exit...")

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Quick MP4 to GIF converter for G.rave vinyl video
Optimized for Executive Summary (small file size, good quality)
"""

import subprocess
import sys
import os

def convert_mp4_to_gif(input_file, output_file='grave_vinyl_demo.gif', width=800, fps=30):
    """
    Convert MP4 to optimized GIF using ffmpeg
    
    Args:
        input_file: Path to MP4 file
        output_file: Output GIF filename
        width: Width in pixels (height auto)
        fps: Frames per second
    """
    
    print("=" * 60)
    print("MP4 to GIF Converter - G.rave 2.0")
    print("=" * 60)
    
    # Check if input exists
    if not os.path.exists(input_file):
        print(f"[FAIL] Input file not found: {input_file}")
        return False
    
    input_size = os.path.getsize(input_file)
    print(f"\n[*] Input: {input_file} ({input_size//1024} KB)")
    
    # Check if ffmpeg is available
    try:
        subprocess.run(['ffmpeg', '-version'], 
                      stdout=subprocess.DEVNULL, 
                      stderr=subprocess.DEVNULL,
                      check=True)
        print("[OK] ffmpeg found")
    except:
        print("[FAIL] ffmpeg not found. Install from: https://ffmpeg.org/download.html")
        print("\nAlternative: Use online converter at https://ezgif.com/video-to-gif")
        return False
    
    print(f"\n[*] Converting to GIF...")
    print(f"    Width: {width}px")
    print(f"    FPS: {fps}")
    
    # FFmpeg command for high-quality GIF
    # Two-pass palette generation for better colors
    cmd = [
        'ffmpeg', '-i', input_file,
        '-vf', f'fps={fps},scale={width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
        '-loop', '0',  # Infinite loop
        '-y',  # Overwrite output
        output_file
    ]
    
    try:
        result = subprocess.run(cmd, 
                              stdout=subprocess.DEVNULL,
                              stderr=subprocess.PIPE,
                              text=True,
                              timeout=60)
        
        if result.returncode == 0 and os.path.exists(output_file):
            output_size = os.path.getsize(output_file)
            print(f"\n[SUCCESS] GIF created: {output_file}")
            print(f"          Size: {output_size//1024} KB")
            
            # Check if file is too large
            if output_size > 2 * 1024 * 1024:  # 2MB
                print(f"\n[WARNING] GIF is large ({output_size//1024//1024} MB)")
                print("          Consider reducing FPS or width")
                print("          Or use online optimizer: https://ezgif.com/optimize")
            
            return True
        else:
            print(f"\n[FAIL] Conversion failed")
            print(f"Error: {result.stderr[-500:]}")  # Last 500 chars
            return False
            
    except subprocess.TimeoutExpired:
        print("\n[FAIL] Conversion timeout (>60 seconds)")
        return False
    except Exception as e:
        print(f"\n[FAIL] Error: {e}")
        return False

def main():
    """Main execution"""
    
    # Find MP4 files in current directory
    mp4_files = [f for f in os.listdir('.') if f.endswith('.mp4')]
    
    if not mp4_files:
        print("No MP4 files found in current directory")
        print("\nUsage: python convert_mp4_to_gif.py [input.mp4]")
        return
    
    # Use first MP4 or command line argument
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        input_file = mp4_files[0]
        print(f"[*] Auto-detected: {input_file}")
    
    # Convert
    success = convert_mp4_to_gif(input_file)
    
    if success:
        print("\n" + "=" * 60)
        print("[SUCCESS] Ready for Executive Summary!")
        print("=" * 60)
        print("\nNext steps:")
        print("  1. Check grave_vinyl_demo.gif looks good")
        print("  2. Insert into Executive Summary PDF")
        print("  3. Submit to TON Foundation!")
    else:
        print("\n" + "=" * 60)
        print("[ALTERNATIVE] Use online converter")
        print("=" * 60)
        print("\n1. Go to: https://ezgif.com/video-to-gif")
        print(f"2. Upload: {input_file}")
        print("3. Settings: 800px width, 30 FPS")
        print("4. Download as: grave_vinyl_demo.gif")
    
    # Keep window open on Windows
    if sys.platform == 'win32':
        input("\nPress Enter to exit...")

if __name__ == '__main__':
    main()

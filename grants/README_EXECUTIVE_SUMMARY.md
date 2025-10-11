# How to Use the Executive Summary

## File: `TON_GRANT_EXECUTIVE_SUMMARY.md`

### Purpose
1-page visual summary with key metrics for TON Foundation grant reviewers.

---

## Converting to PDF

### Option 1: Online Converter (Easiest)
1. Open `TON_GRANT_EXECUTIVE_SUMMARY.md` in any text editor
2. Copy all content
3. Go to: https://www.markdowntopdf.com/
4. Paste content
5. Click "Convert"
6. Download PDF

### Option 2: VS Code Extension
1. Install extension: "Markdown PDF" by yzane
2. Open `TON_GRANT_EXECUTIVE_SUMMARY.md` in VS Code
3. Right-click → "Markdown PDF: Export (pdf)"
4. Save as `G.rave_2.0_Executive_Summary.pdf`

### Option 3: Pandoc (Command Line)
```bash
pandoc TON_GRANT_EXECUTIVE_SUMMARY.md -o G.rave_2.0_Executive_Summary.pdf --pdf-engine=xelatex
```

### Option 4: Google Docs
1. Copy markdown content
2. Paste into Google Docs
3. Format manually (tables, bold, etc.)
4. File → Download → PDF

---

## Inserting into Grant Application

### Method 1: Separate Attachment
- Submit `G.rave_2.0_Executive_Summary.pdf` as first attachment
- Then submit full `ton-foundation-application.md` as main document

### Method 2: Prepend to Application
1. Convert Executive Summary to PDF
2. Convert full application to PDF
3. Merge PDFs (use: https://www.ilovepdf.com/merge_pdf)
4. Submit single PDF with Executive Summary as page 1

### Method 3: Markdown Prepend
1. Copy content from `TON_GRANT_EXECUTIVE_SUMMARY.md`
2. Paste at top of `ton-foundation-application.md`
3. Add page break: `\newpage` (if using pandoc)
4. Submit combined markdown or convert to PDF

---

## Key Sections (What Reviewers See First)

1. **Elevator Pitch** - 30 second hook
2. **Funding Request** - $15K + $50K staged
3. **Current Status** - 85% complete table
4. **Success Criteria** - Clear gates for Phase 2
5. **Budget Breakdown** - Every dollar accounted
6. **Timeline** - 90 days to proof
7. **Why TON** - Perfect fit reasoning
8. **The Ask** - Clear, specific request

---

## Design Tips for PDF

### If Manually Formatting:
- **Font**: Use clean sans-serif (Arial, Helvetica, Roboto)
- **Size**: 10-11pt body, 14-16pt headers
- **Colors**: Use sparingly (TON blue #0088CC for headers)
- **Whitespace**: Don't cram, let it breathe
- **Icons**: Keep emoji or replace with professional icons
- **Tables**: Make them clean with borders
- **Boxes**: Use for key numbers (funding amounts)

### Page Breaks:
If content exceeds 1 page, trim:
- Remove "Contact & Links" section (put in cover letter)
- Combine "Why TON" and "Why Now" into single section
- Shorten "Competitive Advantage" table

---

## Submission Checklist

Before submitting Executive Summary:

- [ ] All numbers are accurate ($15K, $50K, 50 memorials, etc.)
- [ ] Links are working (demo page, GitHub)
- [ ] Contact info is current
- [ ] Fits on 1 page (or max 2 pages)
- [ ] Visual hierarchy is clear
- [ ] No typos or formatting errors
- [ ] PDF renders correctly on mobile + desktop
- [ ] File size < 5MB

---

## Why This Works

**Reviewers are busy. They see 100+ applications.**

This Executive Summary:
- ✅ Grabs attention in 30 seconds
- ✅ Shows you're 85% done (not vaporware)
- ✅ Has clear numbers (not vague promises)
- ✅ Demonstrates strategic thinking (staged funding)
- ✅ Minimizes their risk ($15K vs $75K)
- ✅ Has measurable success criteria

**Result: Higher approval probability + faster decision.**

---

## Alternative Formats

### Pitch Deck Version
If TON asks for slides:
1. Use same content
2. 1 slide per section (10 slides total)
3. More visuals (screenshots, charts)
4. Tools: Google Slides, Canva, Pitch.com

### Infographic Version
For social media / community:
1. Compress to single image
2. Key metrics as visual elements
3. QR code to demo page
4. Tools: Canva, Figma

---

## Testing Before Submission

**Print Preview Test:**
1. Convert to PDF
2. Check page count (should be 1-2 pages)
3. Print on paper or view on tablet
4. Is everything readable?
5. Do tables/boxes render correctly?

**Mobile Test:**
1. Open PDF on phone
2. Can you read without zooming?
3. If not, increase font size

**Share with Friend:**
1. Send to non-technical person
2. Ask: "Can you explain what this project does in 30 seconds?"
3. If they can → Executive Summary works
4. If they can't → simplify

---

## Final File Structure

```
grants/
├── G.rave_2.0_Executive_Summary.pdf     ← PDF version
├── TON_GRANT_EXECUTIVE_SUMMARY.md       ← Markdown source
├── ton-foundation-application.md        ← Full application
└── README_EXECUTIVE_SUMMARY.md          ← This file
```

**Submit:**
- Primary: `ton-foundation-application.md` (or PDF)
- Attachment: `G.rave_2.0_Executive_Summary.pdf`

---

## Quick Edit Commands

### Update Numbers
```bash
# If Phase 1 target changes from $15K to $20K:
sed -i 's/\$15,000/\$20,000/g' TON_GRANT_EXECUTIVE_SUMMARY.md

# If Phase 2 changes from $50K to $40K:
sed -i 's/\$50,000/\$40,000/g' TON_GRANT_EXECUTIVE_SUMMARY.md
```

### Update Status
```bash
# When contract is deployed:
sed -i 's/Needs deploy/Deployed ✅/g' TON_GRANT_EXECUTIVE_SUMMARY.md
```

---

**You're all set!** Convert to PDF and prepend to your grant application. 🚀

# Presentation Files - Smart University Platform

This document explains how to convert the markdown presentations to PowerPoint (PPTX) format.

## Available Presentation Files

| File | Language | Description |
|------|----------|-------------|
| `presentation.md` | English | Original markdown presentation |
| `presentation-fa.md` | Persian (فارسی) | Persian markdown presentation |
| `presentation-marp.md` | English | Marp-compatible presentation (for conversion) |
| `presentation-marp-fa.md` | Persian | Marp-compatible Persian presentation (for conversion) |

## Converting to PowerPoint (PPTX)

### Option 1: Using Marp CLI (Recommended)

The project includes Marp CLI for converting markdown to PPTX.

**Prerequisites:**
- Node.js installed
- Chrome, Edge, or Firefox browser installed

**Steps:**

1. Navigate to the project root directory

2. Run the conversion script:

   **On Windows:**
   ```batch
   scripts\convert-to-pptx.bat
   ```

   **On Linux/Mac:**
   ```bash
   chmod +x scripts/convert-to-pptx.sh
   ./scripts/convert-to-pptx.sh
   ```

3. Find the output files in `docs/pptx/`:
   - `Smart-University-Presentation-EN.pptx`
   - `Smart-University-Presentation-FA.pptx`

### Option 2: Using Marp for VS Code

1. Install the [Marp for VS Code](https://marketplace.visualstudio.com/items?itemName=marp-team.marp-vscode) extension

2. Open `presentation-marp.md` or `presentation-marp-fa.md`

3. Click the Marp icon in the top-right corner

4. Select "Export slide deck..." → Choose PPTX format

### Option 3: Using Marp CLI Directly

```bash
# Install marp-cli globally
npm install -g @marp-team/marp-cli

# Convert English presentation
marp docs/presentation-marp.md --pptx -o docs/pptx/presentation-en.pptx

# Convert Persian presentation
marp docs/presentation-marp-fa.md --pptx -o docs/pptx/presentation-fa.pptx

# Convert to PDF instead
marp docs/presentation-marp.md --pdf -o docs/pdf/presentation-en.pdf
```

### Option 4: Using Marp Web (No Installation Required)

1. Go to [Marp Web](https://web.marp.app/)

2. Copy the content from `presentation-marp.md` or `presentation-marp-fa.md`

3. Paste into the editor

4. Click "Export" → Select PPTX format

## Presentation Structure

Both presentations contain approximately 20 slides covering:

1. **Title Slide** - Project introduction
2. **Project Overview** - Features and capabilities
3. **Architecture Overview** - Microservices diagram
4. **Technology Stack** - Tools and frameworks used
5. **Design Patterns** - 7 patterns implemented
6. **Saga Pattern** - Marketplace checkout flow
7. **Circuit Breaker** - Exam notification resilience
8. **Event-Driven Architecture** - Observer pattern via RabbitMQ
9. **State Pattern** - Exam lifecycle management
10. **Multi-Tenancy** - Row-level tenant isolation
11. **Security Architecture** - JWT and RBAC
12. **No-Overbooking Algorithm** - Pessimistic locking
13. **Testing Strategy** - Comprehensive test coverage
14. **NFR Compliance** - Non-functional requirements
15. **Docker Infrastructure** - Container orchestration
16. **Documentation** - Deliverables list
17. **Demo Walkthrough** - Live demo steps
18. **Key Learnings** - Technical insights
19. **Conclusion** - Project summary
20. **Appendix** - API endpoints and commands

## Customization

### Changing Theme

Edit the YAML frontmatter in the Marp files:

```yaml
---
marp: true
theme: default  # Options: default, gaia, uncover
paginate: true
backgroundColor: #fff
---
```

### Adding Custom CSS

Add custom styles in the `style` section of the frontmatter:

```yaml
style: |
  section {
    font-family: 'Your Font', sans-serif;
  }
  h1 {
    color: #your-color;
  }
```

## Troubleshooting

### "No suitable browser found" Error

Marp CLI requires a browser (Chrome, Edge, or Firefox) to render slides. Make sure one is installed.

### Persian Text Not Rendering Correctly

For Persian presentations, ensure:
1. The font supports Persian characters (Vazir, Tahoma)
2. RTL direction is set in the frontmatter

### Large File Size

If the PPTX file is too large:
1. Reduce image quality in the presentation
2. Use `--allow-local-files` flag for local images
3. Consider using PDF format instead

## Related Documentation

- [AI_Log.md](./AI_Log.md) - AI interaction summary
- [Learning_Report.md](./Learning_Report.md) - Technical learnings
- [architecture.md](./architecture.md) - System architecture
- [ai-interaction-report.md](./ai-interaction-report.md) - Detailed AI report

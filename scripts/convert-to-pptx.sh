#!/bin/bash

# Script to convert Marp markdown presentations to PowerPoint (PPTX)
# Requires: @marp-team/marp-cli installed in frontend/node_modules

echo "Converting presentations to PowerPoint format..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if marp-cli is installed
if [ ! -f "frontend/node_modules/.bin/marp" ]; then
    echo "Error: marp-cli not found. Installing..."
    cd frontend && npm install @marp-team/marp-cli --save-dev && cd ..
fi

# Create output directory
mkdir -p docs/pptx

# Convert English presentation
echo "Converting English presentation..."
./frontend/node_modules/.bin/marp docs/presentation-marp.md --pptx -o docs/pptx/Smart-University-Presentation-EN.pptx

# Convert Persian presentation
echo "Converting Persian presentation..."
./frontend/node_modules/.bin/marp docs/presentation-marp-fa.md --pptx -o docs/pptx/Smart-University-Presentation-FA.pptx

echo ""
echo "✅ Conversion complete!"
echo ""
echo "Output files:"
echo "  - docs/pptx/Smart-University-Presentation-EN.pptx"
echo "  - docs/pptx/Smart-University-Presentation-FA.pptx"
echo ""
echo "Note: You can also convert to PDF using:"
echo "  ./frontend/node_modules/.bin/marp docs/presentation-marp.md --pdf -o docs/pdf/presentation.pdf"

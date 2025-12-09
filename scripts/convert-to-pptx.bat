@echo off
REM Script to convert Marp markdown presentations to PowerPoint (PPTX)
REM Requires: @marp-team/marp-cli installed in frontend/node_modules

echo Converting presentations to PowerPoint format...

REM Navigate to project root
cd /d "%~dp0\.."

REM Check if marp-cli is installed
if not exist "frontend\node_modules\.bin\marp.cmd" (
    echo Error: marp-cli not found. Installing...
    cd frontend
    call npm install @marp-team/marp-cli --save-dev
    cd ..
)

REM Create output directory
if not exist "docs\pptx" mkdir "docs\pptx"

REM Convert English presentation
echo Converting English presentation...
call frontend\node_modules\.bin\marp.cmd docs\presentation-marp.md --pptx -o docs\pptx\Smart-University-Presentation-EN.pptx

REM Convert Persian presentation
echo Converting Persian presentation...
call frontend\node_modules\.bin\marp.cmd docs\presentation-marp-fa.md --pptx -o docs\pptx\Smart-University-Presentation-FA.pptx

echo.
echo ✅ Conversion complete!
echo.
echo Output files:
echo   - docs\pptx\Smart-University-Presentation-EN.pptx
echo   - docs\pptx\Smart-University-Presentation-FA.pptx
echo.
echo Note: You can also convert to PDF using:
echo   frontend\node_modules\.bin\marp.cmd docs\presentation-marp.md --pdf -o docs\pdf\presentation.pdf

pause

@echo off
echo =========================================
echo 1. Removing old corrupted Git history...
echo =========================================
rmdir /s /q .git

echo.
echo =========================================
echo 2. Removing VS Code history backups...
echo =========================================
FOR /d /r . %%d IN (.history) DO @IF EXIST "%%d" rmdir /s /q "%%d"

echo.
echo =========================================
echo 3. Re-initializing Git repository...
echo =========================================
git init
git add .
git commit -m "Initial commit - no secrets this time!"
git branch -M main

echo.
echo =========================================
echo 4. Pushing code to GitHub...
echo =========================================
git remote add origin https://github.com/gauravpatel007/Healthcare-Ai.git
git push -u origin main --force

echo.
echo =========================================
echo DONE! Check your GitHub repository.
echo =========================================
pause

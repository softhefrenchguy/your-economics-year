@echo off
rem Launched by the "Your Economics Year weekly check" scheduled task (Sundays 19:00).
rem Runs scripts/weekly.mjs in a visible window so you can see progress and solve CAPTCHAs.
title Your Economics Year - weekly check
cd /d "%~dp0.."
call npm run weekly
echo.
pause

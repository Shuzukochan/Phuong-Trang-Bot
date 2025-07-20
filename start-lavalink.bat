@echo off
echo Starting Lavalink Server...
echo Make sure you have Java 11+ installed and Lavalink.jar in the same directory
echo.

if not exist "Lavalink.jar" (
    echo Lavalink.jar not found!
    echo Please download Lavalink.jar from: https://github.com/lavalink-devs/Lavalink/releases
    pause
    exit /b 1
)

if not exist "application.yml" (
    echo application.yml not found!
    echo Please make sure the configuration file exists.
    pause
    exit /b 1
)

echo Starting Lavalink server on port 2333...
java -jar Lavalink.jar
pause 
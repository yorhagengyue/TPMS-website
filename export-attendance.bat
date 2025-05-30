@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: 签到记录导出工具 - Windows 批处理版本
echo.
echo ===============================================
echo           TPMS 签到记录导出工具
echo ===============================================
echo.

:: 检查Node.js是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ 错误: 未检测到 Node.js，请先安装 Node.js
    echo    下载地址: https://nodejs.org/
    pause
    exit /b 1
)

:: 检查必要文件是否存在
if not exist "database.js" (
    echo ❌ 错误: 未找到 database.js 文件
    echo    请确保在项目根目录下运行此脚本
    pause
    exit /b 1
)

if not exist "quick-export.js" (
    echo ❌ 错误: 未找到 quick-export.js 文件
    pause
    exit /b 1
)

if not exist "export-all-attendance.js" (
    echo ❌ 错误: 未找到 export-all-attendance.js 文件
    pause
    exit /b 1
)

:: 显示菜单
:menu
cls
echo.
echo ===============================================
echo           TPMS 签到记录导出工具
echo ===============================================
echo.
echo 请选择导出方式:
echo.
echo  1. 快速导出 - 导出所有记录
echo  2. 快速导出 - 导出今天的记录
echo  3. 快速导出 - 导出本周的记录
echo  4. 快速导出 - 导出本月的记录
echo  5. 快速导出 - 指定学生ID
echo  6. 快速导出 - 指定日期范围
echo  7. 高级导出 - 完整功能版本
echo  8. 查看帮助
echo  9. 退出
echo.
set /p choice="请输入选项 (1-9): "

if "%choice%"=="1" (
    echo.
    echo 正在导出所有签到记录...
    node quick-export.js
    goto :end
)

if "%choice%"=="2" (
    echo.
    echo 正在导出今天的签到记录...
    node quick-export.js today
    goto :end
)

if "%choice%"=="3" (
    echo.
    echo 正在导出本周的签到记录...
    node quick-export.js week
    goto :end
)

if "%choice%"=="4" (
    echo.
    echo 正在导出本月的签到记录...
    node quick-export.js month
    goto :end
)

if "%choice%"=="5" (
    echo.
    set /p student_id="请输入学生ID: "
    echo 正在导出学生 !student_id! 的签到记录...
    node quick-export.js !student_id!
    goto :end
)

if "%choice%"=="6" (
    echo.
    echo 请输入日期范围 (格式: YYYY-MM-DD)
    set /p start_date="开始日期: "
    set /p end_date="结束日期: "
    echo 正在导出 !start_date! 至 !end_date! 的签到记录...
    node quick-export.js !start_date! !end_date!
    goto :end
)

if "%choice%"=="7" (
    echo.
    echo 启动高级导出工具...
    echo 可用选项示例:
    echo   --format=excel --include-stats               ^(导出Excel格式包含统计^)
    echo   --format=csv --start-date=2025-01-01         ^(导出CSV格式指定开始日期^)
    echo   --format=json --student-id=2403880d          ^(导出JSON格式指定学生^)
    echo.
    echo 请输入完整的参数 ^(或直接按Enter使用默认设置^):
    set /p advanced_params=""
    if "!advanced_params!"=="" (
        node export-all-attendance.js --format=excel --include-stats
    ) else (
        node export-all-attendance.js !advanced_params!
    )
    goto :end
)

if "%choice%"=="8" (
    cls
    echo.
    echo ===============================================
    echo                   使用帮助
    echo ===============================================
    echo.
    echo 快速导出功能:
    echo   - 支持常用的导出需求
    echo   - 自动生成Excel文件包含统计信息
    echo   - 适合日常使用
    echo.
    echo 高级导出功能:
    echo   - 支持多种格式: Excel, CSV, JSON
    echo   - 更多筛选选项: 课程、出勤率等
    echo   - 详细的统计分析
    echo   - 自定义输出目录
    echo.
    echo 导出文件位置:
    echo   - 默认保存在当前目录
    echo   - 文件名包含时间戳，不会覆盖
    echo.
    echo 数据库支持:
    echo   - MySQL 和 PostgreSQL
    echo   - 自动检测数据库类型
    echo.
    echo 注意事项:
    echo   - 确保数据库连接正常
    echo   - 大量数据导出可能需要较长时间
    echo   - 导出过程中请勿关闭窗口
    echo.
    pause
    goto :menu
)

if "%choice%"=="9" (
    echo.
    echo 再见！
    exit /b 0
)

echo.
echo ❌ 无效选项，请重新选择
timeout /t 2 > nul
goto :menu

:end
echo.
echo ===============================================
echo                 导出完成
echo ===============================================
echo.
set /p continue="是否继续使用导出工具? (y/n): "
if /i "%continue%"=="y" goto :menu
if /i "%continue%"=="yes" goto :menu

echo.
echo 感谢使用 TPMS 签到记录导出工具！
pause 
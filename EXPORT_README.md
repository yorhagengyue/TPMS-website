# TPMS 签到记录导出工具使用说明

## 概述

本工具集提供了多种方式来导出TPMS系统中的用户签到记录，支持不同的使用场景和需求。

## 工具列表

### 1. 快速导出工具 (`quick-export.js`)
- **适用场景**: 日常使用，简单快捷
- **输出格式**: Excel (.xlsx)
- **特点**: 
  - 简单易用，无需复杂参数
  - 自动包含基本统计信息
  - 支持常用的时间范围和筛选

### 2. 高级导出工具 (`export-all-attendance.js`)
- **适用场景**: 需要详细控制导出选项
- **输出格式**: Excel (.xlsx) / CSV / JSON
- **特点**:
  - 丰富的筛选选项
  - 详细的统计分析
  - 自定义输出目录
  - 分页导出大量数据

### 3. Windows 图形界面 (`export-attendance.bat`)
- **适用场景**: Windows用户，图形化操作
- **特点**:
  - 友好的菜单界面
  - 无需记忆命令参数
  - 集成所有导出功能

### 4. 原有导出工具 (`export-attendance.js`)
- **适用场景**: 兼容性使用
- **输出格式**: Excel (.xlsx)
- **特点**: 保持与原有系统的兼容性

## 安装依赖

在使用导出工具前，请确保安装了必要的依赖包：

```bash
npm install xlsx
```

如果尚未安装，请运行：
```bash
npm install
```

## 使用方法

### 方法一：Windows 图形界面（推荐）

双击运行 `export-attendance.bat` 文件，按照菜单提示操作。

```
===============================================
          TPMS 签到记录导出工具
===============================================

请选择导出方式:

 1. 快速导出 - 导出所有记录
 2. 快速导出 - 导出今天的记录
 3. 快速导出 - 导出本周的记录
 4. 快速导出 - 导出本月的记录
 5. 快速导出 - 指定学生ID
 6. 快速导出 - 指定日期范围
 7. 高级导出 - 完整功能版本
 8. 查看帮助
 9. 退出
```

### 方法二：命令行快速导出

```bash
# 导出所有记录
node quick-export.js

# 导出今天的记录
node quick-export.js today

# 导出本周的记录
node quick-export.js week

# 导出本月的记录
node quick-export.js month

# 导出指定学生的记录
node quick-export.js 2403880d

# 导出指定日期范围的记录
node quick-export.js 2025-01-01 2025-01-31
```

### 方法三：命令行高级导出

```bash
# 导出所有记录为Excel格式，包含统计信息
node export-all-attendance.js --format=excel --include-stats

# 导出指定日期范围的记录为CSV格式
node export-all-attendance.js --format=csv --start-date=2025-01-01 --end-date=2025-12-31

# 导出指定学生的记录为JSON格式
node export-all-attendance.js --format=json --student-id=2403880d

# 导出指定课程的记录，限制1000条
node export-all-attendance.js --course="Computer Science" --limit=1000

# 导出到指定目录
node export-all-attendance.js --output-dir=./exports --include-stats
```

## 高级导出工具参数说明

| 参数 | 说明 | 示例 |
|------|------|------|
| `--format` | 导出格式: excel/csv/json | `--format=excel` |
| `--start-date` | 开始日期 (YYYY-MM-DD) | `--start-date=2025-01-01` |
| `--end-date` | 结束日期 (YYYY-MM-DD) | `--end-date=2025-12-31` |
| `--student-id` | 指定学生ID | `--student-id=2403880d` |
| `--course` | 指定课程 (支持模糊匹配) | `--course="Computer Science"` |
| `--include-stats` | 包含统计信息 | `--include-stats` |
| `--output-dir` | 输出目录 | `--output-dir=./exports` |
| `--limit` | 限制导出记录数量 | `--limit=1000` |
| `--help` | 显示帮助信息 | `--help` |

## 导出数据字段说明

### 基本字段
- **ID**: 签到记录唯一标识
- **学生姓名**: 签到学生的姓名
- **学号**: 学生的索引号码
- **课程**: 学生所属课程
- **邮箱**: 学生邮箱地址
- **电话**: 学生电话号码（如有）

### 时间字段
- **签到时间**: 完整的签到时间戳
- **签到日期**: 签到日期
- **签到时刻**: 签到时间

### 位置字段
- **纬度**: 签到位置纬度
- **经度**: 签到位置经度

### 统计字段
- **会话ID**: 关联的会话标识
- **总会话数**: 学生应参加的总会话数
- **已参加会话数**: 学生实际参加的会话数
- **出勤率 (%)**: 学生的出勤百分比

## 输出文件格式

### Excel 格式 (.xlsx)
- **签到记录** 工作表：包含所有签到数据
- **统计信息** 工作表：总体统计数据（如启用）
- **按课程统计** 工作表：按课程分组的统计（如启用）

### CSV 格式 (.csv)
- UTF-8编码，支持中文
- 逗号分隔，字符串自动加引号

### JSON 格式 (.json)
```json
{
  "exportInfo": {
    "timestamp": "2025-01-15T10:30:00.000Z",
    "totalRecords": 1250,
    "filters": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-31",
      "studentId": null,
      "course": null,
      "limit": null
    }
  },
  "data": [...],
  "statistics": {...}
}
```

## 文件命名规则

生成的文件名格式：
```
签到记录_[范围描述]_[时间戳].[扩展名]
```

示例：
- `签到记录_全量导出_20250115T103000.xlsx`
- `签到记录_今天_20250115T103000.xlsx`
- `签到记录_学生2403880d_20250115T103000.xlsx`
- `签到记录_2025-01-01_至_2025-01-31_20250115T103000.csv`

## 数据库支持

支持的数据库类型：
- **MySQL**: 通过连接参数配置
- **PostgreSQL**: 通过连接字符串配置

数据库配置通过 `.env` 文件或环境变量设置：
```env
# MySQL 配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=tpms_db

# 或 PostgreSQL 配置
DATABASE_URL=postgresql://user:password@localhost:5432/tpms_db
```

## 性能注意事项

1. **大量数据导出**：
   - 使用 `--limit` 参数限制记录数量
   - 分批导出，避免内存溢出

2. **网络和数据库性能**：
   - 确保数据库连接稳定
   - 避免在高峰期进行大量导出

3. **磁盘空间**：
   - 确保有足够的磁盘空间
   - Excel文件通常比CSV文件大

## 故障排除

### 常见错误及解决方案

1. **数据库连接失败**
   ```
   错误: 无法连接到数据库
   ```
   - 检查数据库服务是否运行
   - 验证数据库连接配置
   - 确认网络连接正常

2. **Node.js 未安装**
   ```
   错误: 'node' 不是内部或外部命令
   ```
   - 安装 Node.js: https://nodejs.org/
   - 确认安装后重启命令行

3. **依赖包缺失**
   ```
   错误: Cannot find module 'xlsx'
   ```
   - 运行 `npm install xlsx`
   - 或运行 `npm install` 安装所有依赖

4. **权限错误**
   ```
   错误: EACCES: permission denied
   ```
   - 确认对输出目录有写入权限
   - 使用管理员权限运行（如需要）

5. **内存不足**
   ```
   错误: JavaScript heap out of memory
   ```
   - 使用 `--limit` 参数限制导出数量
   - 分批导出大量数据

## 最佳实践

1. **定期导出**：
   - 建立定期导出计划
   - 备份重要的签到数据

2. **数据验证**：
   - 导出后检查记录数量
   - 验证关键字段的完整性

3. **文件管理**：
   - 使用有意义的文件名
   - 建立文件归档策略

4. **安全考虑**：
   - 保护导出的个人信息
   - 遵守数据隐私法规

## 技术支持

如遇到问题，请检查：
1. 数据库连接是否正常
2. Node.js 和依赖包是否正确安装
3. 输出目录是否有写入权限

更多技术细节请参考源代码注释或联系开发团队。 
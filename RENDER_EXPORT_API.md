# TPMS 签到记录导出 API - Render 部署版本

## 概述

这个API端点专门为Render生产环境设计，允许通过HTTP请求导出所有签到记录为Excel文件，无需登录认证，但需要密码保护。

## API 详情

### 端点信息
- **URL**: `/api/public/export-attendance`
- **方法**: `GET`
- **认证**: 密码保护 (`Iammaincomm`)
- **响应格式**: Excel文件 (.xlsx) 或 JSON错误信息

### 请求方式

#### 方式一：查询参数
```http
GET /api/public/export-attendance?password=Iammaincomm
```

#### 方式二：请求头
```http
GET /api/public/export-attendance
X-Export-Password: Iammaincomm
```

### 使用示例

#### 1. 浏览器直接访问
```
https://your-render-app.onrender.com/api/public/export-attendance?password=Iammaincomm
```

#### 2. cURL 命令
```bash
# 使用查询参数
curl -O -J "https://your-render-app.onrender.com/api/public/export-attendance?password=Iammaincomm"

# 使用请求头
curl -H "X-Export-Password: Iammaincomm" -O -J "https://your-render-app.onrender.com/api/public/export-attendance"
```

#### 3. JavaScript/Fetch
```javascript
// 使用查询参数
fetch('/api/public/export-attendance?password=Iammaincomm')
  .then(response => {
    if (response.ok) {
      return response.blob();
    }
    throw new Error('Export failed');
  })
  .then(blob => {
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '签到记录.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  })
  .catch(error => console.error('Error:', error));
```

#### 4. Python requests
```python
import requests

url = "https://your-render-app.onrender.com/api/public/export-attendance"
params = {"password": "Iammaincomm"}

response = requests.get(url, params=params)

if response.status_code == 200:
    with open("attendance_export.xlsx", "wb") as file:
        file.write(response.content)
    print("文件下载成功")
else:
    print(f"下载失败: {response.json()}")
```

## 响应格式

### 成功响应
- **状态码**: `200 OK`
- **内容类型**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **响应头**:
  - `Content-Disposition`: `attachment; filename="签到记录_全量导出_20250530T111234.xlsx"`
  - `X-Total-Records`: 记录总数
  - `X-Export-Time`: 导出时间戳

### 错误响应

#### 密码错误 (401)
```json
{
  "success": false,
  "message": "Invalid password"
}
```

#### 无数据 (404)
```json
{
  "success": false,
  "message": "No attendance records found"
}
```

#### 服务器错误 (500)
```json
{
  "success": false,
  "message": "Failed to export attendance data"
}
```

## 导出文件内容

Excel文件包含两个工作表：

### 工作表1: "签到记录"
包含所有签到记录的详细信息：

| 列名 | 说明 |
|------|------|
| ID | 签到记录唯一标识 |
| 学生姓名 | 学生姓名 |
| 学号 | 学生索引号码 |
| 课程 | 学生所属课程 |
| 邮箱 | 学生邮箱地址 |
| 电话 | 学生电话号码 |
| 签到时间 | 完整的签到时间戳 |
| 签到日期 | 签到日期 |
| 签到时刻 | 签到时间 |
| 纬度 | GPS纬度坐标 |
| 经度 | GPS经度坐标 |
| 会话ID | 关联的会话标识 |
| 总会话数 | 应参加的总会话数 |
| 已参加会话数 | 实际参加的会话数 |
| 出勤率 (%) | 出勤百分比 |

### 工作表2: "统计信息"
包含导出数据的统计摘要：

| 统计项目 | 数值 |
|----------|------|
| 总记录数 | 签到记录总数 |
| 独特学生数 | 不重复学生数量 |
| 导出时间 | 导出操作的时间 |
| 导出环境 | "Render Production" |
| 数据范围 | "所有记录" |

## 测试页面

访问 `/export-test.html` 可以使用图形界面测试导出功能。

## 安全注意事项

1. **密码保护**: 必须提供正确的密码才能访问
2. **生产环境**: 此端点仅在生产环境中启用
3. **临时文件**: 导出后的临时文件会自动删除
4. **日志记录**: 所有导出操作都会记录在服务器日志中

## 限制和注意事项

1. **文件大小**: 大量数据可能导致较大的Excel文件
2. **超时**: 大量数据导出可能需要较长时间
3. **内存使用**: 导出过程会消耗服务器内存
4. **并发限制**: 建议避免同时发起多个导出请求

## 故障排除

### 常见问题

1. **密码错误**
   - 确保密码完全匹配（区分大小写）
   - 检查URL编码问题

2. **下载失败**
   - 检查网络连接
   - 确认服务器状态正常
   - 查看浏览器控制台错误信息

3. **文件无法打开**
   - 确认下载完整
   - 使用支持.xlsx格式的软件（如Microsoft Excel、LibreOffice）

### 联系支持

如遇到技术问题，请联系系统管理员并提供：
- 使用的URL
- 错误信息
- 浏览器类型和版本
- 操作系统信息

## 更新历史

- **v1.0** (2025-01-15): 初始版本，支持完整签到记录导出 
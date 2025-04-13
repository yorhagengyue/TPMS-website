# TPMS 维护工具

本目录包含一系列用于Temasek Polytechnic Mindsport Club系统维护的工具脚本。这些工具主要用于数据库维护、账户管理和问题诊断。

## 工具列表

### 1. 测试认证功能 (test-auth.js)

这个脚本用于测试学生账户的验证和注册流程，帮助诊断"Student already has an account"等认证问题。

**用法:**
```bash
node tools/test-auth.js
```

**功能:**
- 检查数据库结构和外键关系
- 查询特定学生ID的记录和关联账户
- 测试学生ID验证功能
- 清理学生账户
- 测试账户注册功能

如需测试不同的学生ID，请编辑脚本中的`testStudentId`变量。

### 2. 数据库迁移工具 (migrate-db.js)

这个脚本用于更新和修复数据库结构，特别是修复用户表的结构问题，确保正确使用`student_id`字段而不是`index_number`。

**用法:**
```bash
node tools/migrate-db.js
```

**功能:**
- 创建users表的备份
- 检查表结构
- 自动修复表结构和外键关系
- 清理特定学生ID的用户账户

### 3. 清理学生账户工具 (clear-account.js)

这个脚本用于删除与特定学生ID关联的用户账户，适用于解决"Student already has an account"错误。

**用法:**
```bash
node tools/clear-account.js <学生ID>
```

**示例:**
```bash
node tools/clear-account.js 2403880d
```

**功能:**
- 查找指定学生ID的记录
- 查询与该学生关联的用户账户
- 删除这些用户账户

### 4. 两步认证测试工具 (test-two-step-auth.js)

这个脚本专门测试新的两步认证流程：先验证学生ID创建无密码账户，然后设置密码。

**用法:**
```bash
node tools/test-two-step-auth.js
```

**功能:**
- 清理测试用户账户
- 测试学生ID验证功能
- 测试创建无密码账户
- 测试账户密码设置
- 验证整个两步认证流程

### 5. 密码清除工具 (clear-passwords.js)

这个脚本用于清除用户密码并设置`needs_password`标志，以便测试设置密码流程。

**用法:**
```bash
# 清除所有用户密码
node tools/clear-passwords.js

# 清除特定学生的密码
node tools/clear-passwords.js <学生ID>
```

**示例:**
```bash
node tools/clear-passwords.js 2403880d
```

**功能:**
- 清除所有或特定用户的密码
- 设置`needs_password`标志为`TRUE`
- 显示更新后的用户账户信息

### 6. 认证API测试工具 (test-auth-api.js)

这个脚本通过模拟HTTP请求测试认证API端点，验证前端和后端的交互。

**用法:**
```bash
node tools/test-auth-api.js
```

**功能:**
- 测试学生ID验证API端点
- 测试设置密码API端点
- 测试登录API端点
- 测试用户配置文件API端点
- 测试注销API端点
- 提供完整的测试报告和摘要

**注意:** 运行前确保API服务器已启动。

### 7. 学生活动测试工具 (test-activity.js)

这个脚本用于测试学生考勤和CCA活动功能，帮助诊断考勤记录问题并创建测试数据。

**用法:**
```bash
node tools/test-activity.js [学生ID]
```

**示例:**
```bash
node tools/test-activity.js 2403880d
```

**功能:**
- 检查学生考勤记录
- 显示CCA活动会话列表和即将到来的会话
- 创建测试考勤记录
- 显示系统使用统计信息
- 检测学生考勤记录与统计信息是否一致

### 8. 密码设置测试工具 (test-password-setting.js)

这个脚本专门测试两步认证流程中的密码设置功能，通过API直接测试密码设置端点。

**用法:**
```bash
node tools/test-password-setting.js [学生ID]
```

**示例:**
```bash
node tools/test-password-setting.js 2403880d
```

**功能:**
- 查找指定学生的用户账户
- 清除现有密码以准备测试
- 分别使用userId和studentId测试密码设置API
- 比较两种方式的成功率
- 提供详细的测试结果输出

**注意:** 运行前确保API服务器已启动。

### 9. 用户账户修复工具 (fix-user-accounts.js)

这个脚本用于自动检测和修复数据库中的用户账户问题。

**用法:**
```bash
# 仅检查问题但不进行修复
node tools/fix-user-accounts.js --verify-only

# 检查并自动修复问题
node tools/fix-user-accounts.js
```

**功能:**
- 检测密码与needs_password标志不一致的账户
- 识别同一个学生拥有的多个账户
- 发现没有对应学生记录的"孤立"用户账户
- 检测没有用户账户的学生记录
- 自动修复识别到的问题（除非使用--verify-only选项）

**注意:** 建议先使用`--verify-only`选项检查问题，然后再进行实际修复。

## 常见问题解决方案

### "Student already has an account" 错误

1. 使用清理账户工具删除现有账户:
   ```bash
   node tools/clear-account.js <学生ID>
   ```

2. 重启服务器
   ```bash
   npm run dev
   ```

3. 尝试再次注册

### 两步认证问题

如果两步认证流程有问题:

1. 清除用户密码以重置认证状态:
   ```bash
   node tools/clear-passwords.js <学生ID>
   ```

2. 使用两步认证测试工具诊断问题:
   ```bash
   node tools/test-two-step-auth.js
   ```

3. 使用API测试工具检查前后端交互:
   ```bash
   node tools/test-auth-api.js
   ```

### 数据库结构问题

如果遇到数据库结构相关的问题，运行迁移脚本:
```bash
node tools/migrate-db.js
```

### 考勤记录问题

如果学生考勤记录有问题或需要测试考勤系统:
```bash
node tools/test-activity.js <学生ID>
```

## 注意事项

- 这些工具会直接操作数据库，请谨慎使用
- 建议在执行操作前备份数据库
- 如果您不确定某个操作的影响，请先在测试环境中尝试 
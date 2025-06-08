# TPMS 维护工具

本目录包含一系列用于Temasek Polytechnic Mindsport Club系统维护的工具脚本。这些工具主要用于数据库维护、账户管理和问题诊断。

## 工具列表

### 1. 数据库迁移工具 (migrate-db.js)

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

### 2. 清理学生账户工具 (clear-account.js)

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

### 3. 用户账户修复工具 (fix-user-accounts.js)

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

### 密码重置问题

如果需要重置用户密码:

1. 重置所有用户密码:
   ```bash
   node tools/reset-all-passwords.js
   ```

2. 重置特定用户密码:
   ```bash
   node tools/reset-passwords-fixed.js <学生ID>
   ```

3. 检查密码状态:
   ```bash
   node tools/check-password-status.js
   ```

### 数据库结构问题

如果遇到数据库结构相关的问题，运行迁移脚本:
```bash
node tools/migrate-db.js
```

### 用户导入问题

如果需要导入新的学生数据:
```bash
node tools/import-orientation-users-fixed.js
```

或导入新学生:
```bash
node tools/import-new-students.js
```

## 注意事项

- 这些工具会直接操作数据库，请谨慎使用
- 建议在执行操作前备份数据库
- 如果您不确定某个操作的影响，请先在测试环境中尝试 
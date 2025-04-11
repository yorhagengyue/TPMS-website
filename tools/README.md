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

### 数据库结构问题

如果遇到数据库结构相关的问题，运行迁移脚本:
```bash
node tools/migrate-db.js
```

## 注意事项

- 这些工具会直接操作数据库，请谨慎使用
- 建议在执行操作前备份数据库
- 如果您不确定某个操作的影响，请先在测试环境中尝试 
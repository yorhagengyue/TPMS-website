# 数据库配置说明

## 新的 Render PostgreSQL 数据库连接信息

### 连接详情
- **主机名（内部）**: dpg-d1ofc12dbo4c73b0peqg-a
- **主机名（外部）**: dpg-d1ofc12dbo4c73b0peqg-a.singapore-postgres.render.com
- **端口**: 5432
- **数据库名**: tpms_db_pg_4wcj
- **用户名**: tpms_db_pg_user
- **密码**: gstleFafhFgOX5DNtWiJ9qOdaYDwdiXU

### 连接 URL

#### 内部 URL（Render 内部服务间通信）
```
postgresql://tpms_db_pg_user:gstleFafhFgOX5DNtWiJ9qOdaYDwdiXU@dpg-d1ofc12dbo4c73b0peqg-a/tpms_db_pg_4wcj
```

#### 外部 URL（本地开发或外部访问）
```
postgresql://tpms_db_pg_user:gstleFafhFgOX5DNtWiJ9qOdaYDwdiXU@dpg-d1ofc12dbo4c73b0peqg-a.singapore-postgres.render.com/tpms_db_pg_4wcj
```

### PSQL 命令行连接
```bash
PGPASSWORD=gstleFafhFgOX5DNtWiJ9qOdaYDwdiXU psql -h dpg-d1ofc12dbo4c73b0peqg-a.singapore-postgres.render.com -U tpms_db_pg_user tpms_db_pg_4wcj
```

## 配置步骤

### 1. 创建 .env 文件
在项目根目录创建 `.env` 文件，内容如下：

```env
# Database Configuration
DATABASE_URL=postgresql://tpms_db_pg_user:gstleFafhFgOX5DNtWiJ9qOdaYDwdiXU@dpg-d1ofc12dbo4c73b0peqg-a.singapore-postgres.render.com/tpms_db_pg_4wcj

# Application Port
PORT=5000

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
EMAIL_FROM=TPMS System <noreply@tpms.com>

# Environment
NODE_ENV=development
```

### 2. 在 Render 上配置环境变量
如果应用部署在 Render 上，建议在 Render Dashboard 中设置环境变量：
- 使用内部 URL 以获得更好的性能
- 在 Render Dashboard > Environment 中添加：
  - `DATABASE_URL`: 使用内部 URL

### 3. 初始化数据库
使用提供的 SQL 脚本初始化数据库结构：
```bash
# 使用 postgres-schema.sql 初始化表结构
PGPASSWORD=gstleFafhFgOX5DNtWiJ9qOdaYDwdiXU psql -h dpg-d1ofc12dbo4c73b0peqg-a.singapore-postgres.render.com -U tpms_db_pg_user tpms_db_pg_4wcj < postgres-schema.sql
```

### 4. 验证连接
运行以下命令测试数据库连接：
```bash
node tests/db/check-db.js
```

## 注意事项
- `.env` 文件已添加到 `.gitignore`，不会被提交到版本控制
- 请勿将数据库密码等敏感信息提交到代码仓库
- 在生产环境中，建议使用环境变量而不是 `.env` 文件 
# 德明理工学院智力运动俱乐部网站

这是德明理工学院智力运动俱乐部的官方网站项目，提供新闻发布、活动管理和基于位置的签到系统等功能。

## 功能特点

### 🌟 核心功能
- 新闻动态展示与管理
- 活动日历系统
- 基于位置的电子签到
- 学生身份认证
- 响应式设计，支持移动端

### 📱 用户界面
- 现代化的 UI 设计
- 流畅的动画效果
- 直观的导航系统
- 深色/浅色主题支持

### 👨‍💼 管理功能
- Excel 导入/导出学生数据
- 活动管理系统
- 签到数据统计
- 用户权限管理

## 技术栈

### 前端框架
- React 18
- Tailwind CSS
- Framer Motion
- shadcn/ui 组件库

### 工具库
- date-fns：日期处理
- xlsx：Excel 文件处理
- react-hot-toast：通知提示
- react-icons：图标库

## 项目结构

```
/
├── src/
│   ├── components/           # React 组件
│   │   ├── ui/              # UI 组件
│   │   │   ├── button/      # 按钮组件
│   │   │   ├── card/        # 卡片组件
│   │   │   └── layout/      # 布局组件
│   │   └── pages/           # 页面组件
│   ├── lib/                 # 工具函数
│   ├── styles/              # 全局样式
│   └── App.jsx             # 主应用组件
├── public/                  # 静态资源
└── config/                 # 配置文件
```

## 开始使用

### 环境要求
- Node.js 16.0 或更高版本
- npm 7.0 或更高版本

### 安装步骤

1. 克隆项目
```bash
git clone [项目地址]
cd tpms
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm start
```

4. 构建生产版本
```bash
npm run build
```

### 配置说明

1. 位置服务配置
在 `src/App.jsx` 中设置校园坐标：
```javascript
const tpLocation = { 
  lat: 1.3456,   // 纬度
  lng: 103.9321  // 经度
};
```

2. 签到范围设置
在 `src/components/pages/CheckinPage.jsx` 中调整：
```javascript
const CHECKIN_RADIUS = 0.5; // 单位：公里
```

## 开发指南

### 代码规范
- 使用 ESLint 进行代码检查
- 遵循 React 最佳实践
- 使用 Prettier 进行代码格式化

### 提交规范
```bash
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

## 部署说明

### 生产环境部署
1. 构建项目
```bash
npm run build
```

2. 将 `build` 目录下的文件部署到服务器

### 环境变量配置
创建 `.env` 文件：
```env
REACT_APP_API_URL=你的API地址
REACT_APP_GOOGLE_MAPS_KEY=你的Google Maps API密钥
```

## 维护者

- 开发团队 - TP Mindsport Club Development Team

## 许可证

本项目采用 MIT 许可证

## 使用 ngrok 快速预览

如果需要临时将本地开发环境分享给他人预览，可以使用 ngrok：

1. 安装 ngrok
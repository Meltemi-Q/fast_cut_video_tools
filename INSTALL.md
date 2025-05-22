# 📦 安装指南

由于npm缓存权限问题，请按以下步骤手动安装项目依赖：

## 🔧 方法一: 使用yarn (推荐)

```bash
# 1. 安装yarn (如果还没有)
npm install -g yarn

# 2. 安装依赖
yarn install

# 3. 启动开发服务器
yarn dev
```

## 🔧 方法二: 修复npm缓存权限

```bash
# 1. 清理npm缓存 (以管理员身份运行PowerShell)
npm cache clean --force

# 2. 重新设置npm缓存目录权限
npm config set cache "C:\Users\[用户名]\AppData\Local\npm-cache" --global

# 3. 安装依赖
npm install

# 4. 启动开发服务器
npm run dev
```

## 🔧 方法三: 分步安装依赖

如果上述方法仍有问题，可以分步安装：

```bash
# 1. 安装核心React依赖
npm install react react-dom

# 2. 安装TypeScript和构建工具
npm install --save-dev typescript @types/react @types/react-dom vite @vitejs/plugin-react

# 3. 安装样式相关
npm install --save-dev tailwindcss autoprefixer postcss

# 4. 安装其他依赖
npm install zustand @headlessui/react @heroicons/react

# 5. 安装开发工具
npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react-hooks eslint-plugin-react-refresh vitest

# 6. 启动开发服务器
npm run dev
```

## ✅ 验证安装

安装完成后，项目目录应该包含：
- ✅ `node_modules/` 文件夹
- ✅ `package-lock.json` 或 `yarn.lock` 文件

然后访问 `http://localhost:3000` 查看项目。

## 🚨 常见问题

**问题1**: `EPERM: operation not permitted`
- **解决**: 以管理员身份运行命令行工具

**问题2**: `模块找不到错误`
- **解决**: 删除 `node_modules` 和锁文件，重新安装

**问题3**: `端口被占用`
- **解决**: 修改 `vite.config.ts` 中的端口号或关闭占用端口的程序

---

## 📱 项目启动后

1. 🎯 首先会看到文件上传界面
2. 📁 支持拖拽或点击上传视频/图片/GIF文件
3. ✂️ 上传后进入编辑界面，可以进行时间裁剪和区域选择
4. 📥 完成编辑后可以导出为MP4或GIF格式

**注意**: 当前为基础架构版本，核心功能正在开发中。 
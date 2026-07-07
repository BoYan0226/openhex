# OpenHex Landing

这是一个可以直接放进 GitHub Codespaces 的 Next.js landing page 项目。

## 快速开始

在 Codespace 里打开项目后，`.devcontainer` 会自动执行：

```bash
corepack enable && pnpm install
```

如果你是手动上传到一个已有 Codespace，进入项目根目录后运行：

```bash
corepack enable
pnpm install
pnpm dev
```

然后打开自动转发的 `3000` 端口。

## 常用命令

```bash
pnpm dev        # 本地开发，监听 0.0.0.0，适合 Codespaces
pnpm dev:local  # 普通本地开发
pnpm build      # 生产构建
pnpm start      # 运行生产构建
pnpm typecheck  # TypeScript 检查
```

## 环境变量

复制 `.env.example` 为 `.env.local` 后按需要修改：

```bash
cp .env.example .env.local
```

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | `https://app.openhex.tech` | 页面 CTA 会跳到 `${NEXT_PUBLIC_APP_URL}/login` |

## 项目结构

```text
app/                 Next.js App Router 页面和全局样式
components/          导航、页脚、Hero、各个 landing section
i18n/                next-intl 配置
messages/            中文文案
public/              图片、SVG、GIF、法务 Markdown
src/types/           静态资源类型声明
.devcontainer/       GitHub Codespaces 配置
```

## 上传到 GitHub / Codespaces

1. 把这个目录里的所有文件提交到一个 GitHub 仓库。
2. 在仓库页面点击 `Code` -> `Codespaces` -> `Create codespace on main`。
3. 等依赖安装完成后运行 `pnpm dev`。

项目根目录已经包含 `pnpm-lock.yaml`，不要提交 `node_modules/` 或 `.next/`。

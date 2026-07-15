# 《谁偷了我的布丁》 (Who Ate My Pudding)

这是一款基于大语言模型 (LLM) 流式驱动的单机文字推理游戏。玩家将扮演红魔馆的主人蕾米莉亚，通过有限的行动点数(AP)调查现场线索，并盘问嫌疑人，最终找出偷吃限量焦糖布丁的真凶。

## 游戏特点

- **动态打字机流式输出**：接入 DeepSeek V4 Flash 的流式推理 API，实时展示 AI 的**思考过程**与作答，带来极具沉浸感的盘问体验。
- **严谨的物理与逻辑破防机制**：系统内置基于大模型语义判断的“破防”模块，只有用无懈可击的证据或话术才能让真凶认罪。
- **动态 AP 系统与地图探索**：在红魔馆地图中自由移动，调查线索并扣除 AP，行动点耗尽时将进入最终指认阶段。
- **精美暗黑 UI**：原生 React 驱动的毛玻璃材质、暗黑哥特风与专属定制背景图。

---

## 部署与启动指南

项目分为 `backend` (FastAPI) 和 `frontend` (React + Vite)，推荐使用 Nginx 进行生产环境的反向代理部署。

### 1. 环境准备
- Node.js (v18+)
- Python 3.9+
- MySQL 8.0+ 数据库服务

### 2. 数据库配置
在 MySQL 中创建空数据库：
```sql
CREATE DATABASE IF NOT EXISTS whoeat DEFAULT CHARACTER SET utf8mb4;
```

### 3. 后端服务 (Backend)

进入 `backend` 目录，安装依赖并配置环境：

```bash
cd backend
python -m venv venv
# 激活虚拟环境 (Windows: .\venv\Scripts\activate, Linux: source venv/bin/activate)
pip install -r requirements.txt
```

**配置环境变量**：
复制 `.env.example` 并重命名为 `.env`：
```bash
cp .env.example .env
```
编辑 `.env` 文件，填入您的数据库信息，以及阿里云大模型的 `DASHSCOPE_API_KEY`。

**启动后端**：
```bash
# 生产环境推荐使用 uvicorn 启动并结合 gunicorn / supervisor
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 4. 前端服务 (Frontend)

进入 `frontend` 目录：

```bash
cd frontend
npm install
```

**生产环境构建**：
```bash
npm run build
```
这将在 `frontend/dist` 生成静态文件，您可以将其直接配置到 Nginx 中。

**开发环境启动**：
```bash
npm run dev
```

### 5. 初始配置与游玩
启动服务并访问前端页面后，使用游戏内置的专属邀请码 **`whoeat2026`** 进行首个账号的注册，即可开始推理！

# ✨ VLM-OCR: 智能PDF文档识别与处理系统

VLM-OCR 是一个强大的文档处理工具，它利用先进的视觉语言模型（VLM）技术，能够智能地识别和提取PDF文档中的各种元素，包括文字、段落、标题、表格、图表、公式等，并将它们转换为结构化的Markdown格式。

## 🚀 主要特性

- **高精度识别**: 采用多模型并行处理，确保对各类文档内容（包括复杂布局）的高精度识别。
- **多格式支持**: 不仅能提取标准文本，还能精准识别和转换**表格**和**数学公式**为 LaTeX 格式。
- **结构化输出**: 将提取的文档内容自动整理为清晰、易读的Markdown格式，保留原始文档的布局和语义结构。
- **Web界面**: 提供直观易用的Web界面，用户可轻松上传PDF文件、实时查看识别进度和结果。
- **Docker一键部署**: 通过 Docker Compose，可以一键启动整个应用，极大简化了部署和维护流程。
- **灵活配置**: 支持通过环境变量配置API端点、密钥和模型选项，提供可视化的API密钥管理功能。
- **可扩展性**: 后端采用FastAPI框架，支持高并发处理；前端采用Next.js，提供流畅的用户体验。

## 🛠️ 技术栈

- **前端**: Next.js, React, TypeScript, Tailwind CSS
- **后端**: Python, FastAPI, Uvicorn
- **OCR/VLM**: OpenAI API (可扩展)
- **容器化**: Docker, Docker Compose

## ⚙️ 安装与启动

我们强烈推荐使用 Docker 进行部署，这是最简单、最快捷的方式。

### 使用 Docker (推荐)

#### **前提条件**

- 已安装 [Docker](https://www.docker.com/get-started) 和 [Docker Compose](https://docs.docker.com/compose/install/)。

#### **启动步骤**

1.  **克隆项目**
    ```bash
    git clone https://github.com/zishengwu/vlm-ocr-webui.git
    cd vlm-ocr-webui
    ```

2.  **配置环境变量**

    编辑 `docker-compose.yml` 文件来配置你的API设置：
    ```bash
    # 前端环境变量
    NEXT_PUBLIC_API_ENDPOINT=https://api.openai.com/v1
    NEXT_PUBLIC_API_KEY=sk-your-openai-api-key
    NEXT_PUBLIC_API_NAME=OpenAI-API
    NEXT_PUBLIC_DEFAULT_MODEL=gpt-4o
    NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
    NEXT_PUBLIC_MODEL_OPTIONS=["gpt-4o","gpt-4.1"]
    ```
    
    **环境变量说明：**
    - `NEXT_PUBLIC_API_ENDPOINT`: 大语言模型服务的API端点URL
    - `NEXT_PUBLIC_API_KEY`: 大语言模型服务的API密钥
    - `NEXT_PUBLIC_API_NAME`: 默认API配置的显示名称
    - `NEXT_PUBLIC_DEFAULT_MODEL`: 默认使用的模型
    - `NEXT_PUBLIC_MODEL_OPTIONS`: 可用的模型选项（JSON数组格式）
    - `NEXT_PUBLIC_BACKEND_URL`: 前端与后端通信的API URL

3.  **构建并启动容器**
    ```bash
    docker-compose up -d
    ```

    这将会：
    - 构建后端和前端的Docker镜像
    - 使用默认环境变量启动两个服务
    - 后端服务将在 `http://localhost:8000`
    - 前端服务将在 `http://localhost:3000`

4.  **访问应用**
    - 前端应用: [http://localhost:3000](http://localhost:3000)
    - 后端API文档: [http://localhost:8000/docs](http://localhost:8000/docs)

### 本地开发环境

如果你希望在不使用Docker的情况下本地运行应用：

#### **前提条件**

- [Node.js](https://nodejs.org/) (v20 或更高版本)
- [Python](https://www.python.org/) (v3.9 或更高版本)

#### **后端启动**

1.  进入后端目录并安装依赖：
    ```bash
    cd backend
    pip install -r requirements.txt
    ```

2.  启动后端服务：
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000
    ```

#### **前端启动**

1.  进入前端目录并安装依赖：
    ```bash
    cd frontend
    npm install
    ```

2.  配置环境变量：
    通过复制示例文件在 `frontend` 目录下创建 `.env.local` 文件：
    ```bash
    cp .env.example .env.local
    ```
    然后编辑 `.env.local` 文件来设置你的API配置：
    ```
    NEXT_PUBLIC_API_ENDPOINT=https://api.openai.com/v1
    NEXT_PUBLIC_API_KEY=sk-your-openai-api-key
    NEXT_PUBLIC_API_NAME=OpenAI-API
    NEXT_PUBLIC_DEFAULT_MODEL=gpt-4o
    NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
    NEXT_PUBLIC_MODEL_OPTIONS=["gpt-4o","gpt-4.1"]
    ```

3.  启动前端开发服务器：
    ```bash
    npm run dev
    ```

4.  访问应用: [http://localhost:3000](http://localhost:3000)

    **注意：** `.env.local` 文件仅用于本地开发。Docker部署使用 `docker-compose.yml` 中定义的环境变量。

## 📖 使用方法

1.  **访问应用**: 打开浏览器，访问 [http://localhost:3000](http://localhost:3000)。

2.  **配置API设置**: 
    - 如果你已经配置了环境变量，默认的API配置将自动加载。
    - 点击"添加API配置"按钮来添加额外的API端点。
    - 使用眼睛图标来切换API密钥的可见性以确保安全。
    - 从预定义模型中选择或输入自定义模型名称。

3.  **上传和处理**: 
    - 点击上传区域选择一个PDF文件。
    - 系统将使用所有配置的API自动处理PDF。
    - 实时查看识别进度和结果。

4.  **查看结果**: 
    - 比较不同API配置的结果。
    - 为每一页选择最佳结果。
    - 将选定的结果合并为最终文档。

5.  **导出**: 在结果区域，你可以查看、复制或下载Markdown格式的识别内容。

## 🤝 贡献

我们欢迎任何形式的贡献！如果你有任何建议或问题，请随时提交 Issue 或 Pull Request。

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。
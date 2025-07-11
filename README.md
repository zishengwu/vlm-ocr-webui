# ✨ VLM-OCR: 智能PDF文档识别与处理系统

VLM-OCR 是一个强大的文档处理工具，它利用先进的视觉语言模型（VLM）技术，能够智能地识别和提取PDF文档中的各种元素，包括文字、段落、标题、表格、图表、公式等，并将它们转换为结构化的Markdown格式。

## 🚀 主要特性

- **高精度识别**: 采用多模型并行处理，确保对各类文档内容（包括复杂布局）的高精度识别。
- **多格式支持**: 不仅能提取标准文本，还能精准识别和转换**表格**和**数学公式**为 LaTeX 格式。
- **结构化输出**: 将提取的文档内容自动整理为清晰、易读的Markdown格式，保留原始文档的布局和语义结构。
- **Web界面**: 提供直观易用的Web界面，用户可轻松上传PDF文件、实时查看识别进度和结果。
- **Docker一键部署**: 通过 Docker Compose，可以一键启动整个应用，极大简化了部署和维护流程。
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
    git clone https://github.com/your-username/vlm-ocr.git
    cd vlm-ocr
    ```

2.  **配置API密钥**

    在项目根目录下的 `docker-compose.yml` 文件中，你需要配置你的大模型API密钥。找到 `backend` 服务的 `environment` 部分，添加你的密钥信息，例如：

    ```yaml
    services:
      backend:
        # ... (其他配置)
        environment:
          - PYTHONUNBUFFERED=1
          - MAX_WORKERS=4
          # 在这里添加你的API密钥和终点
          - OPENAI_API_KEY=sk-your-openai-api-key
          - OPENAI_BASE_URL=https://api.openai.com/v1
    ```
    *请注意：你需要根据你所使用的大模型服务商，修改环境变量的名称和值。*

3.  **构建并启动容器**
    ```bash
    docker-compose up --build -d
    ```

4.  **访问应用**
    - 前端应用: [http://localhost:3000](http://localhost:3000)
    - 后端API文档: [http://localhost:8000/docs](http://localhost:8000/docs)

### 本地开发环境

如果你希望在本地进行开发和调试，可以按照以下步骤操作：

#### **前提条件**

- [Node.js](https://nodejs.org/) (v20 或更高版本)
- [Python](https://www.python.org/) (v3.9 或更高版本)

#### **后端启动**

1.  进入后端目录并安装依赖：
    ```bash
    cd backend
    pip install -r requirements.txt
    ```

2.  配置环境变量：
    在 `backend` 目录下创建一个 `.env` 文件，并添加以下内容：
    ```
    OPENAI_API_KEY=sk-your-openai-api-key
    OPENAI_BASE_URL=https://api.openai.com/v1
    ```

3.  启动后端服务：
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```

#### **前端启动**

1.  进入前端目录并安装依赖：
    ```bash
    cd frontend
    npm install
    ```

2.  启动前端开发服务器：
    ```bash
    npm run dev
    ```

3.  访问应用: [http://localhost:3000](http://localhost:3000)

## 📖 使用方法

1.  打开浏览器，访问 [http://localhost:3000](http://localhost:3000)。
2.  点击上传区域，选择一个PDF文件。
3.  系统会自动处理PDF，并实时显示识别进度和结果。
4.  在结果区域，你可以查看、复制或下载Markdown格式的识别内容。

## 🤝 贡献

我们欢迎任何形式的贡献！如果你有任何建议或问题，请随时提交 Issue 或 Pull Request。

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。
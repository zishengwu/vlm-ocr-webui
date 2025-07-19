# ✨ VLM-OCR: Intelligent PDF Document Recognition and Processing System

VLM-OCR is a powerful document processing tool that utilizes advanced Vision Language Model (VLM) technology to intelligently recognize and extract various elements from PDF documents, including text, paragraphs, headings, tables, charts, and formulas, converting them into structured Markdown format.

## 🚀 Key Features

- **High-Precision Recognition**: Employs parallel processing with multiple models to ensure high-precision recognition of diverse document content, including complex layouts.
- **Multi-Format Support**: Not only extracts standard text but also accurately recognizes and converts **tables** and **mathematical formulas** into LaTeX format.
- **Structured Output**: Automatically organizes the extracted document content into clear, readable Markdown format, preserving the original layout and semantic structure.
- **Web Interface**: Provides an intuitive and user-friendly web interface for users to easily upload PDF files and view recognition progress and results in real-time.
- **One-Click Deployment with Docker**: Allows for one-click startup of the entire application using Docker Compose, greatly simplifying deployment and maintenance.
- **Scalability**: The backend is built with FastAPI, supporting high-concurrency processing, while the frontend uses Next.js to provide a smooth user experience.

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Python, FastAPI, Uvicorn
- **OCR/VLM**: OpenAI API (extensible)
- **Containerization**: Docker, Docker Compose

## ⚙️ Installation and Startup

We highly recommend using Docker for deployment, as it is the simplest and quickest method.

### Using Docker (Recommended)

#### **Prerequisites**

- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/) must be installed.

#### **Startup Steps**

1.  **Clone the project**
    ```bash
    git clone https://github.com/your-username/vlm-ocr.git
    cd vlm-ocr
    ```

2.  **Configure API Keys**

    In the `docker-compose.yml` file at the project root, you need to configure your large model API keys. Find the `environment` section of the `backend` service and add your key information, for example:

    ```yaml
    services:
      backend:
        # ... (other configurations)
        environment:
          - PYTHONUNBUFFERED=1
          - MAX_WORKERS=4
          # Add your API key and endpoint here
          - OPENAI_API_KEY=sk-your-openai-api-key
          - OPENAI_BASE_URL=https://api.openai.com/v1
    ```
    *Note: You will need to modify the environment variable names and values according to your large model service provider.*

3.  **Build and start the containers**
    ```bash
    docker-compose up --build -d
    ```

4.  **Access the application**
    - Frontend application: [http://localhost:3000](http://localhost:3000)
    - Backend API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### Local Development Environment

If you prefer to develop and debug locally, follow these steps:

#### **Prerequisites**

- [Node.js](https://nodejs.org/) (v20 or higher)
- [Python](https://www.python.org/) (v3.9 or higher)

#### **Backend Startup**

1.  Navigate to the backend directory and install dependencies:
    ```bash
    cd backend
    pip install -r requirements.txt
    ```

2.  Configure environment variables:
    Create a `.env` file in the `backend` directory and add the following:
    ```
    OPENAI_API_KEY=sk-your-openai-api-key
    OPENAI_BASE_URL=https://api.openai.com/v1
    ```

3.  Start the backend service:
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```

#### **Frontend Startup**

1.  Navigate to the frontend directory and install dependencies:
    ```bash
    cd frontend
    npm install
    ```

2.  Configure environment variables:
    Create a `.env.local` file in the `frontend` directory by copying the example file:
    ```bash
    cp .env.local.example .env.local
    ```
    Then edit the `.env.local` file to set your API configuration:
    ```
    NEXT_PUBLIC_API_URL=http://localhost:8000
    NEXT_PUBLIC_API_ENDPOINT=https://api.openai.com/v1/chat/completions
    NEXT_PUBLIC_API_KEY=sk-your-api-key-here
    NEXT_PUBLIC_DEFAULT_MODEL=gpt-4-vision-preview
    ```

3.  Start the frontend development server:
    ```bash
    npm run dev
    ```

4.  Access the application: [http://localhost:3000](http://localhost:3000)

## 📖 How to Use

1.  Open your browser and go to [http://localhost:3000](http://localhost:3000).
2.  Click the upload area to select a PDF file.
3.  The system will automatically process the PDF and display the recognition progress and results in real-time.
4.  In the results area, you can view, copy, or download the recognized content in Markdown format.

## 🤝 Contributing

We welcome contributions of all forms! If you have any suggestions or issues, please feel free to submit an Issue or Pull Request.

## 📄 License

This project is licensed under the [MIT](LICENSE) License.

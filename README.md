# ✨ VLM-OCR: Intelligent PDF Document Recognition and Processing System

VLM-OCR is a powerful document processing tool that utilizes advanced Vision Language Model (VLM) technology to intelligently recognize and extract various elements from PDF documents, including text, paragraphs, headings, tables, charts, and formulas, converting them into structured Markdown format.

## 🚀 Key Features

- **High-Precision Recognition**: Employs parallel processing with multiple models to ensure high-precision recognition of diverse document content, including complex layouts.
- **Multi-Format Support**: Not only extracts standard text but also accurately recognizes and converts **tables** and **mathematical formulas** into LaTeX format.
- **Structured Output**: Automatically organizes the extracted document content into clear, readable Markdown format, preserving the original layout and semantic structure.
- **Web Interface**: Provides an intuitive and user-friendly web interface for users to easily upload PDF files and view recognition progress and results in real-time.
- **One-Click Deployment with Docker**: Allows for one-click startup of the entire application using Docker Compose, greatly simplifying deployment and maintenance.
- **Flexible Configuration**: Supports environment variable configuration for API endpoints, keys, and model options with visual API key management.
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
    git clone https://github.com/zishengwu/vlm-ocr-webui.git
    cd vlm-ocr-webui
    ```

2.  **Configure Environment Variables**

  
    Then edit the `docker-compose.yml` file to configure your API settings:
    ```bash
    # Frontend Environment Variables
    NEXT_PUBLIC_API_ENDPOINT=https://api.openai.com/v1
    NEXT_PUBLIC_API_KEY=sk-your-openai-api-key
    NEXT_PUBLIC_API_NAME=OpenAI-API
    NEXT_PUBLIC_DEFAULT_MODEL=gpt-4o
    NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
    NEXT_PUBLIC_MODEL_OPTIONS=["gpt-4o","gpt-4.1"]
    ```
    
    **Environment Variables Explanation:**
    - `NEXT_PUBLIC_API_ENDPOINT`: The API endpoint URL for the LLM service
    - `NEXT_PUBLIC_API_KEY`: Your API key for the LLM service
    - `NEXT_PUBLIC_API_NAME`: Display name for the default API configuration
    - `NEXT_PUBLIC_DEFAULT_MODEL`: Default model to use
    - `NEXT_PUBLIC_MODEL_OPTIONS`: Available model options (JSON array format)
    - `NEXT_PUBLIC_BACKEND_URL`: Backend API URL for frontend communication

3.  **Build and start the containers**
    ```bash
    docker-compose up -d
    ```

    This will:
    - Build the backend and frontend Docker images
    - Start both services with default environment variables
    - The backend will be available at `http://localhost:8000`
    - The frontend will be available at `http://localhost:3000`


4.  **Access the application**
    - Frontend application: [http://localhost:3000](http://localhost:3000)
    - Backend API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### Local Development Environment

If you prefer to run the application locally without Docker:

#### **Prerequisites**

- [Node.js](https://nodejs.org/) (v20 or higher)
- [Python](https://www.python.org/) (v3.9 or higher)

#### **Backend Startup**

1.  Navigate to the backend directory and install dependencies:
    ```bash
    cd backend
    pip install -r requirements.txt
    ```

2.  Start the backend service:
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 8000
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
    cp .env.example .env.local
    ```
    Then edit the `.env.local` file to set your API configuration:
    ```
    NEXT_PUBLIC_API_ENDPOINT=https://api.openai.com/v1
    NEXT_PUBLIC_API_KEY=sk-your-openai-api-key
    NEXT_PUBLIC_API_NAME=OpenAI-API
    NEXT_PUBLIC_DEFAULT_MODEL=gpt-4o
    NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
    NEXT_PUBLIC_MODEL_OPTIONS=["gpt-4o","gpt-4.1"]
    ```

3.  Start the frontend development server:
    ```bash
    npm run dev
    ```

4.  Access the application: [http://localhost:3000](http://localhost:3000)

    **Note:** The `.env.local` file is only needed for local development. Docker deployment uses environment variables defined in `docker-compose.yml`.

## 📖 How to Use

1.  **Access the Application**: Open your browser and go to [http://localhost:3000](http://localhost:3000).

2.  **Configure API Settings**: 
    - If you have configured environment variables, the default API configuration will be automatically loaded.
    - Click the "Add API Configuration" button to add additional API endpoints.
    - Use the eye icon to toggle API key visibility for security.
    - Select from predefined models or enter a custom model name.

3.  **Upload and Process**: 
    - Click the upload area to select a PDF file.
    - The system will automatically process the PDF using all configured APIs.
    - View the recognition progress and results in real-time.

4.  **Review Results**: 
    - Compare results from different API configurations.
    - Select the best result for each page.
    - Combine selected results into a final document.

5.  **Export**: In the results area, you can view, copy, or download the recognized content in Markdown format.

## 🤝 Contributing

We welcome contributions of all forms! If you have any suggestions or issues, please feel free to submit an Issue or Pull Request.

## 📄 License

This project is licensed under the [MIT](LICENSE) License.

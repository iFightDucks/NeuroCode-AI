# NeuroCode AI

NeuroCode AI is a collaborative AI-powered development platform where users can create projects, invite collaborators, chat in real time, and leverage AI-powered code generation. Inspired by **Devin AI**, this platform allows seamless project management and execution directly in the browser using **WebContainer**.

## ✨ Features

- **Project Collaboration**: Create projects and add collaborators.
- **Real-time Chat**: Discuss project details with team members.
- **AI Assistance**: Use `@ai` prompts to get AI-generated suggestions and code.
- **Automated Project Structure**: AI generates proper files and file tree.
- **Browser Execution**: Run projects directly in the browser via **WebContainer**.

## 🚀 Tech Stack

- **Frontend**: React, Vite
- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Redis
- **Deployment**: Azure (Static Web Apps & App Services)

## 📂 Project Structure

```
NeuroCode-AI/
│── frontend/    # React application (Vite)
│── backend/     # Node.js + Express.js API
│── README.md    # Project documentation
```

## 🛠 Setup & Installation

### 1️⃣ Clone the Repository
```sh
git clone https://github.com/gourabsen21s/NeuroCode-AI.git
cd NeuroCode-AI
```

### 2️⃣ Backend Setup
```sh
cd backend
npm install
node server.js
```
- The backend will be running on **localhost:5000**.

### 3️⃣ Frontend Setup
```sh
cd frontend
npm install
npm run dev
```
- The frontend will be running on **localhost:5173**.

## 🔐 Environment Variables
Create a `.env` file in the **backend** folder and add:
```sh
MONGO_URI=your_mongodb_connection_string
REDIS_URI=your_redis_connection_string
JWT_SECRET=your_jwt_secret
AI_API_KEY=your_ai_api_key
```
For the **frontend**, create a `.env` file inside **frontend**:
```sh
VITE_BACKEND_URL=http://localhost:5000
```

## 🚀 Deployment
NeuroCode AI is deployed on **Azure** using:
- **Azure Static Web Apps** (Frontend)
- **Azure App Service** (Backend)

## 🤝 Contribution Guidelines
1. Fork the repository
2. Create a new branch: `git checkout -b feature-branch`
3. Commit your changes: `git commit -m "Added new feature"`
4. Push to the branch: `git push origin feature-branch`
5. Create a Pull Request

## 📄 License
This project is licensed under the **MIT License**.

---
🚀 **Happy Coding!** ✨

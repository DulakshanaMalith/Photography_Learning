# Photography Learning Platform

A modern, full-stack web application for learning, sharing, and connecting through photography. Built with React (frontend) and Spring Boot (backend), featuring a beautiful UI, real-time chat, notifications, and more.

---

## 🚀 Features

- **User Authentication** (JWT-based)
- **Feed**: Share, like, and comment on posts
- **Photographers Directory**: Discover and connect with photographers
- **Learning Plans**: Explore curated photography learning paths
- **Notifications**: Real-time, attractive notifications for likes, comments, and messages
- **Profile Management**: Edit your profile, view stats
- **Real-time Chat**: WebSocket-powered messaging
- **Responsive Design**: Works beautifully on desktop and mobile

---

## 🛠️ Tech Stack

- **Frontend**: React, Material-UI, Axios
- **Backend**: Spring Boot, Spring Security (JWT), MongoDB
- **Real-time**: WebSocket (STOMP)
- **Other**: Expressive UI/UX, Glassmorphism, Animations

---

## ⚡ Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- Java 17 or 21
- Maven
- MongoDB (local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/photography-learning-platform.git
cd photography-learning-platform
```

### 2. Backend Setup
```bash
cd backend # or the backend directory if separated
# Configure MongoDB URI and JWT secret in src/main/resources/application.properties
mvn spring-boot:run
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

- The frontend runs on [http://localhost:3000](http://localhost:3000)
- The backend runs on [http://localhost:8080](http://localhost:8080)

---

## 🔑 Configuration

- **MongoDB**: Set your connection string in `application.properties`:
  ```
  spring.data.mongodb.uri=mongodb://localhost:27017/photography
  ```
- **JWT Secret**: Set a strong secret in `application.properties`:
  ```
  jwt.secret=your_jwt_secret
  ```
- **Frontend API URLs**: Update API endpoints in `frontend/src/context/AuthContext.js` and other API files if needed.

---

## 📸 Screenshots

> Add screenshots of the Feed, Profile, Notifications, and Photographers pages here for a visual overview.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgements
- [Material-UI](https://mui.com/)
- [Spring Boot](https://spring.io/projects/spring-boot)
- [MongoDB](https://www.mongodb.com/)
- [Undraw Illustrations](https://undraw.co/)

---

**Happy learning and sharing!** 
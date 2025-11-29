# TaskFlow - Real-Time Task Management Application

A full-stack, real-time task management application built with React, Node.js, MongoDB, and Socket.io. Features include drag-and-drop task organization, real-time updates, project management, and team collaboration.

## 🚀 Features

- **Real-time Updates**: Changes sync instantly across all connected users via Socket.io
- **Drag & Drop**: Intuitive task management with react-beautiful-dnd
- **Project Management**: Create and manage multiple projects
- **Task Organization**: Kanban board with Todo, In Progress, Review, and Done columns
- **User Authentication**: Secure JWT-based authentication
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Team Collaboration**: Add members to projects and assign tasks

## 🛠️ Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose ODM
- Socket.io for real-time communication
- JWT for authentication
- bcrypt for password hashing
- Express Validator for input validation

### Frontend
- React 19
- React Router DOM for navigation
- Socket.io Client
- React Beautiful DnD for drag-and-drop
- React Toastify for notifications
- Axios for API calls

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd taskflow-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

4. Start the backend server:
```bash
npm start
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd taskflow-app/client
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Create a `.env` file in the client directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

4. Start the React development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## 🎮 Usage

### Getting Started

1. **Register**: Create a new account on the registration page
2. **Create a Project**: Navigate to Projects and create your first project
3. **Add Tasks**: Go to the Tasks board and start adding tasks to your project
4. **Drag & Drop**: Organize tasks by dragging them between columns
5. **Real-time Sync**: Open the app in multiple browsers to see real-time updates

### Demo Account
```
Email: demo@taskflow.com
Password: demo123
```

## 📁 Project Structure

```
taskflow-app/
├── server.js              # Express server setup
├── package.json           # Backend dependencies
├── models/                # MongoDB models
│   ├── User.js
│   ├── Task.js
│   └── Project.js
├── routes/                # API routes
│   ├── auth.js
│   ├── tasks.js
│   ├── projects.js
│   └── users.js
├── middleware/            # Custom middleware
│   ├── auth.js
│   └── socketAuth.js
└── client/                # React frontend
    ├── src/
    │   ├── pages/         # Page components
    │   ├── components/    # Reusable components
    │   ├── services/      # API services
    │   ├── styles/        # CSS files
    │   └── App.js         # Main App component
    └── package.json       # Frontend dependencies
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update-profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Projects
- `GET /api/projects` - Get all user's projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add member to project

### Tasks
- `GET /api/tasks` - Get tasks (with filters)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comment` - Add comment to task
- `PUT /api/tasks/:id/archive` - Archive/unarchive task

## 🔄 Real-time Events

### Socket.io Events
- `task-create` - New task created
- `task-update` - Task updated
- `task-delete` - Task deleted
- `join-project` - Join project room
- `leave-project` - Leave project room

## 🚀 Deployment

### Backend Deployment (Heroku)

1. Create a Heroku app
2. Set environment variables
3. Connect MongoDB Atlas
4. Deploy using Git

### Frontend Deployment (Vercel/Netlify)

1. Build the React app: `npm run build`
2. Deploy the build folder
3. Set environment variables

## 🐛 Known Issues

- React Beautiful DnD shows deprecation warning with React 19 (use --legacy-peer-deps)
- Ensure MongoDB is running before starting the backend

## 🔮 Future Enhancements

- [ ] File attachments for tasks
- [ ] Email notifications
- [ ] Task comments with mentions
- [ ] Advanced filtering and search
- [ ] Time tracking
- [ ] Calendar view
- [ ] Mobile app
- [ ] Dark mode
- [ ] Export to CSV/PDF
- [ ] Recurring tasks

## 📄 License

MIT License

## 👨‍💻 Author

**Andrew Mene-Otubu**
- Full Stack Developer
- MSc Computer Science with AI Student (University of York)
- GitHub: [silvertiger1]

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📞 Support

For support, email andrewmeneotubu@gmail.com

---

Built with ❤️ for the loveholidays L2 Software Engineer position

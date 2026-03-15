# Smart Space - Backend Server

Node.js Express server with SQLite for the Smart Space Classroom Management System.

## 🚀 API Endpoints

### Authentication
- `POST /api/login`: User login
- `POST /api/register`: User registration
- `POST /api/logout`: Logout and revoke tokens

### Analytics
- `GET /api/dashboard/summary`: Consolidated dashboard data
- `GET /api/analytics/attendance/:studentId`: Attendance metrics
- `GET /api/analytics/performance/detailed/:studentId`: Detailed performance data

### Calendar & Events
- `GET /api/calendar`: Fetch all events
- `PUT /api/calendar/events/:id/reschedule`: Update event date

### Notifications
- `GET /api/notifications`: Get user notifications
- `PUT /api/notifications/:id/read`: Mark as read

## 🛠 Setup & Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Create a `.env` file:
   ```env
   PORT=5000
   JWT_SECRET=your_jwt_secret
   DATABASE_PATH=./classroom.sqlite
   ```

3. **Database Initialization**:
   The server automatically initializes the SQLite database on startup.

4. **Run Server**:
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## 📦 Deployment
The server can be deployed to Render, Railway, or any VPS. Ensure the `.env` variables are set correctly in your production dashboard.

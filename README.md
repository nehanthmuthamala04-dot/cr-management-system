# CR Management System

Modern class CR management web app with a React frontend, FastAPI backend, MongoDB Atlas storage, Google OAuth login, JWT-protected APIs, attendance tracking, rankings, profile stats, and role-based announcements.

## Project Structure

```text
CR-Management/
  backend/
    app/
      api/routes/
      core/
      db/
      schemas/
      services/
    requirements.txt
    .env.example
  frontend/
    src/
      api/
      components/
      contexts/
      pages/
      styles/
    package.json
    .env.example
```

## Backend Setup

cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Update `backend/.env` with your MongoDB Atlas URI, Google OAuth client ID, JWT secret, and frontend origin.

## Frontend Setup

```bash
cd frontend
npm install
copy .env
npm run dev
```

Update `frontend/.env` with the API URL and the same Google OAuth client ID.

## Main API Routes

Authentication:
- `POST /api/auth/google`
- `GET /api/auth/verify`
- `GET /api/auth/me`

Attendance:
- `POST /api/attendance/login`
- `POST /api/attendance/logout`
- `GET /api/attendance/me`
- `GET /api/attendance/ranking`
- `GET /api/attendance/daily`
- `POST /api/attendance/mark`
- `GET /api/attendance/leaderboard`

Students:
- `GET /api/students`
- `POST /api/students`
- `DELETE /api/students/{student_id}`
- `GET /api/students/count`

Students are managed by name and roll number. Example:

```json
{ "name": "Student Name", "rollNumber": "22DS001" }
```

Announcements:
- `GET /api/announcements`
- `POST /api/announcements`
- `PUT /api/announcements/{announcement_id}`
- `DELETE /api/announcements/{announcement_id}`

Profile and Group:
- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/groups/class`

Interactive API docs are available at `http://localhost:8000/docs` when the backend is running.

## Roles

New Google users are created with the `student` role. To allow announcement management, update a user document in MongoDB Atlas and set:

```json
{ "role": "cr" }
```

or:

```json
{ "role": "admin" }
```

## Deployment Notes

The production build serves the React frontend and FastAPI backend from one
service. A Render Blueprint is included in `render.yaml`.

- Create a Render Blueprint from this GitHub repository.
- Set `MONGODB_URI`, `GOOGLE_CLIENT_ID`, and `VITE_GOOGLE_CLIENT_ID` when prompted.
- Add the deployed Render URL to the authorized JavaScript origins in Google Cloud Console.
- Keep `JWT_SECRET` private and unique per environment.

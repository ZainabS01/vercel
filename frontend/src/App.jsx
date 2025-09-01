import { Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Forgot from './pages/Forgot';
import Reset from './pages/Reset';
import StudentDashboard from './pages/StudentDashboard';
import AdminLayout from './pages/AdminLayout';
import AdminApprovals from './pages/AdminApprovals';
import AdminAttendance from './pages/AdminAttendance';
import AdminTasks from './pages/AdminTasks';

function App() {
  return (
    <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/reset" element={<Reset />} />
      <Route path="/student" element={<StudentDashboard />} />

      {/* Admin nested routes with sidebar layout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="approvals" replace />} />
        <Route path="approvals" element={<AdminApprovals />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="tasks" element={<AdminTasks />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
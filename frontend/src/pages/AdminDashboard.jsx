import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [pending, setPending] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [task, setTask] = useState({ title: '', description: '', link: '' });
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all users for approval
    fetch('/api/auth/all', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setPending(data.filter((u) => !u.approved)))
      .catch(() => setPending([]));
    // Fetch all attendance
    fetch('/api/attendance/all', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setAttendance)
      .catch(() => setAttendance([]));
  }, [token]);

  const approve = async (id) => {
    await fetch(`/api/auth/approve/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setPending((prev) => prev.filter((u) => u._id !== id));
  };

  const handleTaskChange = (e) => {
    setTask({ ...task, [e.target.name]: e.target.value });
  };

  const createTask = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('/api/task/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(task),
      });
      const data = await res.json();
      setMessage(data.message || 'Task created');
      setTask({ title: '', description: '', link: '' });
    } catch {
      setMessage('Failed to create task');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <button onClick={logout} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Logout</button>
        </div>
        <h3 className="text-xl font-semibold mb-2">Pending Student Approvals</h3>
        <ul className="mb-6 space-y-2">
          {pending.map((u) => (
            <li key={u._id} className="flex items-center justify-between border p-2 rounded">
              <span>{u.name} ({u.email})</span>
              <button onClick={() => approve(u._id)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Approve</button>
            </li>
          ))}
        </ul>
        <h3 className="text-xl font-semibold mb-2">Attendance Records</h3>
        <ul className="mb-6 space-y-2 max-h-48 overflow-y-auto">
          {attendance.map((a) => (
            <li key={a._id} className="border p-2 rounded">
              {a.user?.name} ({a.user?.email}) - {new Date(a.date).toLocaleDateString()} - {a.status}
            </li>
          ))}
        </ul>
        <h3 className="text-xl font-semibold mb-2">Create Task/Link</h3>
        <form onSubmit={createTask} className="mb-4 space-y-2">
          <input name="title" type="text" placeholder="Title" value={task.title} onChange={handleTaskChange} required className="w-full px-3 py-2 border rounded" />
          <input name="description" type="text" placeholder="Description" value={task.description} onChange={handleTaskChange} className="w-full px-3 py-2 border rounded" />
          <input name="link" type="url" placeholder="Link (optional)" value={task.link} onChange={handleTaskChange} className="w-full px-3 py-2 border rounded" />
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Create Task</button>
        </form>
        {message && <p className="text-blue-600">{message}</p>}
      </div>
    </div>
  );
}

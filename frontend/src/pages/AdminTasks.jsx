import { useEffect, useState } from 'react';

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', link: '', attendanceStart: '', attendanceEnd: '' });
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/task/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load tasks');
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const createTask = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('http://localhost:5000/api/task/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          attendanceStart: form.attendanceStart ? new Date(form.attendanceStart).toISOString() : undefined,
          attendanceEnd: form.attendanceEnd ? new Date(form.attendanceEnd).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create task');
      setMessage('Task created');
      setForm({ title: '', description: '', link: '', attendanceStart: '', attendanceEnd: '' });
      fetchTasks();
    } catch (e) {
      setMessage(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Create Task</h1>
        <form onSubmit={createTask} className="grid gap-3 bg-white p-4 rounded shadow max-w-xl">
          <input name="title" value={form.title} onChange={handleChange} placeholder="Title" className="px-3 py-2 border rounded" required />
          <input name="description" value={form.description} onChange={handleChange} placeholder="Description" className="px-3 py-2 border rounded" />
          <input name="link" value={form.link} onChange={handleChange} placeholder="Link (optional)" className="px-3 py-2 border rounded" />
          <div className="grid md:grid-cols-2 gap-3">
            <label className="text-sm text-gray-700">
              <span className="block mb-1 font-medium">Attendance Start (optional)</span>
              <input type="datetime-local" name="attendanceStart" value={form.attendanceStart} onChange={handleChange} className="w-full px-3 py-2 border rounded" />
            </label>
            <label className="text-sm text-gray-700">
              <span className="block mb-1 font-medium">Attendance End (optional)</span>
              <input type="datetime-local" name="attendanceEnd" value={form.attendanceEnd} onChange={handleChange} className="w-full px-3 py-2 border rounded" />
            </label>
          </div>
          <button type="submit" className="bg-green-600 text-white py-2 rounded hover:bg-green-700">Create</button>
          {message && <p className="text-blue-600">{message}</p>}
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">All Tasks</h2>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {tasks.map(t => (
            <div key={t._id} className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">{t.title}</h3>
              {t.description && <p className="text-sm text-gray-700 mt-1">{t.description}</p>}
              {t.link && <a className="text-blue-600 text-sm mt-2 inline-block" href={t.link} target="_blank" rel="noreferrer">Open link</a>}
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                {t.attendanceStart && <div>Start: {new Date(t.attendanceStart).toLocaleString()}</div>}
                {t.attendanceEnd && <div>End: {new Date(t.attendanceEnd).toLocaleString()}</div>}
              </div>
            </div>
          ))}
          {!loading && tasks.length === 0 && <p>No tasks yet.</p>}
        </div>
      </div>
    </div>
  );
}

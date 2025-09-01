import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const [attendanceMsg, setAttendanceMsg] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myAttendance, setMyAttendance] = useState([]); // user attendance records
  const [busyTask, setBusyTask] = useState({}); // { [taskId]: boolean }
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  });
  const [activeTab, setActiveTab] = useState('Home');
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [tasksRes, attRes] = await Promise.all([
          fetch('http://localhost:5000/api/task/all', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/attendance/me', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [tasksData, attData] = await Promise.all([tasksRes.json(), attRes.json()]);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setMyAttendance(Array.isArray(attData) ? attData : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  // Fetch the freshest profile so semester and other fields are accurate
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) return;
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return; // ignore if unauthorized
        const data = await res.json();
        if (data && data._id) {
          const safe = { id: data._id, name: data.name, email: data.email, role: data.role, semester: data.semester, phone: data.phone };
          setProfile(safe);
          localStorage.setItem('user', JSON.stringify(safe));
        }
      } catch {}
    };
    fetchMe();
  }, [token]);

  const attendedTaskIds = useMemo(() => {
    // r.task can be an id string or a populated object; normalize to string id
    return new Set(
      myAttendance
        .filter(r => r.task)
        .map(r => {
          const t = r.task;
          const id = typeof t === 'object' && t !== null ? t._id : t;
          return String(id);
        })
    );
  }, [myAttendance]);

  const taskTitleById = useMemo(() => {
    const map = new Map();
    tasks.forEach(t => map.set(String(t._id), t.title));
    return map;
  }, [tasks]);

  const recentAttendance = useMemo(() => {
    return [...myAttendance]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 10);
  }, [myAttendance]);

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6);
  }, [tasks]);

  const markAttendanceForTask = async (taskId) => {
    setAttendanceMsg('');
    setBusyTask(prev => ({ ...prev, [taskId]: true }));
    try {
      const res = await fetch(`http://localhost:5000/api/attendance/mark-by-task/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to mark attendance');
      setAttendanceMsg(data.message || 'Attendance marked');
      // optimistic update to show immediately
      setMyAttendance(prev => ([...prev, { task: taskId, createdAt: new Date().toISOString() }]));
      // refresh my attendance set
      const me = await fetch('http://localhost:5000/api/attendance/me', { headers: { Authorization: `Bearer ${token}` } });
      const meData = await me.json();
      setMyAttendance(Array.isArray(meData) ? meData : []);
    } catch (e) {
      setAttendanceMsg(e.message || 'Failed to mark attendance');
    } finally {
      setBusyTask(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-black via-gray-900 to-brand-blue p-4 md:p-6">
      <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur rounded-xl shadow-card">
        {/* Navbar */}
        <div className="grid grid-cols-3 items-center px-4 md:px-6 py-3 border-b">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold">
              {profile?.name ? profile.name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() : 'ST'}
            </div>
            <div className="font-semibold text-brand-black">Student Portal</div>
          </div>
          <div className="flex items-center justify-center gap-1">
            {['Home','Tasks','Attendance','Profile'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab===tab ? 'bg-brand-blue text-white' : 'text-brand-black hover:bg-gray-100'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-end">
            <button onClick={logout} className="px-3 py-1.5 rounded-md text-sm bg-brand-red text-white hover:bg-red-700">Logout</button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {attendanceMsg && <p className="mb-4 text-blue-600 text-sm">{attendanceMsg}</p>}

          {activeTab === 'Home' && (
            <div className="grid gap-4">
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold">
                    {profile?.name ? profile.name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() : 'ST'}
                  </div>
                  <div>
                    <div className="font-semibold text-brand-black text-lg">{profile?.name || 'Student'}</div>
                    <div className="text-sm text-gray-600">{profile?.email || ''}</div>
                    <div className="text-sm"><span className="text-gray-500">Semester:</span> {profile?.semester ?? '-'}</div>
                    {profile?.phone && (
                      <div className="text-sm text-gray-600">{profile.phone}</div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold mb-3">Recent Tasks</h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {recentTasks.map(task => (
                    <li key={task._id} className="border p-3 rounded-lg bg-white shadow-card">
                      <div className="font-semibold">{task.title}</div>
                      {task.description && <div className="text-sm text-gray-700 mt-1 line-clamp-2">{task.description}</div>}
                      <div className="text-xs text-gray-500 mt-1">{new Date(task.createdAt).toLocaleString()}</div>
                    </li>
                  ))}
                  {recentTasks.length === 0 && (
                    <li className="text-sm text-gray-500">No tasks yet</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'Tasks' && (
            <div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">Tasks</h3>
              {loading ? <p>Loading...</p> : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {tasks.map((task) => {
                    const start = task.attendanceStart ? new Date(task.attendanceStart) : null;
                    const end = task.attendanceEnd ? new Date(task.attendanceEnd) : null;
                    const now = new Date();
                    const inWindow = (!start || now >= start) && (!end || now <= end);
                    const alreadyMarked = attendedTaskIds.has(String(task._id));
                    return (
                      <li key={task._id} className="border p-3 rounded-lg flex flex-col gap-1 bg-white shadow-card">
                        <span className="font-semibold">{task.title}</span>
                        {task.description && <span className="text-sm text-gray-700">{task.description}</span>}
                        {task.link && (
                          alreadyMarked ? (
                            <a href={task.link} className="text-blue-600 underline text-sm" target="_blank" rel="noopener noreferrer">Open Link</a>
                          ) : (
                            <span className="text-gray-400 text-sm">Mark attendance to unlock link</span>
                          )
                        )}
                        <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                          {start && <div>Start: {start.toLocaleString()}</div>}
                          {end && <div>End: {end.toLocaleString()}</div>}
                        </div>
                        <div className="mt-2">
                          <button
                            disabled={!inWindow || alreadyMarked || !!busyTask[task._id]}
                            onClick={() => markAttendanceForTask(task._id)}
                            className={`px-3 py-1.5 rounded-md text-white text-sm transition-colors ${(!inWindow || alreadyMarked) ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-blue hover:bg-blue-700'}`}
                          >
                            {alreadyMarked ? 'Attendance Marked' : busyTask[task._id] ? 'Marking...' : 'Mark Attendance'}
                          </button>
                          {!inWindow && (
                            <span className="ml-2 text-xs text-gray-500">{start && now < start ? 'Not started' : 'Window ended'}</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'Attendance' && (
            <div>
              <h3 className="text-lg md:text-xl font-semibold mb-3">My Attendance</h3>
              <ul className="divide-y divide-gray-100 bg-white rounded-lg border">
                {recentAttendance.length > 0 ? recentAttendance.map((r, idx) => {
                  const t = r.task;
                  const id = typeof t === 'object' && t !== null ? t._id : t;
                  const title = (typeof t === 'object' && t?.title) ? t.title : (taskTitleById.get(String(id)) || 'Task');
                  const ts = r.createdAt ? new Date(r.createdAt) : null;
                  return (
                    <li key={r._id || idx} className="p-3">
                      <div className="text-sm font-medium text-brand-black truncate">{title}</div>
                      <div className="text-xs text-gray-600">{ts ? ts.toLocaleString() : ''}</div>
                    </li>
                  );
                }) : (
                  <li className="p-3 text-sm text-gray-500">No attendance yet</li>
                )}
              </ul>
            </div>
          )}

          {activeTab === 'Profile' && (
            <div className="max-w-xl">
              {profileMsg && <p className={`mb-3 text-sm ${profileMsg.startsWith('Profile updated') ? 'text-green-600' : 'text-red-600'}`}>{profileMsg}</p>}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setProfileMsg('');
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  const name = formData.get('name');
                  const email = formData.get('email');
                  const semester = formData.get('semester');
                  const currentPassword = formData.get('currentPassword');
                  const newPassword = formData.get('newPassword');
                  const confirmPassword = formData.get('confirmPassword');
                  const phone = formData.get('phone');
                  if (newPassword && newPassword !== confirmPassword) {
                    setProfileMsg('New passwords do not match');
                    return;
                  }
                  if (newPassword && !/[!@#$%^&*()]/.test(newPassword)) {
                    setProfileMsg('New password must include at least one special character: ! @ # $ % ^ & * ( )');
                    return;
                  }
                  try {
                    const res = await fetch('http://localhost:5000/api/auth/me', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({
                        name,
                        email,
                        semester: semester ? Number(semester) : undefined,
                        currentPassword: currentPassword || undefined,
                        newPassword: newPassword || undefined,
                        phone: phone || undefined,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setProfileMsg(data.message || 'Failed to update profile');
                      return;
                    }
                    setProfileMsg('Profile updated successfully');
                    if (data.user) {
                      localStorage.setItem('user', JSON.stringify(data.user));
                      setProfile(data.user);
                    }
                    form.reset();
                  } catch (err) {
                    setProfileMsg(err.message || 'Failed to update profile');
                  }
                }}
                className="bg-white rounded-lg border p-4 space-y-3"
              >
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name</label>
                  <input name="name" defaultValue={profile?.name || ''} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email</label>
                  <input type="email" name="email" defaultValue={profile?.email || ''} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone (03XXXXXXXXX)</label>
                  <input
                    type="tel"
                    name="phone"
                    pattern="03[0-9]{9}"
                    title="Must start with 03 and be 11 digits (numbers only)"
                    placeholder="e.g., 03xxxxxxxxx"
                    defaultValue={profile?.phone || ''}
                    onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 11); }}
                    className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                  <p className="mt-1 text-xs text-gray-500">Must start with 03 and be 11 digits.</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Semester</label>
                  <input type="number" min="1" max="8" name="semester" defaultValue={profile?.semester ?? ''} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
                <hr />
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Current Password</label>
                    <input type="password" name="currentPassword" placeholder="••••••••" className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">New Password</label>
                    <input type="password" name="newPassword" placeholder="••••••••" pattern="^(?=.*[!@#$%^&*()]).{6,}$" className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    <p className="mt-1 text-xs text-gray-500">Must be 6+ chars and include at least one of ! @ # $ % ^ & * ( )</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Confirm New Password</label>
                    <input type="password" name="confirmPassword" placeholder="••••••••" className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                  </div>
                </div>
                <div className="pt-2">
                  <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-blue-700">Save Changes</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';

export default function AdminAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const token = localStorage.getItem('token');

  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/attendance/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load attendance');
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAttendance(); }, []);

  // Group records by user
  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of records) {
      const u = r.user; // can be string id or populated object
      const id = typeof u === 'object' && u !== null ? u._id : String(u);
      if (!id) continue;
      const name = typeof u === 'object' && u?.name ? u.name : (r.userName || 'Unknown');
      const email = typeof u === 'object' && u?.email ? u.email : (r.userEmail || '');
      if (!map.has(id)) map.set(id, { id, name, email, items: [] });
      map.get(id).items.push(r);
    }
    // Convert to array and sort by name
    return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return grouped;
    return grouped.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  }, [grouped, search]);

  const selectedGroup = useMemo(() => filtered.find(s => s.id === selectedUserId) || null, [filtered, selectedUserId]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <button onClick={fetchAttendance} className="px-3 py-1.5 rounded bg-brand-blue text-white hover:bg-blue-700">Refresh</button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Left: student cards */}
          <div className="md:col-span-1">
            <div className="mb-3">
              <input
                placeholder="Search student by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="grid gap-3">
              {filtered.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedUserId(s.id)}
                  className={`text-left border rounded-lg p-3 bg-white shadow-card hover:shadow-md transition ${selectedUserId===s.id ? 'ring-2 ring-brand-blue' : ''}`}
                >
                  <div className="font-semibold text-brand-black">{s.name || 'Unknown Student'}</div>
                  {s.email && <div className="text-xs text-gray-600">{s.email}</div>}
                  <div className="text-xs mt-1"><span className="text-gray-500">Classes attended:</span> {s.items.length}</div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="text-sm text-gray-500">No students found</div>
              )}
            </div>
          </div>

          {/* Right: selected student's attendance detail */}
          <div className="md:col-span-2">
            {!selectedGroup ? (
              <div className="text-sm text-gray-600">Select a student to view detailed attendance</div>
            ) : (
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-lg font-semibold">{selectedGroup.name || 'Student'}</div>
                    {selectedGroup.email && <div className="text-xs text-gray-600">{selectedGroup.email}</div>}
                  </div>
                  <div className="text-sm"><span className="text-gray-500">Total classes:</span> {selectedGroup.items.length}</div>
                </div>
                <ul className="divide-y">
                  {selectedGroup.items
                    .slice()
                    .sort((a,b)=> new Date(b.createdAt||0) - new Date(a.createdAt||0))
                    .map((r, idx) => {
                      const t = r.task;
                      const title = (typeof t === 'object' && t?.title) ? t.title : (r.taskTitle || 'Task');
                      const ts = r.createdAt ? new Date(r.createdAt).toLocaleString() : '';
                      return (
                        <li key={r._id || idx} className="py-2">
                          <div className="text-sm font-medium text-brand-black">{title}</div>
                          <div className="text-xs text-gray-600">{ts}</div>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';

export default function AdminApprovals() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState({}); // { [userId]: boolean }
  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onFieldChange = (id, field, value) => {
    setUsers(prev => prev.map(u => u._id === id ? { ...u, [field]: value } : u));
  };

  const saveUser = async (id) => {
    try {
      const user = users.find(u => u._id === id);
      const res = await fetch(`http://localhost:5000/api/auth/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: user.name, email: user.email, approved: user.approved })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update user');
      setUsers(prev => prev.map(u => u._id === id ? data.user : u));
    } catch (e) {
      alert(e.message);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/auth/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to delete user');
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const approve = async (id) => {
    try {
      setBusy(prev => ({ ...prev, [id]: true }));
      const res = await fetch(`http://localhost:5000/api/auth/approve/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Approval failed');
      }
      setUsers((prev) => prev.map(u => u._id === id ? { ...u, approved: true } : u));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(prev => ({ ...prev, [id]: false }));
    }
  };

  const reject = async (id) => {
    try {
      setBusy(prev => ({ ...prev, [id]: true }));
      const res = await fetch(`http://localhost:5000/api/auth/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ approved: false })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reject failed');
      setUsers(prev => prev.map(u => u._id === id ? data.user : u));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(prev => ({ ...prev, [id]: false }));
    }
  };

  const pending = users.filter(u => !u.approved);
  const onChangeRole = async (id, newRole) => {
    // optimistic update
    setUsers(prev => prev.map(u => u._id === id ? { ...u, role: newRole } : u));
    await saveRole(id, newRole);
  };

  const saveRole = async (id, role) => {
    try {
      setBusy(prev => ({ ...prev, [id]: true }));
      const res = await fetch(`http://localhost:5000/api/auth/role/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update role');
      // sync returned user
      setUsers(prev => prev.map(u => u._id === id ? data.user : u));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Users & Approvals</h1>
        <p className="text-xs md:text-sm text-gray-500">Manage user access, roles, and approvals</p>
      </div>
      {loading && <p className="text-gray-600">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && (
        <div className="flex flex-wrap gap-2 md:gap-3 text-xs md:text-sm">
          <span className="inline-flex items-center gap-2 bg-white border rounded px-2.5 md:px-3 py-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span>Total: {users.length}</span>
          <span className="inline-flex items-center gap-2 bg-white border rounded px-2.5 md:px-3 py-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span>Pending: {pending.length}</span>
          <span className="inline-flex items-center gap-2 bg-white border rounded px-2.5 md:px-3 py-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>Approved: {users.filter(u=>u.approved).length}</span>
        </div>
      )}

      {/* Mobile cards */}
      {!loading && users.length > 0 && (
        <div className="space-y-3 md:hidden">
          {users.map((u) => (
            <div key={u._id} className="bg-white rounded-lg border shadow-sm p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm">{u.name || '-'}</div>
                  <div className="text-xs text-gray-600 break-all">{u.email || '-'}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border h-fit ${u.approved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{u.approved ? 'Approved' : 'Pending'}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="text-[11px] text-gray-500">Role</div>
                <div>
                  <select
                    value={u.role || 'student'}
                    onChange={(e) => onChangeRole(u._id, e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                    disabled={!!busy[u._id]}
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="text-[11px] text-gray-500">Registered</div>
                <div className="text-xs text-gray-700">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input className="border rounded px-2 py-1 text-sm" value={u.name || ''} onChange={(e)=>onFieldChange(u._id,'name',e.target.value)} placeholder="Name" />
                <input className="border rounded px-2 py-1 text-sm" value={u.email || ''} onChange={(e)=>onFieldChange(u._id,'email',e.target.value)} placeholder="Email" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {!u.approved && (
                  <button disabled={!!busy[u._id]} onClick={() => approve(u._id)} className="bg-blue-600 disabled:opacity-50 text-white px-3 py-1 rounded text-sm">Approve</button>
                )}
                {u.approved && (
                  <button disabled={!!busy[u._id]} onClick={() => reject(u._id)} className="bg-yellow-600 disabled:opacity-50 text-white px-3 py-1 rounded text-sm">Reject</button>
                )}
                <button disabled={!!busy[u._id]} onClick={() => saveUser(u._id)} className="bg-green-600 disabled:opacity-50 text-white px-3 py-1 rounded text-sm">Save</button>
                <button disabled={!!busy[u._id]} onClick={() => deleteUser(u._id)} className="bg-red-600 disabled:opacity-50 text-white px-3 py-1 rounded text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop table */}
      {!loading && users.length > 0 && (
        <div className="hidden md:block overflow-x-auto bg-white rounded-lg border shadow-sm">
          <table className="min-w-full text-left">
            <thead className="sticky top-0 z-10">
              <tr className="border-b bg-gray-50/90 backdrop-blur">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3 hidden lg:table-cell">Registered</th>
                <th className="p-3 hidden xl:table-cell">User ID</th>
                <th className="p-3">Approved</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u, idx) => (
                <tr key={u._id} className={"hover:bg-gray-50 " + (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30')}>
                  <td className="p-3 font-medium">
                    <input
                      className="border rounded px-2 py-1 w-full max-w-[12rem]"
                      value={u.name || ''}
                      onChange={(e) => onFieldChange(u._id, 'name', e.target.value)}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      className="border rounded px-2 py-1 w-full max-w-[16rem]"
                      value={u.email || ''}
                      onChange={(e) => onFieldChange(u._id, 'email', e.target.value)}
                    />
                  </td>
                  <td className="p-3">
                    <select
                      value={u.role || 'student'}
                      onChange={(e) => onChangeRole(u._id, e.target.value)}
                      className="border rounded px-2 py-1"
                      disabled={!!busy[u._id]}
                    >
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-3 hidden lg:table-cell">{u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</td>
                  <td className="p-3 text-xs text-gray-600 hidden xl:table-cell">{u._id}</td>
                  <td className="p-3">
                    <label className="inline-flex items-center space-x-2">
                      <input type="checkbox" checked={!!u.approved} onChange={(e) => onFieldChange(u._id, 'approved', e.target.checked)} />
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${u.approved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{u.approved ? 'Approved' : 'Pending'}</span>
                    </label>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {!u.approved && (
                        <button disabled={!!busy[u._id]} onClick={() => approve(u._id)} className="bg-blue-600 disabled:opacity-50 text-white px-3 py-1 rounded hover:bg-blue-700">Approve</button>
                      )}
                      {u.approved && (
                        <button disabled={!!busy[u._id]} onClick={() => reject(u._id)} className="bg-yellow-600 disabled:opacity-50 text-white px-3 py-1 rounded hover:bg-yellow-700">Reject</button>
                      )}
                      <button disabled={!!busy[u._id]} onClick={() => saveUser(u._id)} className="bg-green-600 disabled:opacity-50 text-white px-3 py-1 rounded hover:bg-green-700">Save</button>
                      <button disabled={!!busy[u._id]} onClick={() => deleteUser(u._id)} className="bg-red-600 disabled:opacity-50 text-white px-3 py-1 rounded hover:bg-red-700">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

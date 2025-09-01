import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Reset() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const token = new URLSearchParams(location.search).get('token') || '';

  useEffect(() => {
    if (!token) setMessage('Invalid reset link.');
  }, [token]);

  const validPw = (pw) => /[!@#$%^&*()]/.test(pw);

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!token) return;
    if (newPassword !== confirm) {
      setMessage('Passwords do not match');
      return;
    }
    if (!validPw(newPassword)) {
      setMessage('Password must include at least one special character: ! @ # $ % ^ & * ( )');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      setMessage('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white p-6 rounded-lg shadow border space-y-4" autoComplete="on">
        <h1 className="text-xl font-semibold">Reset Password</h1>
        <p className="text-sm text-gray-600">Set a new password for your account.</p>
        {message && <div className="text-sm" role="alert">{message}</div>}
        <div>
          <label className="block text-sm mb-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="border rounded px-3 py-2 w-full"
            autoComplete="new-password"
            placeholder="At least one of ! @ # $ % ^ & * ( )"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="border rounded px-3 py-2 w-full"
            autoComplete="new-password"
          />
        </div>
        <button disabled={loading || !token} className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50">
          {loading ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </div>
  );
}

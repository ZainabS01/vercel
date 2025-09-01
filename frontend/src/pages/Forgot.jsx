import { useState } from 'react';

export default function Forgot() {
  const [step, setStep] = useState(1); // 1: email -> OTP, 2: enter OTP + new pw
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validPw = (pw) => /[!@#$%^&*()]/.test(pw);

  const sendOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      setMessage('OTP sent to your email (if it exists). Check inbox/spam.');
      setStep(2);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetWithOtp = async (e) => {
    e.preventDefault();
    setMessage('');
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
      const res = await fetch('http://localhost:5000/api/auth/reset-with-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      setMessage('Password reset successful. You can now login.');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {step === 1 && (
        <form onSubmit={sendOtp} className="w-full max-w-sm bg-white p-6 rounded-lg shadow border space-y-4" autoComplete="on">
          <h1 className="text-xl font-semibold">Forgot Password</h1>
          <p className="text-sm text-gray-600">Enter your email to receive an OTP.</p>
          {message && <div className="text-sm" role="alert">{message}</div>}
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border rounded px-3 py-2 w-full"
              autoComplete="email"
            />
          </div>
          <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50">
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={resetWithOtp} className="w-full max-w-sm bg-white p-6 rounded-lg shadow border space-y-4" autoComplete="on">
          <h1 className="text-xl font-semibold">Verify OTP & Reset</h1>
          <p className="text-sm text-gray-600">Enter the OTP from your email and set a new password.</p>
          {message && <div className="text-sm" role="alert">{message}</div>}
          <div>
            <label className="block text-sm mb-1">OTP Code</label>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))}
              required
              className="border rounded px-3 py-2 w-full"
              placeholder="6-digit code"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="border rounded px-3 py-2 w-full"
              autoComplete="new-password"
              placeholder="Include at least one of ! @ # $ % ^ & * ( )"
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
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="w-1/2 bg-gray-200 text-gray-800 py-2 rounded">Back</button>
            <button disabled={loading} className="w-1/2 bg-blue-600 text-white py-2 rounded disabled:opacity-50">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

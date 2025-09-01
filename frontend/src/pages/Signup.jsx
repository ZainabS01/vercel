import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', semester: '', phone: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      setForm({ ...form, phone: digits });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setIsLoading(true);

    try {
      // Client-side validations
      if (form.phone && !/^03\d{9}$/.test(form.phone)) {
        throw new Error('Phone must start with 03 and be 11 digits');
      }
      if (!/[!@#$%^&*()]/.test(form.password)) {
        throw new Error('Password must include at least one special character: ! @ # $ % ^ & * ( )');
      }
      if (form.password !== form.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          semester: form.semester ? Number(form.semester) : undefined,
          phone: form.phone || undefined,
        }),
        credentials: 'include' // Important for cookies/sessions if using them
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      setMessage({ 
        text: data.message || 'Signup successful! Redirecting to login...',
        type: 'success' 
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      setMessage({ 
        text: error.message || 'Failed to sign up. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const messageClass = message.type === 'error' 
    ? 'text-red-600 bg-red-100 border-l-4 border-red-500 p-4 mb-4' 
    : 'text-green-600 bg-green-100 border-l-4 border-green-500 p-4 mb-4';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-black via-gray-900 to-brand-blue px-4">
      <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur p-6 md:p-8 rounded-xl shadow-card w-full max-w-lg">
        <h2 className="text-2xl font-extrabold mb-6 text-center text-brand-black tracking-tight">Create your account</h2>
        
        {message.text && (
          <div className={messageClass} role="alert">
            <p>{message.text}</p>
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
            Full Name
          </label>
          <input 
            id="name"
            name="name" 
            type="text" 
            placeholder="Enter your full name" 
            value={form.name} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue/60"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
            Email Address
          </label>
          <input 
            id="email"
            name="email" 
            type="email" 
            placeholder="Enter your email" 
            value={form.email} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue/60"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">
            Phone (03XXXXXXXXX)
          </label>
          <input 
          minLength={11}
          maxLength={11}
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            placeholder="e.g., 03xxxxxxxxx"
            value={form.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue/60"
          />
          <p className="mt-1 text-xs text-gray-500">Must start with 03 and be 11 digits.</p>
        </div>

        <div className="mb-4">
          <label htmlFor="semester" className="block text-gray-700 text-sm font-bold mb-2">
            Semester (1–8)
          </label>
          <input
            id="semester"
            name="semester"
            type="number"
            min="1"
            max="8"
            placeholder="Enter semester between 1 and 8"
            value={form.semester}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue/60"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input 
            id="password"
            name="password" 
            type="password" 
            placeholder="Enter a strong password" 
            value={form.password} 
            onChange={handleChange} 
            required 
            minLength="6"
            pattern="^(?=.*[!@#$%^&*()]).{6,}$"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue/60"
          />
          <p className="mt-1 text-xs text-gray-500">Must be 6+ chars and include at least one of ! @ # $ % ^ & * ( )</p>
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-blue/60"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          className={`w-full py-2.5 px-4 rounded-md text-white font-semibold transition-colors ${
            isLoading 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-brand-blue hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Signing up...' : 'Sign Up'}
        </button>
        
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-blue hover:underline font-medium">
            Login here
          </Link>
        </p>
      </form>
    </div>
  );
}

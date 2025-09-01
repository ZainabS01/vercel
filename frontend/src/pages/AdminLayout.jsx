import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition-colors
     hover:bg-brand-blue/10 text-gray-700 ${isActive ? 'bg-brand-blue/20 text-brand-blue font-semibold' : ''}`;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={
          `fixed z-40 inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200
           ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`
        }
      >
        <div className="px-5 py-4 border-b">
          <h2 className="text-lg font-extrabold tracking-tight text-brand-black">Admin Panel</h2>
          <p className="text-xs text-gray-500">Manage users, attendance, and tasks</p>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          <NavLink to="/admin/approvals" className={linkClass}>
            <span className="inline-block w-2 h-2 rounded-full bg-brand-blue" />
            Approvals
          </NavLink>
          <NavLink to="/admin/attendance" className={linkClass}>
            <span className="inline-block w-2 h-2 rounded-full bg-brand-red" />
            Attendance
          </NavLink>
          <NavLink to="/admin/tasks" className={linkClass}>
            <span className="inline-block w-2 h-2 rounded-full bg-brand-blue" />
            Tasks
          </NavLink>
        </nav>
        <div className="p-3 border-t">
          <button onClick={logout} className="w-full bg-brand-red text-white py-2 rounded-md hover:bg-red-700 transition-colors">Logout</button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-3 md:px-6 gap-3">
          {/* Hamburger button on mobile */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M3.75 6.75A.75.75 0 014.5 6h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm.75 4.5a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="text-sm text-brand-black font-semibold">Dashboard</div>
        </header>
        <main className="p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

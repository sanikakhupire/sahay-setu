import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `text-sm px-3 py-1 rounded ${
      isActive ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <nav className="bg-white shadow">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-800 mr-3">Sahay Setu</span>
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/resources" className={linkClass}>
            My Resources
          </NavLink>
          <NavLink to="/needs" className={linkClass}>
            My Needs
          </NavLink>
          <NavLink to="/map" className={linkClass}>
            Ward Map
          </NavLink>
          {(user.role === 'volunteer' || user.role === 'admin') && (
            <NavLink to="/volunteer" className={linkClass}>
              Volunteer Board
            </NavLink>
          )}
          {user.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {user.name} · {user.role}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm bg-gray-200 hover:bg-gray-300 rounded px-3 py-1"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
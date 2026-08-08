import { Link, Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import ThemeToggle from '../../components/ThemeToggle';
import useTheme from '../../hooks/useTheme';
import { 
  LayoutDashboard, 
  Users, 
  Bot, 
  HeartPulse, 
  Settings,
  LogOut,
  Bell,
  FileText,
  Activity,
  Dumbbell,
  Pill,
  Thermometer,
  MessageSquare,
  UtensilsCrossed,
  Folder,
  Shield,
  ClipboardList,
  BarChart3
} from 'lucide-react';
import { useState } from 'react';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { settings } = useSettings();
  const { theme: adminTheme, toggleTheme: toggleAdminTheme } = useTheme('admin_theme');

  // Check if logged in
  const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    navigate('/');
  };

  const navItems = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Medical Records', path: '/admin/records', icon: FileText },
    { name: 'Medicine DB', path: '/admin/medicine-db', icon: Pill },
    { name: 'Disease DB', path: '/admin/diseases', icon: HeartPulse },
    { name: 'Symptoms', path: '/admin/symptoms', icon: Thermometer },
    { name: 'Diet Management', path: '/admin/diet', icon: UtensilsCrossed },
    { name: 'Health Services', path: '/admin/health', icon: HeartPulse },
    { name: 'File Manager', path: '/admin/file-manager', icon: Folder },
    { name: 'Security', path: '/admin/security', icon: Shield },
    { name: 'Audit Logs', path: '/admin/audit', icon: ClipboardList },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className={adminTheme === 'dark' ? 'dark' : ''} style={{colorScheme: adminTheme}} data-theme={adminTheme}>
    <div className="fixed inset-0 z-50 flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between`}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Brand */}
          <div className="h-16 shrink-0 flex items-center justify-center border-b border-gray-200 dark:border-gray-600 dark:border-gray-700 px-4">
            {isSidebarOpen ? (
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                LifeOS Admin
              </h1>
            ) : (
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">A</span>
            )}
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium shadow-sm' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                  }`}
                  title={!isSidebarOpen ? item.name : ''}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                  {isSidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User / Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-600 dark:border-gray-700">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center space-x-3 p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 dark:bg-red-900/30 dark:hover:bg-red-900/30 dark:bg-red-900/30 dark:hover:bg-red-900/30 dark:bg-red-900/30 dark:hover:bg-red-900/20 rounded-xl transition-colors duration-200"
           >
             <LogOut className="w-5 h-5" />
             {isSidebarOpen && <span>Logout</span>}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-800/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-600 dark:border-gray-700 flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 mr-4 rounded-lg hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-700 transition-colors"
            >
              <LayoutDashboard className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-300 dark:text-gray-100">
              {navItems.find(i => location.pathname === i.path || (i.path !== '/admin' && location.pathname.startsWith(i.path)))?.name || 'Admin Panel'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle theme={adminTheme} toggleTheme={toggleAdminTheme} />
            <Link to="/admin/feedback" title="Feedback" className="p-2 rounded-full hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-700 transition-colors">
              <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <Link to="/admin/notifications" title="Notifications" className="p-2 rounded-full hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-700 relative transition-colors">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                A
              </div>
              <span className="font-medium text-sm hidden md:block text-gray-700 dark:text-gray-200">Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <Outlet />
        </div>
      </main>

    </div>
    </div>
  );
};

export default AdminLayout;

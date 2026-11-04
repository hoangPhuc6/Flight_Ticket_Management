import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Globe, User as UserIcon, KeyRound, Plane, LogOut,
  ChevronDown, Shield, LayoutDashboard, Briefcase
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

function Navbar({ isSolid = false }) {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sync user from localStorage & listen for changes
  const loadUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    loadUser();
    window.addEventListener('storage', loadUser);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', loadUser);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setIsDropdownOpen(false);
    navigate('/signin');
  };

  const isLightNav = isSolid || isScrolled;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isLightNav
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
        {/* Khối 1: Logo */}
        <div className="flex-shrink-0 flex items-center">
          <Link to="/" className="inline-block focus:outline-none">
            <img
              src={logoImg}
              alt="EasyFlight Logo"
              className={`w-auto object-contain transition-all duration-300 ${
                isLightNav
                  ? 'h-14 sm:h-16 md:h-18 max-w-[200px] sm:max-w-[260px]'
                  : 'h-24 sm:h-32 md:h-40 max-w-[280px] sm:max-w-[360px]'
              }`}
            />
          </Link>
        </div>

        {/* Khối 2: Menu giữa */}
        <ul className="hidden lg:flex items-center space-x-8">
          <li>
            <Link
              to="/"
              className={`text-base font-semibold transition-colors hover:text-blue-600 ${
                isLightNav ? 'text-slate-700' : 'text-white'
              }`}
            >
              Trang chủ
            </Link>
          </li>
          <li>
            <Link
              to="/customer/flight-results"
              className={`text-base font-semibold transition-colors hover:text-blue-600 ${
                isLightNav ? 'text-slate-700' : 'text-white'
              }`}
            >
              Đặt vé
            </Link>
          </li>
          <li>
            <Link
              to="/customer/my-flights"
              className={`text-base font-semibold transition-colors hover:text-blue-600 ${
                isLightNav ? 'text-slate-700' : 'text-white'
              }`}
            >
              Chuyến bay của tôi
            </Link>
          </li>
          <li>
            <Link
              to="/"
              className={`text-base font-semibold transition-colors hover:text-orange-500 ${
                isLightNav ? 'text-orange-600' : 'text-orange-400'
              }`}
            >
              Khuyến mãi 🔥
            </Link>
          </li>
        </ul>

        {/* Khối 3: Authen phải */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div
            className={`hidden sm:flex items-center space-x-1.5 mr-2 cursor-pointer hover:text-blue-600 transition-colors ${
              isLightNav ? 'text-slate-700' : 'text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span className="font-semibold text-xs tracking-wider">VND | VN</span>
          </div>

          {user ? (
            /* User Avatar & Dropdown Menu */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-2xl border transition-all cursor-pointer ${
                  isLightNav
                    ? 'bg-slate-50 border-slate-200/80 hover:bg-slate-100 text-slate-800'
                    : 'bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-white'
                }`}
              >
                {/* Avatar Initial */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-sm uppercase shrink-0">
                  {(user.fullName || user.email || 'U').charAt(0)}
                </div>

                <div className="hidden sm:block text-left max-w-[140px] truncate">
                  <p className="text-xs font-bold truncate leading-tight">
                    {user.fullName || user.email?.split('@')[0]}
                  </p>
                  <p className={`text-[10px] leading-tight ${isLightNav ? 'text-slate-500' : 'text-blue-100'}`}>
                    {user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'STAFF' ? 'Nhân viên' : 'Hội viên'}
                  </p>
                </div>

                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  } ${isLightNav ? 'text-slate-400' : 'text-white/80'}`}
                />
              </button>

              {/* Dropdown Card */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                  {/* User brief header */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">Đang đăng nhập với tư cách</p>
                    <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                      {user.fullName || 'Khách hàng'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {user.role === 'ADMIN' ? 'Admin Control' : user.role === 'STAFF' ? 'Staff Portal' : 'Thành viên EasyFlight'}
                    </span>
                  </div>

                  {/* Menu links */}
                  <div className="p-1 space-y-0.5 text-xs font-semibold">
                    <Link
                      to="/customer/profile?tab=info"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-blue-500" />
                      <span>Thông tin tài khoản</span>
                    </Link>

                    <Link
                      to="/customer/profile?tab=security"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                    >
                      <KeyRound className="w-4 h-4 text-emerald-500" />
                      <span>Đổi mật khẩu & Bảo mật</span>
                    </Link>

                    <Link
                      to="/customer/my-flights"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                    >
                      <Plane className="w-4 h-4 text-sky-500" />
                      <span>Chuyến bay của tôi</span>
                    </Link>

                    {/* Role specific quick links */}
                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-purple-600" />
                        <span>Trang Quản trị Admin</span>
                      </Link>
                    )}

                    {user.role === 'STAFF' && (
                      <Link
                        to="/staff/dashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-emerald-600" />
                        <span>Trang Nhân viên Staff</span>
                      </Link>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="my-1 border-t border-slate-100" />

                  {/* Logout item */}
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/signin"
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isLightNav
                    ? 'text-blue-600 hover:bg-blue-50'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Đăng nhập
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

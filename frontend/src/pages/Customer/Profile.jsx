import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import authService from '../../api/authService';
import { bookingService } from '../../api/services/bookingService';
import Navbar from '../../components/Homepage/Navbar';
import Footer from '../../components/Homepage/Footer';

// Subcomponents
import Toast from '../../components/Customer/Profile/Toast';
import ProfileHeader from '../../components/Customer/Profile/ProfileHeader';
import ProfileSidebar from '../../components/Customer/Profile/ProfileSidebar';
import PersonalInfoTab from '../../components/Customer/Profile/PersonalInfoTab';
import SecurityTab from '../../components/Customer/Profile/SecurityTab';
import BookingsTab from '../../components/Customer/Profile/BookingsTab';
import PreferencesTab from '../../components/Customer/Profile/PreferencesTab';

export default function CustomerProfile() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab: 'info' | 'security' | 'bookings' | 'preferences'
  const activeTab = searchParams.get('tab') || 'info';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // Toast notification state
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // Current User in LocalStorage
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

  // Extended Profile Form
  const [profileForm, setProfileForm] = useState(() => {
    const stored = localStorage.getItem('local_customer_profile');
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          fullName: parsed.fullName || u.fullName || '',
          email: u.email || '',
          phoneNumber: parsed.phoneNumber || u.phoneNumber || '',
          dateOfBirth: parsed.dateOfBirth || '',
          gender: parsed.gender || 'MALE',
          documentNumber: parsed.documentNumber || '',
          nationality: parsed.nationality || 'Việt Nam',
          address: parsed.address || ''
        };
      } catch {
        // fallback
      }
    }
    return {
      fullName: u.fullName || '',
      email: u.email || '',
      phoneNumber: u.phoneNumber || '',
      dateOfBirth: '',
      gender: 'MALE',
      documentNumber: '',
      nationality: 'Việt Nam',
      address: ''
    };
  });

  // Password change state
  const [pwdForm, setPwdForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Bookings list for stats and preview
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Preferences state
  const [preferences, setPreferences] = useState(() => {
    try {
      const p = localStorage.getItem('local_user_preferences');
      return p ? JSON.parse(p) : { emailNotifications: true, smsAlerts: true, promoEmails: true };
    } catch {
      return { emailNotifications: true, smsAlerts: true, promoEmails: true };
    }
  });

  // Fetch bookings
  useEffect(() => {
    let mounted = true;
    bookingService
      .getMy()
      .then((res) => {
        if (mounted) setMyBookings(res || []);
      })
      .catch(() => {
        if (mounted) setMyBookings([]);
      })
      .finally(() => {
        if (mounted) setLoadingBookings(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Compute membership & flight stats
  const stats = useMemo(() => {
    const total = myBookings.length;
    const confirmedCount = myBookings.filter(
      (b) => b.status === 'CONFIRMED' || b.status === 'PAID'
    ).length;
    const miles = confirmedCount * 350;

    let tier = 'Thành viên Đồng (Bronze)';
    let tierBadge = 'bg-amber-100 text-amber-800 border-amber-300';
    if (confirmedCount >= 5) {
      tier = 'Thành viên Bạc (Silver)';
      tierBadge = 'bg-slate-200 text-slate-800 border-slate-300';
    }
    if (confirmedCount >= 10) {
      tier = 'Thành viên Vàng (Gold)';
      tierBadge = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
    if (confirmedCount >= 20) {
      tier = 'Thành viên Kim Cương (Diamond)';
      tierBadge = 'bg-cyan-100 text-cyan-800 border-cyan-300';
    }

    return { total, confirmedCount, miles, tier, tierBadge };
  }, [myBookings]);

  // Handle Profile Save
  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) {
      addToast('Vui lòng nhập họ và tên của bạn.', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedUser = {
        ...currentUser,
        fullName: profileForm.fullName.trim(),
        phoneNumber: profileForm.phoneNumber.trim()
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      localStorage.setItem('local_customer_profile', JSON.stringify(profileForm));

      // Notify Navbar to update user display immediately
      window.dispatchEvent(new Event('storage'));

      setTimeout(() => {
        setIsSavingProfile(false);
        addToast('Cập nhật hồ sơ cá nhân thành công!', 'success');
      }, 350);
    } catch {
      setIsSavingProfile(false);
      addToast('Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.', 'error');
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmPassword } = pwdForm;

    if (!oldPassword) {
      addToast('Vui lòng nhập mật khẩu hiện tại.', 'error');
      return;
    }
    if (!newPassword) {
      addToast('Vui lòng nhập mật khẩu mới.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Mật khẩu mới phải có tối thiểu 6 ký tự.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Mật khẩu xác nhận không khớp với mật khẩu mới.', 'error');
      return;
    }
    if (oldPassword === newPassword) {
      addToast('Mật khẩu mới không được trùng với mật khẩu hiện tại.', 'error');
      return;
    }

    setIsChangingPwd(true);
    try {
      const res = await authService.changePassword({
        oldPassword,
        newPassword,
        confirmPassword
      });

      addToast(
        res?.message || 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.',
        'success'
      );
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.';
      addToast(msg, 'error');
    } finally {
      setIsChangingPwd(false);
    }
  };

  // Handle Preferences Save
  const handleSavePreferences = () => {
    localStorage.setItem('local_user_preferences', JSON.stringify(preferences));
    addToast('Đã lưu tùy chọn thông báo thành công!', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar isSolid={true} />

      <Toast toasts={toasts} onRemove={removeToast} />

      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800 font-semibold">Hồ sơ cá nhân & Bảo mật</span>
        </div>

        {/* Profile Header Hero Card */}
        <ProfileHeader
          profileForm={profileForm}
          currentUser={currentUser}
          stats={stats}
        />

        {/* Main Grid: Sidebar + Active Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <ProfileSidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              totalBookings={stats.total}
            />
          </div>

          <div className="lg:col-span-3">
            {activeTab === 'info' && (
              <PersonalInfoTab
                profileForm={profileForm}
                setProfileForm={setProfileForm}
                onSave={handleSaveProfile}
                isSaving={isSavingProfile}
              />
            )}

            {activeTab === 'security' && (
              <SecurityTab
                pwdForm={pwdForm}
                setPwdForm={setPwdForm}
                onChangePassword={handleChangePassword}
                isChangingPwd={isChangingPwd}
              />
            )}

            {activeTab === 'bookings' && (
              <BookingsTab
                myBookings={myBookings}
                loadingBookings={loadingBookings}
              />
            )}

            {activeTab === 'preferences' && (
              <PreferencesTab
                preferences={preferences}
                setPreferences={setPreferences}
                onSave={handleSavePreferences}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

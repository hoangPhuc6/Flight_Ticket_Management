import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import authService from '../../api/authService';
import { bookingService } from '../../api/services/bookingService';
import { profileService } from '../../api/services/profileService';
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

  // Extended Profile Form (khởi tạo từ user trong localStorage, sau đó nạp từ API /users/me)
  const [profileForm, setProfileForm] = useState(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
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
  const [loadingProfile, setLoadingProfile] = useState(true);

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

  // Preferences state (nạp từ API cùng với hồ sơ)
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsAlerts: true,
    promoEmails: true
  });
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Đồng bộ thông tin user cơ bản (tên, SĐT) vào localStorage để Navbar hiển thị đúng
  const syncLocalUser = (profile) => {
    setCurrentUser((prev) => {
      const updated = {
        ...prev,
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber || ''
      };
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
      return updated;
    });
  };

  const applyProfile = (p) => {
    setProfileForm({
      fullName: p.fullName || '',
      email: p.email || '',
      phoneNumber: p.phoneNumber || '',
      dateOfBirth: p.dateOfBirth || '',
      gender: p.gender || 'MALE',
      documentNumber: p.documentNumber || '',
      nationality: p.nationality || 'Việt Nam',
      address: p.address || ''
    });
    if (p.preferences) setPreferences(p.preferences);
  };

  // Fetch profile
  useEffect(() => {
    let mounted = true;
    profileService
      .getMe()
      .then((p) => {
        if (!mounted || !p) return;
        applyProfile(p);
        syncLocalUser(p);
      })
      .catch((err) => {
        if (mounted) {
          addToast(
            err?.response?.data?.message || 'Không tải được hồ sơ cá nhân. Vui lòng thử lại.',
            'error'
          );
        }
      })
      .finally(() => {
        if (mounted) setLoadingProfile(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

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
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) {
      addToast('Vui lòng nhập họ và tên của bạn.', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await profileService.updateMe({
        fullName: profileForm.fullName.trim(),
        phoneNumber: profileForm.phoneNumber.replace(/\s/g, ''),
        dateOfBirth: profileForm.dateOfBirth || null,
        gender: profileForm.gender || null,
        documentNumber: profileForm.documentNumber.trim(),
        nationality: profileForm.nationality.trim(),
        address: profileForm.address.trim()
      });
      if (res?.data) {
        applyProfile(res.data);
        syncLocalUser(res.data);
      }
      addToast(res?.message || 'Cập nhật hồ sơ cá nhân thành công!', 'success');
    } catch (err) {
      addToast(
        err?.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.',
        'error'
      );
    } finally {
      setIsSavingProfile(false);
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
  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    try {
      const res = await profileService.updatePreferences(preferences);
      if (res?.data) setPreferences(res.data);
      addToast(res?.message || 'Đã lưu tùy chọn thông báo thành công!', 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || 'Lưu tùy chọn thất bại. Vui lòng thử lại.', 'error');
    } finally {
      setIsSavingPrefs(false);
    }
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
                isLoading={loadingProfile}
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
                isSaving={isSavingPrefs}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

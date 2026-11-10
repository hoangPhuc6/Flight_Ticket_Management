import '../../css/Authentication/SignInForm.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import signinHero from '../../assets/signin_hero.png';
import logoImg from '../../assets/logo.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import authService from '../../api/authService';

function SignInForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    // Trang khách muốn vào trước khi bị yêu cầu đăng nhập (vd: trang kết quả chuyến bay)
    const redirectTo = location.state?.from?.pathname
        ? `${location.state.from.pathname}${location.state.from.search || ''}`
        : '/customer/home';

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setErrorMsg('');
        const cleanEmail = email.trim();

        // ===== Validate phía client, hiển thị thông báo cho người dùng =====
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!cleanEmail) {
            setErrorMsg('Vui lòng nhập email.');
            return;
        }
        if (!emailRegex.test(cleanEmail)) {
            setErrorMsg('Email không hợp lệ. Vui lòng kiểm tra lại.');
            return;
        }
        if (!password) {
            setErrorMsg('Vui lòng nhập mật khẩu.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authService.login({ email: cleanEmail, password });
            // Backend trả về { status: "success", message: "...", data: { email, role, accessToken } }
            if (response.status === 'success' && response.data) {
                const { data } = response;
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('user', JSON.stringify({
                    email: data.email,
                    role: data.role,
                    fullName: data.fullName
                }));

                // Chuyển hướng dựa trên role
                if (data.role === 'ADMIN') {
                    navigate('/admin/dashboard');
                } else if (data.role === 'STAFF') {
                    navigate('/staff/dashboard');
                } else {
                    navigate(redirectTo);
                }
            } else {
                setErrorMsg(response.message || 'Đăng nhập thất bại.');
            }
        } catch (error) {
            console.error('Login error:', error);
            if (!error.response) {
                // Không kết nối được server -> báo lỗi, KHÔNG tự đăng nhập giả
                setErrorMsg('Không thể kết nối đến server. Vui lòng kiểm tra Backend đã khởi động chưa (cổng 5000)!');
            } else {
                setErrorMsg(error.response?.data?.message || 'Sai email hoặc mật khẩu!');
            }
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <div className="signin-wrapper">

            {/* ===== CỘT TRÁI: Hero ===== */}
            <div className="signin-hero">
                <img src={signinHero} alt="Sky view" className="signin-hero__img" />
                <div className="signin-hero__overlay">
                    <div className="signin-hero__content">
                        <h2 className="signin-hero__title">
                            Khám phá thế giới<br />cùng EasyFlight.
                        </h2>
                        <p className="signin-hero__desc">
                            Trải nghiệm đặt vé máy bay liền mạch, minh bạch và đẳng cấp.
                            Hành trình của bạn bắt đầu từ đây.
                        </p>
                    </div>
                </div>
            </div>

            {/* ===== CỘT PHẢI: Form ===== */}
            <div className="signin-panel">
                <div className="signin-card">

                    {/* Brand */}
                    <div className="signin-brand">
                        <div className="signin-brand__logo-box">
                            <img src={logoImg} alt="EasyFlight Logo" className="signin-brand__logo" />
                        </div>
                    </div>

                    {/* Heading */}
                    <h1 className="signin-heading">Chào mừng bạn trở lại!</h1>
                    <p className="signin-subtext">
                        Vui lòng đăng nhập để tiếp tục hành trình của bạn.
                    </p>

                    {/* Form */}
                    <form className="signin-form-fields" onSubmit={handleLogin} noValidate>

                        {/* Thông báo lỗi */}
                        {errorMsg && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: '#FEE2E2',
                                color: '#991B1B',
                                borderRadius: '8px',
                                fontSize: '14px',
                                border: '1px solid #FCA5A5',
                                marginBottom: '4px'
                            }}>
                                {errorMsg}
                            </div>
                        )}

                        {/* Email */}
                        <div className="si-form-group">
                            <label htmlFor="signin-email">Email</label>
                            <div className="si-input-wrapper">
                                <i className="fas fa-envelope si-input-icon"></i>
                                <input
                                    type="email"
                                    id="signin-email"
                                    placeholder="Nhập địa chỉ email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Mật khẩu */}
                        <div className="si-form-group">
                            <label htmlFor="signin-password">Mật khẩu</label>
                            <div className="si-input-wrapper">
                                <i className="fas fa-lock si-input-icon"></i>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="signin-password"
                                    placeholder="Nhập mật khẩu"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="si-toggle-pwd"
                                    onClick={() => setShowPassword(v => !v)}
                                    aria-label="Hiện/ẩn mật khẩu"
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                                </button>
                            </div>
                        </div>

                        {/* Options row */}
                        <div className="si-options-row">
                            <label className="si-remember">
                                <input type="checkbox" />
                                <span>Ghi nhớ đăng nhập</span>
                            </label>
                            <button type="button" className="si-forgot">Quên mật khẩu?</button>
                        </div>

                        {/* Submit */}
                        <button type="submit" className="btn-signin-new" disabled={isLoading}>
                            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>



                        {/* Signup link */}
                        <p className="si-signup-prompt">
                            Chưa có tài khoản?{' '}
                            <Link to="/signup" className="si-signup-link">Đăng ký ngay</Link>
                        </p>

                    </form>
                </div>
            </div>

        </div>
    );
}

export default SignInForm;
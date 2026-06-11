import { useState, useEffect } from "react";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader, ShieldAlert, Smartphone } from "lucide-react";
import { supabase } from "../lib/supabase";

interface AuthPageProps {
  initialMode?: "login" | "signup" | "forgot_password" | "reset_password";
  onSuccess: (email: string) => void;
  onBack: () => void;
}

type AuthMode = "login" | "signup" | "forgot_password" | "reset_password";

export default function AuthPage({ initialMode = "login", onSuccess, onBack }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Autofill first credential (customer) by default when loading login page for convenience
  useEffect(() => {
    if (mode === "login" && !email) {
      setEmail("customer@gmail.com");
      setPassword("password123");
    }
  }, [mode]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (pwd: string) => pwd.length >= 6;

  const validatePhone = (p: string) => /^[0-9]{10,11}$/.test(p);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    if (!validateEmail(email)) {
      setError("Email không hợp lệ");
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setLoading(false);
      return;
    }

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message === "Invalid login credentials"
        ? "Email hoặc mật khẩu không đúng"
        : loginError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Handle remember me logic in local storage (mock-only helper)
      if (rememberMe) {
        localStorage.setItem("remember_me_email", email);
      } else {
        localStorage.removeItem("remember_me_email");
      }

      setSuccessMsg("Đăng nhập thành công!");
      setTimeout(() => {
        setLoading(false);
        onSuccess(email);
      }, 1500);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    if (!fullName.trim()) {
      setError("Vui lòng nhập tên đầy đủ");
      setLoading(false);
      return;
    }

    if (!validatePhone(phone)) {
      setError("Số điện thoại không hợp lệ (phải từ 10 đến 11 chữ số)");
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError("Email không hợp lệ");
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setLoading(false);
      return;
    }

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name: fullName,
          role: "customer", // Signups default to Customer
          phone: phone
        },
      },
    });

    setLoading(false);

    if (signupError) {
      if (signupError.message.includes("already registered")) {
        setError("Email này đã được đăng ký");
      } else {
        setError(signupError.message);
      }
      return;
    }

    if (data.user) {
      setSuccessMsg("Đăng ký tài khoản khách hàng thành công! Bạn sẽ được đăng nhập tự động.");
      setTimeout(() => onSuccess(email), 2000);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    if (!validateEmail(email)) {
      setError("Email không hợp lệ");
      setLoading(false);
      return;
    }

    const users = JSON.parse(localStorage.getItem('mock_supabase_users') || '[]');
    const user = users.find((u: any) => u.email === email);
    setLoading(false);

    if (!user) {
      setError("Email không tồn tại trong hệ thống.");
      return;
    }

    setIsOtpStep(true);
    setSuccessMsg("Mã OTP đã được gửi về email của bạn! Nhập mã OTP '123456' để đổi mật khẩu.");
  };

  const handleOtpResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    if (otp.trim() !== "123456") {
      setError("Mã OTP không chính xác. Vui lòng nhập '123456'.");
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setLoading(false);
      return;
    }

    // Update user in mock storage
    const users = JSON.parse(localStorage.getItem('mock_supabase_users') || '[]');
    const updatedUsers = users.map((u: any) => {
      if (u.email === email) {
        return {
          ...u,
          password: password
        };
      }
      return u;
    });
    localStorage.setItem('mock_supabase_users', JSON.stringify(updatedUsers));

    setLoading(false);
    setSuccessMsg("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.");
    setTimeout(() => {
      setIsOtpStep(false);
      setMode("login");
      setPassword("");
      setConfirmPassword("");
      setOtp("");
      setSuccessMsg("");
    }, 1500);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    if (!validatePassword(password)) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setLoading(false);
      return;
    }

    const { error: resetError } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSuccessMsg("Đặt lại mật khẩu thành công!");
    setTimeout(() => {
      onSuccess(email || "user@example.com");
    }, 1500);
  };

  // Autocomplete email if saved in remember me
  useEffect(() => {
    const savedEmail = localStorage.getItem("remember_me_email");
    if (savedEmail && mode === "login") {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [mode]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-8 pt-24">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {mode === "login" && "Đăng Nhập Hệ Thống"}
              {mode === "signup" && "Đăng Ký Tài Khoản"}
              {mode === "forgot_password" && "Quên Mật Khẩu"}
              {mode === "reset_password" && "Đặt Lại Mật Khẩu"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {mode === "forgot_password"
                ? "Nhập email để nhận liên kết đặt lại mật khẩu"
                : mode === "reset_password"
                ? "Nhập mật khẩu mới cho tài khoản của bạn"
                : "Vào thế giới điện ảnh CineStar"}
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 shadow-2xl space-y-6">
          
          {/* Role selector removed, single login layout */}

          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-600/10 border border-red-500/20 rounded-xl flex gap-2 text-red-400">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium leading-tight">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-600/10 border border-green-500/20 rounded-xl flex gap-2 text-green-400">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium leading-tight">{successMsg}</p>
            </div>
          )}

          <form
            onSubmit={
              mode === "login"
                ? handleLogin
                : mode === "signup"
                ? handleSignup
                : mode === "forgot_password"
                ? (isOtpStep ? handleOtpResetPassword : handleForgotPassword)
                : handleResetPassword
            }
            className="space-y-4"
          >
            {/* Full Name (Signup only) */}
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tên Đầy Đủ</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="text" required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Phone Number (Signup only) */}
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Số Điện Thoại</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="tel" required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0123456789"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all font-sans"
                  />
                </div>
              </div>
            )}

            {/* Email (not displayed in Reset Password) */}
            {mode !== "reset_password" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tên đăng nhập hoặc Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="email" required
                    disabled={isOtpStep}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {/* OTP Code (Forgot Password with OTP step only) */}
            {mode === "forgot_password" && isOtpStep && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Mã xác thực OTP</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="text" required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Nhập mã OTP (123456)"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all font-sans"
                  />
                </div>
              </div>
            )}

            {/* Password (Login, Signup, Reset Password, or Forgot Password OTP step) */}
            {(mode !== "forgot_password" || isOtpStep) && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {mode === "reset_password" || isOtpStep ? "Mật Khẩu Mới" : "Mật Khẩu"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type={showPassword ? "text" : "password"} required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-10 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (Reset Password, or Forgot Password OTP step) */}
            {(mode === "reset_password" || (mode === "forgot_password" && isOtpStep)) && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Xác Nhận Mật Khẩu Mới</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type={showPassword ? "text" : "password"} required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận mật khẩu mới"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-10 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all font-sans"
                  />
                </div>
              </div>
            )}

            {/* Remember Me and Forgot Password row (Login only) */}
            {mode === "login" && (
              <div className="flex items-center justify-between text-xs sm:text-sm mt-1 select-none">
                <label className="flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 bg-zinc-800 border-zinc-750 rounded text-red-600 focus:ring-red-500/30 focus:ring-offset-zinc-900 transition-all cursor-pointer"
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot_password");
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-wait text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-red-600/10 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : mode === "login" ? (
                "Đăng Nhập"
              ) : mode === "signup" ? (
                "Đăng Ký"
              ) : mode === "forgot_password" ? (
                isOtpStep ? "Xác Nhận & Đổi Mật Khẩu" : "Gửi Yêu Cầu"
              ) : (
                "Cập Nhật Mật Khẩu"
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          {mode === "forgot_password" && (
            <div className="mt-6 text-center border-t border-zinc-800 pt-6">
              <button
                type="button"
                onClick={() => {
                  setIsOtpStep(false);
                  setMode("login");
                  setError("");
                  setSuccessMsg("");
                  setOtp("");
                  setPassword("");
                  setConfirmPassword("");
                }}
                className="text-red-400 hover:text-red-300 font-medium transition-colors text-sm"
              >
                Quay lại Đăng Nhập
              </button>
            </div>
          )}
          {(mode === "login" || mode === "signup") && (
            <div className="mt-6 text-center border-t border-zinc-800 pt-6">
              <p className="text-gray-400 text-sm mb-3">
                {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
              </p>
              <button
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-red-400 hover:text-red-300 font-medium transition-colors text-sm"
              >
                {mode === "login" ? "Đăng Ký Khách Hàng" : "Đăng Nhập"}
              </button>
            </div>
          )}
          {mode === "reset_password" && (
            <div className="mt-6 text-center border-t border-zinc-800 pt-6">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-red-400 hover:text-red-300 font-medium transition-colors text-sm"
              >
                Quay lại Đăng Nhập
              </button>
            </div>
          )}
        </div>

        {/* Info & Test Accounts Box */}
        <div className="mt-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-3">
          <p className="text-gray-400 text-xs leading-relaxed">
            <span className="text-yellow-400 font-medium">Lưu ý:</span>{" "}
            {mode === "forgot_password"
              ? "Vui lòng nhập đúng email đã đăng ký trên hệ thống để nhận liên kết khôi phục mật khẩu."
              : mode === "reset_password"
              ? "Hãy chọn một mật khẩu mạnh để bảo mật tài khoản tốt hơn."
              : "Hệ thống tự động phân quyền truy cập (khách hàng, nhân viên, quản trị) dựa trên tài khoản đăng nhập."}
          </p>

          {mode === "login" && (
            <div className="border-t border-zinc-800/80 pt-3 space-y-2">
              <p className="text-white text-xs font-bold flex items-center gap-1.5">
                <span>🔑</span> Tài khoản thử nghiệm nhanh (Click để điền nhanh):
              </p>
              <div className="grid grid-cols-1 gap-1.5 text-[10px] text-zinc-400 font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("customer@gmail.com");
                    setPassword("password123");
                  }}
                  className="bg-zinc-950 p-2 rounded-lg border border-zinc-850 hover:border-zinc-700 transition-colors flex justify-between w-full text-left cursor-pointer"
                >
                  <span>Khách hàng: <strong>customer@gmail.com</strong></span>
                  <span className="text-gray-500">pass: password123</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("staff@gmail.com");
                    setPassword("password123");
                  }}
                  className="bg-zinc-950 p-2 rounded-lg border border-zinc-850 hover:border-zinc-700 transition-colors flex justify-between w-full text-left cursor-pointer"
                >
                  <span>Nhân viên: <strong>staff@gmail.com</strong></span>
                  <span className="text-gray-500">pass: password123</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("nguyennhutrung788@gmail.com");
                    setPassword("29112006");
                  }}
                  className="bg-zinc-950 p-2 rounded-lg border border-zinc-850 hover:border-zinc-700 transition-colors flex justify-between w-full text-left cursor-pointer"
                >
                  <span>Quản trị 1: <strong>nguyennhutrung788@gmail.com</strong></span>
                  <span className="text-red-400">pass: 29112006</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@gmail.com");
                    setPassword("password123");
                  }}
                  className="bg-zinc-950 p-2 rounded-lg border border-zinc-850 hover:border-zinc-700 transition-colors flex justify-between w-full text-left cursor-pointer"
                >
                  <span>Quản trị 2: <strong>admin@gmail.com</strong></span>
                  <span className="text-gray-500">pass: password123</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

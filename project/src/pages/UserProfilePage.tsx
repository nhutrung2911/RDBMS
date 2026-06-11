import { useState, useEffect } from "react";
import { LogOut, User, Mail, Calendar, Edit2, Save, X, Loader } from "lucide-react";
import { supabase } from "../lib/supabase";

interface UserProfile {
  email: string;
  fullName: string;
  phone?: string;
  memberSince: string;
  points: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

interface UserProfilePageProps {
  userEmail: string;
  onLogout: () => void;
  onBack: () => void;
}

const TIER_INFO = {
  bronze: { label: "Bronze", color: "bg-amber-700", min: 0 },
  silver: { label: "Silver", color: "bg-slate-400", min: 500 },
  gold: { label: "Gold", color: "bg-yellow-500", min: 1500 },
  platinum: { label: "Platinum", color: "bg-purple-500", min: 3000 },
};

export default function UserProfilePage({ userEmail, onLogout, onBack }: UserProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile>({
    email: userEmail,
    fullName: "Khách hàng",
    phone: "",
    memberSince: new Date().toLocaleDateString("vi-VN"),
    points: 450,
    tier: "bronze",
  });

  useEffect(() => {
    const loadUserData = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const metadata = data.session.user.user_metadata || {};
        setProfile(prev => ({
          ...prev,
          fullName: metadata.full_name || prev.fullName,
          phone: metadata.phone || prev.phone || "",
        }));
      }
    };
    loadUserData();
  }, [userEmail]);

  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleEdit = () => {
    setIsEditing(true);
    setTempProfile(profile);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempProfile(profile);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    if (!tempProfile.fullName.trim()) {
      setMessage("Vui lòng nhập tên đầy đủ");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: { full_name: tempProfile.fullName, phone: tempProfile.phone },
    });

    setLoading(false);

    if (error) {
      setMessage("Cập nhật thất bại: " + error.message);
      return;
    }

    setProfile(tempProfile);
    setIsEditing(false);
    setMessage("Cập nhật thông tin thành công!");
    setTimeout(() => setMessage(""), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const getTierProgress = () => {
    const currentTier = (Object.entries(TIER_INFO).find(
      ([_, info]) => profile.points >= info.min
    )?.[0] || "bronze") as keyof typeof TIER_INFO;

    const tierArray = ["bronze", "silver", "gold", "platinum"] as const;
    const currentIndex = tierArray.indexOf(currentTier);
    const nextIndex = currentIndex + 1;
    const nextTier = (nextIndex < tierArray.length ? tierArray[nextIndex] : null) as keyof typeof TIER_INFO | null;
    const nextMinPoints = nextTier ? TIER_INFO[nextTier].min : TIER_INFO.platinum.min;

    return {
      current: currentTier,
      next: nextTier,
      pointsToNext: nextTier ? nextMinPoints - profile.points : 0,
      progress: nextTier ? ((profile.points - TIER_INFO[currentTier].min) / (nextMinPoints - TIER_INFO[currentTier].min)) * 100 : 100,
    };
  };

  const tierProgress = getTierProgress();
  const tierInfo = TIER_INFO[tierProgress.current as keyof typeof TIER_INFO];

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Hồ Sơ Của Tôi</h1>
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${message.includes("thất bại") ? "bg-red-600/20 border border-red-600/30" : "bg-green-600/20 border border-green-600/30"}`}>
            <p className={`text-sm font-medium ${message.includes("thất bại") ? "text-red-400" : "text-green-400"}`}>
              {message}
            </p>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 mb-6">
          {/* User Avatar Section */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-zinc-800">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">{profile.fullName}</h2>
              <p className="text-gray-400 text-sm">{profile.email}</p>
              <p className="text-gray-500 text-xs mt-1">Thành viên từ {profile.memberSince}</p>
            </div>
          </div>

          {/* Tier Section */}
          <div className="mb-8">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className={`w-2 h-6 ${tierInfo.color} rounded-full`} />
              Hạng Thành Viên
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold px-3 py-1 rounded-full text-white ${tierInfo.color}`}>
                  {tierInfo.label}
                </span>
                <span className="text-gray-400 text-sm">{profile.points} điểm</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className={`h-full ${tierInfo.color} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(tierProgress.progress, 100)}%` }}
                />
              </div>
              {tierProgress.next && (
                <p className="text-gray-400 text-xs">
                  Còn <span className="text-red-400 font-medium">{tierProgress.pointsToNext}</span> điểm để lên hạng{" "}
                  <span className="font-medium">{TIER_INFO[tierProgress.next as keyof typeof TIER_INFO].label}</span>
                </p>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <span className="w-2 h-6 bg-red-500 rounded-full" />
              Thông Tin Cá Nhân
            </h3>
            <div className="text-[10px] text-zinc-600 font-mono">DEBUG: {JSON.stringify(profile)}</div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tên Đầy Đủ</label>
                  <input
                    type="text"
                    value={tempProfile.fullName}
                    onChange={(e) => setTempProfile({ ...tempProfile, fullName: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={tempProfile.email}
                    disabled
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-gray-600 cursor-not-allowed opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Số Điện Thoại</label>
                  <input
                    type="tel"
                    value={tempProfile.phone || ""}
                    onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                    placeholder="0123456789"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-red-900 text-white font-medium py-2 rounded-lg transition-colors"
                  >
                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <User className="w-3 h-3" />
                      Tên
                    </div>
                    <p className="text-white font-medium">{profile.fullName}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </div>
                    <p className="text-white font-medium text-sm truncate">{profile.email}</p>
                  </div>
                  {profile.phone && (
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                        <span>📱</span>
                        Điện Thoại
                      </div>
                      <p className="text-white font-medium">{profile.phone}</p>
                    </div>
                  )}
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <Calendar className="w-3 h-3" />
                      Thành Viên
                    </div>
                    <p className="text-white font-medium text-sm">{profile.memberSince}</p>
                  </div>
                </div>

                <button
                  onClick={handleEdit}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2 rounded-lg transition-colors mt-4"
                >
                  <Edit2 className="w-4 h-4" />
                  Chỉnh Sửa Thông Tin
                </button>
              </>
            )}
          </div>
        </div>

        {/* Rewards Card */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 mb-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-yellow-500 rounded-full" />
            Điểm Thưởng
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-yellow-400">{profile.points}</p>
              <p className="text-gray-400 text-xs mt-1">Điểm Hiện Tại</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-red-400">250</p>
              <p className="text-gray-400 text-xs mt-1">Sắp Nhận</p>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-400">1050</p>
              <p className="text-gray-400 text-xs mt-1">Đã Dùng</p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 font-medium py-3 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Đăng Xuất
        </button>
      </div>
    </div>
  );
}

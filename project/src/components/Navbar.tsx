import { useState } from "react";
import { Search, User, MapPin, ChevronDown, Menu, X, Ticket, Film, LayoutDashboard } from "lucide-react";

interface NavbarProps {
  onNavigate: (page: string, data?: unknown) => void;
  currentPage: string;
  userEmail?: string | null;
  userRole?: "customer" | "admin" | null;
  onAuthClick?: () => void;
  onSearch?: (query: string) => void;
}

export default function Navbar({ onNavigate, currentPage, userEmail, userRole, onAuthClick, onSearch }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const showAdminLink = userRole === "admin";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-500 transition-colors">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              CINE<span className="text-red-500">STAR</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Phim Đang Chiếu", page: "home" },
              { label: "Phim Sắp Chiếu", page: "coming_soon" },
            ].map((item) => (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentPage === item.page
                    ? "text-red-500 bg-red-500/10"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* City Selector */}
            <button className="hidden md:flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm px-3 py-2 rounded-lg hover:bg-white/5">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>TP. HCM</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Search */}
            <div className="relative">
              {searchOpen ? (
                <div className="flex items-center bg-white/10 rounded-lg overflow-hidden border border-white/10">
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      if (onSearch) onSearch(val);
                    }}
                    placeholder="Tìm phim..."
                    className="bg-transparent text-white text-sm px-3 py-2 outline-none w-48 placeholder-gray-500"
                  />
                  <button
                    onClick={() => { 
                      setSearchOpen(false); 
                      setSearchQuery(""); 
                      if (onSearch) onSearch("");
                    }}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Admin Portal (Admin and Staff only) */}
            {showAdminLink && (
              <button
                onClick={() => onNavigate("admin")}
                className={`hidden md:flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-colors ${
                  currentPage === "admin"
                    ? "text-red-500 bg-red-500/10 font-bold"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-red-500" />
                <span>Quản Trị</span>
              </button>
            )}

            {/* My Tickets */}
            <button
              onClick={() => onNavigate("my_tickets")}
              className="hidden md:flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm px-3 py-2 rounded-lg hover:bg-white/5"
            >
              <Ticket className="w-4 h-4" />
              <span>Vé Của Tôi</span>
            </button>

            {/* User Account */}
            {userEmail ? (
              <button
                onClick={onAuthClick}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors bg-red-600/10 hover:bg-red-600/20 px-3 py-2 rounded-lg text-sm border border-red-600/20 font-medium"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline truncate max-w-xs">{userEmail}</span>
                <span className="sm:hidden">Hồ Sơ</span>
              </button>
            ) : (
              <button
                onClick={onAuthClick}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg text-sm border border-white/10"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Đăng Nhập</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-black/98 border-t border-white/5 px-4 py-3 space-y-1">
          {[
            { label: "Phim Đang Chiếu", page: "home" },
            { label: "Phim Sắp Chiếu", page: "coming_soon" },
            { label: "Vé Của Tôi", page: "my_tickets" },
            ...(showAdminLink ? [{ label: "Quản Trị Hệ Thống", page: "admin" }] : []),
          ].map((item) => (
            <button
              key={item.page}
              onClick={() => { onNavigate(item.page); setMenuOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

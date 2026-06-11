import { Film, MapPin, Phone, Mail, Facebook, Youtube, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-zinc-900 border-t border-zinc-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">CINE<span className="text-red-500">STAR</span></span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Trải nghiệm điện ảnh đỉnh cao với công nghệ chiếu phim hiện đại nhất Việt Nam.
            </p>
            <div className="flex gap-3">
              {[Facebook, Youtube, Instagram].map((Icon, i) => (
                <button key={i} className="w-8 h-8 bg-zinc-800 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Phim</h4>
            <ul className="space-y-2">
              {["Phim Đang Chiếu", "Phim Sắp Chiếu", "Phim Nổi Bật", "Đánh Giá Phim"].map((l) => (
                <li key={l}>
                  <button className="text-gray-500 hover:text-red-400 text-sm transition-colors">
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Dịch Vụ</h4>
            <ul className="space-y-2">
              {["Thành Viên CineStar", "Ưu Đãi & Khuyến Mãi", "Combo Bắp Nước", "Thẻ Quà Tặng", "Thuê Rạp Riêng"].map((l) => (
                <li key={l}>
                  <button className="text-gray-500 hover:text-red-400 text-sm transition-colors">
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Liên Hệ</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-gray-500">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                72 Lê Thánh Tôn, Q.1, TP. Hồ Chí Minh
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-500">
                <Phone className="w-4 h-4 text-red-500 flex-shrink-0" />
                1900 6017
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-500">
                <Mail className="w-4 h-4 text-red-500 flex-shrink-0" />
                nguyennhutrung788@gmail.com
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-gray-600 text-xs">© 2026 CineStar. Bảo lưu mọi quyền.</p>
          <div className="flex gap-4">
            {["Chính sách bảo mật", "Điều khoản sử dụng", "Hỗ trợ"].map((t) => (
              <button key={t} className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

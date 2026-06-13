import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Play, RotateCcw, X, Cpu, Info, ShieldAlert } from "lucide-react";

export interface ConcurrencyConfig {
  devModeEnabled: boolean;
  scenario: "none" | "lost_update" | "dirty_read" | "non_repeatable_read" | "phantom" | "deadlock";
  isolationLevel: "READ_UNCOMMITTED" | "READ_COMMITTED" | "REPEATABLE_READ" | "SERIALIZABLE";
  useLockFix: boolean;
  latencyMs: number;
}

export interface SqlLog {
  id: string;
  timestamp: string;
  message: string;
  type: "info" | "query" | "lock" | "success" | "error";
}

interface DevPanelProps {
  config: ConcurrencyConfig;
  onChangeConfig: (newConfig: ConcurrencyConfig) => void;
  logs: SqlLog[];
  onClearLogs: () => void;
}

const SCENARIOS = [
  { id: "none", name: "Không giả lập (Mặc định)" },
  { id: "lost_update", name: "1. Lost Update (Mất CN)" },
  { id: "dirty_read", name: "2. Dirty Read (Đọc rác)" },
  { id: "non_repeatable_read", name: "3. Non-repeatable Read (Đọc không lại)" },
  { id: "phantom", name: "4. Phantom (Bóng ma)" },
  { id: "deadlock", name: "5. Deadlock (Khóa chết)" },
];

const ISOLATION_LEVELS = [
  { id: "READ_UNCOMMITTED", name: "READ UNCOMMITTED" },
  { id: "READ_COMMITTED", name: "READ COMMITTED" },
  { id: "REPEATABLE_READ", name: "REPEATABLE READ" },
  { id: "SERIALIZABLE", name: "SERIALIZABLE" },
];

const SCENARIO_DESCRIPTIONS: Record<string, { desc: string; trigger: string; fixDesc: string }> = {
  none: {
    desc: "Chế độ hoạt động bình thường của ứng dụng.",
    trigger: "Không có kịch bản xung đột được thiết lập.",
    fixDesc: "N/A"
  },
  lost_update: {
    desc: "Hai luồng cùng đọc ghế trống cùng lúc. Luồng A đặt trước nhưng luồng B không biết, luồng B tiếp tục đặt đè lên. Database giải quyết bằng cách dùng khóa độc quyền UPDLOCK hoặc HOLDLOCK khi đọc trạng thái ghế.",
    trigger: "Vào trang Đặt vé (SeatsPage hoặc Quầy bán vé), chọn ghế và bấm 'Tiếp theo/In vé'. Hệ thống sẽ tự động tạo luồng phụ đặt trùng ghế đó cùng lúc để tạo xung đột.",
    fixDesc: "Khi bật 'Sửa lỗi': Stored Procedure sẽ dùng khóa UPDLOCK, HOLDLOCK. Luồng phụ sẽ bị block (chờ khóa) cho đến khi giao dịch hiện tại hoàn tất, sau đó luồng phụ thất bại vì ghế đã có chủ."
  },
  dirty_read: {
    desc: "Giao dịch A đang thực hiện giữ ghế thanh toán (chưa commit). Giao dịch B đọc sơ đồ ghế và thấy ghế đã bị khóa (Đọc dữ liệu chưa commit). Sau đó Giao dịch A hủy thanh toán (rollback).",
    trigger: "Chọn ghế và sang trang Thanh toán QR (đơn hàng ở trạng thái chưa thanh toán). Hãy mở sơ đồ ghế ở một trình duyệt khác (hoặc tab ẩn danh) để xem trạng thái ghế đó.",
    fixDesc: "Khi chọn mức cô lập 'READ COMMITTED' (mặc định SQL Server): Giao dịch B sẽ không đọc được trạng thái chưa commit của A (hoặc bị block hoặc chỉ thấy trạng thái ghế trống cho đến khi A thực sự commit thành công)."
  },
  non_repeatable_read: {
    desc: "Nhân viên A đọc báo cáo doanh thu lần 1. Trong lúc Transaction A vẫn mở, khách hàng B hủy/hoàn vé (commit thành công). Nhân viên A đọc lại doanh thu lần 2 trong cùng transaction và nhận được con số khác.",
    trigger: "Vào Admin Portal -> Báo cáo Doanh thu, nhấn 'Xem báo cáo'. Hệ thống sẽ mở một Transaction kéo dài vài giây (theo độ trễ). Trong lúc đó, một tiến trình phụ sẽ thực hiện hủy vé chạy ngầm.",
    fixDesc: "Khi chọn mức cô lập 'REPEATABLE READ' hoặc cao hơn: Database sẽ khóa các dòng doanh thu đã đọc, chặn mọi thao tác cập nhật/xóa vé của tiến trình B cho tới khi Transaction A kết thúc, đảm bảo kết quả 2 lần đọc giống hệt nhau."
  },
  phantom: {
    desc: "Khách hàng A tìm kiếm các suất chiếu khả dụng của phim. Trong lúc tìm kiếm, Admin chèn thêm một suất chiếu mới. Khách hàng A tìm kiếm lại trong cùng transaction và thấy xuất hiện thêm suất chiếu mới (bóng ma).",
    trigger: "Vào xem chi tiết phim và bấm 'Tra cứu suất chiếu'. Trong lúc chờ, hệ thống tự động chèn thêm suất chiếu mới chạy ngầm.",
    fixDesc: "Khi chọn mức cô lập 'SERIALIZABLE': Database khóa cả phạm vi dữ liệu (Range Lock), chặn hành động insert suất chiếu mới của Admin cho đến khi Transaction tìm kiếm hoàn tất."
  },
  deadlock: {
    desc: "Nhân viên A đặt vé combo ghế {A1, A2} (khóa A1 rồi khóa A2). Nhân viên B đặt vé combo {A2, A1} (khóa A2 rồi khóa A1). Cả hai khóa chéo nhau tạo thành Deadlock. SQL Server sẽ tự động hủy một trong hai giao dịch.",
    trigger: "Vào trang Đặt vé (chọn từ 2 ghế trở lên, ví dụ A1 và A2) và bấm xác nhận đặt vé. Hệ thống giả lập luồng phụ khóa ngược hướng để tạo khóa chết.",
    fixDesc: "Khi bật 'Sửa lỗi': Hệ thống tự động sắp xếp danh sách ghế chọn theo thứ tự bảng chữ cái (luôn khóa ghế có ID nhỏ trước, ví dụ A1 rồi mới đến A2) $\rightarrow$ loại bỏ hoàn toàn khả năng khóa chéo."
  }
};

export default function DevPanel({ config, onChangeConfig, logs, onClearLogs }: DevPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "logs">("settings");
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === "logs" && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, activeTab]);

  const updateSetting = (key: keyof ConcurrencyConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    // Auto adjust isolation level based on scenario for demonstration convenience
    if (key === "scenario") {
      if (value === "dirty_read") newConfig.isolationLevel = "READ_UNCOMMITTED";
      else if (value === "non_repeatable_read") newConfig.isolationLevel = "READ_COMMITTED";
      else if (value === "phantom") newConfig.isolationLevel = "REPEATABLE_READ";
      else if (value === "lost_update" || value === "deadlock") newConfig.isolationLevel = "READ_COMMITTED";
    }
    onChangeConfig(newConfig);
  };

  const getLogColorClass = (type: SqlLog["type"]) => {
    switch (type) {
      case "query":
        return "text-cyan-400";
      case "lock":
        return "text-amber-400 font-semibold";
      case "success":
        return "text-emerald-400 font-bold";
      case "error":
        return "text-red-500 font-bold animate-pulse";
      default:
        return "text-gray-300";
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-[999] bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white p-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center border border-white/20"
        title="Bảng điều khiển tương tranh"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Cpu className="w-5 h-5 animate-pulse" />}
      </button>

      {/* Floating Panel Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-[999] w-full max-w-lg bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md transition-all duration-350 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-red-500" />
              <h3 className="text-white font-bold text-sm">Concurrency Control Center</h3>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-800 rounded-lg p-0.5 border border-zinc-700">
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  activeTab === "settings" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Cấu Hình
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "logs" ? "bg-red-600 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                Nhật ký SQL
                {logs.length > 0 && (
                  <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-ping" />
                )}
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 max-h-[420px] overflow-y-auto space-y-4">
            
            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="space-y-4 text-xs">
                {/* Dev mode toggle */}
                <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                  <div>
                    <h4 className="text-white font-bold">Kích hoạt chế độ giả lập tương tranh</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">Bật tính năng khóa dữ liệu và xung đột</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.devModeEnabled}
                      onChange={(e) => updateSetting("devModeEnabled", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-650" />
                  </label>
                </div>

                {config.devModeEnabled && (
                  <>
                    {/* Scenario selector */}
                    <div className="space-y-1.5">
                      <label className="block text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Tình huống tương tranh</label>
                      <select
                        value={config.scenario}
                        onChange={(e) => updateSetting("scenario", e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-500"
                      >
                        {SCENARIOS.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Dynamic info box for scenario */}
                    {config.scenario !== "none" && (
                      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex gap-2">
                          <Info className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <div>
                            <span className="text-white font-bold">Mô tả lý thuyết:</span>
                            <p className="text-gray-450 mt-1 leading-relaxed text-[11px]">{SCENARIO_DESCRIPTIONS[config.scenario].desc}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 border-t border-zinc-850 pt-2.5">
                          <Play className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <div>
                            <span className="text-white font-bold">Cách thử nghiệm trên UI:</span>
                            <p className="text-gray-450 mt-1 leading-relaxed text-[11px]">{SCENARIO_DESCRIPTIONS[config.scenario].trigger}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Settings fields row */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Isolation Level Selector */}
                      <div className="space-y-1.5">
                        <label className="block text-gray-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1">
                          Isolation Level
                          {config.scenario === "dirty_read" && config.isolationLevel === "READ_UNCOMMITTED" && (
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                          )}
                        </label>
                        <select
                          value={config.isolationLevel}
                          onChange={(e) => updateSetting("isolationLevel", e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500 font-mono text-[11px]"
                        >
                          {ISOLATION_LEVELS.map((i) => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Transaction delay slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <label className="block text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Độ trễ lock / query</label>
                          <span className="text-red-400 font-bold font-mono">{(config.latencyMs / 1000).toFixed(1)}s</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="5000"
                          step="500"
                          value={config.latencyMs}
                          onChange={(e) => updateSetting("latencyMs", Number(e.target.value))}
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                      </div>
                    </div>

                    {/* Apply Lock Fix switch (For Lost Update and Deadlock) */}
                    {(config.scenario === "lost_update" || config.scenario === "deadlock") && (
                      <div className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                        <div className="flex gap-2">
                          {config.useLockFix ? (
                            <ShieldAlert className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 animate-bounce" />
                          )}
                          <div>
                            <h4 className="text-white font-bold flex items-center gap-1.5">
                              {config.useLockFix ? "Đã áp dụng cách khắc phục" : "Chưa khắc phục lỗi (Sử dụng SP cũ)"}
                            </h4>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {config.scenario === "lost_update" ? "Dùng SP có UPDLOCK, HOLDLOCK" : "Sắp xếp tăng dần ID ghế trước khi khóa"}
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.useLockFix}
                            onChange={(e) => updateSetting("useLockFix", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-650" />
                        </label>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* LOGS TAB */}
            {activeTab === "logs" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Live Database Simulation Logs:</span>
                  <button
                    onClick={onClearLogs}
                    className="flex items-center gap-1 bg-zinc-850 hover:bg-zinc-850 border border-zinc-800 text-gray-400 hover:text-white px-2 py-1 rounded transition-colors text-[10px] font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Xóa log
                  </button>
                </div>

                {/* Log list box */}
                <div className="h-72 bg-zinc-950 border border-zinc-850 rounded-xl p-4 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 shadow-inner select-text">
                  {logs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-600 italic">
                      Chưa có nhật ký truy vấn SQL.
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-1 border-b border-zinc-900/50 pb-1 last:border-0 last:pb-0">
                        <span className="text-zinc-650 flex-shrink-0 font-sans text-[9px] mt-0.5">[{log.timestamp}]</span>
                        <span className={`${getLogColorClass(log.type)} break-words flex-1`}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={consoleEndRef} />
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </>
  );
}

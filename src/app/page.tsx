"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const UNITS = ["15-1", "15-2", "15-3", "15-4", "15-5", "15-6"] as const;
const FLOORS = Array.from({ length: 16 }, (_, i) => 17 - i); // 17F down to 2F

type ReadingData = Record<string, string>;
type Period = {
  id: number;
  label: string;
  readingDate: string;
  createdAt: string;
};
type WizardStep = "ask" | "unit" | "floor" | "reading" | null;

export default function Home() {
  const [readings, setReadings] = useState<ReadingData>({});
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // New period form
  const [showNewPeriod, setShowNewPeriod] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newDate, setNewDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  // Mobile wizard
  const [wizardStep, setWizardStep] = useState<WizardStep>(null);
  const [wizardUnit, setWizardUnit] = useState<string>("");
  const [wizardFloor, setWizardFloor] = useState<number | null>(null);
  const [wizardValue, setWizardValue] = useState("");
  const [wizardSaving, setWizardSaving] = useState(false);
  const wizardInputRef = useRef<HTMLInputElement>(null);
  const hasShownWizard = useRef(false);

  const cellKey = (floor: number, unit: string) => `${floor}_${unit}`;

  // Load periods
  const loadPeriods = useCallback(async () => {
    try {
      const res = await fetch("/api/periods");
      if (res.ok) {
        const data: Period[] = await res.json();
        setPeriods(data);
        if (data.length > 0 && selectedPeriodId === null) {
          setSelectedPeriodId(data[0].id);
        }
      }
    } catch {
      setMessage("讀取期別失敗");
    }
  }, [selectedPeriodId]);

  // Load readings for selected period
  const loadReadings = useCallback(async (periodId: number) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/readings?periodId=${periodId}`);
      if (res.ok) {
        const data = await res.json();
        setReadings(data);
      }
    } catch {
      setMessage("讀取度數失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  useEffect(() => {
    if (selectedPeriodId !== null) {
      loadReadings(selectedPeriodId);
    }
  }, [selectedPeriodId, loadReadings]);

  // Auto-show wizard on mobile on first load (once per session)
  useEffect(() => {
    if (!hasShownWizard.current && typeof window !== "undefined") {
      hasShownWizard.current = true;
      const alreadyShown = sessionStorage.getItem("wizardShown");
      if (!alreadyShown && window.innerWidth < 768) {
        sessionStorage.setItem("wizardShown", "1");
        setWizardStep("ask");
      }
    }
  }, []);

  // Focus input when entering reading step; small delay to let DOM render
  useEffect(() => {
    if (wizardStep === "reading") {
      setTimeout(() => wizardInputRef.current?.focus(), 100);
    }
  }, [wizardStep]);

  const handleChange = (floor: number, unit: string, value: string) => {
    if (value !== "" && !/^\d{0,4}$/.test(value)) return;
    setReadings((prev) => ({
      ...prev,
      [cellKey(floor, unit)]: value,
    }));
  };

  const handleSave = async () => {
    if (selectedPeriodId === null) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId: selectedPeriodId, records: readings }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(`儲存成功！共 ${data.count} 筆`);
      } else {
        setMessage("儲存失敗");
      }
    } catch {
      setMessage("儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePeriod = async () => {
    if (!newLabel || !newDate) return;
    try {
      const res = await fetch("/api/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel, readingDate: newDate }),
      });
      if (res.ok) {
        const created: Period = await res.json();
        setPeriods((prev) => [created, ...prev]);
        setSelectedPeriodId(created.id);
        setReadings({});
        setShowNewPeriod(false);
        setNewLabel("");
        setMessage(`已建立「${created.label}」`);
      }
    } catch {
      setMessage("建立期別失敗");
    }
  };

  // Wizard: save a single reading and return to table
  const handleWizardSave = async () => {
    if (!wizardUnit || wizardFloor === null || selectedPeriodId === null) return;
    const key = cellKey(wizardFloor, wizardUnit);
    const updatedReadings = { ...readings, [key]: wizardValue };
    setReadings(updatedReadings);
    setWizardSaving(true);
    try {
      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId: selectedPeriodId, records: updatedReadings }),
      });
      if (res.ok) {
        setMessage(`已儲存 ${wizardUnit} ${wizardFloor}F 度數`);
      } else {
        setMessage("儲存失敗");
      }
    } catch {
      setMessage("儲存失敗");
    } finally {
      setWizardSaving(false);
      setWizardStep(null);
      setWizardUnit("");
      setWizardFloor(null);
      setWizardValue("");
    }
  };

  const closeWizard = () => {
    setWizardStep(null);
    setWizardUnit("");
    setWizardFloor(null);
    setWizardValue("");
  };

  const filledCount = Object.values(readings).filter((v) => v !== "").length;
  const totalCells = UNITS.length * FLOORS.length;
  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:py-8 sm:px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">家美香榭廣場 B棟</h1>
            <p className="text-xs sm:text-sm text-gray-600">新北市五股區成泰路二段91巷15號</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              瓦斯度數紀錄｜已填 {filledCount} / {totalCells}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mobile quick-entry button */}
            <button
              onClick={() => setWizardStep("ask")}
              className="sm:hidden bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-1"
            >
              ✏️ 快速輸入度數
            </button>
            {/* Period selector */}
            <select
              value={selectedPeriodId ?? ""}
              onChange={(e) => setSelectedPeriodId(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none"
            >
              {periods.length === 0 && <option value="">尚無期別</option>}
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}（{p.readingDate}）
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowNewPeriod(!showNewPeriod)}
              className="border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors"
            >
              + 新增期別
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || selectedPeriodId === null}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "儲存中..." : "儲存"}
            </button>
            <Link
              href="/usage"
              className="border border-amber-400 text-amber-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-amber-50 transition-colors text-center"
            >
              📊 用量計算
            </Link>
          </div>
        </div>

        {/* New period form */}
        {showNewPeriod && (
          <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">期別名稱</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="例：2026年3月"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">抄表日期</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreatePeriod}
                disabled={!newLabel || !newDate}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                建立
              </button>
              <button
                onClick={() => setShowNewPeriod(false)}
                className="text-gray-500 px-3 py-2 text-sm hover:text-gray-700"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Period info */}
        {selectedPeriod && (
          <p className="text-xs text-gray-400 mb-3">
            目前期別：{selectedPeriod.label}｜抄表日期：{selectedPeriod.readingDate}
          </p>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="border border-blue-700 px-2 py-2.5 text-sm font-semibold w-12 sticky left-0 bg-blue-600 z-10">
                  樓層
                </th>
                {UNITS.map((unit) => (
                  <th
                    key={unit}
                    className="border border-blue-700 px-2 py-2.5 text-sm font-semibold min-w-[80px]"
                  >
                    {unit}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FLOORS.map((floor, rowIdx) => (
                <tr
                  key={floor}
                  className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="border border-gray-200 px-2 py-2 text-center text-sm font-semibold text-gray-700 bg-gray-100 sticky left-0 z-10">
                    {floor}F
                  </td>
                  {UNITS.map((unit) => (
                    <td
                      key={unit}
                      className="border border-gray-200 p-0"
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={readings[cellKey(floor, unit)] ?? ""}
                        onChange={(e) =>
                          handleChange(floor, unit, e.target.value)
                        }
                        placeholder="—"
                        className="w-full px-2 py-2.5 text-sm text-center bg-transparent focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-400 transition-colors min-h-[44px]"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Status */}
        {message && (
          <p className={`text-sm mt-4 text-center font-medium ${message.includes("成功") || message.includes("已建立") || message.includes("已儲存") ? "text-green-600" : "text-red-500"}`}>
            {message}
          </p>
        )}
        {loading && (
          <p className="text-sm mt-4 text-center text-gray-400">載入中...</p>
        )}
      </div>

      {/* Mobile Wizard Modal */}
      {wizardStep !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl p-6 pb-8 sm:pb-6">
            {/* Step: ask */}
            {wizardStep === "ask" && (
              <div className="text-center">
                <div className="text-4xl mb-3">📋</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">要填度數嗎？</h2>
                <p className="text-sm text-gray-500 mb-6">
                  {selectedPeriod
                    ? `目前期別：${selectedPeriod.label}`
                    : "請先選擇期別"}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setWizardStep("unit")}
                    disabled={selectedPeriodId === null}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-base font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    ✅ 是，開始填
                  </button>
                  <button
                    onClick={closeWizard}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl text-base font-semibold hover:bg-gray-200 transition-colors"
                  >
                    ✖ 不用
                  </button>
                </div>
              </div>
            )}

            {/* Step: unit */}
            {wizardStep === "unit" && (
              <div>
                <button onClick={() => setWizardStep("ask")} className="text-sm text-gray-400 mb-3">
                  ← 返回
                </button>
                <h2 className="text-xl font-bold text-gray-900 mb-1">幾號？</h2>
                <p className="text-sm text-gray-500 mb-4">請選擇要填的門牌號</p>
                <div className="grid grid-cols-3 gap-3">
                  {UNITS.map((unit) => (
                    <button
                      key={unit}
                      onClick={() => {
                        setWizardUnit(unit);
                        setWizardStep("floor");
                      }}
                      className="py-4 rounded-xl bg-blue-50 text-blue-700 font-bold text-lg hover:bg-blue-100 active:bg-blue-200 transition-colors border-2 border-blue-200"
                    >
                      {unit}
                    </button>
                  ))}
                </div>
                <button onClick={closeWizard} className="mt-4 w-full text-sm text-gray-400 py-2">
                  取消
                </button>
              </div>
            )}

            {/* Step: floor */}
            {wizardStep === "floor" && (
              <div>
                <button onClick={() => setWizardStep("unit")} className="text-sm text-gray-400 mb-3">
                  ← 返回
                </button>
                <h2 className="text-xl font-bold text-gray-900 mb-1">幾樓？</h2>
                <p className="text-sm text-gray-500 mb-4">
                  {wizardUnit}・請選擇樓層
                </p>
                <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {FLOORS.map((floor) => {
                    const existing = readings[cellKey(floor, wizardUnit)];
                    return (
                      <button
                        key={floor}
                        onClick={() => {
                          setWizardFloor(floor);
                          setWizardValue(existing ?? "");
                          setWizardStep("reading");
                        }}
                        className={`py-3 rounded-xl font-semibold text-base transition-colors border-2 ${
                          existing
                            ? "bg-green-50 text-green-700 border-green-300"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                        }`}
                      >
                        {floor}F
                      </button>
                    );
                  })}
                </div>
                <button onClick={closeWizard} className="mt-4 w-full text-sm text-gray-400 py-2">
                  取消
                </button>
              </div>
            )}

            {/* Step: reading */}
            {wizardStep === "reading" && wizardFloor !== null && (
              <div>
                <button onClick={() => setWizardStep("floor")} className="text-sm text-gray-400 mb-3">
                  ← 返回
                </button>
                <h2 className="text-xl font-bold text-gray-900 mb-1">填度數</h2>
                <p className="text-sm text-gray-500 mb-5">
                  {wizardUnit} · {wizardFloor}F
                </p>
                <input
                  ref={wizardInputRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={wizardValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d{0,4}$/.test(v)) setWizardValue(v);
                  }}
                  placeholder="請輸入度數（最多4位數）"
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-4 text-2xl text-center font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 mb-5"
                />
                <button
                  onClick={handleWizardSave}
                  disabled={wizardSaving || !wizardValue}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl text-base font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {wizardSaving ? "儲存中..." : "✔ 確認儲存"}
                </button>
                <button onClick={closeWizard} className="mt-3 w-full text-sm text-gray-400 py-2">
                  取消
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

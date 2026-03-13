"use client";

import { useState, useEffect, useCallback } from "react";

const UNITS = ["15-1", "15-2", "15-3", "15-4", "15-5", "15-6"] as const;
const FLOORS = Array.from({ length: 16 }, (_, i) => 17 - i); // 17F down to 2F

type ReadingData = Record<string, string>;
type Period = {
  id: number;
  label: string;
  readingDate: string;
  createdAt: string;
};

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

  const filledCount = Object.values(readings).filter((v) => v !== "").length;
  const totalCells = UNITS.length * FLOORS.length;
  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">家美香榭廣場 B棟</h1>
            <p className="text-sm text-gray-600">新北市五股區成泰路二段91巷15號</p>
            <p className="text-sm text-gray-500 mt-1">
              瓦斯度數紀錄｜已填 {filledCount} / {totalCells}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Period selector */}
            <select
              value={selectedPeriodId ?? ""}
              onChange={(e) => setSelectedPeriodId(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-100 transition-colors"
            >
              + 新增期別
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || selectedPeriodId === null}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "儲存中..." : "儲存"}
            </button>
          </div>
        </div>

        {/* New period form */}
        {showNewPeriod && (
          <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">期別名稱</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="例：2026年3月"
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">抄表日期</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleCreatePeriod}
              disabled={!newLabel || !newDate}
              className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              建立
            </button>
            <button
              onClick={() => setShowNewPeriod(false)}
              className="text-gray-500 px-3 py-1.5 text-sm hover:text-gray-700"
            >
              取消
            </button>
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
                <th className="border border-blue-700 px-3 py-2.5 text-sm font-semibold w-16">
                  樓層
                </th>
                {UNITS.map((unit) => (
                  <th
                    key={unit}
                    className="border border-blue-700 px-3 py-2.5 text-sm font-semibold min-w-[100px]"
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
                  <td className="border border-gray-200 px-3 py-2 text-center text-sm font-semibold text-gray-700 bg-gray-100">
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
                        className="w-full px-3 py-2 text-sm text-center bg-transparent focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-400 transition-colors"
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
          <p className={`text-sm mt-4 text-center font-medium ${message.includes("成功") || message.includes("已建立") ? "text-green-600" : "text-red-500"}`}>
            {message}
          </p>
        )}
        {loading && (
          <p className="text-sm mt-4 text-center text-gray-400">載入中...</p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";

const UNITS = ["15-1", "15-2", "15-3", "15-4", "15-5", "15-6"] as const;
const FLOORS = Array.from({ length: 16 }, (_, i) => 17 - i); // 17F down to 2F

type ReadingData = Record<string, string>;

export default function Home() {
  const [readings, setReadings] = useState<ReadingData>({});
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const cellKey = (floor: number, unit: string) => `${floor}_${unit}`;

  // Load readings when date changes
  const loadReadings = useCallback(async (d: string) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/readings?date=${d}`);
      if (res.ok) {
        const data = await res.json();
        setReadings(data);
      }
    } catch {
      setMessage("讀取失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReadings(date);
  }, [date, loadReadings]);

  const handleChange = (floor: number, unit: string, value: string) => {
    // Only allow up to 4 digits
    if (value !== "" && !/^\d{0,4}$/.test(value)) return;
    setReadings((prev) => ({
      ...prev,
      [cellKey(floor, unit)]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, records: readings }),
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

  const filledCount = Object.values(readings).filter((v) => v !== "").length;
  const totalCells = UNITS.length * FLOORS.length;

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
          <div className="flex items-center gap-3">
            <label htmlFor="date" className="text-sm font-medium text-gray-700">
              抄表日期
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "儲存中..." : "儲存"}
            </button>
          </div>
        </div>

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
          <p className={`text-sm mt-4 text-center font-medium ${message.includes("成功") ? "text-green-600" : "text-red-500"}`}>
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

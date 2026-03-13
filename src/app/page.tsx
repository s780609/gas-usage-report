"use client";

import { useState } from "react";

const UNITS = ["15-1", "15-2", "15-3", "15-4", "15-5", "15-6"] as const;
const FLOORS = Array.from({ length: 16 }, (_, i) => 17 - i); // 17F down to 2F

type ReadingData = Record<string, string>;

export default function Home() {
  const [readings, setReadings] = useState<ReadingData>({});
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const cellKey = (floor: number, unit: string) => `${floor}_${unit}`;

  const handleChange = (floor: number, unit: string, value: string) => {
    // Only allow up to 4 digits
    if (value !== "" && !/^\d{0,4}$/.test(value)) return;
    setReadings((prev) => ({
      ...prev,
      [cellKey(floor, unit)]: value,
    }));
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

        {/* Footer hint */}
        <p className="text-xs text-gray-400 mt-4 text-center">
          目前為前端展示版本，資料庫功能將於連接 Neon DB 後啟用
        </p>
      </div>
    </div>
  );
}

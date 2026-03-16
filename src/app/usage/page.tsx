"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const UNITS = ["15-1", "15-2", "15-3", "15-4", "15-5", "15-6"] as const;
const FLOORS = Array.from({ length: 16 }, (_, i) => 17 - i);

type ReadingData = Record<string, string>;
type Period = {
  id: number;
  label: string;
  readingDate: string;
  createdAt: string;
};

export default function UsagePage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [currentPeriodId, setCurrentPeriodId] = useState<number | null>(null);
  const [prevPeriodId, setPrevPeriodId] = useState<number | null>(null);
  const [currentReadings, setCurrentReadings] = useState<ReadingData>({});
  const [prevReadings, setPrevReadings] = useState<ReadingData>({});
  const [loading, setLoading] = useState(false);

  const cellKey = (floor: number, unit: string) => `${floor}_${unit}`;

  const loadPeriods = useCallback(async () => {
    try {
      const res = await fetch("/api/periods");
      if (res.ok) {
        const data: Period[] = await res.json();
        setPeriods(data);
        if (data.length >= 2) {
          setCurrentPeriodId(data[0].id);
          setPrevPeriodId(data[1].id);
        } else if (data.length === 1) {
          setCurrentPeriodId(data[0].id);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadReadings = useCallback(async (periodId: number): Promise<ReadingData> => {
    try {
      const res = await fetch(`/api/readings?periodId=${periodId}`);
      if (res.ok) return await res.json();
    } catch {
      /* ignore */
    }
    return {};
  }, []);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      currentPeriodId !== null ? loadReadings(currentPeriodId) : Promise.resolve({}),
      prevPeriodId !== null ? loadReadings(prevPeriodId) : Promise.resolve({}),
    ]).then(([curr, prev]) => {
      setCurrentReadings(curr);
      setPrevReadings(prev);
      setLoading(false);
    });
  }, [currentPeriodId, prevPeriodId, loadReadings]);

  const getUsage = (floor: number, unit: string) => {
    const key = cellKey(floor, unit);
    const curr = parseInt(currentReadings[key], 10);
    const prev = parseInt(prevReadings[key], 10);
    if (isNaN(curr) || isNaN(prev)) return null;
    return curr - prev;
  };

  const currentPeriod = periods.find((p) => p.id === currentPeriodId);
  const prevPeriod = periods.find((p) => p.id === prevPeriodId);

  // 統計
  const allUsages = FLOORS.flatMap((floor) =>
    UNITS.map((unit) => getUsage(floor, unit))
  ).filter((v): v is number => v !== null);
  const totalUsage = allUsages.reduce((s, v) => s + v, 0);
  const avgUsage = allUsages.length > 0 ? (totalUsage / allUsages.length).toFixed(1) : "—";

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:py-8 sm:px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">用量計算</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              本期度數 − 上期度數 = 用量
            </p>
          </div>
          <Link
            href="/"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-100 transition-colors text-center"
          >
            ← 回到抄表
          </Link>
        </div>

        {/* Period selectors */}
        <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">本期</label>
            <select
              value={currentPeriodId ?? ""}
              onChange={(e) => setCurrentPeriodId(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            >
              {periods.length === 0 && <option value="">尚無期別</option>}
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}（{p.readingDate}）
                </option>
              ))}
            </select>
          </div>
          <div className="text-lg font-bold text-gray-400 self-end pb-2">−</div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">上期</label>
            <select
              value={prevPeriodId ?? ""}
              onChange={(e) => setPrevPeriodId(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-full"
            >
              {periods.length === 0 && <option value="">尚無期別</option>}
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}（{p.readingDate}）
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        {allUsages.length > 0 && (
          <div className="mb-4 flex gap-4 text-sm">
            <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">總用量</div>
              <div className="text-xl font-bold text-emerald-600">{totalUsage}</div>
            </div>
            <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">平均用量</div>
              <div className="text-xl font-bold text-blue-600">{avgUsage}</div>
            </div>
            <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">已計算戶數</div>
              <div className="text-xl font-bold text-gray-700">{allUsages.length}</div>
            </div>
          </div>
        )}

        {/* Comparison info */}
        {currentPeriod && prevPeriod && (
          <p className="text-xs text-gray-400 mb-3">
            比較：{currentPeriod.label}（{currentPeriod.readingDate}）vs {prevPeriod.label}（{prevPeriod.readingDate}）
          </p>
        )}

        {periods.length < 2 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-sm">需要至少兩期資料才能計算用量</p>
            <Link
              href="/"
              className="inline-block mt-4 text-blue-600 text-sm hover:underline"
            >
              前往抄表 →
            </Link>
          </div>
        )}

        {/* Usage Table */}
        {periods.length >= 2 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-amber-600 text-white">
                  <th className="border border-amber-700 px-2 py-2.5 text-sm font-semibold w-12 sticky left-0 bg-amber-600 z-10">
                    樓層
                  </th>
                  {UNITS.map((unit) => (
                    <th
                      key={unit}
                      className="border border-amber-700 px-2 py-2.5 text-sm font-semibold min-w-[100px]"
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
                    {UNITS.map((unit) => {
                      const key = cellKey(floor, unit);
                      const usage = getUsage(floor, unit);
                      const curr = currentReadings[key];
                      const prev = prevReadings[key];
                      return (
                        <td
                          key={unit}
                          className="border border-gray-200 px-2 py-2 text-center"
                        >
                          {usage !== null ? (
                            <div>
                              <div className={`text-lg font-bold ${usage < 0 ? "text-red-500" : "text-emerald-600"}`}>
                                {usage}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                {curr} − {prev}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {loading && (
          <p className="text-sm mt-4 text-center text-gray-400">載入中...</p>
        )}
      </div>
    </div>
  );
}

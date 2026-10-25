import React, { useState } from 'react';
import {
  AssetType,
  CategoryBreakdownItem,
  DailyCashflowItem,
} from '../types/ledger';
import { formatCompactKRW, formatKRW } from '../utils/ledgerMath';

interface CategoryDonutChartProps {
  items: CategoryBreakdownItem[];
  totalExpense: number;
  onSelectCategory?: (categoryId: string) => void;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  items,
  totalExpense,
  onSelectCategory,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (items.length === 0 || totalExpense <= 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium text-slate-700">
          이번 달 지출 내역이 아직 없습니다.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          지출을 기록하면 카테고리별 소비 비중 도넛 차트가 이곳에 표시됩니다.
        </p>
      </div>
    );
  }

  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  let accumulatedFraction = 0;

  const activeItem = items.find((i) => i.categoryId === hoveredId) ?? null;

  return (
    <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12">
      <div className="relative mx-auto flex items-center justify-center md:col-span-5">
        <svg
          viewBox="0 0 180 180"
          className="h-44 w-44 overflow-visible"
          role="img"
          aria-label={`카테고리별 지출 도넛 차트, 총 지출 ${formatKRW(totalExpense)}`}
        >
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#e6e2f3"
            strokeWidth="22"
          />
          {items.map((item) => {
            const fraction = item.amount / totalExpense;
            const dashLength = Math.max(0, fraction * circumference - 1.5);
            const dashOffset = -accumulatedFraction * circumference;
            accumulatedFraction += fraction;
            const isHovered = hoveredId === item.categoryId;

            return (
              <circle
                key={item.categoryId}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isHovered ? 26 : 22}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 90 90)"
                className="cursor-pointer transition-opacity duration-150"
                opacity={hoveredId && !isHovered ? 0.45 : 1}
                onMouseEnter={() => setHoveredId(item.categoryId)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectCategory?.(item.categoryId)}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="text-[11px] font-medium text-slate-500">
            {activeItem ? activeItem.label : '총 지출'}
          </span>
          <span className="mt-0.5 font-mono text-sm font-semibold text-slate-900 tabular-nums">
            {activeItem
              ? formatCompactKRW(activeItem.amount)
              : formatCompactKRW(totalExpense)}
          </span>
          <span className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
            {activeItem ? `${activeItem.sharePercent.toFixed(1)}%` : `${items.length}개 항목`}
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-100 md:col-span-7">
        {items.slice(0, 6).map((item) => {
          const isHovered = hoveredId === item.categoryId;
          return (
            <button
              key={item.categoryId}
              type="button"
              onMouseEnter={() => setHoveredId(item.categoryId)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectCategory?.(item.categoryId)}
              aria-label={`${item.label} 지출 ${formatKRW(item.amount)} (${item.sharePercent.toFixed(1)}%) 내역 보기`}
              className={`flex w-full items-center justify-between gap-3 py-2 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-teal-700 ${
                isHovered ? 'bg-slate-50' : 'hover:bg-slate-50/80'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="truncate text-xs font-medium text-slate-800">
                  {item.label}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  · {item.count}건
                </span>
              </div>
              <div className="flex shrink-0 items-baseline gap-2.5 font-mono text-xs tabular-nums">
                <span className="font-semibold text-slate-900">
                  {formatKRW(item.amount)}
                </span>
                <span className="w-11 text-right text-slate-500">
                  {item.sharePercent.toFixed(1)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface DailySpendingChartProps {
  dailyItems: DailyCashflowItem[];
  totalBudget: number;
}

export const DailySpendingChart: React.FC<DailySpendingChartProps> = ({
  dailyItems,
  totalBudget,
}) => {
  const defaultSelectedIndex = (() => {
    for (let i = dailyItems.length - 1; i >= 0; i--) {
      if (dailyItems[i].expense > 0 || dailyItems[i].income > 0) return i;
    }
    return 0;
  })();

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const activeIdx =
    selectedIdx !== null && selectedIdx < dailyItems.length
      ? selectedIdx
      : defaultSelectedIndex;
  const activeDay = dailyItems[activeIdx];

  const maxDailyExpense = Math.max(
    100000,
    ...dailyItems.map((d) => d.expense)
  );
  const maxCumulative = Math.max(
    totalBudget,
    ...dailyItems.map((d) => d.cumulativeExpense),
    100000
  );

  const svgWidth = 560;
  const svgHeight = 176;
  const padLeft = 8;
  const padRight = 8;
  const padTop = 14;
  const padBottom = 26;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const barStep = plotW / Math.max(1, dailyItems.length);
  const barWidth = Math.max(6, Math.min(12, barStep * 0.62));

  const cumulativePoints = dailyItems
    .map((item, idx) => {
      const cx = padLeft + idx * barStep + barStep / 2;
      const cy =
        padTop + plotH - (item.cumulativeExpense / maxCumulative) * plotH;
      return `${cx.toFixed(1)},${cy.toFixed(1)}`;
    })
    .join(' ');

  const budgetY =
    totalBudget > 0
      ? padTop + plotH - (totalBudget / maxCumulative) * plotH
      : null;

  return (
    <div>
      {activeDay && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {activeDay.date}
            </span>
            <span aria-hidden="true">·</span>
            <span>일 지출</span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {formatKRW(activeDay.expense)}
            </span>
            {activeDay.income > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>수입</span>
                <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                  +{formatKRW(activeDay.income)}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-teal-700" />
              <span>일별 지출</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-3 bg-amber-600" />
              <span>
                누적 {formatCompactKRW(activeDay.cumulativeExpense)}
              </span>
            </span>
          </div>
        </div>
      )}

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="h-44 w-full select-none"
        role="img"
        aria-label="일별 지출 막대 및 누적 예산 추이 차트"
      >
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padTop + plotH * (1 - ratio);
          return (
            <line
              key={ratio}
              x1={padLeft}
              x2={svgWidth - padRight}
              y1={y}
              y2={y}
              stroke="#e6e2f3"
              strokeWidth="1"
            />
          );
        })}

        {budgetY !== null && (
          <g>
            <line
              x1={padLeft}
              x2={svgWidth - padRight}
              y1={budgetY}
              y2={budgetY}
              stroke="#c4bfdd"
              strokeDasharray="4 3"
              strokeWidth="1"
            />
            <text
              x={svgWidth - padRight - 2}
              y={Math.max(11, budgetY - 4)}
              textAnchor="end"
              className="fill-slate-400 font-mono text-[9px]"
            >
              월 예산 {formatCompactKRW(totalBudget)}
            </text>
          </g>
        )}

        {dailyItems.map((item, idx) => {
          const x = padLeft + idx * barStep + (barStep - barWidth) / 2;
          const barH =
            item.expense > 0
              ? Math.max(3, (item.expense / maxDailyExpense) * (plotH * 0.88))
              : 2;
          const y = padTop + plotH - barH;
          const isSelected = idx === activeIdx;

          return (
            <g
              key={item.date}
              className="cursor-pointer"
              onMouseEnter={() => setSelectedIdx(idx)}
              onClick={() => setSelectedIdx(idx)}
            >
              <rect
                x={padLeft + idx * barStep}
                y={padTop}
                width={barStep}
                height={plotH + padBottom}
                fill="transparent"
              />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx="2"
                fill={
                  item.expense === 0
                    ? '#ddd9ee'
                    : isSelected
                      ? '#242749'
                      : '#345793'
                }
                opacity={item.expense === 0 ? 0.65 : isSelected ? 1 : 0.82}
              />
              {(item.day === 1 ||
                (item.day % 5 === 0 && dailyItems.length - item.day >= 2) ||
                item.day === dailyItems.length) && (
                <text
                  x={padLeft + idx * barStep + barStep / 2}
                  y={svgHeight - 7}
                  textAnchor="middle"
                  className={`font-mono text-[10px] ${
                    isSelected ? 'fill-slate-900 font-semibold' : 'fill-slate-400'
                  }`}
                >
                  {item.day}일
                </text>
              )}
            </g>
          );
        })}

        <polyline
          fill="none"
          stroke="#d9a92a"
          strokeWidth="1.75"
          points={cumulativePoints}
          className="pointer-events-none"
        />
      </svg>
    </div>
  );
};

interface PortfolioAllocationChartProps {
  allocations: {
    type: AssetType;
    label: string;
    amount: number;
    sharePercent: number;
    color: string;
  }[];
  totalValuation: number;
}

export const PortfolioAllocationChart: React.FC<PortfolioAllocationChartProps> = ({
  allocations,
  totalValuation,
}) => {
  const [hoveredType, setHoveredType] = useState<AssetType | null>(null);

  if (allocations.length === 0 || totalValuation <= 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-500">
        등록된 투자 자산이 없습니다.
      </div>
    );
  }

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let accumulatedFraction = 0;
  const activeItem = allocations.find((a) => a.type === hoveredType) ?? null;

  return (
    <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-12">
      <div className="relative mx-auto flex items-center justify-center sm:col-span-5">
        <svg
          viewBox="0 0 170 170"
          className="h-40 w-40 overflow-visible"
          role="img"
          aria-label={`투자 자산 배분 비중, 총 평가액 ${formatKRW(totalValuation)}`}
        >
          <circle
            cx="85"
            cy="85"
            r={radius}
            fill="none"
            stroke="#e6e2f3"
            strokeWidth="20"
          />
          {allocations.map((item) => {
            const fraction = item.amount / totalValuation;
            const dashLength = Math.max(0, fraction * circumference - 1.5);
            const dashOffset = -accumulatedFraction * circumference;
            accumulatedFraction += fraction;
            const isHovered = hoveredType === item.type;

            return (
              <circle
                key={item.type}
                cx="85"
                cy="85"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isHovered ? 24 : 20}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 85 85)"
                className="cursor-pointer transition-opacity duration-150"
                opacity={hoveredType && !isHovered ? 0.45 : 1}
                onMouseEnter={() => setHoveredType(item.type)}
                onMouseLeave={() => setHoveredType(null)}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
          <span className="text-[11px] font-medium text-slate-500">
            {activeItem ? activeItem.label : '총 평가액'}
          </span>
          <span className="mt-0.5 font-mono text-sm font-semibold text-slate-900 tabular-nums">
            {activeItem
              ? formatCompactKRW(activeItem.amount)
              : formatCompactKRW(totalValuation)}
          </span>
          <span className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
            {activeItem ? `${activeItem.sharePercent.toFixed(1)}%` : '포트폴리오'}
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-100 sm:col-span-7">
        {allocations.map((item) => {
          const isHovered = hoveredType === item.type;
          return (
            <div
              key={item.type}
              onMouseEnter={() => setHoveredType(item.type)}
              onMouseLeave={() => setHoveredType(null)}
              className={`flex items-center justify-between gap-3 py-2.5 transition-colors ${
                isHovered ? 'bg-slate-50' : ''
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold text-slate-800">
                  {item.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2.5 font-mono text-xs tabular-nums">
                <span className="font-semibold text-slate-900">
                  {formatKRW(item.amount)}
                </span>
                <span className="w-12 text-right text-slate-500">
                  {item.sharePercent.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface OverspendingCategoryItem {
  categoryId: string;
  label: string;
  color: string;
  amount: number;
  count: number;
  sharePercent: number;
}

interface OverspendingDonutChartProps {
  items: OverspendingCategoryItem[];
  totalOverspending: number;
  onSelectCategory?: (categoryId: string) => void;
}

export const OverspendingDonutChart: React.FC<OverspendingDonutChartProps> = ({
  items,
  totalOverspending,
  onSelectCategory,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (items.length === 0 || totalOverspending <= 0) {
    return null;
  }

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let accumulatedFraction = 0;
  const activeItem = items.find((i) => i.categoryId === hoveredId) ?? null;

  return (
    <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12 bg-white/80 rounded-xl p-4 border border-rose-200">
      <div className="relative mx-auto flex items-center justify-center sm:col-span-5">
        <svg
          viewBox="0 0 140 140"
          className="h-36 w-36 overflow-visible"
          role="img"
          aria-label={`과소비 영역별 도넛 차트, 총 ${formatKRW(totalOverspending)}`}
        >
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#fbe0d9"
            strokeWidth="18"
          />
          {items.map((item) => {
            const fraction = item.amount / totalOverspending;
            const dashLength = Math.max(0, fraction * circumference - 1);
            const dashOffset = -accumulatedFraction * circumference;
            accumulatedFraction += fraction;
            const isHovered = hoveredId === item.categoryId;

            return (
              <circle
                key={item.categoryId}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isHovered ? 22 : 18}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 70 70)"
                className="cursor-pointer transition-opacity duration-150"
                opacity={hoveredId && !isHovered ? 0.45 : 1}
                onMouseEnter={() => setHoveredId(item.categoryId)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectCategory?.(item.categoryId)}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
          <span className="text-[10px] font-bold text-rose-800 truncate max-w-[80px]">
            {activeItem ? activeItem.label : '최다 과소비'}
          </span>
          <span className="font-mono text-xs font-extrabold text-rose-950 tabular-nums">
            {activeItem
              ? formatCompactKRW(activeItem.amount)
              : formatCompactKRW(items[0]?.amount ?? totalOverspending)}
          </span>
          <span className="font-mono text-[10px] font-bold text-rose-700 tabular-nums">
            {activeItem ? `${activeItem.sharePercent.toFixed(1)}%` : `${items[0]?.sharePercent.toFixed(1)}%`}
          </span>
        </div>
      </div>

      <div className="divide-y divide-rose-100 sm:col-span-7">
        <div className="pb-1.5 flex items-center justify-between text-[11px] font-bold text-rose-900">
          <span>과소비 발생 영역 (카테고리)</span>
          <span>금액 및 비중</span>
        </div>
        {items.map((item, idx) => {
          const isHovered = hoveredId === item.categoryId;
          return (
            <div
              key={item.categoryId}
              onMouseEnter={() => setHoveredId(item.categoryId)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectCategory?.(item.categoryId)}
              className={`flex items-center justify-between gap-2 py-1.5 transition-colors cursor-pointer rounded px-1.5 ${
                isHovered ? 'bg-rose-100/70' : 'hover:bg-rose-50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="text-xs font-bold text-rose-950 truncate">
                  {idx === 0 && <span className="text-rose-600 mr-1">👑</span>}
                  {item.label}
                </span>
                <span className="text-[10px] text-rose-700 font-mono">
                  ({item.count}건)
                </span>
              </div>
              <div className="flex items-baseline gap-2 font-mono text-xs tabular-nums shrink-0">
                <span className="font-bold text-rose-950">
                  {formatKRW(item.amount)}
                </span>
                <span className="w-11 text-right font-bold text-rose-700">
                  {item.sharePercent.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

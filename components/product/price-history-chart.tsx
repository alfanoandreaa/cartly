"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAccent } from "@/components/providers/theme-provider";
import { accentById } from "@/lib/theme";
import { formatPrice } from "@/lib/utils";

export function PriceHistoryChart({ data }: { data: { date: string; price: number }[] }) {
  const { accent } = useAccent();
  const accentHex = accentById(accent).hex;

  if (!data.length) {
    return (
      <div className="grid h-52 place-items-center rounded-2xl border border-dashed border-line text-center text-sm text-muted">
        Price history will appear after Cartly completes its first checks.
      </div>
    );
  }

  const prices = data.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const current = prices.at(-1) ?? 0;

  return (
    <div>
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          ["CURRENT", current, "text-white"],
          ["LOWEST", min, "text-lime"],
          ["HIGHEST", max, "text-muted"]
        ].map(([label, value, color]) => (
          <div key={label as string}>
            <p className="text-[10px] font-bold tracking-[.14em] text-muted">{label as string}</p>
            <p className={`mt-1 text-lg font-bold ${color}`}>{formatPrice(value as number)}</p>
          </div>
        ))}
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentHex} stopOpacity={0.25} />
                <stop offset="95%" stopColor={accentHex} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#2e2e2e" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="date" stroke="#747474" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis domain={["dataMin - 30", "dataMax + 30"]} stroke="#747474" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#232323", border: "1px solid #353535", borderRadius: 12, fontSize: 12 }}
              formatter={(value: number) => [formatPrice(value), "Price"]}
            />
            <Area type="monotone" dataKey="price" stroke={accentHex} strokeWidth={2.5} fill="url(#priceFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

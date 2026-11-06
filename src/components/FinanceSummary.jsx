import { cardClass } from "./BusinessUI"
import { formatAmount } from "../lib/businessFinance"

export default function FinanceSummary({ summary, title = "Business sales audit", loading = false }) {
  return <section className="my-6" aria-label={title}>
    <h2 className="text-lg font-semibold text-white">{title}</h2>
    <p className="mt-1 text-sm text-[#777]">Cash-only launch view for the current POS rollout.</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className={cardClass}><p className="text-sm text-[#777]">Cash sales after refunds</p><p className="mt-3 text-2xl font-bold text-emerald-400">{loading ? "..." : formatAmount(summary.cashNet)} cash</p><p className="mt-2 text-xs text-[#AAA]">Sales: {formatAmount(summary.cashSales)} cash · Refunds: {formatAmount(summary.cashRefunds)} cash</p></div>
      <div className={cardClass}><p className="text-sm text-[#777]">Cash refunds</p><p className="mt-3 text-2xl font-bold text-[#F5C400]">{loading ? "..." : formatAmount(summary.cashRefunds)} cash</p><p className="mt-2 text-xs text-[#AAA]">Refunded transactions in the current filter</p></div>
      <div className={cardClass}><p className="text-sm text-[#777]">Completed cash sales</p><p className="mt-3 text-2xl font-bold text-white">{loading ? "..." : summary.salesCount.toLocaleString()}</p><p className="mt-2 text-xs text-[#AAA]">{summary.cashCount} cash transactions in the current view</p></div>
      <div className={cardClass}><p className="text-sm text-[#777]">Cash payment share</p><p className="mt-3 text-2xl font-bold text-white">{loading ? "..." : `${summary.cashCount ? Math.max(0, ((summary.cashCount / Math.max(summary.salesCount || 1, 1)) * 100)).toFixed(0) : 0}%`}</p><p className="mt-2 text-xs text-[#AAA]">Current launch mix for cashier-facing transactions</p></div>
    </div>
  </section>
}

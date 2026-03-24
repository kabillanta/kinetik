/* eslint-disable @typescript-eslint/no-explicit-any */

export default function StatCard({ label, value, icon: Icon }: any) {
  return (
    <div className="p-6 rounded-2xl border border-black/[0.04] bg-white flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[#86868B] text-xs uppercase tracking-widest font-semibold">
          {label}
        </div>
        {Icon && (
          <div className="p-2 bg-black/[0.03] rounded-xl text-black">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="text-4xl font-semibold text-black tracking-tight">
        {value}
      </div>
    </div>
  );
}

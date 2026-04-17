export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-y-auto overscroll-contain flex flex-col items-center bg-gradient-to-br from-[var(--teal-mist)] via-[var(--lavender-mist)] to-[var(--pink-mist)] px-4 py-6">
      <div className="w-full max-w-md my-auto">
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl overflow-hidden border-2 border-[#1D3557] shadow-lg mb-3">
            <img src="/app_logo.png" alt="CampusMarket" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl sm:text-2xl font-brand font-bold text-[#1D3557] tracking-tight">Campus Marketplace</h1>
          <p className="text-[#1D3557] text-xs sm:text-sm mt-1">ABV-IIITM Gwalior</p>
        </div>
        {children}
      </div>
    </div>
  );
}

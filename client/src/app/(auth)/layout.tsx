export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[var(--teal-mist)] via-[var(--lavender-mist)] to-[var(--pink-mist)] px-4 py-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--main)] border-2 border-[#1D3557] shadow-lg mb-3">
            <span className="text-2xl font-bold text-[#1D3557]">CM</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-brand font-bold text-[#1D3557] tracking-tight">Campus Marketplace</h1>
          <p className="text-[#1D3557] text-xs sm:text-sm mt-1">ABV-IIITM Gwalior</p>
        </div>
        {children}
      </div>
    </div>
  );
}

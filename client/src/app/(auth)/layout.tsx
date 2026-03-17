export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--teal-mist)] via-[var(--lavender-mist)] to-[var(--pink-mist)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--main)] border-2 border-[#1D3557] shadow-lg mb-4">
            <span className="text-2xl font-bold text-[#1D3557]">CM</span>
          </div>
          <h1 className="text-2xl font-brand font-bold text-[#1D3557] tracking-tight">Campus Marketplace</h1>
          <p className="text-[#1D3557] text-sm mt-1">ABV-IIITM Gwalior</p>
        </div>
        {children}
      </div>
    </div>
  );
}

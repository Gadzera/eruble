export function OrcaLogo({ className = "h-7 w-auto" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.png" alt="Орка" className={className} />;
}

export function OrcaWordmarkText({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-[-0.02em] text-foreground ${className}`}>
      Орка
    </span>
  );
}

export function OrcaWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <OrcaLogo className="h-8 w-auto" />
      <div className="flex flex-col leading-none gap-0.5">
        <OrcaWordmarkText className="text-[17px]" />
        <span className="text-[10.5px] text-muted-foreground tracking-wide uppercase">
          Цифровой рубль · B2B
        </span>
      </div>
    </div>
  );
}

/** Официальный знак Цифрового рубля Банка России */
export function DigitalRubleMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Цифровой рубль"
    >
      <circle cx="16" cy="16" r="15" stroke="#00843D" strokeWidth="2" fill="white" />
      <circle cx="16" cy="16" r="11.5" stroke="#00843D" strokeWidth="0.75" fill="none" />
      <text x="16" y="21" textAnchor="middle" fontSize="15" fontWeight="700" fontFamily="Arial, sans-serif" fill="#00843D">₽</text>
      <line x1="10" y1="21.5" x2="22" y2="21.5" stroke="#00843D" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function DigitalRubleBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <DigitalRubleMark className="h-5 w-5" />
      <span className="text-[11px] font-semibold text-[#00843D] tracking-wide">Цифровой рубль</span>
    </div>
  );
}

export function OrcaWordmark({ className = "", large = false }: { className?: string; large?: boolean }) {
  if (large) {
    // Login page: square icon + wordmark stacked right
    return (
      <div className={`flex items-center gap-5 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt=""
          aria-hidden
          className="h-24 w-24 rounded-3xl shrink-0"
          style={{ mixBlendMode: "multiply" }}
        />
        <div className="flex flex-col gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo2.png"
            alt="Орка"
            className="h-14 w-auto"
            style={{ objectFit: "contain", objectPosition: "left center", mixBlendMode: "multiply" }}
          />
          <span className="text-[13px] text-muted-foreground tracking-widest uppercase font-medium">
            Цифровой рубль · B2B
          </span>
        </div>
      </div>
    );
  }

  // Dashboard sidebar: original layout, logo2.png only
  return (
    <div className={`flex flex-col leading-none gap-1 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo2.png"
        alt="Орка"
        className="h-8 w-auto"
        style={{ mixBlendMode: "multiply" }}
      />
      <span className="text-[10.5px] text-muted-foreground tracking-wide uppercase">
        Цифровой рубль · B2B
      </span>
    </div>
  );
}

export function OrcaWordmarkText({ className = "" }: { className?: string }) {
  return (
    <span className={`font-black tracking-[-0.03em] text-foreground ${className}`}>
      О₽ка
    </span>
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

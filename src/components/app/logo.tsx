/** Иконка — синий квадрат с волной и горизонтальной полосой */
export function OrcaLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Орка">
      <rect width="100" height="100" rx="22" fill="url(#orca-bg)" />
      <path
        d="M15 63 L29 38 L43 58 L57 38 L72 58"
        stroke="white" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M18 72 L74 27"
        stroke="white" strokeWidth="9.5" strokeLinecap="round"
      />
      <rect x="19" y="81" width="62" height="10" rx="5" fill="white" />
      <defs>
        <linearGradient id="orca-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4B60FF" />
          <stop offset="1" stopColor="#2318B0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function OrcaWordmarkText({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-[-0.02em] text-foreground ${className}`}>
      О<span className="text-[0.92em]">₽</span>ка
    </span>
  );
}

export function OrcaWordmark({ className = "", large = false }: { className?: string; large?: boolean }) {
  if (large) {
    // Страница входа: PNG-иконка + PNG-название
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

  // Дашборд (сайдбар): logo.png + текст «Орка»
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" aria-hidden className="h-12 w-12 rounded-2xl shrink-0" />
      <div className="flex flex-col leading-none gap-0.5">
        <span className="text-[17px] font-bold tracking-[-0.02em] text-foreground">Орка</span>
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

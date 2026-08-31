"use client";

const CATEGORY_HEX = {
  "Ménage": "#78350F",
  "Grillade": "#B45309",
  "Industriel": "#57534E",
  "Écologique": "#16A34A",
};

/**
 * Illustration de sac de charbon dessinée à la main (SVG), utilisée en
 * attendant que le vendeur ajoute une vraie photo de son produit.
 * Nettement plus soignée qu'une icône générique posée sur un fond uni.
 */
export function SackIllustration({ category, Icon }) {
  const color = CATEGORY_HEX[category] || "#78350F";
  const uid = category.replace(/[^a-zA-Z]/g, "");

  return (
    <svg viewBox="0 0 240 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.14" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={`sack-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.75" />
        </linearGradient>
        <pattern id={`hatch-${uid}`} width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="7" stroke="#FAFAF9" strokeOpacity="0.18" strokeWidth="2" />
        </pattern>
      </defs>

      <rect width="240" height="180" fill={`url(#bg-${uid})`} />

      {/* ombre au sol */}
      <ellipse cx="120" cy="152" rx="58" ry="8" fill={color} opacity="0.12" />

      {/* corps du sac */}
      <path
        d="M78 62 C74 100 70 120 84 148 C96 158 144 158 156 148 C170 120 166 100 162 62 Z"
        fill={`url(#sack-${uid})`}
      />
      <path
        d="M78 62 C74 100 70 120 84 148 C96 158 144 158 156 148 C170 120 166 100 162 62 Z"
        fill={`url(#hatch-${uid})`}
      />
      {/* col noué en haut */}
      <path d="M96 46 C96 60 92 62 92 62 L148 62 C148 62 144 60 144 46 Z" fill={color} opacity="0.9" />
      <ellipse cx="120" cy="46" rx="24" ry="8" fill={color} />
      <path d="M104 40 Q120 30 136 40" stroke="#FAFAF9" strokeOpacity="0.5" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* couture centrale */}
      <path d="M120 66 L120 150" stroke="#FAFAF9" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="3 4" />

      {/* étiquette avec icône de catégorie */}
      <g transform="translate(120,108)">
        <circle r="22" fill="#FAFAF9" opacity="0.95" />
        <circle r="22" fill="none" stroke={color} strokeOpacity="0.3" strokeWidth="1.5" />
        <foreignObject x="-12" y="-12" width="24" height="24">
          <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", color }}>
            <Icon size={16} />
          </div>
        </foreignObject>
      </g>
    </svg>
  );
}

/**
 * Illustration de fond du héros : sacs empilés + braises qui montent.
 * Remplace un simple dégradé générique par une scène dessinée pour la marque.
 */
export function HeroIllustration() {
  return (
    <svg viewBox="0 0 480 320" className="w-full h-full" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="heroGlow" x1="0.3" y1="1" x2="0.7" y2="0">
          <stop offset="0%" stopColor="#B45309" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#B45309" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sackA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#5C2E0A" />
        </linearGradient>
        <linearGradient id="sackB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#92400E" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>

      <ellipse cx="240" cy="300" rx="220" ry="60" fill="url(#heroGlow)" />

      {/* sac arrière gauche */}
      <path d="M60 260 C56 230 58 205 68 190 C80 182 110 182 122 190 C132 205 134 230 130 260 C118 270 72 270 60 260 Z" fill="url(#sackB)" opacity="0.8" />
      {/* sac arrière droit */}
      <path d="M350 265 C346 232 349 205 360 188 C374 179 406 179 419 188 C430 205 432 232 428 265 C414 276 364 276 350 265 Z" fill="url(#sackB)" opacity="0.85" />
      {/* sac principal, au centre */}
      <path d="M175 300 C168 250 172 210 190 185 C210 172 270 172 290 185 C308 210 312 250 305 300 C284 316 196 316 175 300 Z" fill="url(#sackA)" />
      <path d="M205 178 C205 165 200 160 200 160 L280 160 C280 160 275 165 275 178 Z" fill="#5C2E0A" />
      <ellipse cx="240" cy="160" rx="38" ry="10" fill="#5C2E0A" />
      <path d="M215 300 C215 260 218 225 225 200" stroke="#FAFAF9" strokeOpacity="0.12" strokeWidth="3" fill="none" />
      <path d="M255 300 C255 260 258 225 265 200" stroke="#FAFAF9" strokeOpacity="0.12" strokeWidth="3" fill="none" />

      {/* braises qui montent */}
      {[
        [150, 150, 4], [320, 170, 3], [240, 120, 5], [200, 90, 3],
        [280, 100, 4], [240, 60, 3], [170, 200, 3], [310, 220, 3],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="#D97706" opacity="0.85">
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur={`${2.4 + (i % 3)}s`} repeatCount="indefinite" begin={`${i * 0.3}s`} />
        </circle>
      ))}
    </svg>
  );
}

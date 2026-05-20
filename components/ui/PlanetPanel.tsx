'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { getPlanet, ORBITING, type Planet } from '@/lib/planets';

const tabs = ['Overview', 'Composition', 'Moons', 'Fun Facts'] as const;
type Tab = typeof tabs[number];

import { EASE, EASE_OUT } from '@/lib/motion';

const panelMotion = {
  initial: { x: 480, opacity: 0, filter: 'blur(20px)' },
  animate: { x: 0, opacity: 1, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE } },
  exit:    { x: 480, opacity: 0, filter: 'blur(20px)', transition: { duration: 0.4, ease: EASE_OUT } },
};

export default function PlanetPanel() {
  const selectedId = useStore(s => s.selectedId);
  const setSelected = useStore(s => s.setSelected);
  const planet = getPlanet(selectedId);
  const [tab, setTab] = useState<Tab>('Overview');

  return (
    <AnimatePresence mode="wait">
      {planet && (
        <motion.aside
          key={planet.id}
          {...panelMotion}
          className="fixed top-0 right-0 bottom-0 z-30 w-full md:w-[440px] lg:w-[480px] p-4 md:p-5 flex pointer-events-none"
        >
          <div className="glass-strong relative w-full rounded-3xl overflow-hidden flex flex-col pointer-events-auto">
            {/* Planet color accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${planet.color.glow}, transparent)` }}
            />
            {/* Glow blob */}
            <div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-40 blur-3xl pointer-events-none"
              style={{ background: planet.color.glow }}
            />

            <header className="relative p-6 md:p-7 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                  className="text-[10px] uppercase tracking-[0.4em] text-white/50 mb-2"
                >
                  {planet.tagline}
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.28 } }}
                  className="text-4xl md:text-5xl font-light text-gradient leading-none"
                >
                  {planet.name}
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.5 } }}
                  className="mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/55"
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: planet.color.glow, boxShadow: `0 0 10px ${planet.color.glow}` }}
                  />
                  {planet.type === 'star' ? 'G-type Star' :
                   planet.type === 'rocky' ? 'Terrestrial' :
                   planet.type === 'gas' ? 'Gas Giant' : 'Ice Giant'}
                </motion.div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-9 h-9 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 transition flex items-center justify-center text-white/70 hover:text-white"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            {/* Tabs */}
            <div className="px-6 md:px-7 flex gap-1 border-b border-white/5">
              {tabs.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`relative px-3 py-3 text-[11px] uppercase tracking-[0.25em] transition-colors
                    ${tab === t ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                >
                  {t}
                  {tab === t && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute left-2 right-2 -bottom-px h-[2px] rounded-full"
                      style={{ background: planet.color.glow, boxShadow: `0 0 8px ${planet.color.glow}` }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-6 md:px-7 pt-6 md:pt-7 pb-16 md:pb-20">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                >
                  {tab === 'Overview' && (
                    <div className="space-y-6">
                      <p className="text-white/75 text-[14px] leading-relaxed">{planet.description}</p>

                      {planet.signature && (
                        <SignatureLine text={planet.signature} accent={planet.color.glow} />
                      )}

                      <StatGrid planet={planet} />

                      {planet.id !== 'earth' && <SizeVsEarth planet={planet} />}

                      <AxialTiltCard planet={planet} />

                      {planet.id !== 'sun' && <DistanceStrip planet={planet} />}

                      {planet.id !== 'earth' && <TravelTime planet={planet} />}

                      {planet.missions && planet.missions.length > 0 && (
                        <MissionsChips missions={planet.missions} accent={planet.color.glow} />
                      )}
                    </div>
                  )}

                  {tab === 'Composition' && (
                    <div className="space-y-5">
                      <Row label="Composition" value={planet.facts.composition} />
                      <Row label="Diameter" value={planet.facts.diameter} />
                      <Row label="Mass" value={planet.facts.mass} />
                      <Row label="Gravity" value={planet.facts.gravity} />
                      <Row label="Surface Temp" value={planet.facts.temperature} />
                      <Row label="Discovered" value={planet.facts.discovered} />
                      <CompositionBar planet={planet} />
                    </div>
                  )}

                  {tab === 'Moons' && (
                    <div>
                      <div className="text-white/60 text-sm mb-4">
                        Known natural satellites: <span className="text-white">{planet.facts.moons}</span>
                      </div>
                      {planet.moons && planet.moons.length > 0 ? (
                        <ul className="space-y-2.5">
                          {planet.moons.map(m => (
                            <li key={m.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] transition">
                              <div className="w-7 h-7 rounded-full shrink-0" style={{
                                background: `radial-gradient(circle at 30% 30%, ${m.color}, #000)`,
                                boxShadow: `0 0 10px ${m.color}40`,
                              }} />
                              <div className="flex-1">
                                <div className="text-white/95 font-medium">{m.name}</div>
                                <div className="text-[11px] uppercase tracking-widest text-white/45">
                                  r: {m.radius.toFixed(2)} · orbit: {m.distance.toFixed(1)}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-white/45 italic">No moons in this system.</div>
                      )}
                    </div>
                  )}

                  {tab === 'Fun Facts' && (
                    <ul className="space-y-3">
                      {planet.funFacts.map((f, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0, transition: { delay: i * 0.08 } }}
                          className="flex gap-3 p-3.5 rounded-2xl border border-white/8 bg-white/[0.03]"
                        >
                          <div className="text-cosmos-accent font-mono text-xs pt-0.5">{String(i+1).padStart(2,'0')}</div>
                          <div className="text-white/80 text-[14px] leading-relaxed">{f}</div>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
      <span className="text-[11px] uppercase tracking-[0.25em] text-white/45">{label}</span>
      <span className="text-white/90 text-sm font-mono text-right">{value}</span>
    </div>
  );
}

function StatGrid({ planet }: { planet: Planet }) {
  const stats = [
    { l: 'Diameter', v: planet.facts.diameter },
    { l: 'Gravity', v: planet.facts.gravity },
    { l: 'Day Length', v: planet.facts.day },
    { l: 'Year Length', v: planet.facts.year },
    { l: 'Distance', v: planet.facts.distanceFromSun },
    { l: 'Moons', v: planet.facts.moons },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((s, i) => (
        <motion.div
          key={s.l}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.05 * i + 0.2 } }}
          className="p-3.5 rounded-2xl border border-white/8 bg-white/[0.025] hover:bg-white/[0.05] transition"
        >
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/45 mb-1">{s.l}</div>
          <div className="text-white/95 text-sm font-mono break-words">{s.v}</div>
        </motion.div>
      ))}
    </div>
  );
}

function CompositionBar({ planet }: { planet: Planet }) {
  const segs =
    planet.type === 'star' ? [['Hydrogen', 73, '#fde68a'], ['Helium', 25, '#fb923c'], ['Other', 2, '#fda4af']]
    : planet.type === 'gas' ? [['Hydrogen', 90, '#fde68a'], ['Helium', 8, '#fbcfe8'], ['Other', 2, '#a78bfa']]
    : planet.type === 'ice' ? [['Hydrogen', 80, '#a5f3fc'], ['Helium', 10, '#93c5fd'], ['Methane', 10, '#c4b5fd']]
    : [['Iron', 32, '#fb923c'], ['Oxygen', 30, '#7dd3fc'], ['Silicon', 15, '#a78bfa'], ['Other', 23, '#94a3b8']];

  return (
    <div className="mt-2">
      <div className="text-[10px] uppercase tracking-[0.25em] text-white/45 mb-2">Estimated Composition</div>
      <div className="flex h-2 rounded-full overflow-hidden border border-white/10">
        {segs.map(([name, pct, c]) => (
          <div key={name as string} title={`${name} ${pct}%`} style={{ width: `${pct}%`, background: c as string }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-[11px]">
        {segs.map(([name, pct, c]) => (
          <div key={name as string} className="flex items-center gap-1.5 text-white/65">
            <span className="w-2 h-2 rounded-full" style={{ background: c as string }} />
            <span className="text-white/80">{name as string}</span>
            <span className="text-white/40 font-mono">{pct as number}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Overview widgets ─────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2">{children}</div>
  );
}

function SignatureLine({ text, accent }: { text: string; accent: string }) {
  return (
    <div className="flex gap-3 items-stretch">
      <span
        className="w-0.5 rounded-full shrink-0 self-stretch my-1"
        style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
      />
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-0.5">Signature feature</div>
        <div className="text-white/85 text-[13px] leading-snug">{text}</div>
      </div>
    </div>
  );
}

function SizeVsEarth({ planet }: { planet: Planet }) {
  const ratio = planet.metrics.diameterEarth;
  const isEarth = planet.id === 'earth';
  const earth = getPlanet('earth');
  const earthDiameter = earth?.facts.diameter ?? '12,742 km';

  // Hero-sized layout (full panel width)
  const maxR = planet.id === 'sun' ? 64 : 55;
  const biggest = Math.max(1, ratio);
  const earthPx = Math.max((1 / biggest) * maxR, 4);
  const planetPx = Math.max((ratio / biggest) * maxR, 6);

  const ring = planet.ring;
  const ringRx = ring ? planetPx * 1.75 : 0;
  const ringRy = ringRx * 0.22;
  const ringTiltDeg = -16;

  const w = 440;
  const h = 210;
  const earthCx = 70;
  const planetCx = 330;
  const cy = 70;

  const gradId = `pg-${planet.id}`;
  const bandId = `pb-${planet.id}`;
  const clipId = `pc-${planet.id}`;
  const earthGradId = `eg-${planet.id}`;
  const coronaId = `corona-${planet.id}`;
  const plasmaId = `plasma-${planet.id}`;
  const showBands = planet.type === 'gas' || planet.type === 'ice';
  const isStar = planet.type === 'star';

  // Center multiplier badge sits between the two bodies, on the dashed connector.
  const badgeCx = (earthCx + planetCx) / 2;

  return (
    <div className="p-4 rounded-2xl border border-white/8 bg-white/[0.025] relative overflow-hidden">
      {/* Soft corner glow in the planet's accent color */}
      <div
        className="absolute -top-20 -right-20 w-44 h-44 rounded-full opacity-[0.09] blur-3xl pointer-events-none"
        style={{ background: planet.color.glow }}
      />

      <div className="flex items-baseline justify-between mb-1 relative">
        <SectionLabel>Size vs Earth</SectionLabel>
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/35">true scale</div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[200px] block" preserveAspectRatio="xMidYMid meet">
        <defs>
          <clipPath id={earthGradId}>
            <circle cx={earthCx} cy={cy} r={earthPx} />
          </clipPath>
          <radialGradient id={`${earthGradId}-shade`} cx="32%" cy="30%">
            <stop offset="0%" stopColor="white" stopOpacity="0.32" />
            <stop offset="55%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="0.55" />
          </radialGradient>
          {isStar ? (
            <>
              <radialGradient id={gradId} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#ffd06a" />
                <stop offset="40%" stopColor={planet.color.primary} />
                <stop offset="80%" stopColor={planet.color.secondary} />
                <stop offset="100%" stopColor="#c8500a" />
              </radialGradient>
              <radialGradient id={coronaId} cx="50%" cy="50%">
                <stop offset="55%" stopColor={planet.color.glow} stopOpacity="0.5" />
                <stop offset="80%" stopColor={planet.color.glow} stopOpacity="0.15" />
                <stop offset="100%" stopColor={planet.color.glow} stopOpacity="0" />
              </radialGradient>
              {/* Yellow granulation — subtle bright patches over the orange base */}
              <filter id={plasmaId} x="0%" y="0%" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="3" seed="5" />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 1
                          0 0 0 0 0.82
                          0 0 0 0 0.30
                          0 0 0 1.1 -0.40"
                />
              </filter>
            </>
          ) : (
            <radialGradient id={gradId} cx="32%" cy="30%">
              <stop offset="0%" stopColor={planet.color.primary} />
              <stop offset="78%" stopColor={planet.color.secondary} />
              <stop offset="100%" stopColor="#000" />
            </radialGradient>
          )}
          {showBands && (
            <linearGradient id={bandId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="30%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="50%" stopColor="rgba(0,0,0,0.22)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
          )}
          <clipPath id={clipId}>
            <circle cx={planetCx} cy={cy} r={planetPx} />
          </clipPath>
        </defs>

        {/* Dashed connector between bodies */}
        <line
          x1={earthCx + earthPx + 6}
          y1={cy}
          x2={badgeCx - 32}
          y2={cy}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1}
          strokeDasharray="2 4"
        />
        <line
          x1={badgeCx + 32}
          y1={cy}
          x2={planetCx - planetPx - (ring ? ringRx - planetPx + 6 : 6)}
          y2={cy}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1}
          strokeDasharray="2 4"
        />

        {/* Back half of ring (behind planet) */}
        {ring && (
          <g transform={`rotate(${ringTiltDeg} ${planetCx} ${cy})`}>
            <path
              d={`M ${planetCx - ringRx} ${cy} A ${ringRx} ${ringRy} 0 0 1 ${planetCx + ringRx} ${cy}`}
              stroke={ring.color}
              strokeWidth={2.2}
              fill="none"
              opacity={ring.opacity * 0.75}
            />
            <path
              d={`M ${planetCx - ringRx * 0.86} ${cy} A ${ringRx * 0.86} ${ringRy * 0.86} 0 0 1 ${planetCx + ringRx * 0.86} ${cy}`}
              stroke={ring.color}
              strokeWidth={1}
              fill="none"
              opacity={ring.opacity * 0.45}
            />
          </g>
        )}

        {/* Earth — real Blue Marble day map, clipped to a sphere */}
        <g clipPath={`url(#${earthGradId})`}>
          <image
            href="/textures/earth/2k_earth_daymap.jpg"
            x={earthCx - earthPx * 1.8}
            y={cy - earthPx}
            width={earthPx * 3.6}
            height={earthPx * 2}
            preserveAspectRatio="xMidYMid slice"
          />
          {/* Sphere shading — bright top-left, dark bottom-right */}
          <circle cx={earthCx} cy={cy} r={earthPx} fill={`url(#${earthGradId}-shade)`} />
        </g>
        {/* Subtle outer atmosphere halo */}
        <circle
          cx={earthCx}
          cy={cy}
          r={earthPx + 1.5}
          fill="none"
          stroke="#7cb6ff"
          strokeWidth={1}
          opacity={0.35}
        />

        {/* Planet body — Sun gets corona + plasma texture (self-luminous), planets get sphere shading */}
        {isStar ? (
          <>
            {/* Corona */}
            <circle cx={planetCx} cy={cy} r={planetPx * 1.38} fill={`url(#${coronaId})`} />
            {/* Body */}
            <circle cx={planetCx} cy={cy} r={planetPx} fill={`url(#${gradId})`} />
            {/* Plasma granulation — subtle yellow hot spots */}
            <g clipPath={`url(#${clipId})`}>
              <rect
                x={planetCx - planetPx}
                y={cy - planetPx}
                width={planetPx * 2}
                height={planetPx * 2}
                filter={`url(#${plasmaId})`}
                opacity={0.50}
                style={{ mixBlendMode: 'screen' }}
              />
            </g>
            {/* Warm limb so the body stays defined */}
            <circle
              cx={planetCx}
              cy={cy}
              r={planetPx}
              fill="none"
              stroke={planet.color.secondary}
              strokeWidth={1}
              opacity={0.45}
            />
          </>
        ) : (
          <>
            <circle cx={planetCx} cy={cy} r={planetPx} fill={`url(#${gradId})`} />
            {showBands && (
              <circle cx={planetCx} cy={cy} r={planetPx} fill={`url(#${bandId})`} clipPath={`url(#${clipId})`} />
            )}
            {/* Specular highlight */}
            <circle
              cx={planetCx - planetPx * 0.32}
              cy={cy - planetPx * 0.32}
              r={planetPx * 0.26}
              fill="white"
              opacity={0.22}
            />
            {/* Limb shadow */}
            <circle
              cx={planetCx + planetPx * 0.07}
              cy={cy + planetPx * 0.07}
              r={planetPx}
              fill="black"
              opacity={0.18}
              clipPath={`url(#${clipId})`}
            />
          </>
        )}

        {/* Front half of ring (over planet) */}
        {ring && (
          <g transform={`rotate(${ringTiltDeg} ${planetCx} ${cy})`}>
            <path
              d={`M ${planetCx - ringRx} ${cy} A ${ringRx} ${ringRy} 0 0 0 ${planetCx + ringRx} ${cy}`}
              stroke={ring.color}
              strokeWidth={2.2}
              fill="none"
              opacity={ring.opacity}
            />
            <path
              d={`M ${planetCx - ringRx * 0.86} ${cy} A ${ringRx * 0.86} ${ringRy * 0.86} 0 0 0 ${planetCx + ringRx * 0.86} ${cy}`}
              stroke={ring.color}
              strokeWidth={1}
              fill="none"
              opacity={ring.opacity * 0.6}
            />
          </g>
        )}

        {/* Center multiplier badge */}
        <g>
          <rect
            x={badgeCx - 30}
            y={cy - 13}
            width={60}
            height={26}
            rx={13}
            fill="rgba(8,12,28,0.85)"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={1}
          />
          <text
            x={badgeCx}
            y={cy + 5}
            textAnchor="middle"
            fill="white"
            fontSize="13"
            fontFamily="ui-monospace, SFMono-Regular, monospace"
            letterSpacing="0.5"
          >
            {isEarth ? '1.00×' : `${ratio.toFixed(2)}×`}
          </text>
        </g>

        {/* Labels — below each body */}
        <text
          x={earthCx}
          y={h - 36}
          textAnchor="middle"
          fill="rgba(255,255,255,0.92)"
          fontSize="16"
          fontWeight="500"
          letterSpacing="2"
        >
          EARTH
        </text>
        <text
          x={earthCx}
          y={h - 12}
          textAnchor="middle"
          fill="rgba(255,255,255,0.85)"
          fontSize="16"
          fontWeight="500"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          {earthDiameter}
        </text>
        <text
          x={planetCx}
          y={h - 36}
          textAnchor="middle"
          fill="rgba(255,255,255,1)"
          fontSize="16"
          fontWeight="500"
          letterSpacing="2"
        >
          {planet.name.toUpperCase()}
        </text>
        <text
          x={planetCx}
          y={h - 12}
          textAnchor="middle"
          fill={planet.color.glow}
          fontSize="16"
          fontWeight="500"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          {planet.facts.diameter}
        </text>
      </svg>
    </div>
  );
}

function AxialTiltCard({ planet }: { planet: Planet }) {
  const deg = (planet.axialTilt * 180) / Math.PI;
  const comparison = tiltComparison(planet.id, deg);

  const w = 120;
  const h = 120;
  const cx = w / 2;
  const cy = h / 2;
  const r = 22;
  const len = 42;
  const rad = planet.axialTilt - Math.PI / 2;
  const x1 = cx + Math.cos(rad) * len;
  const y1 = cy + Math.sin(rad) * len;
  const x2 = cx - Math.cos(rad) * len;
  const y2 = cy - Math.sin(rad) * len;

  // Arc from vertical reference to the current tilt
  const arcR = 26;
  const arcEndX = cx + Math.cos(-Math.PI / 2 + planet.axialTilt) * arcR;
  const arcEndY = cy + Math.sin(-Math.PI / 2 + planet.axialTilt) * arcR;
  const largeArc = planet.axialTilt > Math.PI ? 1 : 0;

  const isEarth = planet.id === 'earth';
  const isStar = planet.type === 'star';
  const showBands = planet.type === 'gas' || planet.type === 'ice';
  const ring = planet.ring;
  // Ring lies in the equatorial plane — perpendicular to the axis, so it rotates with the tilt.
  const ringTiltDeg = deg;
  const ringRx = ring ? r * 1.7 : 0;
  const ringRy = ringRx * 0.22;

  const gradId = `tilt-grad-${planet.id}`;
  const bandId = `tilt-band-${planet.id}`;
  const clipId = `tilt-clip-${planet.id}`;
  const earthShadeId = `tilt-earth-shade-${planet.id}`;
  const coronaId = `tilt-corona-${planet.id}`;
  const plasmaId = `tilt-plasma-${planet.id}`;

  return (
    <div className="p-4 rounded-2xl border border-white/8 bg-white/[0.025] flex items-center gap-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-[110px] h-[110px] shrink-0">
        <defs>
          {isStar ? (
            <>
              <radialGradient id={gradId} cx="50%" cy="50%">
                <stop offset="0%" stopColor="#ffd06a" />
                <stop offset="40%" stopColor={planet.color.primary} />
                <stop offset="80%" stopColor={planet.color.secondary} />
                <stop offset="100%" stopColor="#c8500a" />
              </radialGradient>
              <radialGradient id={coronaId} cx="50%" cy="50%">
                <stop offset="55%" stopColor={planet.color.glow} stopOpacity="0.5" />
                <stop offset="80%" stopColor={planet.color.glow} stopOpacity="0.15" />
                <stop offset="100%" stopColor={planet.color.glow} stopOpacity="0" />
              </radialGradient>
              <filter id={plasmaId} x="0%" y="0%" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.30" numOctaves="3" seed="5" />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 1
                          0 0 0 0 0.82
                          0 0 0 0 0.30
                          0 0 0 1.1 -0.40"
                />
              </filter>
            </>
          ) : (
            <radialGradient id={gradId} cx="32%" cy="30%">
              <stop offset="0%" stopColor={planet.color.primary} />
              <stop offset="78%" stopColor={planet.color.secondary} />
              <stop offset="100%" stopColor="#000" />
            </radialGradient>
          )}
          {showBands && (
            <linearGradient id={bandId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="30%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="50%" stopColor="rgba(0,0,0,0.22)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
          )}
          <clipPath id={clipId}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
          {isEarth && (
            <radialGradient id={earthShadeId} cx="32%" cy="30%">
              <stop offset="0%" stopColor="white" stopOpacity="0.32" />
              <stop offset="55%" stopColor="white" stopOpacity="0" />
              <stop offset="100%" stopColor="black" stopOpacity="0.55" />
            </radialGradient>
          )}
        </defs>

        {/* Vertical reference */}
        <line
          x1={cx}
          y1={cy - 50}
          x2={cx}
          y2={cy + 50}
          stroke="white"
          strokeOpacity={0.55}
          strokeWidth={1.2}
          strokeDasharray="3 3"
        />
        {/* Tilt arc indicator */}
        <path
          d={`M ${cx} ${cy - arcR} A ${arcR} ${arcR} 0 ${largeArc} 1 ${arcEndX} ${arcEndY}`}
          fill="none"
          stroke={planet.color.glow}
          strokeWidth={1}
          opacity={0.45}
        />

        {/* Back half of ring (behind planet) */}
        {ring && (
          <g transform={`rotate(${ringTiltDeg} ${cx} ${cy})`}>
            <path
              d={`M ${cx - ringRx} ${cy} A ${ringRx} ${ringRy} 0 0 1 ${cx + ringRx} ${cy}`}
              stroke={ring.color}
              strokeWidth={1.6}
              fill="none"
              opacity={ring.opacity * 0.7}
            />
          </g>
        )}

        {/* Planet body — Blue Marble for Earth, plasma + corona for the Sun, procedural elsewhere */}
        {isEarth ? (
          <g clipPath={`url(#${clipId})`}>
            <image
              href="/textures/earth/2k_earth_daymap.jpg"
              x={cx - r * 1.8}
              y={cy - r}
              width={r * 3.6}
              height={r * 2}
              preserveAspectRatio="xMidYMid slice"
            />
            <circle cx={cx} cy={cy} r={r} fill={`url(#${earthShadeId})`} />
          </g>
        ) : isStar ? (
          <>
            <circle cx={cx} cy={cy} r={r * 1.38} fill={`url(#${coronaId})`} />
            <circle cx={cx} cy={cy} r={r} fill={`url(#${gradId})`} />
            <g clipPath={`url(#${clipId})`}>
              <rect
                x={cx - r}
                y={cy - r}
                width={r * 2}
                height={r * 2}
                filter={`url(#${plasmaId})`}
                opacity={0.50}
                style={{ mixBlendMode: 'screen' }}
              />
            </g>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={planet.color.secondary}
              strokeWidth={1}
              opacity={0.45}
            />
          </>
        ) : (
          <>
            <circle cx={cx} cy={cy} r={r} fill={`url(#${gradId})`} />
            {showBands && (
              <circle cx={cx} cy={cy} r={r} fill={`url(#${bandId})`} clipPath={`url(#${clipId})`} />
            )}
            {/* Specular highlight + limb shadow for sphere depth */}
            <circle cx={cx - r * 0.32} cy={cy - r * 0.32} r={r * 0.24} fill="white" opacity={0.20} />
            <circle
              cx={cx + r * 0.07}
              cy={cy + r * 0.07}
              r={r}
              fill="black"
              opacity={0.18}
              clipPath={`url(#${clipId})`}
            />
          </>
        )}

        {/* Front half of ring (over planet) */}
        {ring && (
          <g transform={`rotate(${ringTiltDeg} ${cx} ${cy})`}>
            <path
              d={`M ${cx - ringRx} ${cy} A ${ringRx} ${ringRy} 0 0 0 ${cx + ringRx} ${cy}`}
              stroke={ring.color}
              strokeWidth={1.6}
              fill="none"
              opacity={ring.opacity}
            />
          </g>
        )}

        {/* Tilted axis (drawn last so it sits over everything) */}
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={planet.color.glow} strokeWidth={2} strokeLinecap="round" />
        <circle cx={x1} cy={y1} r={2.6} fill={planet.color.glow} />
        <circle cx={x2} cy={y2} r={2.6} fill={planet.color.glow} />
      </svg>
      <div className="flex-1 min-w-0">
        <SectionLabel>Axial tilt</SectionLabel>
        <div className="text-3xl font-light text-white/95 leading-none mb-1.5 tabular-nums">
          {deg.toFixed(1)}
          <span className="text-white/45 text-lg ml-0.5">°</span>
        </div>
        <div className="text-[11px] text-white/55 leading-relaxed">{comparison}</div>
      </div>
    </div>
  );
}

function tiltComparison(id: string, deg: number) {
  if (id === 'sun') return 'The Sun rotates with a gentle 7° tilt relative to the solar system\'s plane.';
  if (id === 'earth') return '23.5° gives Earth its four seasons.';
  if (id === 'venus') return 'Venus spins upside-down — the apparent 177° is its inverted rotation.';
  if (id === 'uranus') return 'Tilted on its side — it rolls along its orbit like a barrel.';
  if (deg < 5) return 'Barely tilted — no real seasonal cycle.';
  if (Math.abs(deg - 23.5) < 5) return 'Almost identical to Earth — would produce Earth-like seasons.';
  if (deg > 80 && deg < 120) return 'Tilted nearly sideways — extreme polar day/night cycles.';
  if (deg > 30) return 'Steeper than Earth — produces sharper seasons.';
  return 'Less tilted than Earth — milder seasonal variation.';
}

function DistanceStrip({ planet }: { planet: Planet }) {
  const maxAU = 30.05; // Neptune sets the scale
  const pct = (planet.metrics.realAU / maxAU) * 100;
  const lightMin = planet.metrics.realAU * 8.317;
  const distKm = planet.metrics.realAU * KM_PER_AU;
  const ticks = [0, 5, 10, 15, 20, 25, 30];

  // Smart label anchoring: edges anchor to the side so the text never spills out of the card.
  const labelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    whiteSpace: 'nowrap',
    color: planet.color.glow,
  };
  if (pct < 12) {
    labelStyle.left = '0';
  } else if (pct > 88) {
    labelStyle.right = '0';
  } else {
    labelStyle.left = `${pct}%`;
    labelStyle.transform = 'translateX(-50%)';
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
      <div className="flex items-baseline justify-between mb-3">
        <SectionLabel>Distance from Sun</SectionLabel>
        <div className="text-2xl font-light text-white/95 leading-none tabular-nums">
          {planet.metrics.realAU.toFixed(2)}
          <span className="text-white/45 text-sm ml-1">AU</span>
        </div>
      </div>

      <div className="relative pt-7 pb-8">
        {/* Background track */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-white/12" />
        {/* Progress fill up to current planet */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, #ffb058, ${planet.color.glow})`,
            boxShadow: `0 0 8px ${planet.color.glow}`,
          }}
        />

        {/* Sun marker (left edge) */}
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 rounded-full"
          style={{
            width: 14,
            height: 14,
            marginLeft: -7,
            background: 'radial-gradient(circle, #fff5cc 0%, #ffb058 55%, #ff7028 100%)',
            boxShadow: '0 0 12px #ffb058',
          }}
        />

        {/* Other planet dots */}
        {ORBITING.filter(p => p.id !== planet.id).map(p => {
          const x = (p.metrics.realAU / maxAU) * 100;
          return (
            <div
              key={p.id}
              className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white/60"
              style={{
                left: `${x}%`,
                width: 6,
                height: 6,
                marginLeft: -3,
              }}
              title={`${p.name} · ${p.metrics.realAU} AU`}
            />
          );
        })}

        {/* Current planet dot — on top, glowing */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${pct}%`,
            width: 12,
            height: 12,
            marginLeft: -6,
            background: planet.color.glow,
            boxShadow: `0 0 14px ${planet.color.glow}`,
          }}
        />

        {/* Tick marks below the track */}
        {ticks.map(au => (
          <div
            key={`t${au}`}
            className="absolute w-px h-2 bg-white/25"
            style={{
              left: `${(au / maxAU) * 100}%`,
              top: 'calc(50% + 4px)',
            }}
          />
        ))}

        {/* Tick labels */}
        {ticks.map((au, i) => {
          const x = (au / maxAU) * 100;
          const tickStyle: React.CSSProperties = {
            position: 'absolute',
            top: 'calc(50% + 14px)',
            whiteSpace: 'nowrap',
          };
          if (i === 0) tickStyle.left = '0';
          else if (i === ticks.length - 1) tickStyle.right = '0';
          else {
            tickStyle.left = `${x}%`;
            tickStyle.transform = 'translateX(-50%)';
          }
          return (
            <div key={`l${au}`} className="text-[9px] text-white/45 font-mono uppercase tracking-wider" style={tickStyle}>
              {au === 0 ? 'Sun' : `${au} AU`}
            </div>
          );
        })}

        {/* Current planet label — above the strip */}
        <div className="text-[11px] uppercase tracking-[0.22em] font-semibold" style={labelStyle}>
          {planet.name}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/5 text-[12px]">
        <div className="text-white/55">
          <span className="text-white/90 font-mono tabular-nums">
            {(distKm / 1_000_000_000).toFixed(2)}
          </span>{' '}
          billion km
        </div>
        <div className="text-white/55 flex items-center gap-1.5">
          <span className="inline-block w-1 h-1 rounded-full" style={{ background: planet.color.glow }} />
          Light arrives in{' '}
          <span className="text-white/90 font-mono tabular-nums">{formatLightTime(lightMin)}</span>
        </div>
      </div>
    </div>
  );
}

function formatLightTime(minutes: number) {
  if (minutes < 1) return `${(minutes * 60).toFixed(1)} s`;
  if (minutes < 60) return `${minutes.toFixed(1)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes - h * 60);
  return `${h} h ${m} min`;
}

const KM_PER_AU = 149_597_871;

function TravelTime({ planet }: { planet: Planet }) {
  // Mean Earth-to-target distance — assumes coplanar circular orbits, so |Δ AU|.
  const distAU = Math.abs(planet.metrics.realAU - 1);
  if (distAU === 0) return null;
  const distKm = distAU * KM_PER_AU;

  const modes = [
    { label: 'Light',           note: '299,792 km/s',  kmh: 1_079_252_849 },
    { label: 'Voyager 2',       note: '15.4 km/s',     kmh: 55_440 },
    { label: 'Commercial jet',  note: '900 km/h',      kmh: 900 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <SectionLabel>Travel from Earth</SectionLabel>
        <div className="text-[10px] text-white/40 font-mono">~{distAU.toFixed(2)} AU</div>
      </div>
      <div className="rounded-2xl border border-white/8 bg-white/[0.025] divide-y divide-white/5 overflow-hidden">
        {modes.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.06 * i + 0.1, ease: EASE } }}
            className="flex items-center justify-between gap-3 p-3.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: planet.color.glow, boxShadow: `0 0 6px ${planet.color.glow}` }}
              />
              <div className="min-w-0">
                <div className="text-[13px] text-white/90 leading-tight">{m.label}</div>
                <div className="text-[10px] text-white/40 font-mono mt-0.5">{m.note}</div>
              </div>
            </div>
            <div className="text-white/95 text-[13px] font-mono tabular-nums shrink-0">
              {formatTravelTime(distKm / m.kmh)}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="text-[12px] text-white/55 mt-2 italic leading-snug">
        Mean orbital separation — actual mission durations depend on launch alignment.
      </div>
    </div>
  );
}

function formatTravelTime(hours: number) {
  if (hours < 1 / 60) return `${(hours * 3600).toFixed(0)} s`;
  if (hours < 1) return `${(hours * 60).toFixed(0)} min`;
  if (hours < 24) return `${hours.toFixed(1)} h`;
  const days = hours / 24;
  if (days < 60) return `${days.toFixed(1)} days`;
  const years = days / 365.25;
  if (years < 10) return `${years.toFixed(1)} years`;
  if (years < 1000) return `${years.toFixed(0)} years`;
  return `${(years / 1000).toFixed(1)}k years`;
}

function MissionsChips({ missions, accent }: { missions: string[]; accent: string }) {
  const MAX = 5;
  const total = missions.length;
  const visible = missions.slice(0, MAX);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Notable missions</SectionLabel>
        <div
          className="px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-[0.15em]"
          style={{
            color: accent,
            borderColor: `${accent}50`,
            background: `${accent}12`,
          }}
        >
          {total > MAX ? `${total}+` : total} {total === 1 ? 'mission' : 'missions'}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {visible.map((m, i) => (
          <motion.span
            key={m}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.05 * i + 0.1, ease: EASE } }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white/[0.05] text-[12px] text-white/90 hover:bg-white/[0.10] hover:text-white transition"
            style={{ borderColor: `${accent}40` }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
            />
            {m}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

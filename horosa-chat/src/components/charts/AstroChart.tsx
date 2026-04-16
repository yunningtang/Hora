/**
 * AstroChart — 西占星盘 (Western Astrology Chart)
 * Renders a circular zodiac wheel with houses, planets, and aspects.
 * Data from horosa_astro_chart.
 */
import { useMemo } from "react";

const SIGNS = ["Ari","Tau","Gem","Can","Leo","Vir","Lib","Sco","Sag","Cap","Aqu","Pis"];
const SIGN_CN: Record<string, string> = {
  Ari:"白羊",Tau:"金牛",Gem:"双子",Can:"巨蟹",Leo:"狮子",Vir:"处女",
  Lib:"天秤",Sco:"天蝎",Sag:"射手",Cap:"摩羯",Aqu:"水瓶",Pis:"双鱼",
};
const SIGN_GLYPHS: Record<string, string> = {
  Ari:"♈",Tau:"♉",Gem:"♊",Can:"♋",Leo:"♌",Vir:"♍",
  Lib:"♎",Sco:"♏",Sag:"♐",Cap:"♑",Aqu:"♒",Pis:"♓",
};
const PLANET_GLYPHS: Record<string, string> = {
  Sun:"☉",Moon:"☽",Mercury:"☿",Venus:"♀",Mars:"♂",
  Jupiter:"♃",Saturn:"♄",Uranus:"♅",Neptune:"♆",Pluto:"♇",
  NorthNode:"☊",SouthNode:"☋",Asc:"Asc",MC:"MC",
};

interface PlanetData {
  name: string;
  sign: string;
  degree: number;
  retrograde?: boolean;
}

interface HouseData {
  number: number;
  sign: string;
  degree: number;
}

function extractPlanets(data: Record<string, unknown>): PlanetData[] {
  const planets: PlanetData[] = [];
  const src = (data.planets ?? data.bodies ?? data.celestialBodies ?? data.planet) as Record<string, unknown>[] | Record<string, unknown> | undefined;
  if (Array.isArray(src)) {
    for (const p of src) {
      planets.push({
        name: String(p.name ?? p.planet ?? ""),
        sign: String(p.sign ?? p.signAbbr ?? ""),
        degree: Number(p.degree ?? p.lon ?? p.longitude ?? 0),
        retrograde: Boolean(p.retrograde ?? p.retro),
      });
    }
  } else if (src && typeof src === "object") {
    for (const [name, v] of Object.entries(src)) {
      if (v && typeof v === "object") {
        const vv = v as Record<string, unknown>;
        planets.push({
          name,
          sign: String(vv.sign ?? vv.signAbbr ?? ""),
          degree: Number(vv.degree ?? vv.lon ?? vv.longitude ?? 0),
          retrograde: Boolean(vv.retrograde ?? vv.retro),
        });
      }
    }
  }
  return planets;
}

function extractHouses(data: Record<string, unknown>): HouseData[] {
  const houses: HouseData[] = [];
  const src = (data.houses ?? data.cusps ?? data.house) as unknown;
  if (Array.isArray(src)) {
    src.forEach((h: Record<string, unknown>, i: number) => {
      houses.push({
        number: Number(h.number ?? i + 1),
        sign: String(h.sign ?? ""),
        degree: Number(h.degree ?? h.cusp ?? h.lon ?? 0),
      });
    });
  }
  return houses;
}

function polarXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function WheelSVG({ planets, houses }: { planets: PlanetData[]; houses: HouseData[] }) {
  const size = 480;
  const cx = size / 2, cy = size / 2;
  const rOuter = 220, rSign = 190, rHouse = 150, rPlanet = 120, rInner = 80;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", margin: "0 auto" }}>
      {/* Background */}
      <circle cx={cx} cy={cy} r={rOuter} fill="var(--bg-warm)" stroke="var(--line-default)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={rSign} fill="none" stroke="var(--line-subtle)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={rHouse} fill="var(--bg-base)" stroke="var(--line-default)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={rInner} fill="var(--bg-base)" stroke="var(--line-subtle)" strokeWidth="0.5" />

      {/* Sign divisions */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = i * 30;
        const p1 = polarXY(cx, cy, rSign, angle);
        const p2 = polarXY(cx, cy, rOuter, angle);
        const mid = polarXY(cx, cy, (rSign + rOuter) / 2, angle + 15);
        return (
          <g key={i}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--line-subtle)" strokeWidth="0.5" />
            <text x={mid.x} y={mid.y} textAnchor="middle" dominantBaseline="central"
              fill="var(--ink-tertiary)" fontSize="14" fontFamily="var(--font-body)">
              {SIGN_GLYPHS[SIGNS[i]] ?? SIGNS[i]}
            </text>
          </g>
        );
      })}

      {/* House cusps */}
      {houses.map((h, i) => {
        const angle = h.degree;
        const p1 = polarXY(cx, cy, rInner, angle);
        const p2 = polarXY(cx, cy, rHouse, angle);
        const isAxis = [1, 4, 7, 10].includes(h.number);
        return (
          <g key={`h${i}`}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={isAxis ? "var(--ink-secondary)" : "var(--line-subtle)"}
              strokeWidth={isAxis ? 1.5 : 0.5} />
          </g>
        );
      })}

      {/* Planets */}
      {planets.map((p, i) => {
        const pos = polarXY(cx, cy, rPlanet, p.degree);
        return (
          <g key={`p${i}`}>
            <circle cx={pos.x} cy={pos.y} r={12} fill="var(--bg-base)" stroke="var(--line-subtle)" strokeWidth="0.5" />
            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
              fill="var(--ink-primary)" fontSize="11" fontFamily="var(--font-body)" fontWeight="500">
              {PLANET_GLYPHS[p.name] ?? p.name.slice(0, 2)}
            </text>
            {p.retrograde && (
              <text x={pos.x + 10} y={pos.y - 8} fill="var(--el-fire)" fontSize="8">R</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function PlanetTable({ planets }: { planets: PlanetData[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 16 }}>
      <thead>
        <tr>
          {["行星", "星座", "度数", "逆行"].map((h) => (
            <th key={h} style={{ padding: "6px 12px", textAlign: "left", borderBottom: "1px solid var(--line-subtle)", color: "var(--ink-tertiary)", fontWeight: 500, fontSize: 12 }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {planets.map((p, i) => (
          <tr key={i}>
            <td style={{ padding: "6px 12px", borderBottom: "1px solid var(--line-subtle)" }}>
              <span style={{ marginRight: 6 }}>{PLANET_GLYPHS[p.name] ?? ""}</span>{p.name}
            </td>
            <td style={{ padding: "6px 12px", borderBottom: "1px solid var(--line-subtle)", color: "var(--ink-secondary)" }}>
              {SIGN_GLYPHS[p.sign] ?? ""} {SIGN_CN[p.sign] ?? p.sign}
            </td>
            <td style={{ padding: "6px 12px", borderBottom: "1px solid var(--line-subtle)", fontFamily: "var(--font-mono)", color: "var(--ink-secondary)" }}>
              {p.degree.toFixed(2)}°
            </td>
            <td style={{ padding: "6px 12px", borderBottom: "1px solid var(--line-subtle)", color: p.retrograde ? "var(--el-fire)" : "var(--ink-disabled)" }}>
              {p.retrograde ? "℞" : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AstroChart({ data }: { data: Record<string, unknown> }) {
  const planets = useMemo(() => extractPlanets(data), [data]);
  const houses = useMemo(() => extractHouses(data), [data]);

  if (planets.length === 0 && houses.length === 0) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 12 }}>西占星盘 — 原始数据</div>
        <pre style={{ fontSize: 11, lineHeight: 1.6, color: "var(--ink-secondary)", overflow: "auto", maxHeight: 500, fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ padding: 20 }}>
        <WheelSVG planets={planets} houses={houses} />
      </div>
      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <PlanetTable planets={planets} />
      </div>
    </div>
  );
}

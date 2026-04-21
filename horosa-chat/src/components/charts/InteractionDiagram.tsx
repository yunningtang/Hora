/**
 * InteractionDiagram — 四柱关系
 * 4 pillar bubbles with stem+branch, below are horizontal lines showing
 * 合 / 三合 / 三会 / 冲 / 刑 / 害 / 破 / 暗合 relationships.
 */
import type { BaziData, PillarKey } from "../../types/horosa";

const KEYS: PillarKey[] = ["year", "month", "day", "time"];
const CN = { year: "年柱", month: "月柱", day: "日柱", time: "时柱" };

const EL_CLS: Record<string, string> = {
  Metal: "el-metal", Wood: "el-wood", Water: "el-water", Fire: "el-fire", Earth: "el-earth",
};
function ec(el: string) { return EL_CLS[el] ?? ""; }

const REL_COLOR: Record<string, string> = {
  合: "var(--el-wood)",
  六合: "var(--el-wood)",
  三合: "var(--el-wood)",
  三会: "var(--el-water)",
  暗合: "var(--el-water)",
  冲: "var(--el-fire)",
  刑: "var(--el-fire)",
  害: "var(--el-metal)",
  破: "var(--el-earth)",
};

interface Relation {
  from: number;  // 0..3 index
  to: number;
  label: string;
}

function extractRelations(data: BaziData): Relation[] {
  const idx: Record<string, number> = { "年": 0, "月": 1, "日": 2, "时": 3 };
  type Ref = { zhu: string; cell: string };
  const out: Relation[] = [];

  const maps: { key: string; label: string }[] = [
    { key: "ganHe", label: "合" },
    { key: "ganCong", label: "冲" },
    { key: "ziHe6", label: "六合" },
    { key: "ziHe3", label: "三合" },
    { key: "ziHui", label: "三会" },
    { key: "ziCong", label: "冲" },
    { key: "ziXing", label: "刑" },
    { key: "ziPo", label: "破" },
    { key: "ziCuan", label: "害" },
  ];
  for (const { key, label } of maps) {
    const obj = (data as unknown as Record<string, Record<string, Ref[]>>)[key];
    if (!obj) continue;
    for (const [, refs] of Object.entries(obj)) {
      if (refs.length >= 2) {
        const ix = refs.map((r) => idx[r.zhu]).filter((i) => i !== undefined);
        for (let i = 0; i < ix.length - 1; i++) {
          for (let j = i + 1; j < ix.length; j++) {
            if (ix[i] !== ix[j]) out.push({ from: Math.min(ix[i], ix[j]), to: Math.max(ix[i], ix[j]), label });
          }
        }
      }
    }
  }
  // De-dupe identical edges
  const seen = new Set<string>();
  return out.filter((r) => {
    const k = `${r.from}-${r.to}-${r.label}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export default function InteractionDiagram({ data }: { data: BaziData }) {
  const relations = extractRelations(data);
  const pillars = KEYS.map((k) => data.fourColumns[k]);
  if (relations.length === 0) return null;

  // Column positions (4 pillars evenly spaced)
  const colW = 120;
  const startX = 80;
  const cxOf = (i: number) => startX + i * colW + 28; // center x of bubble column

  const bubbleY = 26;
  const branchY = bubbleY + 70;
  const firstLineY = branchY + 72;
  const lineStep = 26;

  const svgW = startX + 4 * colW + 60;
  const svgH = firstLineY + relations.length * lineStep + 20;

  return (
    <div className="card" style={{ padding: "18px 22px 20px", marginTop: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: 1, marginBottom: 16 }}>
        四 柱 关 系
      </div>
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: "block", margin: "0 auto", maxWidth: "100%" }}>
        {/* Column headers */}
        {KEYS.map((k, i) => (
          <text key={k} x={cxOf(i)} y={14} textAnchor="middle"
            fontSize="11" fontFamily="var(--font-body)" fill="var(--ink-4)" letterSpacing="1">
            {CN[k]}
          </text>
        ))}

        {/* Stem & branch bubbles */}
        {pillars.map((p, i) => (
          <g key={`pil-${i}`}>
            {/* Stem bubble */}
            <circle cx={cxOf(i)} cy={bubbleY + 30} r={28} fill="var(--bg-inner)" stroke="var(--line)" strokeWidth="1" />
            <text x={cxOf(i)} y={bubbleY + 36} textAnchor="middle"
              fontSize="26" fontFamily="var(--font-display)" fontWeight="500"
              className={ec(p.stem.element)}
              style={{ fill: "currentColor" }}>
              {p.stem.cell}
            </text>
            {/* Branch bubble */}
            <circle cx={cxOf(i)} cy={branchY + 30} r={28} fill="var(--bg-inner)" stroke="var(--line)" strokeWidth="1" />
            <text x={cxOf(i)} y={branchY + 36} textAnchor="middle"
              fontSize="26" fontFamily="var(--font-display)" fontWeight="500"
              className={ec(p.branch.element)}
              style={{ fill: "currentColor" }}>
              {p.branch.cell}
            </text>
          </g>
        ))}

        {/* Dashed separator */}
        <line x1={60} y1={firstLineY - 12} x2={svgW - 60} y2={firstLineY - 12}
          stroke="var(--line)" strokeDasharray="3 4" strokeWidth="1" />

        {/* Relations */}
        {relations.map((r, i) => {
          const y = firstLineY + i * lineStep;
          const x1 = cxOf(r.from);
          const x2 = cxOf(r.to);
          const midX = (x1 + x2) / 2;
          const color = REL_COLOR[r.label] ?? "var(--ink-4)";
          return (
            <g key={i}>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth="1.4" />
              <circle cx={x1} cy={y} r={4} fill="var(--bg-inner)" stroke={color} strokeWidth="1.4" />
              <circle cx={x2} cy={y} r={4} fill="var(--bg-inner)" stroke={color} strokeWidth="1.4" />
              <rect x={midX - 16} y={y - 9} width={32} height={14} rx={3}
                fill="var(--bg-inner)" stroke="none" />
              <text x={midX} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize="11" fontFamily="var(--font-body)" fontWeight="500"
                fill={color}>
                {r.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

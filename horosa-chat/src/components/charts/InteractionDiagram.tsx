/**
 * InteractionDiagram — 干支关系连线图 (合/冲/刑/害 visualization)
 * Renders the four pillars with SVG lines showing relationships.
 */
import type { BaziData, PillarKey } from "../../types/horosa";

const KEYS: PillarKey[] = ["year", "month", "day", "time"];
const CN = { year: "年柱", month: "月柱", day: "日柱", time: "时柱" };

const REL_COLORS: Record<string, string> = {
  合: "var(--el-wood)",
  六合: "var(--el-wood)",
  三合: "var(--el-wood)",
  三会: "var(--el-water)",
  暗合: "var(--el-water)",
  冲: "var(--el-fire)",
  刑: "var(--el-fire)",
  害: "var(--el-earth)",
  破: "var(--el-metal)",
};

interface Relation {
  from: number; // pillar index
  to: number;
  label: string;
  level: "gan" | "zhi";
}

function extractRelations(data: BaziData): Relation[] {
  const relations: Relation[] = [];
  const pillarIdx: Record<string, number> = { "年": 0, "月": 1, "日": 2, "时": 3 };

  const maps: { key: string; label: string; level: "gan" | "zhi" }[] = [
    { key: "ganHe", label: "合", level: "gan" },
    { key: "ganCong", label: "冲", level: "gan" },
    { key: "ziHe6", label: "六合", level: "zhi" },
    { key: "ziHe3", label: "三合", level: "zhi" },
    { key: "ziHui", label: "三会", level: "zhi" },
    { key: "ziCong", label: "冲", level: "zhi" },
    { key: "ziXing", label: "刑", level: "zhi" },
    { key: "ziPo", label: "破", level: "zhi" },
    { key: "ziCuan", label: "害", level: "zhi" },
  ];

  for (const { key, label, level } of maps) {
    const obj = (data as Record<string, Record<string, { zhu: string; cell: string }[]>>)[key];
    if (!obj) continue;
    for (const [, refs] of Object.entries(obj)) {
      if (refs.length >= 2) {
        const indices = refs.map((r) => pillarIdx[r.zhu]).filter((x) => x !== undefined);
        for (let i = 0; i < indices.length - 1; i++) {
          for (let j = i + 1; j < indices.length; j++) {
            relations.push({ from: indices[i], to: indices[j], label, level });
          }
        }
      }
    }
  }
  return relations;
}

export default function InteractionDiagram({ data }: { data: BaziData }) {
  const relations = extractRelations(data);
  const pillars = KEYS.map((k) => data.fourColumns[k]);

  const colW = 100;
  const totalW = colW * 4 + 60;
  const ganY = 40;
  const zhiY = 100;
  const lineBaseY = 140;

  // Group relations by level to stack them
  const ganRels = relations.filter((r) => r.level === "gan");
  const zhiRels = relations.filter((r) => r.level === "zhi");

  function colX(idx: number) { return 30 + idx * colW + colW / 2; }

  return (
    <div className="card" style={{ padding: 20, marginTop: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 16, letterSpacing: 1 }}>
        四柱关系图
      </div>

      <svg width={totalW} height={lineBaseY + (zhiRels.length + ganRels.length) * 28 + 20}
        viewBox={`0 0 ${totalW} ${lineBaseY + (zhiRels.length + ganRels.length) * 28 + 20}`}
        style={{ display: "block", margin: "0 auto", maxWidth: "100%" }}>

        {/* Pillar headers */}
        {KEYS.map((k, i) => {
          const x = colX(i);
          const p = pillars[i];
          return (
            <g key={k}>
              {/* Label */}
              <text x={x} y={16} textAnchor="middle" fill="var(--ink-tertiary)" fontSize="11" fontFamily="var(--font-body)">
                {CN[k]}
              </text>
              {/* Gan */}
              <text x={x} y={ganY + 4} textAnchor="middle" dominantBaseline="central"
                fill="var(--ink-primary)" fontSize="22" fontFamily="var(--font-display)" fontWeight="300">
                {p.stem.cell}
              </text>
              {/* Zhi */}
              <text x={x} y={zhiY + 4} textAnchor="middle" dominantBaseline="central"
                fill="var(--ink-primary)" fontSize="22" fontFamily="var(--font-display)" fontWeight="300">
                {p.branch.cell}
              </text>
              {/* Dots */}
              <circle cx={x} cy={ganY + 4} r={16} fill="none" stroke="var(--line-subtle)" strokeWidth="0.5" />
              <circle cx={x} cy={zhiY + 4} r={16} fill="none" stroke="var(--line-subtle)" strokeWidth="0.5" />
            </g>
          );
        })}

        {/* Divider */}
        <line x1={20} y1={lineBaseY - 10} x2={totalW - 20} y2={lineBaseY - 10}
          stroke="var(--line-subtle)" strokeWidth="0.5" strokeDasharray="4 4" />

        {/* Relation lines */}
        {[...ganRels, ...zhiRels].map((rel, i) => {
          const fromX = colX(rel.from);
          const toX = colX(rel.to);
          const y = lineBaseY + i * 28 + 14;
          const color = REL_COLORS[rel.label] ?? "var(--ink-tertiary)";
          return (
            <g key={i}>
              {/* Line */}
              <line x1={fromX} y1={y} x2={toX} y2={y} stroke={color} strokeWidth="1.5" />
              {/* Dots at ends */}
              <circle cx={fromX} cy={y} r={4} fill="var(--bg-base)" stroke={color} strokeWidth="1.5" />
              <circle cx={toX} cy={y} r={4} fill="var(--bg-base)" stroke={color} strokeWidth="1.5" />
              {/* Label */}
              <text x={(fromX + toX) / 2} y={y - 6} textAnchor="middle"
                fill={color} fontSize="10" fontFamily="var(--font-body)" fontWeight="500">
                {rel.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

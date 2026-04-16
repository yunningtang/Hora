/* ── QimenGrid ─ 奇门遁甲 9-palace visualisation ── */

import { useMemo } from "react";

/* Luoshu magic-square layout (row-major, top-left to bottom-right) */
const LUOSHU: { idx: number; label: string; gua: string }[] = [
  { idx: 4, label: "四", gua: "巽" },
  { idx: 9, label: "九", gua: "离" },
  { idx: 2, label: "二", gua: "坤" },
  { idx: 3, label: "三", gua: "震" },
  { idx: 5, label: "五", gua: "中" },
  { idx: 7, label: "七", gua: "兑" },
  { idx: 8, label: "八", gua: "艮" },
  { idx: 1, label: "一", gua: "坎" },
  { idx: 6, label: "六", gua: "乾" },
];

/* Element colour mapping for palace gua */
const GUA_EL: Record<string, string> = {
  坎: "var(--el-water)",
  坤: "var(--el-earth)",
  震: "var(--el-wood)",
  巽: "var(--el-wood)",
  中: "var(--el-earth)",
  乾: "var(--el-metal)",
  兑: "var(--el-metal)",
  艮: "var(--el-earth)",
  离: "var(--el-fire)",
};

/* ── Palace data shape (normalised) ── */
interface PalaceInfo {
  tianpan?: string;   // 天盘干
  dipan?: string;     // 地盘干
  men?: string;       // 八门
  xing?: string;      // 九星
  shen?: string;      // 八神
  qiyi?: string;      // 奇仪
  extras?: string[];  // anything else worth showing
}

/* ── Helpers to fish data out of unknown shapes ── */

function str(v: unknown): string | undefined {
  if (typeof v === "string" && v) return v;
  if (typeof v === "number") return String(v);
  return undefined;
}

/** Try common key aliases for a field */
function pick(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = str(obj[k]);
    if (v) return v;
  }
  return undefined;
}

/** Normalise one palace object into PalaceInfo */
function normalisePalace(raw: Record<string, unknown>): PalaceInfo {
  const info: PalaceInfo = {};

  info.tianpan = pick(raw, "tianpan", "tianPan", "天盘", "天盘干", "tianGan", "tian");
  info.dipan   = pick(raw, "dipan", "diPan", "地盘", "地盘干", "diGan", "di");
  info.men     = pick(raw, "men", "door", "八门", "门", "bamen");
  info.xing    = pick(raw, "xing", "star", "九星", "星", "jiuxing");
  info.shen    = pick(raw, "shen", "god", "八神", "神", "bashen");
  info.qiyi    = pick(raw, "qiyi", "qiYi", "奇仪", "stem", "奇");

  // Collect leftover string values as extras
  const used = new Set(["tianpan","tianPan","天盘","天盘干","tianGan","tian",
    "dipan","diPan","地盘","地盘干","diGan","di",
    "men","door","八门","门","bamen",
    "xing","star","九星","星","jiuxing",
    "shen","god","八神","神","bashen",
    "qiyi","qiYi","奇仪","stem","奇",
    "index","idx","gong","宫","gua","卦","name","palace"]);
  const extras: string[] = [];
  for (const [k, v] of Object.entries(raw)) {
    if (used.has(k)) continue;
    const s = str(v);
    if (s) extras.push(`${k}: ${s}`);
  }
  if (extras.length) info.extras = extras;

  return info;
}

/** Attempt to extract a 9-palace array from opaque data */
function extractPalaces(data: Record<string, unknown>): PalaceInfo[] | null {
  // Direct array under common keys
  for (const key of ["palaces", "gongs", "qimen", "palace", "gong", "九宫", "宫"]) {
    const candidate = data[key];
    if (Array.isArray(candidate) && candidate.length >= 9) {
      return candidate.slice(0, 9).map((p: unknown) =>
        typeof p === "object" && p !== null ? normalisePalace(p as Record<string, unknown>) : {}
      );
    }
  }

  // Object keyed by palace number (1-9) or gua name
  for (const key of ["palaces", "gongs", "qimen", "palace", "gong", "九宫", "宫"]) {
    const candidate = data[key];
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      const obj = candidate as Record<string, unknown>;
      const byNum: PalaceInfo[] = [];
      let found = 0;
      for (let i = 1; i <= 9; i++) {
        const p = obj[String(i)] ?? obj[`宫${i}`];
        if (p && typeof p === "object") {
          byNum[i] = normalisePalace(p as Record<string, unknown>);
          found++;
        }
      }
      if (found >= 5) return Array.from({ length: 10 }, (_, i) => byNum[i] ?? {});
    }
  }

  // Flat: data itself has "gong1" .. "gong9" or "palace1" .. "palace9"
  {
    const byNum: PalaceInfo[] = [];
    let found = 0;
    for (let i = 1; i <= 9; i++) {
      for (const prefix of ["gong", "palace", "宫"]) {
        const p = data[`${prefix}${i}`] ?? data[`${prefix}_${i}`];
        if (p && typeof p === "object") {
          byNum[i] = normalisePalace(p as Record<string, unknown>);
          found++;
          break;
        }
      }
    }
    if (found >= 5) return Array.from({ length: 10 }, (_, i) => byNum[i] ?? {});
  }

  return null;
}

/** Extract top-level meta (局数, 旬空, etc.) */
function extractMeta(data: Record<string, unknown>): { label: string; value: string }[] {
  const meta: { label: string; value: string }[] = [];
  const mapping: [string[], string][] = [
    [["ju", "局", "jushu", "局数"], "局数"],
    [["yuan", "元", "三元"], "三元"],
    [["dun", "遁", "dunType"], "遁"],
    [["xunKong", "xunkong", "旬空", "空亡"], "旬空"],
    [["zhifu", "值符", "zhiFu"], "值符"],
    [["zhishi", "值使", "zhiShi"], "值使"],
    [["ganzi", "干支", "datetime", "时辰"], "时辰"],
  ];
  for (const [keys, label] of mapping) {
    for (const k of keys) {
      const v = str(data[k]);
      if (v) { meta.push({ label, value: v }); break; }
    }
  }
  return meta;
}

/* ── Styles ── */

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 1,
  background: "var(--line-subtle)",
  borderRadius: "var(--r-lg)",
  overflow: "hidden",
  boxShadow: "var(--shadow-card)",
};

const cellStyle: React.CSSProperties = {
  background: "var(--bg-base)",
  padding: "12px 10px",
  minHeight: 110,
  display: "flex",
  flexDirection: "column",
  gap: 3,
  position: "relative",
};

const guaBadgeStyle: React.CSSProperties = {
  position: "absolute",
  top: 4,
  right: 6,
  fontSize: 11,
  fontWeight: 600,
  opacity: 0.45,
  letterSpacing: 0.5,
};

const tagStyle = (color: string): React.CSSProperties => ({
  fontSize: 11,
  color: "var(--ink-tertiary)",
  letterSpacing: 0.3,
  lineHeight: 1.5,
  display: "flex",
  gap: 4,
  alignItems: "baseline",
});

const valStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 14,
  fontWeight: 400,
  color: "var(--ink-primary)",
};

const metaBarStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px 20px",
  marginBottom: 16,
  fontSize: 13,
  color: "var(--ink-secondary)",
  letterSpacing: 0.14,
};

const fallbackStyle: React.CSSProperties = {
  background: "var(--bg-stone)",
  borderRadius: "var(--r-lg)",
  padding: 20,
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "var(--ink-secondary)",
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  lineHeight: 1.7,
  maxHeight: 480,
  overflow: "auto",
};

/* ── Cell renderer ── */
function PalaceCell({ palace, info }: { palace: typeof LUOSHU[number]; info: PalaceInfo }) {
  const hasContent = info.tianpan || info.dipan || info.men || info.xing || info.shen || info.qiyi;

  return (
    <div style={cellStyle}>
      {/* Gua badge */}
      <span style={{ ...guaBadgeStyle, color: GUA_EL[palace.gua] ?? "var(--ink-disabled)" }}>
        {palace.gua}{palace.label}
      </span>

      {hasContent ? (
        <>
          {info.shen && (
            <div style={tagStyle("var(--ink-tertiary)")}>
              <span style={{ fontSize: 10, color: "var(--ink-disabled)" }}>神</span>
              <span style={{ ...valStyle, fontSize: 13, color: "var(--el-metal)" }}>{info.shen}</span>
            </div>
          )}
          {info.xing && (
            <div style={tagStyle("var(--ink-tertiary)")}>
              <span style={{ fontSize: 10, color: "var(--ink-disabled)" }}>星</span>
              <span style={{ ...valStyle, fontSize: 13, color: "var(--el-water)" }}>{info.xing}</span>
            </div>
          )}
          {info.men && (
            <div style={tagStyle("var(--ink-tertiary)")}>
              <span style={{ fontSize: 10, color: "var(--ink-disabled)" }}>门</span>
              <span style={{ ...valStyle, fontSize: 13, color: "var(--el-wood)" }}>{info.men}</span>
            </div>
          )}
          {info.tianpan && (
            <div style={tagStyle("var(--ink-tertiary)")}>
              <span style={{ fontSize: 10, color: "var(--ink-disabled)" }}>天</span>
              <span style={{ ...valStyle, color: "var(--el-fire)" }}>{info.tianpan}</span>
            </div>
          )}
          {info.dipan && (
            <div style={tagStyle("var(--ink-tertiary)")}>
              <span style={{ fontSize: 10, color: "var(--ink-disabled)" }}>地</span>
              <span style={{ ...valStyle, color: "var(--el-earth)" }}>{info.dipan}</span>
            </div>
          )}
          {info.qiyi && (
            <div style={tagStyle("var(--ink-tertiary)")}>
              <span style={{ fontSize: 10, color: "var(--ink-disabled)" }}>奇</span>
              <span style={{ ...valStyle, fontSize: 13 }}>{info.qiyi}</span>
            </div>
          )}
          {info.extras?.map((e, i) => (
            <div key={i} style={{ fontSize: 11, color: "var(--ink-disabled)", lineHeight: 1.4 }}>{e}</div>
          ))}
        </>
      ) : (
        <span style={{ color: "var(--ink-disabled)", fontSize: 12, marginTop: 8 }}>--</span>
      )}
    </div>
  );
}

/* ── Main ── */
export default function QimenGrid({ data }: { data: Record<string, unknown> }) {
  const palaces = useMemo(() => extractPalaces(data), [data]);
  const meta = useMemo(() => extractMeta(data), [data]);

  /* Fallback: if we cannot parse palaces, show formatted JSON */
  if (!palaces) {
    return (
      <div>
        {meta.length > 0 && (
          <div style={metaBarStyle}>
            {meta.map((m) => (
              <span key={m.label}>
                <span style={{ color: "var(--ink-tertiary)", fontWeight: 500 }}>{m.label}</span>{" "}
                <span style={{ fontFamily: "var(--font-display)", color: "var(--ink-primary)" }}>{m.value}</span>
              </span>
            ))}
          </div>
        )}
        <pre style={fallbackStyle}>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div>
      {/* Meta bar */}
      {meta.length > 0 && (
        <div style={metaBarStyle}>
          {meta.map((m) => (
            <span key={m.label}>
              <span style={{ color: "var(--ink-tertiary)", fontWeight: 500 }}>{m.label}</span>{" "}
              <span style={{ fontFamily: "var(--font-display)", color: "var(--ink-primary)" }}>{m.value}</span>
            </span>
          ))}
        </div>
      )}

      {/* 3x3 Grid */}
      <div style={gridStyle}>
        {LUOSHU.map((sq) => {
          const info = palaces[sq.idx] ?? {};
          return <PalaceCell key={sq.idx} palace={sq} info={info} />;
        })}
      </div>
    </div>
  );
}

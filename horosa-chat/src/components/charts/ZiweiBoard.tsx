import { type CSSProperties, type ReactNode } from "react";

/* ═══════════════════════════════════════════
   ZiweiBoard — 紫微斗数 12-palace grid
   ═══════════════════════════════════════════ */

/* ── Traditional 4×4 layout ──
   [巳6] [午7]  [未8]  [申9]
   [辰5] [info] [info] [酉10]
   [卯4] [info] [info] [戌11]
   [寅3] [丑2]  [子1]  [亥12]

   Grid positions (row, col) — 1-indexed:
*/
const BRANCH_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

const GRID_POS: Record<string, [number, number]> = {
  巳: [1, 1], 午: [1, 2], 未: [1, 3], 申: [1, 4],
  辰: [2, 1],                          酉: [2, 4],
  卯: [3, 1],                          戌: [3, 4],
  寅: [4, 1], 丑: [4, 2], 子: [4, 3], 亥: [4, 4],
};

/* ── 四化 marker colours ── */
const SIHUA_STYLE: Record<string, CSSProperties> = {
  化禄: { color: "var(--el-wood)", fontWeight: 600 },
  化权: { color: "var(--el-fire)", fontWeight: 600 },
  化科: { color: "var(--el-water)", fontWeight: 600 },
  化忌: { color: "var(--el-earth)", fontWeight: 600 },
  禄: { color: "var(--el-wood)", fontWeight: 600 },
  权: { color: "var(--el-fire)", fontWeight: 600 },
  科: { color: "var(--el-water)", fontWeight: 600 },
  忌: { color: "var(--el-earth)", fontWeight: 600 },
};

/* ── Known palace names (for heuristic matching) ── */
const PALACE_NAMES = [
  "命宫", "兄弟宫", "夫妻宫", "子女宫", "财帛宫", "疾厄宫",
  "迁移宫", "交友宫", "仆役宫", "事业宫", "官禄宫", "田宅宫", "福德宫", "父母宫",
  "身宫",
];

/* ═══════════════════════════════════════════
   Types (loose — we parse from Record<string, unknown>)
   ═══════════════════════════════════════════ */

interface Palace {
  name: string;       // e.g. "命宫"
  branch: string;     // e.g. "子"
  mainStars: Star[];
  minorStars: Star[];
  sihua: string[];    // e.g. ["化禄"]
  extras: Record<string, unknown>;
}

interface Star {
  name: string;
  sihua?: string;     // attached 四化
  brightness?: string; // 亮度 e.g. "庙" "旺" "利" "平" "陷"
}

interface PersonInfo {
  name?: string;
  gender?: string;
  birthDate?: string;
  birthTime?: string;
  lunarDate?: string;
  mingzhu?: string;   // 命主
  shenzhu?: string;   // 身主
  wuxingju?: string;  // 五行局
  shengong?: string;  // 身宫所在
  extras: Record<string, unknown>;
}

/* ═══════════════════════════════════════════
   Data extraction helpers
   ═══════════════════════════════════════════ */

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

/** Try to parse a star from various shapes */
function parseStar(v: unknown): Star | null {
  if (typeof v === "string") return { name: v };
  if (isObj(v)) {
    const name = str(v.name || v.star || v.xing || v.starName || "");
    if (!name) return null;
    return {
      name,
      sihua: str(v.sihua || v.hua || v.fourChange || ""),
      brightness: str(v.brightness || v.miao || v.liang || v.liangdu || ""),
    };
  }
  return null;
}

/** Try to extract palace data from an object */
function parsePalace(obj: Record<string, unknown>, fallbackBranch?: string): Palace | null {
  const name = str(obj.name || obj.gongName || obj.gong || obj.palace || obj.palaceName || obj.宫名 || "");
  const branch = str(obj.branch || obj.dizhi || obj.zhi || obj.earthlyBranch || obj.地支 || fallbackBranch || "");

  // Main stars
  const mainRaw = arr(obj.mainStars || obj.zhuXing || obj.主星 || obj.majorStars || obj.main || []);
  const mainStars = mainRaw.map(parseStar).filter((s): s is Star => s !== null);

  // Minor stars
  const minorRaw = arr(
    obj.minorStars || obj.fuXing || obj.副星 || obj.smallStars || obj.minor ||
    obj.otherStars || obj.其他星 || obj.杂曜 || [],
  );
  const minorStars = minorRaw.map(parseStar).filter((s): s is Star => s !== null);

  // 四化 at palace level
  const sihuaRaw = arr(obj.sihua || obj.四化 || obj.hua || []);
  const sihua = sihuaRaw.map((x) => str(x)).filter(Boolean);

  // Collect extra keys we didn't consume
  const consumed = new Set([
    "name", "gongName", "gong", "palace", "palaceName", "宫名",
    "branch", "dizhi", "zhi", "earthlyBranch", "地支",
    "mainStars", "zhuXing", "主星", "majorStars", "main",
    "minorStars", "fuXing", "副星", "smallStars", "minor", "otherStars", "其他星", "杂曜",
    "sihua", "四化", "hua",
  ]);
  const extras: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!consumed.has(k) && v !== null && v !== undefined && v !== "") {
      extras[k] = v;
    }
  }

  if (!name && !branch && mainStars.length === 0) return null;
  return { name, branch, mainStars, minorStars, sihua, extras };
}

/** Heuristic: does this object look like a palace? */
function looksLikePalace(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj);
  const palaceKeys = ["name", "gongName", "gong", "palace", "palaceName", "宫名",
    "mainStars", "zhuXing", "主星", "majorStars", "minorStars", "fuXing", "副星",
    "branch", "dizhi", "zhi", "地支"];
  return palaceKeys.some((k) => keys.includes(k))
    || keys.some((k) => PALACE_NAMES.some((p) => k.includes(p)));
}

/** Extract person-level info from data */
function extractPersonInfo(data: Record<string, unknown>): PersonInfo {
  const info: PersonInfo = { extras: {} };
  const infoSrc = isObj(data.info) ? data.info : isObj(data.basic) ? data.basic : data;

  info.name = str(infoSrc.name || infoSrc.姓名 || data.name || "");
  info.gender = str(infoSrc.gender || infoSrc.性别 || data.gender || "");
  info.birthDate = str(infoSrc.birthDate || infoSrc.date || infoSrc.出生日期 || data.date || "");
  info.birthTime = str(infoSrc.birthTime || infoSrc.time || infoSrc.出生时间 || data.time || "");
  info.lunarDate = str(infoSrc.lunarDate || infoSrc.nongli || infoSrc.农历 || data.nongli || "");
  info.mingzhu = str(infoSrc.mingzhu || infoSrc.命主 || data.mingzhu || "");
  info.shenzhu = str(infoSrc.shenzhu || infoSrc.身主 || data.shenzhu || "");
  info.wuxingju = str(infoSrc.wuxingju || infoSrc.五行局 || data.wuxingju || data.ju || "");
  info.shengong = str(infoSrc.shengong || infoSrc.身宫 || data.shengong || "");

  // Grab extras from info source
  if (isObj(infoSrc) && infoSrc !== data) {
    const consumed = new Set([
      "name", "姓名", "gender", "性别", "birthDate", "date", "出生日期",
      "birthTime", "time", "出生时间", "lunarDate", "nongli", "农历",
      "mingzhu", "命主", "shenzhu", "身主", "wuxingju", "五行局", "ju",
      "shengong", "身宫",
    ]);
    for (const [k, v] of Object.entries(infoSrc)) {
      if (!consumed.has(k) && v !== null && v !== undefined && v !== "") {
        info.extras[k] = v;
      }
    }
  }

  return info;
}

/** Main extraction: find palaces from the data blob */
function extractPalaces(data: Record<string, unknown>): Palace[] {
  // Strategy 1: look for a palaces / gongs array
  const candidates = [
    data.palaces, data.gongs, data.宫位, data.palace, data.gong,
    data.twelve, data.twelvePalaces, data.十二宫,
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0) {
      const palaces = c.filter(isObj).map((o, i) => parsePalace(o, BRANCH_ORDER[i % 12]));
      const valid = palaces.filter((p): p is Palace => p !== null);
      if (valid.length >= 6) return valid;
    }
    if (isObj(c)) {
      // Could be keyed by branch or palace name
      const entries = Object.entries(c);
      const palaces = entries.map(([k, v]) => {
        if (!isObj(v)) return null;
        return parsePalace(v, k);
      }).filter((p): p is Palace => p !== null);
      if (palaces.length >= 6) return palaces;
    }
  }

  // Strategy 2: iterate top-level keys for palace-like objects
  const found: Palace[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (isObj(val) && looksLikePalace(val)) {
      const p = parsePalace(val, key);
      if (p) found.push(p);
    }
  }
  if (found.length >= 6) return found;

  // Strategy 3: look one level deeper
  for (const [, val] of Object.entries(data)) {
    if (isObj(val)) {
      for (const [k2, v2] of Object.entries(val)) {
        if (isObj(v2) && looksLikePalace(v2)) {
          const p = parsePalace(v2, k2);
          if (p) found.push(p);
        }
      }
    }
  }

  return found;
}

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

function StarTag({ star }: { star: Star }) {
  const huaLabel = star.sihua || "";
  const huaStyle = SIHUA_STYLE[huaLabel] ?? {};
  const brightLabel = star.brightness || "";

  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>
        {star.name}
      </span>
      {brightLabel && (
        <span style={{ fontSize: "0.75em", color: "var(--ink-disabled)", marginLeft: 2 }}>
          {brightLabel}
        </span>
      )}
      {huaLabel && (
        <span style={{ fontSize: "0.75em", marginLeft: 2, ...huaStyle }}>
          {huaLabel}
        </span>
      )}
    </span>
  );
}

function PalaceCell({ palace }: { palace: Palace }) {
  const hasContent = palace.mainStars.length > 0 || palace.minorStars.length > 0;

  return (
    <div style={{
      gridRow: undefined, /* set by parent */
      display: "flex",
      flexDirection: "column",
      padding: "10px 8px",
      minHeight: 120,
      borderRadius: "var(--r-sm)",
      border: "1px solid var(--line-subtle)",
      background: "var(--bg-base)",
      overflow: "hidden",
      gap: 4,
    }}>
      {/* Palace header: name + branch */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 2,
      }}>
        <span style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--ink-secondary)",
          letterSpacing: 0.5,
        }}>
          {palace.name || "?"}
        </span>
        <span style={{
          fontSize: 11,
          color: "var(--ink-disabled)",
          fontFamily: "var(--font-display)",
        }}>
          {palace.branch}
        </span>
      </div>

      {/* Main stars */}
      {palace.mainStars.length > 0 && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "2px 6px",
          fontSize: 13,
          color: "var(--ink-primary)",
          lineHeight: 1.6,
        }}>
          {palace.mainStars.map((s, i) => <StarTag key={i} star={s} />)}
        </div>
      )}

      {/* Minor stars */}
      {palace.minorStars.length > 0 && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1px 4px",
          fontSize: 11,
          color: "var(--ink-tertiary)",
          lineHeight: 1.6,
        }}>
          {palace.minorStars.map((s, i) => <StarTag key={i} star={s} />)}
        </div>
      )}

      {/* Palace-level 四化 */}
      {palace.sihua.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: "auto" }}>
          {palace.sihua.map((h, i) => (
            <span key={i} style={{
              fontSize: 10,
              padding: "1px 5px",
              borderRadius: "var(--r-sm)",
              background: "var(--bg-stone)",
              ...(SIHUA_STYLE[h] ?? { color: "var(--ink-tertiary)" }),
            }}>
              {h}
            </span>
          ))}
        </div>
      )}

      {/* Fallback: show non-empty extras if no stars rendered */}
      {!hasContent && Object.keys(palace.extras).length > 0 && (
        <div style={{ fontSize: 11, color: "var(--ink-disabled)", lineHeight: 1.6, wordBreak: "break-all" }}>
          {Object.entries(palace.extras).slice(0, 4).map(([k, v]) => (
            <div key={k}>{k}: {typeof v === "string" ? v : JSON.stringify(v)}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoCell({ info, palaces }: { info: PersonInfo; palaces: Palace[] }) {
  const rows: [string, string][] = [];
  if (info.name) rows.push(["姓名", info.name]);
  if (info.gender) rows.push(["性别", info.gender]);
  if (info.birthDate) rows.push(["出生", info.birthDate + (info.birthTime ? ` ${info.birthTime}` : "")]);
  if (info.lunarDate) rows.push(["农历", info.lunarDate]);
  if (info.wuxingju) rows.push(["五行局", info.wuxingju]);
  if (info.mingzhu) rows.push(["命主", info.mingzhu]);
  if (info.shenzhu) rows.push(["身主", info.shenzhu]);
  if (info.shengong) rows.push(["身宫", info.shengong]);

  // Add extra info entries
  for (const [k, v] of Object.entries(info.extras)) {
    if (typeof v === "string" || typeof v === "number") {
      rows.push([k, String(v)]);
    }
  }

  return (
    <div style={{
      gridColumn: "2 / 4",
      gridRow: "2 / 4",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
      borderRadius: "var(--r-sm)",
      background: "var(--bg-stone)",
      border: "1px solid var(--line-subtle)",
      gap: 6,
    }}>
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: 18,
        fontWeight: 600,
        color: "var(--ink-primary)",
        letterSpacing: 2,
        marginBottom: 4,
      }}>
        紫微斗数命盘
      </div>

      {rows.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
          {rows.map(([label, value]) => (
            <div key={label} style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              lineHeight: 1.6,
            }}>
              <span style={{ color: "var(--ink-tertiary)", minWidth: 48 }}>{label}</span>
              <span style={{ color: "var(--ink-secondary)", textAlign: "right" }}>{value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--ink-disabled)" }}>
          {palaces.length} 宫
        </div>
      )}
    </div>
  );
}

function JsonFallback({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="card" style={{ padding: 20, borderRadius: "var(--r-lg)" }}>
      <div style={{
        fontSize: 13,
        fontWeight: 500,
        color: "var(--ink-tertiary)",
        marginBottom: 12,
        letterSpacing: 1,
      }}>
        紫微斗数 — 原始数据
      </div>
      <pre style={{
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        color: "var(--ink-secondary)",
        background: "var(--bg-warm)",
        padding: 16,
        borderRadius: "var(--r-md)",
        overflow: "auto",
        maxHeight: 480,
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════ */

export default function ZiweiBoard({ data }: { data: Record<string, unknown> }) {
  const palaces = extractPalaces(data);

  // If we couldn't find enough palaces, show JSON fallback
  if (palaces.length < 6) {
    return <JsonFallback data={data} />;
  }

  const info = extractPersonInfo(data);

  // Map palaces to grid positions by branch
  // Build a lookup: branch -> palace
  const byBranch = new Map<string, Palace>();
  const unmapped: Palace[] = [];

  for (const p of palaces) {
    if (p.branch && GRID_POS[p.branch] && !byBranch.has(p.branch)) {
      byBranch.set(p.branch, p);
    } else {
      unmapped.push(p);
    }
  }

  // Fill remaining positions with unmapped palaces (if any branches are unoccupied)
  const allBranches = Object.keys(GRID_POS);
  let unmappedIdx = 0;
  for (const b of allBranches) {
    if (!byBranch.has(b) && unmappedIdx < unmapped.length) {
      const p = { ...unmapped[unmappedIdx], branch: b };
      byBranch.set(b, p);
      unmappedIdx++;
    }
  }

  // Build the grid cells
  const cells: ReactNode[] = [];

  for (const [branch, [row, col]] of Object.entries(GRID_POS)) {
    const palace = byBranch.get(branch);
    if (palace) {
      cells.push(
        <div key={branch} style={{ gridRow: row, gridColumn: col }}>
          <PalaceCell palace={palace} />
        </div>,
      );
    } else {
      // Empty palace slot
      cells.push(
        <div key={branch} style={{
          gridRow: row,
          gridColumn: col,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 120,
          borderRadius: "var(--r-sm)",
          border: "1px solid var(--line-subtle)",
          background: "var(--bg-base)",
        }}>
          <span style={{ fontSize: 12, color: "var(--ink-disabled)" }}>{branch}</span>
        </div>,
      );
    }
  }

  // Overflow palaces that didn't fit in the grid
  const overflow = unmapped.slice(unmappedIdx);

  return (
    <div>
      <div className="card" style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridTemplateRows: "repeat(4, auto)",
        gap: 4,
        padding: 4,
        borderRadius: "var(--r-lg)",
        background: "var(--bg-warm)",
        overflow: "hidden",
      }}>
        {cells}
        <InfoCell info={info} palaces={palaces} />
      </div>

      {/* Overflow palaces rendered below the grid */}
      {overflow.length > 0 && (
        <div className="card" style={{ marginTop: 16, padding: 16, borderRadius: "var(--r-lg)" }}>
          <div style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink-tertiary)",
            marginBottom: 10,
            letterSpacing: 1,
          }}>
            其他宫位
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
            {overflow.map((p, i) => <PalaceCell key={i} palace={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}

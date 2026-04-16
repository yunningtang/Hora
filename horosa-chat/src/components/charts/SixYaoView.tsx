/* ── SixYaoView ── 六爻 (I Ching hexagram) visualisation ── */

const LINE_W = 120;
const LINE_H = 8;
const GAP = 6;
const BREAK = 14;

// ── helpers ──────────────────────────────────────────────

function get(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function str(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

// ── data extraction ──────────────────────────────────────

interface YaoLine {
  index: number;        // 0 = bottom (初爻)
  yin: boolean;         // true = yin (broken), false = yang (solid)
  moving: boolean;
  dizhi: string;        // 地支
  liuqin: string;       // 六亲
  shiying: string;      // 世 / 应 marker
  liushen: string;      // 六神
  extra: string;        // any extra label
}

interface GuaInfo {
  name: string;
  upper: string;
  lower: string;
  yao: YaoLine[];
  guaci: string;
  yaoci: string[];
  naying: string;
}

const POS_CN = ["初", "二", "三", "四", "五", "上"];

function extractYao(raw: unknown[], fallbackCount: number): YaoLine[] {
  const lines: YaoLine[] = [];
  const count = raw.length || fallbackCount || 6;
  for (let i = 0; i < count; i++) {
    const r = obj(raw[i] ?? {});
    const val = get(r, "value", "val", "v", "yao", "line");
    const isYin =
      val === 0 || val === false || val === "yin" || val === "阴" || val === 6 || val === 8;
    const moving =
      !!get(r, "change", "moving", "dong", "动", "bianyao") ||
      val === 6 || val === 9;
    lines.push({
      index: i,
      yin: isYin,
      moving,
      dizhi: str(get(r, "dizhi", "branch", "地支", "zhi")),
      liuqin: str(get(r, "liuqin", "relative", "六亲", "rel")),
      shiying: str(get(r, "shiying", "shi_ying", "世应", "position")),
      liushen: str(get(r, "liushen", "六神", "god", "shen")),
      extra: str(get(r, "name", "label", "text", "")),
    });
  }
  return lines;
}

function extractGua(d: Record<string, unknown>): GuaInfo {
  const guaObj = obj(get(d, "gua", "hexagram", "benGua", "ben_gua", "本卦", "result") ?? d);
  const name = str(get(guaObj, "name", "guaName", "卦名", "gua_name", "title"));
  const upper = str(get(guaObj, "upper", "upperTrigram", "上卦", "shang", "outer"));
  const lower = str(get(guaObj, "lower", "lowerTrigram", "下卦", "xia", "inner"));
  const rawYao = arr(get(guaObj, "yao", "lines", "yaos", "line", "爻") ?? get(d, "yao", "lines", "yaos", "line", "爻"));
  const yao = extractYao(rawYao, 6);
  const guaci = str(get(guaObj, "guaci", "卦辞", "gua_ci", "description", "text"));
  const rawYaoci = arr(get(guaObj, "yaoci", "爻辞", "yao_ci", "lineTexts"));
  const yaoci = rawYaoci.map((x) => str(x));
  const naying = str(get(guaObj, "naying", "纳音", "nayin"));
  return { name, upper, lower, yao, guaci, yaoci, naying };
}

function extractBianGua(d: Record<string, unknown>): GuaInfo | null {
  const raw = get(d, "bianGua", "bian_gua", "变卦", "changed", "transformed", "changeTo");
  if (!raw) return null;
  const o = obj(raw);
  return extractGua(o);
}

// ── SVG line drawing ─────────────────────────────────────

function YangLine({ moving }: { moving: boolean }) {
  return (
    <rect
      x={0} y={0} width={LINE_W} height={LINE_H} rx={2}
      fill={moving ? "var(--el-fire)" : "var(--ink-primary)"}
    />
  );
}

function YinLine({ moving }: { moving: boolean }) {
  const seg = (LINE_W - BREAK) / 2;
  const color = moving ? "var(--el-fire)" : "var(--ink-primary)";
  return (
    <>
      <rect x={0} y={0} width={seg} height={LINE_H} rx={2} fill={color} />
      <rect x={seg + BREAK} y={0} width={seg} height={LINE_H} rx={2} fill={color} />
    </>
  );
}

function HexagramSVG({ yao, label }: { yao: YaoLine[]; label?: string }) {
  const rowH = LINE_H + 18;
  const svgH = rowH * 6 + 8;
  const leftPad = 100;
  const rightPad = 90;
  const svgW = leftPad + LINE_W + rightPad;

  return (
    <div style={{ textAlign: "center" }}>
      {label && (
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500,
          color: "var(--ink-primary)", marginBottom: 8, letterSpacing: 1,
        }}>
          {label}
        </div>
      )}
      <svg
        width={svgW} height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ display: "block", margin: "0 auto", maxWidth: "100%" }}
      >
        {yao.slice().reverse().map((line, vi) => {
          const i = line.index;
          const y = vi * rowH + 4;
          const posLabel = POS_CN[i] ?? String(i + 1);
          const yinYang = line.yin ? "阴" : "阳";

          return (
            <g key={i}>
              {/* left labels: 六神 + 六亲 + 地支 */}
              <text
                x={leftPad - 8} y={y + LINE_H / 2 + 1}
                textAnchor="end" dominantBaseline="middle"
                fontSize={12} fill="var(--ink-secondary)"
                fontFamily="var(--font-body)"
              >
                {[line.liushen, line.liuqin, line.dizhi].filter(Boolean).join(" ")}
              </text>

              {/* the line */}
              <g transform={`translate(${leftPad}, ${y})`}>
                {line.yin
                  ? <YinLine moving={line.moving} />
                  : <YangLine moving={line.moving} />}
              </g>

              {/* right labels: position + 世/应 + moving marker */}
              <text
                x={leftPad + LINE_W + 8} y={y + LINE_H / 2 + 1}
                textAnchor="start" dominantBaseline="middle"
                fontSize={12} fill="var(--ink-tertiary)"
                fontFamily="var(--font-body)"
              >
                {posLabel}{yinYang}
                {line.shiying ? ` ${line.shiying}` : ""}
                {line.moving ? " ◯" : ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── main component ───────────────────────────────────────

export default function SixYaoView({ data }: { data: Record<string, unknown> }) {
  const gua = extractGua(data);
  const bian = extractBianGua(data);

  // If we couldn't extract any meaningful yao data, show formatted JSON fallback
  const hasYao = gua.yao.length > 0 && gua.yao.some((y) => y.dizhi || y.liuqin || y.extra);
  const hasName = !!gua.name;

  if (!hasYao && !hasName) {
    return (
      <div className="card" style={{ padding: 20, borderRadius: "var(--r-lg)" }}>
        <div style={{
          fontSize: 13, fontWeight: 500, color: "var(--ink-tertiary)",
          marginBottom: 12, letterSpacing: 1,
        }}>
          六爻排盘结果
        </div>
        <pre style={{
          fontSize: 13, lineHeight: 1.7, color: "var(--ink-secondary)",
          whiteSpace: "pre-wrap", wordBreak: "break-all",
          fontFamily: "var(--font-body)", margin: 0,
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  const guaLabel = [gua.name, gua.naying].filter(Boolean).join("  ");
  const trigramLine = [
    gua.upper ? `上卦 ${gua.upper}` : "",
    gua.lower ? `下卦 ${gua.lower}` : "",
  ].filter(Boolean).join("　");

  const bianLabel = bian
    ? [bian.name, bian.naying].filter(Boolean).join("  ")
    : "";

  const question = str(get(data, "question", "问题", "ask"));
  const datetime = str(get(data, "datetime", "date", "时间", "time"));
  const xunkong = str(get(data, "xunkong", "旬空", "xunEmpty"));

  return (
    <div>
      {/* meta info */}
      {(question || datetime || xunkong) && (
        <div style={{
          marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap",
          fontSize: 14, color: "var(--ink-secondary)", letterSpacing: 0.14,
        }}>
          {question && <span>问事：{question}</span>}
          {datetime && <span>{datetime}</span>}
          {xunkong && <span>旬空：{xunkong}</span>}
        </div>
      )}

      {/* header: gua name + trigrams */}
      {(guaLabel || trigramLine) && (
        <div className="card" style={{
          padding: "16px 20px", borderRadius: "var(--r-lg)", marginBottom: 16,
        }}>
          {guaLabel && (
            <div style={{
              fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 300,
              color: "var(--ink-primary)", lineHeight: 1.3, letterSpacing: 1,
            }}>
              {guaLabel}
            </div>
          )}
          {trigramLine && (
            <div style={{ fontSize: 13, color: "var(--ink-tertiary)", marginTop: 6, letterSpacing: 0.5 }}>
              {trigramLine}
            </div>
          )}
        </div>
      )}

      {/* hexagram diagrams */}
      <div className="card" style={{
        padding: "20px 12px", borderRadius: "var(--r-lg)",
        display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
        overflow: "auto",
      }}>
        <HexagramSVG
          yao={gua.yao}
          label={bian ? "本卦" + (gua.name ? ` ${gua.name}` : "") : undefined}
        />
        {bian && (
          <>
            <div style={{
              display: "flex", alignItems: "center",
              fontSize: 20, color: "var(--ink-disabled)", padding: "0 4px",
              fontFamily: "var(--font-display)",
            }}>
              →
            </div>
            <HexagramSVG
              yao={bian.yao.length > 0 ? bian.yao : deriveChangedYao(gua.yao)}
              label={"变卦" + (bianLabel ? ` ${bianLabel}` : "")}
            />
          </>
        )}
      </div>

      {/* 卦辞 */}
      {gua.guaci && (
        <div className="card" style={{ padding: "16px 20px", marginTop: 16, borderRadius: "var(--r-lg)" }}>
          <div style={{
            fontSize: 13, fontWeight: 500, color: "var(--ink-tertiary)",
            marginBottom: 8, letterSpacing: 1,
          }}>
            卦辞
          </div>
          <div style={{ fontSize: 14, color: "var(--ink-secondary)", lineHeight: 1.8, letterSpacing: 0.14 }}>
            {gua.guaci}
          </div>
        </div>
      )}

      {/* 爻辞 */}
      {gua.yaoci.length > 0 && gua.yaoci.some(Boolean) && (
        <div className="card" style={{ padding: "16px 20px", marginTop: 16, borderRadius: "var(--r-lg)" }}>
          <div style={{
            fontSize: 13, fontWeight: 500, color: "var(--ink-tertiary)",
            marginBottom: 8, letterSpacing: 1,
          }}>
            爻辞
          </div>
          {gua.yaoci.map((text, i) =>
            text ? (
              <div key={i} style={{
                fontSize: 14, lineHeight: 1.8, letterSpacing: 0.14,
                color: gua.yao[i]?.moving ? "var(--el-fire)" : "var(--ink-secondary)",
              }}>
                <span style={{ color: "var(--ink-tertiary)", fontWeight: 500 }}>
                  {POS_CN[i] ?? i + 1}爻：
                </span>
                {text}
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}

// Derive changed yao by flipping moving lines
function deriveChangedYao(yao: YaoLine[]): YaoLine[] {
  return yao.map((line) => ({
    ...line,
    yin: line.moving ? !line.yin : line.yin,
    moving: false,
  }));
}

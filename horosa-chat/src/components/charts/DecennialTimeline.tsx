/**
 * DecennialTimeline — 大运流年时间轴
 * Data from horosa_predict_decennials / horosa_predict_givenyear.
 * Renders a horizontal scrollable timeline of decennial periods.
 */

interface DecennialPeriod {
  ganzi: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  stem?: string;
  branch?: string;
}

function extractPeriods(data: Record<string, unknown>): DecennialPeriod[] {
  const periods: DecennialPeriod[] = [];

  // Try common data shapes
  const src = (data.decennials ?? data.dayun ?? data.periods ?? data.data) as unknown;
  const arr = Array.isArray(src) ? src : null;

  if (arr) {
    for (const item of arr) {
      if (item && typeof item === "object") {
        const d = item as Record<string, unknown>;
        periods.push({
          ganzi: String(d.ganzi ?? d.ganzhi ?? d.pillar ?? d.name ?? ""),
          startAge: Number(d.startAge ?? d.start_age ?? d.ageStart ?? 0),
          endAge: Number(d.endAge ?? d.end_age ?? d.ageEnd ?? 0),
          startYear: Number(d.startYear ?? d.start_year ?? d.yearStart ?? 0),
          endYear: Number(d.endYear ?? d.end_year ?? d.yearEnd ?? 0),
          stem: d.stem as string | undefined,
          branch: d.branch as string | undefined,
        });
      }
    }
  }

  return periods;
}

function extractAnnuals(data: Record<string, unknown>): Record<string, unknown>[] {
  const src = (data.annuals ?? data.liuyear ?? data.years ?? data.annual) as unknown;
  if (Array.isArray(src)) return src as Record<string, unknown>[];
  return [];
}

export default function DecennialTimeline({ data }: { data: Record<string, unknown> }) {
  const periods = extractPeriods(data);
  const annuals = extractAnnuals(data);

  if (periods.length === 0 && annuals.length === 0) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 12 }}>大运流年 — 原始数据</div>
        <pre style={{ fontSize: 11, lineHeight: 1.6, color: "var(--ink-secondary)", overflow: "auto", maxHeight: 500, fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div>
      {/* Decennial periods */}
      {periods.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 16, letterSpacing: 1 }}>
            大运
          </div>
          <div style={{
            display: "flex", gap: 2, overflowX: "auto",
            paddingBottom: 8, scrollbarWidth: "thin",
          }}>
            {periods.map((p, i) => (
              <div
                key={i}
                style={{
                  flex: "0 0 auto",
                  width: 80,
                  padding: "12px 8px",
                  textAlign: "center",
                  background: i % 2 === 0 ? "var(--bg-warm)" : "var(--bg-base)",
                  borderRadius: "var(--r-sm)",
                  cursor: "default",
                  transition: "background 0.15s",
                }}
              >
                <div style={{
                  fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 300,
                  color: "var(--ink-primary)", lineHeight: 1.2,
                }}>
                  {p.ganzi}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-tertiary)", marginTop: 6 }}>
                  {p.startAge}–{p.endAge}岁
                </div>
                <div style={{ fontSize: 10, color: "var(--ink-disabled)", marginTop: 2 }}>
                  {p.startYear || ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Annual details */}
      {annuals.length > 0 && (
        <div className="card" style={{ padding: 20, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 16, letterSpacing: 1 }}>
            流年
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
            {annuals.slice(0, 40).map((a, i) => {
              const year = a.year ?? a.yearGanzi ?? a.ganzi ?? "";
              const summary = a.summary ?? a.brief ?? "";
              return (
                <div key={i} style={{
                  padding: "8px",
                  background: "var(--bg-warm)",
                  borderRadius: "var(--r-sm)",
                  textAlign: "center",
                }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 400, color: "var(--ink-primary)" }}>
                    {String(year)}
                  </div>
                  {summary && (
                    <div style={{ fontSize: 10, color: "var(--ink-tertiary)", marginTop: 4, lineHeight: 1.4 }}>
                      {String(summary).slice(0, 20)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

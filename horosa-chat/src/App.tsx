import { useAppStore, type TabKey } from "./stores/appStore";
import { callTool } from "./lib/mcp";
import ProfileForm from "./components/profile/ProfileForm";
import BaziBoard from "./components/charts/BaziBoard";
import InteractionDiagram from "./components/charts/InteractionDiagram";
import ZiweiBoard from "./components/charts/ZiweiBoard";
import AstroChart from "./components/charts/AstroChart";
import SixYaoView from "./components/charts/SixYaoView";
import QimenGrid from "./components/charts/QimenGrid";
import DecennialTimeline from "./components/charts/DecennialTimeline";
import type { BaziBirthResponse } from "./types/horosa";

const TABS: { key: TabKey; label: string; tool: string }[] = [
  { key: "bazi", label: "八字排盘", tool: "horosa_cn_bazi_birth" },
  { key: "ziwei", label: "紫微斗数", tool: "horosa_cn_ziwei_birth" },
  { key: "astro", label: "西占星盘", tool: "horosa_astro_chart" },
  { key: "sixyao", label: "六爻起卦", tool: "horosa_cn_sixyao" },
  { key: "qimen", label: "奇门遁甲", tool: "horosa_cn_qimen" },
  { key: "predict", label: "大运流年", tool: "horosa_predict_decennials" },
];

function App() {
  const store = useAppStore();
  const { activeProfile, activeTab, loading, error } = store;

  async function runTool(tab: TabKey) {
    if (!activeProfile) return;
    const tabDef = TABS.find((t) => t.key === tab);
    if (!tabDef) return;

    store.setLoading(true);
    store.setError(null);

    const args: Record<string, unknown> = {
      date: activeProfile.birthDate,
      time: activeProfile.birthTime,
      zone: activeProfile.zone,
      lat: activeProfile.lat,
      lon: activeProfile.lon,
    };

    // Six yao needs different params
    if (tab === "sixyao") {
      args.date = activeProfile.birthDate;
      args.time = activeProfile.birthTime;
    }

    try {
      const result = await callTool(tabDef.tool, args);
      const typed = result as Record<string, unknown>;

      if (typed.ok === false) {
        store.setError((typed.error as Record<string, string>)?.message ?? "调用失败");
        return;
      }

      switch (tab) {
        case "bazi":
          store.setBaziData((typed as unknown as BaziBirthResponse).data?.bazi ?? null);
          break;
        case "ziwei":
          store.setZiweiData(typed.data as Record<string, unknown> ?? typed);
          break;
        case "astro":
          store.setAstroData(typed.data as Record<string, unknown> ?? typed);
          break;
        case "sixyao":
          store.setSixyaoData(typed.data as Record<string, unknown> ?? typed);
          break;
        case "qimen":
          store.setQimenData(typed.data as Record<string, unknown> ?? typed);
          break;
        case "predict":
          store.setPredictData(typed.data as Record<string, unknown> ?? typed);
          break;
      }
    } catch (e) {
      store.setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      store.setLoading(false);
    }
  }

  function handleTabClick(key: TabKey) {
    store.setActiveTab(key);
  }

  function handleRunCurrent() {
    runTool(activeTab);
  }

  const currentTabDef = TABS.find((t) => t.key === activeTab)!;

  function renderContent() {
    switch (activeTab) {
      case "bazi":
        if (!store.baziData) return null;
        return (
          <>
            <BaziBoard data={store.baziData} />
            <InteractionDiagram data={store.baziData} />
          </>
        );
      case "ziwei":
        if (!store.ziweiData) return null;
        return <ZiweiBoard data={store.ziweiData} />;
      case "astro":
        if (!store.astroData) return null;
        return <AstroChart data={store.astroData} />;
      case "sixyao":
        if (!store.sixyaoData) return null;
        return <SixYaoView data={store.sixyaoData} />;
      case "qimen":
        if (!store.qimenData) return null;
        return <QimenGrid data={store.qimenData} />;
      case "predict":
        if (!store.predictData) return null;
        return <DecennialTimeline data={store.predictData} />;
      default:
        return null;
    }
  }

  const hasData = (() => {
    switch (activeTab) {
      case "bazi": return !!store.baziData;
      case "ziwei": return !!store.ziweiData;
      case "astro": return !!store.astroData;
      case "sixyao": return !!store.sixyaoData;
      case "qimen": return !!store.qimenData;
      case "predict": return !!store.predictData;
    }
  })();

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 300,
            color: "var(--ink-primary)", letterSpacing: 2, lineHeight: 1.2,
          }}>
            命理工作台
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-tertiary)", marginTop: 6, letterSpacing: 1 }}>
            horosa
          </div>
        </div>

        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`sidebar-item ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => handleTabClick(tab.key)}
          >
            {tab.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />
        <div style={{ padding: "0 24px" }}>
          <div style={{ fontSize: 11, color: "var(--ink-disabled)", letterSpacing: 0.5 }}>v0.1.0</div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        {/* Top bar */}
        <div className="top-bar">
          {activeProfile ? (
            <>
              <span style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-primary)" }}>
                {activeProfile.name}
              </span>
              <span style={{ fontSize: 13, color: "var(--ink-tertiary)", fontFamily: "var(--font-mono)", letterSpacing: 0.5 }}>
                {activeProfile.birthDate} {activeProfile.birthTime}
              </span>
              <span className="info-chip">{activeProfile.location}</span>
              <div style={{ flex: 1 }} />
              <button className="btn" onClick={handleRunCurrent} disabled={loading}>
                {loading ? (
                  <span className="loading-dots"><span /><span /><span /></span>
                ) : (
                  currentTabDef.label.replace("排盘", "").replace("起卦", "")
                    ? `排${currentTabDef.label.replace("排盘", "").replace("起卦", "")}`
                    : `运行`
                )}
              </button>
              <button className="btn btn-ghost" onClick={() => store.setActiveProfile(null)}>
                换人
              </button>
            </>
          ) : (
            <span style={{ fontSize: 14, color: "var(--ink-tertiary)", letterSpacing: 0.14 }}>
              创建档案以开始排盘
            </span>
          )}
        </div>

        {/* Content */}
        <div className="content-area" style={{ scrollbarWidth: "thin" }}>
          {error && (
            <div style={{
              marginBottom: 20, padding: "10px 16px",
              background: "rgba(197,48,48,0.06)", borderRadius: "var(--r-md)",
              fontSize: 13, color: "var(--el-fire)", boxShadow: "var(--shadow-edge)",
            }}>
              {error}
            </div>
          )}

          {!activeProfile ? (
            <div style={{ maxWidth: 460 }}>
              <div className="card" style={{ overflow: "hidden" }}>
                <ProfileForm />
              </div>
            </div>
          ) : hasData ? (
            renderContent()
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: 320, gap: 12,
            }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 200,
                color: "var(--ink-disabled)", lineHeight: 1,
              }}>
                {activeTab === "bazi" ? "命" : activeTab === "ziwei" ? "微" : activeTab === "astro" ? "☉" : activeTab === "sixyao" ? "卦" : activeTab === "qimen" ? "奇" : "运"}
              </div>
              <span style={{ fontSize: 13, color: "var(--ink-disabled)", letterSpacing: 0.5 }}>
                点击上方按钮排{currentTabDef.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

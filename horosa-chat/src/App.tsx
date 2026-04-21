import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAppStore, useActiveProfile, useCachedChart, type TabKey } from "./stores/appStore";
import { callTool } from "./lib/mcp";
import ProfileForm from "./components/profile/ProfileForm";
import ProfileManager from "./components/profile/ProfileManager";
import ConfirmDeleteModal from "./components/profile/ConfirmDeleteModal";
import BaziBoard from "./components/charts/BaziBoard";
import InteractionDiagram from "./components/charts/InteractionDiagram";
const ZiweiBoard = lazy(() => import("./components/charts/ZiweiBoard"));
const AstroChart = lazy(() => import("./components/charts/AstroChart"));
const SixYaoView = lazy(() => import("./components/charts/SixYaoView"));
const QimenGrid = lazy(() => import("./components/charts/QimenGrid"));
import type { BaziBirthResponse, BaziData } from "./types/horosa";

const TABS: { key: TabKey; label: string; tool: string; btnLabel: string }[] = [
  { key: "bazi", label: "八 字", tool: "horosa_cn_bazi_direct", btnLabel: "排八字" },
  { key: "ziwei", label: "紫 微", tool: "horosa_cn_ziwei_birth", btnLabel: "排紫微" },
  { key: "astro", label: "西 占", tool: "horosa_astro_chart", btnLabel: "排星盘" },
  { key: "sixyao", label: "六 爻", tool: "horosa_cn_sixyao", btnLabel: "起卦" },
  { key: "qimen", label: "奇 门", tool: "horosa_cn_qimen", btnLabel: "排奇门" },
];

function ErrorToast() {
  const { error, setError } = useAppStore();
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error, setError]);
  if (!error) return null;
  return (
    <div className="toast">
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--el-fire)", marginTop: 6, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, marginBottom: 2 }}>调用失败</div>
        <div style={{ color: "var(--ink-4)", fontSize: 12, lineHeight: 1.5 }}>{error}</div>
      </div>
      <button onClick={() => setError(null)} className="icon-btn" style={{ width: 22, height: 22 }} aria-label="关闭">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function Skeleton({ tab = "bazi" }: { tab?: TabKey }) {
  const layouts: Record<TabKey, number[]> = {
    bazi: [48, 420, 160, 100, 100],
    ziwei: [560],
    astro: [420, 260],
    sixyao: [80, 260, 100, 100],
    qimen: [60, 420],
  };
  const heights = layouts[tab] ?? layouts.bazi;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {heights.map((h, i) => <div key={i} className="skeleton" style={{ height: h }} />)}
    </div>
  );
}

function TabBar({ activeTab, onChange }: { activeTab: TabKey; onChange: (t: TabKey) => void }) {
  const barRef = useRef<HTMLDivElement>(null);
  const [underline, setUnderline] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!barRef.current) return;
    const activeEl = barRef.current.querySelector<HTMLButtonElement>(`.tab.active`);
    if (activeEl) {
      const rect = activeEl.getBoundingClientRect();
      const parentRect = barRef.current.getBoundingClientRect();
      setUnderline({ left: rect.left - parentRect.left, width: rect.width });
    }
  }, [activeTab]);

  return (
    <div ref={barRef} className="tabbar">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`tab ${tab.key === activeTab ? "active" : ""}`}
        >
          {tab.label}
        </button>
      ))}
      <div className="tab-underline" style={{ left: underline.left, width: underline.width }} />
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="16" x2="20" y2="16" />
    </svg>
  );
}
function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function App() {
  const store = useAppStore();
  const activeProfile = useActiveProfile();
  const activeTab = useAppStore((s) => s.activeTab);
  const loading = useAppStore((s) => s.loading);
  const hydrated = useAppStore((s) => s.hydrated);
  const profileDraft = useAppStore((s) => s.profileDraft);
  const cachedData = useCachedChart(activeProfile?.id ?? null, activeTab);
  const [fetchAttempted, setFetchAttempted] = useState<Record<string, boolean>>({});

  useEffect(() => { store.hydrate(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    if (!activeProfile || !hydrated) return;
    const key = `${activeProfile.id}:${activeTab}`;
    if (cachedData || fetchAttempted[key] || loading) return;
    runTool(activeTab);
    setFetchAttempted((s) => ({ ...s, [key]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile?.id, activeTab, cachedData, hydrated]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        store.openNewProfile();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>(".sidebar-search input")?.focus();
      }
      if (e.key === "Escape") {
        if (profileDraft) store.closeProfileDraft();
        else if (store.pendingDelete) store.cancelDelete();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileDraft, store.pendingDelete]);

  async function runTool(tab: TabKey) {
    if (!activeProfile) return;
    const tabDef = TABS.find((t) => t.key === tab);
    if (!tabDef) return;

    store.setLoading(true);
    store.setError(null);

    try {
      const needsGender = tab === "bazi" || tab === "ziwei";
      const args: Record<string, unknown> = {
        date: activeProfile.birthDate,
        time: activeProfile.birthTime,
        zone: activeProfile.zone,
        lat: activeProfile.lat,
        lon: activeProfile.lon,
      };
      if (needsGender) args.gender = activeProfile.gender === "M";
      const result = await callTool(tabDef.tool, args);
      const typed = result as Record<string, unknown>;

      if (typed.ok === false) {
        const err = typed.error as Record<string, string> | undefined;
        store.setError(err?.message ?? "调用失败");
        return;
      }

      const typedData = typed.data as Record<string, unknown> | undefined;
      let payload: unknown = typedData ?? typed;
      if (tab === "bazi") {
        payload = (typed as unknown as BaziBirthResponse).data?.bazi ?? null;
      }
      if (payload) await store.setChart(activeProfile.id, tab, payload);
    } catch (e) {
      store.setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      store.setLoading(false);
    }
  }

  function renderChart() {
    if (!cachedData) return null;
    const lazyWrap = (el: React.ReactNode) => (
      <Suspense fallback={<Skeleton tab={activeTab} />}>{el}</Suspense>
    );
    switch (activeTab) {
      case "bazi":
        return (
          <>
            <BaziBoard data={cachedData as BaziData} />
            <InteractionDiagram data={cachedData as BaziData} />
          </>
        );
      case "ziwei": return lazyWrap(<ZiweiBoard data={cachedData as Record<string, unknown>} />);
      case "astro": return lazyWrap(<AstroChart data={cachedData as Record<string, unknown>} />);
      case "sixyao": return lazyWrap(<SixYaoView data={cachedData as Record<string, unknown>} />);
      case "qimen": return lazyWrap(<QimenGrid data={cachedData as Record<string, unknown>} />);
    }
  }

  const currentTab = TABS.find((t) => t.key === activeTab)!;
  const showWizard = profileDraft !== null || (hydrated && store.profiles.length === 0 && !activeProfile);

  if (!hydrated) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--ink-5)", fontSize: 13 }}>
        <div className="loading-dots"><span /><span /><span /></div>
      </div>
    );
  }

  return (
    <>
      <div className="layout">
        {/* Sidebar — 和罗 branded */}
        <aside className="sidebar">
          <ProfileManager />
        </aside>

        {/* Main */}
        <div className="main-area">
          {activeProfile ? (
            <>
              {/* Profile strip */}
              <div className="profile-strip">
                <div className="profile-strip-avatar">
                  {activeProfile.name.slice(0, 1)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="profile-strip-name">
                    <span>{activeProfile.name.length === 2 ? `${activeProfile.name[0]} ${activeProfile.name[1]}` : activeProfile.name}</span>
                    <span className="mini-chip">
                      {activeProfile.gender === "M" ? "♂ 男" : activeProfile.gender === "F" ? "♀ 女" : "⚥"}
                    </span>
                    {activeProfile.relation && (
                      <span className="mini-chip">{activeProfile.relation}</span>
                    )}
                  </div>
                  <div className="profile-strip-meta">
                    <span>{activeProfile.birthDate}</span>
                    <span className="sep">·</span>
                    <span>{activeProfile.birthTime}</span>
                    <span className="sep">·</span>
                    <span>{activeProfile.location}{activeProfile.subLocation ? ` ${activeProfile.subLocation}` : ""}</span>
                    {activeProfile.trueSolarTime !== false && (
                      <>
                        <span className="sep">·</span>
                        <span>真太阳时</span>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="btn ghost" style={{ gap: 5 }}>
                    <ExportIcon />
                    导 出
                  </button>
                  <button className="btn" style={{ gap: 6 }}>
                    <ChatIcon />
                    问 和 罗
                  </button>
                </div>
              </div>

              {/* Tab bar */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", background: "var(--bg)" }}>
                <div style={{ flex: 1 }}>
                  <TabBar activeTab={activeTab} onChange={store.setActiveTab} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 2, paddingRight: 24, position: "absolute", right: 0 }}>
                  <button className="icon-btn" title="重新排盘" onClick={() => runTool(activeTab)} disabled={loading}>
                    <RefreshIcon />
                  </button>
                  <button className="icon-btn" title="更多" style={{ marginLeft: 4 }}>
                    <MenuIcon />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="content-area">
                {loading ? (
                  <Skeleton tab={activeTab} />
                ) : cachedData ? (
                  <div key={`${activeProfile.id}:${activeTab}`} className="fade-in">
                    {renderChart()}
                  </div>
                ) : (
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", padding: "80px 20px", gap: 20,
                    animation: "fade-in var(--dur-slow) var(--ease-out)",
                  }}>
                    <div style={{
                      fontFamily: "var(--font-display)", fontSize: 64, fontWeight: 200,
                      color: "var(--ink-5)", lineHeight: 1,
                    }}>
                      {activeTab === "bazi" ? "命" : activeTab === "ziwei" ? "微" : activeTab === "astro" ? "☉" : activeTab === "sixyao" ? "卦" : "奇"}
                    </div>
                    <button className="btn" onClick={() => runTool(activeTab)}>
                      {currentTab.btnLabel}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "100%", gap: 24, padding: 48,
              animation: "fade-in var(--dur-slow) var(--ease-out)",
            }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 72, fontWeight: 200,
                color: "var(--ink-5)", lineHeight: 1, letterSpacing: 8,
              }}>
                和 罗
              </div>
              <div style={{ textAlign: "center", maxWidth: 340 }}>
                <div style={{ fontSize: 15, color: "var(--ink-3)", marginBottom: 10, letterSpacing: 0.2 }}>
                  {store.profiles.length > 0 ? "选择左侧档案以开始" : "还没有档案"}
                </div>
                {store.profiles.length === 0 && (
                  <>
                    <div style={{ fontSize: 13, color: "var(--ink-4)", lineHeight: 1.7, marginBottom: 24 }}>
                      档案是一个人的生辰信息,用于排八字、紫微、西占等命盘。
                      所有数据保存在本地浏览器,不上传。
                    </div>
                    <button className="btn" onClick={store.openNewProfile}>
                      创建第一个档案
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wizard */}
      {showWizard && (
        <div className="overlay" onClick={() => store.closeProfileDraft()}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
            <ProfileForm
              initial={profileDraft && profileDraft.id ? profileDraft : undefined}
              onDone={() => store.closeProfileDraft()}
            />
          </div>
        </div>
      )}

      <ConfirmDeleteModal />
      <ErrorToast />
    </>
  );
}

export default App;

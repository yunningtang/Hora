/**
 * ProfileManager — 和罗 sidebar profile list.
 * Matches the reference design with hash-colored avatars, relation tag,
 * and subtle active state (no colored side-borders).
 */
import { useMemo, useState } from "react";
import { useAppStore, type Profile } from "../../stores/appStore";

/** Stable HSL palette from name */
function nameColor(name: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
  const hue = Math.abs(hash) % 360;
  return {
    bg: `hsl(${hue}, 28%, 90%)`,
    fg: `hsl(${hue}, 42%, 28%)`,
  };
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function DeleteIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  );
}

function ProfileCard({ profile, isActive }: { profile: Profile; isActive: boolean }) {
  const { setActiveProfile, openEditProfile, askDelete } = useAppStore();
  const genderIcon = profile.gender === "M" ? "♂" : profile.gender === "F" ? "♀" : "⚥";
  const avatarColor = nameColor(profile.name);
  const birthYear = profile.birthDate.slice(0, 4);

  return (
    <div
      onClick={() => setActiveProfile(profile.id)}
      className={`profile-row ${isActive ? "active" : ""}`}
    >
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: isActive ? "var(--ink)" : avatarColor.bg,
        color: isActive ? "var(--accent-inv)" : avatarColor.fg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 600, flexShrink: 0,
        fontFamily: "var(--font-display)",
        transition: "background var(--dur-normal) var(--ease-out), color var(--dur-normal) var(--ease-out)",
      }}>
        {profile.name.slice(0, 1)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: isActive ? 600 : 500,
          color: "var(--ink)", whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ fontFamily: "var(--font-display)", letterSpacing: 2 }}>
            {profile.name.length === 2 ? `${profile.name[0]} ${profile.name[1]}` : profile.name}
          </span>
          <span style={{ fontSize: 11, color: "var(--ink-4)", fontWeight: 400 }}>
            {genderIcon}
          </span>
        </div>
        <div style={{
          fontSize: 11, color: "var(--ink-4)", marginTop: 2,
          fontFamily: "var(--font-mono)", letterSpacing: 0.2,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {birthYear} · {profile.location}
          {profile.subLocation && <span style={{ opacity: 0.7 }}> {profile.subLocation}</span>}
        </div>
      </div>

      <div className="actions" style={{ display: "flex", gap: 2 }}>
        <button
          onClick={(e) => { e.stopPropagation(); openEditProfile(profile); }}
          className="icon-btn" title="编辑"
          style={{ width: 24, height: 24 }}
        >
          <EditIcon />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); askDelete(profile); }}
          className="icon-btn" title="删除"
          style={{ width: 24, height: 24 }}
        >
          <DeleteIcon />
        </button>
      </div>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

export default function ProfileManager() {
  const { profiles, activeProfileId, openNewProfile } = useAppStore();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.birthDate.includes(q)
    );
  }, [profiles, query]);

  return (
    <>
      {/* Brand header */}
      <div className="brand-heluo">
        <div>
          <div className="brand-heluo-name">和 罗</div>
          <div className="brand-heluo-sub">命 理 工 作 台</div>
        </div>
        <div className="brand-heluo-glyph">時</div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索档案..."
        />
        <span className="kbd">⌘K</span>
      </div>

      {/* Section header */}
      <div className="sidebar-section-header">
        <span>档 案</span>
        <button
          onClick={openNewProfile}
          style={{
            border: "none", background: "transparent", cursor: "pointer",
            fontSize: 12, color: "var(--ink-3)", fontWeight: 500,
            padding: "2px 6px", borderRadius: 4,
            transition: "all var(--dur-fast) var(--ease-out)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.background = "var(--bg-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "transparent"; }}
        >
          + 新 建
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
        {filtered.length === 0 ? (
          <div style={{
            margin: "8px 16px", padding: "14px 12px",
            textAlign: "center", fontSize: 12, color: "var(--ink-4)",
            background: "var(--bg-inner)", borderRadius: "var(--r-md)",
            border: "1px dashed var(--line)",
          }}>
            {query ? "无匹配档案" : "暂无档案"}
          </div>
        ) : (
          filtered.map((p) => (
            <ProfileCard key={p.id} profile={p} isActive={activeProfileId === p.id} />
          ))
        )}
      </div>

      {/* Footer — Ask Heluo + settings */}
      <div className="sidebar-footer-actions">
        <button className="ask-heluo" title="问和罗">
          <ChatIcon />
          问 和 罗
        </button>
        <button className="icon-btn" title="设置" style={{ width: 32, height: 32 }}>
          <SettingsIcon />
        </button>
      </div>
    </>
  );
}

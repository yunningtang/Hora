import { useAppStore } from "../../stores/appStore";

export default function ConfirmDeleteModal() {
  const { pendingDelete, cancelDelete, removeProfile } = useAppStore();
  if (!pendingDelete) return null;

  return (
    <div className="overlay" onClick={cancelDelete}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 380, padding: 28 }}
      >
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 400,
          color: "var(--ink-primary)", marginBottom: 14, letterSpacing: 0.3,
        }}>
          删除档案
        </div>
        <div style={{ fontSize: 14, color: "var(--ink-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
          确定要删除档案{" "}
          <span style={{ fontWeight: 600, color: "var(--ink-primary)" }}>「{pendingDelete.name}」</span>{" "}
          吗?
          <br />
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
            该档案下的所有命盘数据(八字/紫微/西占/六爻/奇门)也会一并删除,无法恢复。
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={cancelDelete} className="btn btn-white">
            取消
          </button>
          <button
            onClick={() => removeProfile(pendingDelete.id)}
            className="btn"
            style={{ background: "var(--el-fire)", borderColor: "var(--el-fire)" }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(0.92)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

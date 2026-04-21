/**
 * ProfileForm — 3-step wizard for creating / editing a profile.
 * If `initial` is provided with an id, acts as edit mode.
 */
import { useState, useEffect } from "react";
import { useAppStore, type Profile } from "../../stores/appStore";
import DateTimeStep from "./DateTimeStep";
import LocationStep from "./LocationStep";

export default function ProfileForm({ initial, onDone }: { initial?: Partial<Profile>; onDone?: () => void }) {
  const addOrUpdateProfile = useAppStore((s) => s.addOrUpdateProfile);
  const isEdit = Boolean(initial?.id);
  const [step, setStep] = useState(0);

  const [name, setName] = useState(initial?.name ?? "");
  const [gender, setGender] = useState<"M" | "F" | "X">((initial?.gender as "M" | "F" | "X") ?? "M");
  const [relation, setRelation] = useState(initial?.relation ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "1990-06-15");
  const [birthTime, setBirthTime] = useState(initial?.birthTime ?? "12:00");
  const [unknownTime, setUnknownTime] = useState(false);
  const [trueSolarTime, setTrueSolarTime] = useState(initial?.trueSolarTime ?? true);
  const [lat, setLat] = useState(initial?.lat ?? "39.90");
  const [lon, setLon] = useState(initial?.lon ?? "116.40");
  const [zone, setZone] = useState(initial?.zone ?? "8");
  const [location, setLocation] = useState(initial?.location ?? "北京");
  const [subLocation, setSubLocation] = useState(initial?.subLocation ?? "");

  useEffect(() => {
    if (initial) {
      setName(initial.name ?? "");
      setGender((initial.gender as "M" | "F" | "X") ?? "M");
      setRelation(initial.relation ?? "");
      setBirthDate(initial.birthDate ?? "1990-06-15");
      setBirthTime(initial.birthTime ?? "12:00");
      setTrueSolarTime(initial.trueSolarTime ?? true);
      setLat(initial.lat ?? "39.90");
      setLon(initial.lon ?? "116.40");
      setZone(initial.zone ?? "8");
      setLocation(initial.location ?? "北京");
      setSubLocation(initial.subLocation ?? "");
      setStep(0);
    }
  }, [initial?.id]);

  async function submit() {
    await addOrUpdateProfile({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim() || "未命名",
      gender,
      relation: relation.trim() || undefined,
      birthDate,
      birthTime: unknownTime ? "12:00" : birthTime,
      trueSolarTime,
      zone,
      lat,
      lon,
      location,
      subLocation: subLocation.trim() || undefined,
      createdAt: initial?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    });
    onDone?.();
  }

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-tertiary)",
    marginBottom: 6, letterSpacing: 0.3,
  };

  const steps = ["基本信息", "出生时间", "出生地点"];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 300,
            color: "var(--ink-primary)", letterSpacing: 1,
          }}>
            {isEdit ? "编辑档案" : "新建档案"}
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 16, alignItems: "center" }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div
                  onClick={() => i < step && setStep(i)}
                  style={{
                    width: 22, height: 22, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 600,
                    background: i <= step ? "var(--ink-primary)" : "var(--bg-warm)",
                    color: i <= step ? "var(--bg-base)" : "var(--ink-disabled)",
                    cursor: i < step ? "pointer" : "default",
                    transition: "all 0.2s ease",
                  }}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{
                  fontSize: 12, color: i === step ? "var(--ink-primary)" : "var(--ink-disabled)",
                  fontWeight: i === step ? 500 : 400,
                }}>
                  {s}
                </span>
                {i < steps.length - 1 && (
                  <div style={{ width: 16, height: 1, background: i < step ? "var(--ink-primary)" : "var(--bg-warm)", margin: "0 4px" }} />
                )}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={onDone}
          style={{
            border: "none", background: "transparent", cursor: "pointer",
            color: "var(--ink-disabled)", fontSize: 18, padding: 4,
          }}
          title="取消"
        >
          ×
        </button>
      </div>

      {step === 0 && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>姓名</label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入姓名"
              autoFocus
              style={{ height: 44, fontSize: 15 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>性别</label>
            <div style={{ display: "flex", gap: 8 }}>
              {([["M", "男"], ["F", "女"], ["X", "其他"]] as const).map(([val, lb]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setGender(val)}
                  style={{
                    flex: 1, padding: "10px 0", fontSize: 14, fontWeight: 500,
                    color: gender === val ? "var(--accent-inv)" : "var(--ink-3)",
                    background: gender === val ? "var(--ink)" : "var(--bg-card)",
                    border: "none", borderRadius: "var(--r-md)",
                    cursor: "pointer", transition: "all 0.2s ease",
                  }}
                >
                  {lb}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>关系标签 <span style={{ color: "var(--ink-5)", fontWeight: 400 }}>(可选)</span></label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {["朋友", "家人", "伴侣", "同事", "历史人物", "客户"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRelation(r === relation ? "" : r)}
                  style={{
                    padding: "5px 12px", fontSize: 12, fontWeight: 500,
                    color: relation === r ? "var(--accent-inv)" : "var(--ink-3)",
                    background: relation === r ? "var(--ink)" : "var(--bg-card)",
                    border: "none", borderRadius: "var(--r-pill)",
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <input
              className="input-field"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="自定义关系..."
              style={{ fontSize: 13, height: 36 }}
            />
          </div>

          <button className="btn" style={{ width: "100%", padding: "10px 24px", fontSize: 15 }}
            onClick={() => setStep(1)}>
            下一步
          </button>
        </div>
      )}

      {step === 1 && (
        <DateTimeStep
          birthDate={birthDate} setBirthDate={setBirthDate}
          birthTime={birthTime} setBirthTime={setBirthTime}
          unknownTime={unknownTime} setUnknownTime={setUnknownTime}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <LocationStep
          lat={lat} setLat={setLat}
          lon={lon} setLon={setLon}
          zone={zone} setZone={setZone}
          location={location} setLocation={setLocation}
          onBack={() => setStep(1)}
          onSubmit={submit}
          submitLabel={isEdit ? "保存" : "创建档案"}
        />
      )}
    </div>
  );
}

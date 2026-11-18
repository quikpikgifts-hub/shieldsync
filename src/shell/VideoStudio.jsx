import React, { useEffect, useMemo, useState } from "react";
import { Film, Upload, Sparkles, ClipboardCheck, ShieldCheck, Download, X, CircleAlert, CheckCircle2, FileVideo, WandSparkles } from "lucide-react";
import { T } from "./theme.js";
import { Btn, Card, Field, inputStyle, Pill } from "./primitives.jsx";

const CHECKS = [
  { label: "Message and factual accuracy", points: 20 },
  { label: "Visual quality and framing", points: 20 },
  { label: "Audio clarity", points: 15 },
  { label: "Captions and spelling", points: 15 },
  { label: "Brand consistency", points: 10 },
  { label: "Editing and pacing", points: 10 },
  { label: "Platform formatting and CTA", points: 10 },
];

export default function VideoStudio({ session, workspace, brandList = [] }) {
  const [brandId, setBrandId] = useState(brandList[0]?.id || "");
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [format, setFormat] = useState("9:16");
  const [duration, setDuration] = useState("30");
  const [script, setScript] = useState(null);
  const [scriptText, setScriptText] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [checks, setChecks] = useState([]);
  const [projectName, setProjectName] = useState("New video project");

  const brand = useMemo(() => brandList.find(b => b.id === brandId) || null, [brandList, brandId]);
  const score = CHECKS.reduce((sum, item, i) => sum + (checks.includes(i) ? item.points : 0), 0);

  useEffect(() => {
    if (!file) { setPreviewUrl(""); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!brandId && brandList[0]) setBrandId(brandList[0].id);
  }, [brandList, brandId]);

  const generateScript = async () => {
    if (!brand || !topic.trim()) {
      setError("Choose a client brand and enter a video topic first.");
      return;
    }
    if (!session?.access_token || !workspace?.ownerOrgId) {
      setError("A signed-in workspace session is required for AI script generation.");
      return;
    }
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/social/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          agent: "videoScript",
          org_id: workspace.ownerOrgId,
          input: {
            brandVoice: brand.brandVoice || `Business: ${brand.businessName}. Industry: ${brand.industry || "not specified"}. Description: ${brand.description || ""}. Tone: ${brand.tone || "clear, trustworthy and professional"}.`,
            topic: `${topic}. Client: ${brand.businessName}. Target runtime: ${duration} seconds. Use authentic client-provided footage and do not invent testimonials, credentials, legal outcomes or spoken statements.`,
            platform,
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Script generation is unavailable.");
      setScript(data.script || null);
      const s = data.script || {};
      const formatted = [
        s.hook ? `HOOK: ${s.hook}` : "",
        ...(s.beats || []).map((beat, i) => `${i + 1}. ${beat}`),
        s.cta ? `CTA: ${s.cta}` : "",
        (s.onScreenText || []).length ? `ON-SCREEN TEXT: ${s.onScreenText.join(" / ")}` : "",
      ].filter(Boolean).join("\n\n");
      setScriptText(formatted);
      setNotice("Script generated. Review every statement against the client's approved facts before production.");
    } catch (err) {
      setError(err.message || "Could not generate the script.");
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (event) => {
    const next = event.target.files?.[0] || null;
    if (next && !next.type.startsWith("video/")) {
      setError("Please choose a video file.");
      event.target.value = "";
      return;
    }
    setError("");
    setFile(next);
  };

  const resetProject = () => {
    setFile(null);
    setScript(null);
    setScriptText("");
    setTopic("");
    setProjectName("New video project");
    setChecks([]);
    setNotice("");
    setError("");
  };

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
            <Film size={22} color={T.accent} />
            <div style={{ fontSize: 23, fontWeight: 850 }}>Quik Pik AI Video Studio</div>
          </div>
          <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>Create client briefs, generate scripts, preview source footage and run the 90-point production quality gate.</div>
        </div>
        <Pill tone="accent">Production workspace</Pill>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 16, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 16 }}>
          <Card>
            <div style={{ fontSize: 15, fontWeight: 750, marginBottom: 14 }}>1. Project brief</div>
            <Field label="Client / brand">
              <select style={inputStyle} value={brandId} onChange={e => setBrandId(e.target.value)}>
                <option value="">Choose a client brand</option>
                {brandList.map(b => <option key={b.id} value={b.id}>{b.businessName}</option>)}
              </select>
            </Field>
            <Field label="Project name">
              <input style={inputStyle} value={projectName} onChange={e => setProjectName(e.target.value)} />
            </Field>
            <Field label="Video topic / objective">
              <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={topic} onChange={e => setTopic(e.target.value)} placeholder="Example: George Phillips introduces himself and explains how Huggins helps families understand the bail bond process." />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Platform">
                <select style={inputStyle} value={platform} onChange={e => setPlatform(e.target.value)}>
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram Reels</option>
                  <option value="facebook">Facebook</option>
                  <option value="youtube">YouTube Shorts</option>
                </select>
              </Field>
              <Field label="Aspect ratio">
                <select style={inputStyle} value={format} onChange={e => setFormat(e.target.value)}>
                  <option>9:16</option><option>16:9</option><option>1:1</option>
                </select>
              </Field>
            </div>
            <Field label="Target runtime">
              <select style={inputStyle} value={duration} onChange={e => setDuration(e.target.value)}>
                <option value="15">15 seconds</option><option value="30">30 seconds</option><option value="45">45 seconds</option><option value="60">60 seconds</option>
              </select>
            </Field>
            <Btn onClick={generateScript} disabled={busy || !brandList.length} style={{ width: "100%", justifyContent: "center" }}>
              <Sparkles size={14} /> {busy ? "Generating script…" : "Generate video script"}
            </Btn>
            {!brandList.length && <div style={{ marginTop: 10, color: T.amber, fontSize: 12 }}>Add a client brand in Social before creating a client project.</div>}
            {error && <div style={{ marginTop: 12, color: T.red, fontSize: 12.5 }}>{error}</div>}
            {notice && <div style={{ marginTop: 12, color: T.green, fontSize: 12.5 }}>{notice}</div>}
          </Card>

          <Card>
            <div style={{ fontSize: 15, fontWeight: 750, marginBottom: 8 }}>2. Source footage</div>
            <div style={{ color: T.textSub, fontSize: 12.5, lineHeight: 1.6, marginBottom: 12 }}>Select an authorized client video to preview it in this browser. This first studio build does not upload or permanently store the file.</div>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: 18, border: `1px dashed ${T.borderH}`, borderRadius: 10, cursor: "pointer", color: T.textSub, background: T.surface }}>
              <Upload size={17} /> Choose video file
              <input type="file" accept="video/*" onChange={handleFile} style={{ display: "none" }} />
            </label>
            {file && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                    <FileVideo size={16} color={T.accent} />
                    <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                  </div>
                  <button onClick={() => setFile(null)} aria-label="Remove video" style={{ background: "none", border: 0, color: T.textSub, cursor: "pointer" }}><X size={15} /></button>
                </div>
                <video src={previewUrl} controls playsInline style={{ width: "100%", maxHeight: 300, background: "#000", borderRadius: 8 }} />
                <div style={{ marginTop: 7, fontSize: 11, color: T.amber }}>Local preview only — upload storage is not yet connected.</div>
              </div>
            )}
          </Card>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 750 }}>3. Script and edit notes</div>
              {script && <Pill tone="green">Generated</Pill>}
            </div>
            <textarea value={scriptText} onChange={e => setScriptText(e.target.value)} placeholder="Your generated script will appear here. You can edit it before production." style={{ ...inputStyle, minHeight: 240, resize: "vertical", lineHeight: 1.6 }} />
            <div style={{ fontSize: 11.5, color: T.textDim, marginTop: 8 }}>Use only the client's real statements and verified business information. AI output is a draft, not a verified claim.</div>
          </Card>

          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 750 }}>4. Internal quality gate</div>
              <div style={{ fontSize: 20, fontWeight: 850, color: score >= 90 ? T.green : T.amber }}>{score}/100</div>
            </div>
            <div style={{ fontSize: 12, color: T.textSub, marginBottom: 12 }}>Mark each item only after checking the finished edit. A score of 90 is required; any compliance failure is an automatic hold.</div>
            {CHECKS.map((item, i) => (
              <label key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 0", borderTop: `1px solid ${T.border}`, cursor: "pointer" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.textSub }}>
                  <input type="checkbox" checked={checks.includes(i)} onChange={e => setChecks(old => e.target.checked ? [...old, i] : old.filter(x => x !== i))} />
                  {item.label}
                </span>
                <span style={{ fontSize: 12, color: T.textDim }}>{item.points} pts</span>
              </label>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, color: score >= 90 ? T.green : T.amber, fontSize: 12.5 }}>
              {score >= 90 ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}
              {score >= 90 ? "Internal checklist threshold reached. Compliance review still required." : "Not ready to pass. Complete the remaining checks."}
            </div>
          </Card>
        </div>
      </div>

      <Card style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
          <ShieldCheck size={18} color={T.accent} />
          <div style={{ fontSize: 14, fontWeight: 750 }}>Approval and publishing controls</div>
          <Pill tone="amber">Not yet connected</Pill>
        </div>
        <div style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.65 }}>
          This workspace currently supports a local source-video preview, brief and script drafting. Persistent media storage, server-recorded client approvals, version locking and per-client publishing authorization still need to be implemented before this project can be submitted for formal approval or published from ShieldSync.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <Btn variant="ghost" onClick={resetProject}>Clear local project</Btn>
        </div>
      </Card>
    </div>
  );
}

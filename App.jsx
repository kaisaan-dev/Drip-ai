import { useState, useRef, useCallback } from "react";

const STYLE_CATEGORIES = ["Cohesion", "Fit", "Colour", "Creativity", "Vibe"];

export default function DripAI() {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef();
  const shareCardRef = useRef();

  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setImageBase64(e.target.result.split(",")[1]);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }, []);

  const analyzeOutfit = async () => {
    if (!imageBase64) return;
    setLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/jpeg", data: imageBase64 }
              },
              {
                type: "text",
                text: `You are a sharp, honest, stylish fashion critic. Analyse this outfit photo and respond ONLY with valid JSON, no markdown, no extra text.

Return exactly this structure:
{
  "overallScore": <number 1-10>,
  "verdict": "<one punchy sentence verdict, max 12 words>",
  "scores": {
    "Cohesion": <1-10>,
    "Fit": <1-10>,
    "Colour": <1-10>,
    "Creativity": <1-10>,
    "Vibe": <1-10>
  },
  "whatWorks": "<2-3 sentences on what's working>",
  "whatDoesnt": "<2-3 sentences on what's not working>",
  "stylistTip": "<one specific, actionable tip to elevate the look>"
}`
              }
            ]
          }]
        })
      });
      const data = await response.json();
      const text = data.content.map(i => i.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(clean));
    } catch (err) {
      console.error(err);
      setResult({ error: true });
    }
    setLoading(false);
  };

  const reset = () => {
    setImage(null);
    setImageBase64(null);
    setResult(null);
    setCopied(false);
  };

  const shareToTwitter = () => {
    const score = result?.overallScore;
    const label = getScoreLabel(score);
    const text = `My outfit just got rated ${score}/10 (${label}) by Drip AI 🔥\n\nCheck yours at drip.ai`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyShareText = () => {
    const score = result?.overallScore;
    const label = getScoreLabel(score);
    const cats = STYLE_CATEGORIES.map(c => `${c}: ${result.scores[c]}/10`).join(" · ");
    const text = `drip.ai rated my fit ${score}/10 (${label})\n${cats}\n"${result.verdict}"\ncheck yours → drip.ai`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "#C8F560";
    if (score >= 6) return "#F5D060";
    return "#F56060";
  };

  const getScoreLabel = (score) => {
    if (score >= 9) return "FIRE 🔥";
    if (score >= 8) return "CLEAN ✨";
    if (score >= 7) return "DECENT 👍";
    if (score >= 5) return "MID 😐";
    return "MISS ❌";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0A",
      fontFamily: "'Courier New', monospace",
      color: "#F0EDE6",
      overflowX: "hidden"
    }}>
      {/* Grain */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        opacity: 0.5
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "520px", margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <h1 style={{
              fontSize: "clamp(52px, 14vw, 88px)", fontWeight: "900", lineHeight: "0.9",
              margin: 0, letterSpacing: "-0.04em",
              fontFamily: "'Georgia', serif",
              color: "#F0EDE6"
            }}>drip</h1>
            <span style={{
              fontSize: "clamp(18px, 4vw, 24px)", fontWeight: "400",
              color: "#C8F560", fontFamily: "'Courier New', monospace",
              letterSpacing: "0.1em"
            }}>.ai</span>
          </div>
          <div style={{ fontSize: "12px", letterSpacing: "0.2em", color: "#444", marginTop: "8px" }}>
            RATE YOUR FIT WITH AI
          </div>
          <div style={{ width: "32px", height: "2px", background: "#C8F560", marginTop: "12px" }} />
        </div>

        {/* Upload */}
        {!image && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            style={{
              border: `2px dashed ${dragOver ? "#C8F560" : "#222"}`,
              borderRadius: "4px", padding: "64px 32px",
              textAlign: "center", cursor: "pointer",
              transition: "all 0.2s",
              background: dragOver ? "rgba(200,245,96,0.03)" : "transparent",
            }}
          >
            <div style={{ fontSize: "52px", marginBottom: "20px" }}>👕</div>
            <div style={{ fontSize: "13px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#666" }}>
              Drop your fit
            </div>
            <div style={{ fontSize: "11px", color: "#333", marginTop: "8px" }}>tap to upload · any photo works</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => processFile(e.target.files[0])} />
          </div>
        )}

        {/* Preview + Analyse */}
        {image && !result && (
          <div>
            <div style={{ position: "relative", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
              <img src={image} alt="outfit" style={{
                width: "100%", display: "block", maxHeight: "500px", objectFit: "cover"
              }} />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)"
              }} />
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={analyzeOutfit} disabled={loading} style={{
                flex: 1, padding: "18px",
                background: loading ? "#1A1A1A" : "#C8F560",
                color: loading ? "#444" : "#0A0A0A",
                border: "none", borderRadius: "4px",
                fontSize: "13px", fontWeight: "700", letterSpacing: "0.25em",
                textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Courier New', monospace", transition: "all 0.15s"
              }}>
                {loading ? "READING THE FIT..." : "RATE MY FIT →"}
              </button>
              <button onClick={reset} style={{
                padding: "18px 20px", background: "transparent", color: "#444",
                border: "1px solid #1A1A1A", borderRadius: "4px",
                fontSize: "11px", cursor: "pointer",
                fontFamily: "'Courier New', monospace", letterSpacing: "0.1em"
              }}>✕</button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{
              display: "inline-block", width: "28px", height: "28px",
              border: "2px solid #1A1A1A", borderTopColor: "#C8F560",
              borderRadius: "50%", animation: "spin 0.7s linear infinite"
            }} />
            <div style={{ marginTop: "16px", fontSize: "11px", letterSpacing: "0.25em", color: "#444" }}>
              ANALYSING YOUR DRIP...
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Results */}
        {result && !result.error && (
          <div style={{ animation: "fadeUp 0.4s ease forwards" }}>
            <style>{`
              @keyframes fadeUp {
                from { opacity: 0; transform: translateY(16px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            {/* SHAREABLE CARD */}
            <div ref={shareCardRef} style={{
              background: "#111", border: "1px solid #1E1E1E",
              borderRadius: "8px", overflow: "hidden", marginBottom: "16px"
            }}>
              {/* Card top - image + score overlay */}
              <div style={{ position: "relative" }}>
                <img src={image} alt="outfit" style={{
                  width: "100%", display: "block",
                  maxHeight: "360px", objectFit: "cover", objectPosition: "top"
                }} />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, #111 0%, rgba(0,0,0,0.3) 50%, transparent 100%)"
                }} />
                {/* Score badge */}
                <div style={{
                  position: "absolute", bottom: "20px", left: "20px", right: "20px",
                  display: "flex", alignItems: "flex-end", justifyContent: "space-between"
                }}>
                  <div>
                    <div style={{
                      fontSize: "72px", fontWeight: "900", lineHeight: "1",
                      fontFamily: "'Georgia', serif",
                      color: getScoreColor(result.overallScore),
                      textShadow: "0 2px 20px rgba(0,0,0,0.5)"
                    }}>
                      {result.overallScore}
                      <span style={{ fontSize: "24px", color: "rgba(255,255,255,0.4)" }}>/10</span>
                    </div>
                    <div style={{
                      fontSize: "12px", letterSpacing: "0.2em",
                      color: getScoreColor(result.overallScore), marginTop: "4px"
                    }}>
                      {getScoreLabel(result.overallScore)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: "18px", fontWeight: "900", letterSpacing: "-0.02em",
                    fontFamily: "'Georgia', serif", color: "rgba(255,255,255,0.6)"
                  }}>
                    drip<span style={{ color: "#C8F560" }}>.ai</span>
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: "20px" }}>
                {/* Verdict */}
                <div style={{
                  fontSize: "15px", fontStyle: "italic", color: "#AAA",
                  fontFamily: "'Georgia', serif", marginBottom: "20px",
                  lineHeight: "1.5"
                }}>
                  "{result.verdict}"
                </div>

                {/* Category bars */}
                <div style={{ marginBottom: "20px" }}>
                  {STYLE_CATEGORIES.map(cat => (
                    <div key={cat} style={{ marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "10px", letterSpacing: "0.15em", color: "#555" }}>{cat.toUpperCase()}</span>
                        <span style={{ fontSize: "10px", color: getScoreColor(result.scores[cat]) }}>
                          {result.scores[cat]}/10
                        </span>
                      </div>
                      <div style={{ height: "2px", background: "#1A1A1A", borderRadius: "1px" }}>
                        <div style={{
                          height: "100%", borderRadius: "1px",
                          width: `${result.scores[cat] * 10}%`,
                          background: getScoreColor(result.scores[cat])
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feedback */}
                {[
                  { label: "WHAT'S WORKING", content: result.whatWorks, accent: "#C8F560" },
                  { label: "WHAT'S NOT", content: result.whatDoesnt, accent: "#F56060" },
                  { label: "STYLIST TIP", content: result.stylistTip, accent: "#60C8F5" },
                ].map(({ label, content, accent }) => (
                  <div key={label} style={{
                    marginBottom: "12px", padding: "14px 16px",
                    background: "#0D0D0D", borderRadius: "4px",
                    borderLeft: `2px solid ${accent}`
                  }}>
                    <div style={{ fontSize: "9px", letterSpacing: "0.3em", color: accent, marginBottom: "6px" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#888" }}>
                      {content}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share buttons */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              <button onClick={copyShareText} style={{
                flex: 1, padding: "14px",
                background: copied ? "#1A2A0A" : "#C8F560",
                color: copied ? "#C8F560" : "#0A0A0A",
                border: copied ? "1px solid #C8F560" : "none",
                borderRadius: "4px", fontSize: "12px", fontWeight: "700",
                letterSpacing: "0.2em", cursor: "pointer",
                fontFamily: "'Courier New', monospace", transition: "all 0.2s"
              }}>
                {copied ? "COPIED ✓" : "COPY TO SHARE"}
              </button>
              <button onClick={shareToTwitter} style={{
                flex: 1, padding: "14px",
                background: "transparent", color: "#888",
                border: "1px solid #222", borderRadius: "4px",
                fontSize: "12px", fontWeight: "700", letterSpacing: "0.2em",
                cursor: "pointer", fontFamily: "'Courier New', monospace"
              }}>
                POST ON X →
              </button>
            </div>

            <button onClick={reset} style={{
              width: "100%", padding: "14px",
              background: "transparent", color: "#333",
              border: "1px solid #111", borderRadius: "4px",
              fontSize: "11px", cursor: "pointer",
              fontFamily: "'Courier New', monospace",
              letterSpacing: "0.2em", textTransform: "uppercase"
            }}>
              CHECK ANOTHER FIT
            </button>
          </div>
        )}

        {result?.error && (
          <div style={{ textAlign: "center", padding: "32px", color: "#F56060", fontSize: "13px" }}>
            Something went wrong. Try again.
            <br />
            <button onClick={reset} style={{
              marginTop: "16px", padding: "12px 24px",
              background: "transparent", color: "#555",
              border: "1px solid #222", borderRadius: "4px",
              cursor: "pointer", fontFamily: "'Courier New', monospace",
              fontSize: "11px", letterSpacing: "0.15em"
            }}>RETRY</button>
          </div>
        )}

        <div style={{
          marginTop: "64px", paddingTop: "20px",
          borderTop: "1px solid #111",
          fontSize: "10px", letterSpacing: "0.2em", color: "#222",
          textAlign: "center"
        }}>
          DRIP.AI — AI FASHION CRITIC
        </div>
      </div>
    </div>
  );
}

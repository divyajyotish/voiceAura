import { useState } from "react";
import "./styles.css";
import { requestMicrophoneAccess, analyzeStream } from "./utils/audioAnalysis";
import { downloadVoiceAuraPDF } from "./utils/pdfReport";
import { startPayment } from "./utils/payment";

export default function App() {
  const [requesting, setRequesting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryId, setRecoveryId] = useState("");
  const [recoveryChecking, setRecoveryChecking] = useState(false);
  const [recoveryError, setRecoveryError] = useState(null);

  // Step 1: ask for mic permission and WAIT for it. Only once it's
  // actually granted do we switch into the "recording" UI - this is the
  // fix for recording appearing to start before permission was answered.
  const startRecording = async () => {
    setError(null);
    setReport(null);
    setUnlocked(false);
    setPaymentError(null);
    setRequesting(true);

    try {
      const stream = await requestMicrophoneAccess();
      setRequesting(false);
      setRecording(true);
      setTimeLeft(30);

      const result = await analyzeStream(stream, 30, (secondsLeft) => {
        setTimeLeft(secondsLeft);
      });
      setReport(result);
    } catch (err) {
      console.error(err);
      setError(
        "Microphone access is required for VoiceAura to analyze your voice. Please allow microphone access in your browser and try again."
      );
    } finally {
      setRequesting(false);
      setRecording(false);
    }
  };

  // Download Professional PDF - now generated natively (crisp text,
  // proper branding/sections), not a screenshot of the on-screen card
  const downloadPDF = () => {
    downloadVoiceAuraPDF(report);
  };

  const handleUnlock = () => {
    setPaymentError(null);
    setPaying(true);
    startPayment({
      onSuccess: () => {
        setPaying(false);
        setUnlocked(true);
      },
      onFailure: (message) => {
        setPaying(false);
        if (message) setPaymentError(message);
      },
    });
  };

  // Recovery path: if Razorpay's widget showed an error but money was
  // actually deducted (a known checkout-widget glitch), the user can
  // paste their Payment ID (visible in their bank/UPI app or Razorpay
  // SMS/email) and we verify it directly against Razorpay's records.
  const handleRecoveryCheck = async () => {
    setRecoveryError(null);
    if (!recoveryId.trim()) {
      setRecoveryError("Please enter your Payment ID.");
      return;
    }
    setRecoveryChecking(true);
    try {
      const res = await fetch("/.netlify/functions/check-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: recoveryId.trim() }),
      });
      const result = await res.json();
      if (result.verified) {
        setUnlocked(true);
        setShowRecovery(false);
      } else {
        setRecoveryError(
          "This Payment ID doesn't show as a successful payment yet. If money was deducted, please wait a few minutes and try again, or contact support."
        );
      }
    } catch (err) {
      console.error(err);
      setRecoveryError("Could not verify right now. Please try again.");
    } finally {
      setRecoveryChecking(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <div className="badge">Real-Time Voice Analysis</div>

        <h1 className="title">VoiceAura</h1>

        <p className="subtitle">
          Get real, measured insights into your voice — confidence, energy,
          pitch, and speaking patterns — from a 30-second recording.
        </p>

        <div className="stats">
          <div className="stat-card">
            <h2 className="stat-number">30s</h2>
            <p className="stat-label">Quick Voice Scan</p>
          </div>

          <div className="stat-card">
            <h2 className="stat-number">0</h2>
            <p className="stat-label">Audio Stored or Uploaded</p>
          </div>

          <div className="stat-card">
            <h2 className="stat-number">7+</h2>
            <p className="stat-label">Real Acoustic Metrics</p>
          </div>
        </div>

        {/* Mic Button */}
        <div className="mic-wrapper">
          <button
            className={`mic-button ${recording ? "recording" : ""}`}
            onClick={startRecording}
            disabled={recording || requesting}
          >
            🎤
          </button>

          {!recording && !requesting && !error && (
            <p className="subtitle-small">Tap to start your AI voice scan</p>
          )}
          {requesting && (
            <p className="subtitle-small">Requesting microphone access…</p>
          )}
          {recording && <p className="timer">{timeLeft}s remaining...</p>}
        </div>

        {error && <div className="error-box">{error}</div>}

        {/* Report */}
        {report && (
          <div className="report-card">
            <h2>Your Professional VoiceAura Report</h2>
            <p className="report-disclaimer">
              Based on real-time analysis of your 30-second voice recording.
            </p>

            <div className="report-item">
              Vocal Confidence Score: <span>{report.score}%</span>
            </div>

            <div className="report-item">
              Voice Energy: <span>{report.energyLevel}</span>
            </div>

            {!unlocked && (
              <div className="locked-section">
                <div className="locked-blur">
                  <div className="report-item">
                    Vocal Tone: <span>██████████</span>
                  </div>
                  <div className="report-item">
                    Pitch Profile: <span>██████████</span>
                  </div>
                  <div className="report-item">
                    Pitch Steadiness: <span>██████████</span>
                  </div>
                  <div className="report-item">
                    Pause Ratio: <span>██████████</span>
                  </div>
                  <div className="report-item">
                    AI Recommendation: <span>████████████████████</span>
                  </div>
                  <div className="report-item">
                    Personality Type: <span>██████████</span>
                  </div>
                  <div className="report-item">
                    Career Match: <span>██████████</span>
                  </div>
                </div>

                <div className="unlock-box">
                  <p className="unlock-title">🔒 Unlock Your Full Report</p>
                  <p className="unlock-subtitle">
                    Get 13 detailed insights including AI Recommendation,
                    Personality Type, Career Match &amp; more — plus a
                    downloadable PDF.
                  </p>
                  <button
                    className="unlock-btn"
                    onClick={handleUnlock}
                    disabled={paying}
                  >
                    {paying ? "Opening secure payment…" : "Unlock Full Report — ₹29"}
                  </button>
                  {paymentError && (
                    <p className="payment-error">{paymentError}</p>
                  )}

                  {!showRecovery ? (
                    <button
                      className="recovery-link"
                      onClick={() => setShowRecovery(true)}
                    >
                      Already paid but report didn't unlock?
                    </button>
                  ) : (
                    <div className="recovery-box">
                      <p className="recovery-label">
                        Enter your Payment ID (from your bank/UPI app or Razorpay
                        message) to verify and unlock:
                      </p>
                      <input
                        type="text"
                        className="recovery-input"
                        placeholder="e.g. pay_XXXXXXXXXXXXXX"
                        value={recoveryId}
                        onChange={(e) => setRecoveryId(e.target.value)}
                      />
                      <button
                        className="recovery-btn"
                        onClick={handleRecoveryCheck}
                        disabled={recoveryChecking}
                      >
                        {recoveryChecking ? "Checking…" : "Verify Payment"}
                      </button>
                      {recoveryError && (
                        <p className="payment-error">{recoveryError}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {unlocked && (
              <>
                <div className="report-item">
                  Vocal Tone: <span>{report.tone}</span>
                </div>

                <div className="report-item">
                  Pitch Profile: <span>{report.pitchProfile}</span>
                </div>

                <div className="report-item">
                  Average Pitch:{" "}
                  <span>
                    {report.avgPitch > 0 ? `${report.avgPitch} Hz` : "Not Detected"}
                  </span>
                </div>

                <div className="report-item">
                  Pitch Steadiness: <span>{report.steadiness}</span>
                </div>

                <div className="report-item">
                  Pause Ratio: <span>{report.pauseRatio}%</span>
                </div>

                <div className="report-item">
                  AI Recommendation: <span>{report.recommendation}</span>
                </div>

                <p className="report-disclaimer fun-insights-divider">
                  Fun Insights — for entertainment &amp; self-reflection
                </p>

                <div className="report-item">
                  Estimated Voice Age: <span>{report.estimatedVoiceAge}</span>
                </div>

                <div className="report-item">
                  Personality Type: <span>{report.personalityType}</span>
                </div>

                <div className="report-item">
                  Leadership Aura: <span>{report.leadershipAura}</span>
                </div>

                <div className="report-item">
                  Persuasion Power: <span>{report.persuasionPower}</span>
                </div>

                <div className="report-item">
                  Stress Level: <span>{report.stressLevel}</span>
                </div>

                <div className="report-item">
                  Relationship Style: <span>{report.relationshipStyle}</span>
                </div>

                <div className="report-item">
                  Career Match: <span>{report.careerMatch}</span>
                </div>

                <div className="report-item">
                  Insight: <span>{report.insight}</span>
                </div>

                <button className="download-btn" onClick={downloadPDF}>
                  Download Professional Report (PDF)
                </button>
              </>
            )}
          </div>
        )}

        <footer className="site-footer">
          <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
          <span className="footer-dot">•</span>
          <a href="/terms.html" target="_blank" rel="noopener noreferrer">
            Terms &amp; Conditions
          </a>
          <span className="footer-dot">•</span>
          <a href="/refund-policy.html" target="_blank" rel="noopener noreferrer">
            Refund Policy
          </a>
        </footer>
      </div>
    </div>
  );
}

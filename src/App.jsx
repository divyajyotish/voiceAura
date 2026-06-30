import { useState } from "react";
import "./styles.css";
import { requestMicrophoneAccess, analyzeStream } from "./utils/audioAnalysis";
import { downloadVoiceAuraPDF } from "./utils/pdfReport";

export default function App() {
  const [requesting, setRequesting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  // Step 1: ask for mic permission and WAIT for it. Only once it's
  // actually granted do we switch into the "recording" UI - this is the
  // fix for recording appearing to start before permission was answered.
  const startRecording = async () => {
    setError(null);
    setReport(null);
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

  return (
    <div className="app">
      <div className="container">
        <div className="badge">AI Powered Voice Intelligence</div>

        <h1 className="title">VoiceAura</h1>

        <p className="subtitle">
          Unlock your hidden personality, emotional power, confidence, and
          voice energy in just 30 seconds.
        </p>

        <div className="stats">
          <div className="stat-card">
            <h2 className="stat-number">50K+</h2>
            <p className="stat-label">Reports Generated</p>
          </div>

          <div className="stat-card">
            <h2 className="stat-number">92%</h2>
            <p className="stat-label">Accuracy Score</p>
          </div>

          <div className="stat-card">
            <h2 className="stat-number">4.9★</h2>
            <p className="stat-label">User Rating</p>
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

            <button className="download-btn" onClick={downloadPDF}>
              Download Professional Report (PDF)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

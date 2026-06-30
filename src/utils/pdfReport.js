// Builds a clean, branded VoiceAura PDF report directly with jsPDF
// drawing commands (text, rects, lines) instead of screenshotting the
// on-screen card. This avoids the dark-card-colors-on-forced-white-bg
// bug, gives crisp text instead of a blurry image, and makes it easy to
// extend later (e.g. locked/premium sections, watermarks, page 2).
import jsPDF from "jspdf";

function generateReportId() {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VA-${rand}`;
}

export function downloadVoiceAuraPDF(report) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  const gold = [255, 183, 0];
  const goldDark = [184, 134, 11];
  const navy = [10, 20, 40];
  const textDark = [45, 45, 45];
  const textMuted = [120, 120, 120];

  const pitchDisplay =
    report.avgPitch > 0 ? `${report.avgPitch} Hz` : "Not Detected";

  // ---------- Header band ----------
  doc.setFillColor(...gold);
  doc.rect(0, 0, pageWidth, 38, "F");
  doc.setFillColor(...goldDark);
  doc.rect(0, 36, pageWidth, 1.5, "F");

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("VoiceAura", margin, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text("AI Powered Voice Intelligence Report", margin, 28);

  const reportId = generateReportId();
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  doc.setFontSize(9);
  doc.text(`Report ID: ${reportId}`, pageWidth - margin, 17, { align: "right" });
  doc.text(`Date: ${dateStr}`, pageWidth - margin, 23, { align: "right" });

  let y = 52;

  doc.setTextColor(...textMuted);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.text(
    "Based on real-time acoustic analysis of a 30-second voice recording.",
    margin,
    y
  );
  y += 12;

  // ---------- helpers ----------
  const sectionTitle = (title) => {
    doc.setFillColor(...gold);
    doc.rect(margin, y - 4.5, 3, 5, "F");
    doc.setTextColor(...navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, margin + 6, y);
    y += 9;
  };

  const fieldRow = (label, value) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11.5);
    doc.setTextColor(...textDark);
    doc.text(label, margin, y);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...goldDark);
    doc.text(String(value), pageWidth - margin, y, { align: "right" });

    y += 7;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y - 3.5, pageWidth - margin, y - 3.5);
    y += 3;
  };

  // ---------- Section 1 ----------
  sectionTitle("Vocal Performance Metrics");
  fieldRow("Vocal Confidence Score", `${report.score}%`);
  fieldRow("Voice Energy", report.energyLevel);
  fieldRow("Pitch Profile", report.pitchProfile);
  fieldRow("Average Pitch", pitchDisplay);
  y += 6;

  // ---------- Section 2 ----------
  sectionTitle("Speaking Pattern Analysis");
  fieldRow("Vocal Tone", report.tone);
  fieldRow("Pitch Steadiness", report.steadiness);
  fieldRow("Pause Ratio", `${report.pauseRatio}%`);
  y += 6;

  // ---------- Section 3: Fun Insights ----------
  // Clearly separated and labelled as entertainment/self-reflection,
  // since these traits aren't a scientific reading of personality,
  // age, or relationships - just a playful interpretation of the
  // measured energy/steadiness/score above.
  sectionTitle("Fun Insights");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.text("For entertainment and self-reflection purposes.", margin, y);
  y += 8;

  fieldRow("Estimated Voice Age", report.estimatedVoiceAge);
  fieldRow("Personality Type", report.personalityType);
  fieldRow("Leadership Aura", report.leadershipAura);
  fieldRow("Persuasion Power", report.persuasionPower);
  fieldRow("Stress Level", report.stressLevel);
  fieldRow("Relationship Style", report.relationshipStyle);
  fieldRow("Career Match", report.careerMatch);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...textDark);
  const insightLines = doc.splitTextToSize(report.insight, contentWidth);
  doc.text(insightLines, margin, y);
  y += insightLines.length * 6 + 8;

  // ---------- AI Recommendation callout ----------
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const recLines = doc.splitTextToSize(report.recommendation, contentWidth - 14);
  const recBoxHeight = recLines.length * 6 + 16;

  doc.setFillColor(255, 248, 225);
  doc.roundedRect(margin, y, contentWidth, recBoxHeight, 3, 3, "F");
  doc.setFillColor(...gold);
  doc.rect(margin, y, 2, recBoxHeight, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(...navy);
  doc.text("AI Recommendation", margin + 8, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...textDark);
  doc.text(recLines, margin + 8, y + 16);

  y += recBoxHeight + 14;

  // ---------- Footer ----------
  const footerY = doc.internal.pageSize.getHeight() - 18;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text(
    "This report reflects acoustic patterns from a single recording and is intended for guidance and self-improvement purposes.",
    margin,
    footerY
  );
  doc.setFont("helvetica", "normal");
  doc.text("Generated by VoiceAura AI", margin, footerY + 5);
  doc.text(reportId, pageWidth - margin, footerY + 5, { align: "right" });

  doc.save("VoiceAura-Professional-Report.pdf");
}
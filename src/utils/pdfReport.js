import jsPDF from "jspdf";
import { translations } from "./reportTranslations";

function generateReportId() {
  return `VA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function addPageIfNeeded(doc, y, needed = 30) {
  if (y + needed > 272) { doc.addPage(); return 20; }
  return y;
}

export function downloadVoiceAuraPDF(report, lang = "en") {
  const t = translations[lang] || translations.en;
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  const gold = [255, 183, 0];
  const goldDark = [184, 134, 11];
  const navy = [10, 20, 40];
  const textDark = [45, 45, 45];
  const textMuted = [110, 110, 110];
  const textLight = [80, 80, 80];

  const reportId = generateReportId();
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const pitchDisplay = report.avgPitch > 0 ? `${report.avgPitch} ${t.hz}` : t.notDetected;
  const energyLabel = t.energyLevels[report.energyLevel] || report.energyLevel;
  const steadyLabel = t.steadinessLevels[report.steadiness] || report.steadiness;
  const stressLabel = t.stressLevels[report.stressLevel] || report.stressLevel;
  const pitchLabel = t.pitchProfiles[report.pitchProfile] || report.pitchProfile;

  // Header
  doc.setFillColor(...gold);
  doc.rect(0, 0, pageWidth, 42, "F");
  doc.setFillColor(...goldDark);
  doc.rect(0, 40, pageWidth, 1.5, "F");
  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text(t.brandName, margin, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(t.reportTitle, margin, 27);
  doc.setFontSize(9);
  doc.text(`${t.reportId}: ${reportId}`, pageWidth - margin, 16, { align: "right" });
  doc.text(`${t.date}: ${dateStr}`, pageWidth - margin, 23, { align: "right" });

  let y = 55;

  // Helpers
  const sectionHeader = (title) => {
    y = addPageIfNeeded(doc, y, 20);
    doc.setFillColor(...gold);
    doc.rect(margin, y - 4, 3.5, 7, "F");
    doc.setTextColor(...navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, margin + 6, y + 1);
    y += 11;
  };

  const subLabel = (label) => {
    y = addPageIfNeeded(doc, y, 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...goldDark);
    doc.text(label, margin, y);
    y += 6;
  };

  const bodyText = (text, indent = 0) => {
    if (!text) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...textDark);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    y = addPageIfNeeded(doc, y, lines.length * 5.5 + 2);
    doc.text(lines, margin + indent, y);
    y += lines.length * 5.5 + 3;
  };

  const bullet = (text) => {
    if (!text) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...textDark);
    const lines = doc.splitTextToSize(text, contentWidth - 8);
    y = addPageIfNeeded(doc, y, lines.length * 5.5 + 1);
    doc.text("•", margin + 2, y);
    doc.text(lines, margin + 8, y);
    y += lines.length * 5.5 + 2;
  };

  const callout = (title, text) => {
    const lines = doc.splitTextToSize(text, contentWidth - 14);
    const boxH = lines.length * 5.5 + 16;
    y = addPageIfNeeded(doc, y, boxH + 4);
    doc.setFillColor(255, 248, 220);
    doc.roundedRect(margin, y, contentWidth, boxH, 3, 3, "F");
    doc.setFillColor(...gold);
    doc.rect(margin, y, 2.5, boxH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...navy);
    doc.text(title, margin + 8, y + 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...textDark);
    doc.text(lines, margin + 8, y + 16);
    y += boxH + 6;
  };

  const divider = () => {
    y = addPageIfNeeded(doc, y, 6);
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  };

  const bigLabel = (text) => {
    y = addPageIfNeeded(doc, y, 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...goldDark);
    doc.text(text, margin, y);
    y += 8;
  };

  const gap = (n = 5) => { y += n; };

  // ─── 1. Voice Identity ───
  sectionHeader(t.s1Title);
  bodyText(t.s1Body1);
  bodyText(t.s1Body2);
  gap(); divider();

  // ─── 2. Confidence ───
  sectionHeader(`${t.s2Title} (${report.score}%)`);
  const confFn = report.score >= 85 ? t.s2High : report.score >= 70 ? t.s2Mid : t.s2Low;
  bodyText(confFn(report.score));
  gap(3);
  subLabel(t.s2DeepInsight);
  bullet(t.s2B1); bullet(t.s2B2); bullet(t.s2B3);
  if (report.score < 85) bullet(t.s2B4);
  gap(2);
  subLabel(t.s2Impact); bodyText(t.s2ImpactBody, 4);
  gap(2);
  subLabel(t.s2Tip);
  bullet(t.s2T1); bullet(t.s2T2); bullet(t.s2T3);
  gap(); divider();

  // ─── 3. Voice Energy ───
  sectionHeader(t.s3Title);
  bodyText(t.s3Intro(energyLabel));
  gap(3);
  subLabel(t.s3Means);
  const energyBullets = report.energyLevel === "High" ? t.s3High : report.energyLevel === "Medium" ? t.s3Mid : t.s3Low;
  energyBullets.forEach(b => bullet(b));
  gap(2);
  subLabel(t.s3PsyEffect);
  const psyText = report.energyLevel === "High" ? t.s3PsyHigh : report.energyLevel === "Medium" ? t.s3PsyMid : t.s3PsyLow;
  bodyText(psyText, 4);
  gap(2);
  subLabel(t.s3Tip);
  const tipText = report.energyLevel === "High" ? t.s3TipHigh : report.energyLevel === "Medium" ? t.s3TipMid : t.s3TipLow;
  bodyText(tipText, 4);
  gap(); divider();

  // ─── 4. Vocal Tone ───
  sectionHeader(`${t.s4Title} (${report.tone})`);
  bodyText(t.s4Body);
  gap(3);
  subLabel(t.s4Means);
  bullet(t.s4B1); bullet(t.s4B2); bullet(t.s4B3);
  gap(2);
  subLabel(t.s4Social); bodyText(t.s4SocialBody, 4);
  gap(); divider();

  // ─── 5. Pitch Profile ───
  sectionHeader(`${t.s5Title} — ${pitchLabel} (${pitchDisplay})`);
  subLabel(t.s5WhatItSays);
  const pitchBullets = report.pitchProfile === "Low Register" ? t.s5Low : report.pitchProfile === "High Register" ? t.s5High : t.s5Mid;
  pitchBullets.forEach(b => bullet(b));
  gap(2);
  subLabel(t.s5Advantage);
  const advText = report.pitchProfile === "Low Register" ? t.s5AdvLow : report.pitchProfile === "High Register" ? t.s5AdvHigh : t.s5AdvMid;
  bodyText(advText, 4);
  if (report.pitchProfile !== "Mid Register") {
    gap(2);
    subLabel(t.s5Improve);
    const impText = report.pitchProfile === "Low Register" ? t.s5ImpLow : t.s5ImpHigh;
    bodyText(impText, 4);
  }
  gap(); divider();

  // ─── 6. Pitch Steadiness ───
  sectionHeader(`${t.s6Title} (${steadyLabel})`);
  const steadyIntro = report.steadiness === "Steady" ? t.s6Steady : report.steadiness === "Moderate" ? t.s6Moderate : t.s6Variable;
  bodyText(steadyIntro);
  gap(3);
  subLabel(t.s6Interp);
  const steadyBullets = report.steadiness === "Steady" ? t.s6SteadyB : report.steadiness === "Moderate" ? t.s6ModB : t.s6VarB;
  steadyBullets.forEach(b => bullet(b));
  if (report.steadiness === "Variable") {
    gap(2); subLabel(t.s6Hidden); bodyText(t.s6HiddenBody, 4);
  }
  gap(2);
  subLabel(t.s6Rec);
  bodyText(report.steadiness === "Steady" ? t.s6RecSteady : t.s6RecOther, 4);
  gap(); divider();

  // ─── 7. Pause Pattern ───
  sectionHeader(`${t.s7Title} (${report.pauseRatio}%)`);
  const pauseIntro = report.pauseRatio < 25 ? t.s7Low : report.pauseRatio < 40 ? t.s7Mid : t.s7High;
  bodyText(pauseIntro);
  gap(3);
  subLabel(t.s7Means);
  bullet(t.s7B1); bullet(t.s7B2);
  gap(2);
  subLabel(t.s7Positive); bodyText(t.s7PosBody, 4);
  gap(2);
  subLabel(t.s7Risk); bodyText(t.s7RiskBody, 4);
  gap(); divider();

  // ─── Fun Insights Banner ───
  y = addPageIfNeeded(doc, y, 30);
  doc.setFillColor(255, 248, 220);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...navy);
  doc.text(t.funInsightsHeader, pageWidth / 2, y + 8, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.text(t.funInsightsDisclaimer, pageWidth / 2, y + 15, { align: "center" });
  y += 28;

  // ─── 8. Personality ───
  sectionHeader(t.s8Title);
  bigLabel(report.personalityType);
  bodyText(t.s8Intro);
  bullet(t.s8B1); bullet(t.s8B2); bullet(t.s8B3);
  gap(2);
  subLabel(t.s8Strength); bodyText(t.s8StrBody, 4);
  gap(2);
  subLabel(t.s8Weak); bodyText(t.s8WeakBody, 4);
  gap(); divider();

  // ─── 9. Leadership ───
  sectionHeader(t.s9Title);
  bigLabel(report.leadershipAura);
  bodyText(t.s9Body);
  gap(3);
  subLabel(t.s9Indicators);
  bullet(t.s9B1); bullet(t.s9B2); bullet(t.s9B3);
  gap(2);
  subLabel(t.s9Growth); bodyText(t.s9GrowthBody, 4);
  gap(); divider();

  // ─── 10. Persuasion ───
  sectionHeader(t.s10Title);
  bigLabel(report.persuasionPower);
  bodyText(t.s10Body);
  bullet(t.s10B1); bullet(t.s10B2); bullet(t.s10B3);
  gap(2); bodyText(t.s10Conclusion, 4);
  gap(); divider();

  // ─── 11. Stress ───
  sectionHeader(t.s11Title);
  bigLabel(stressLabel);
  if (report.stressLevel === "Calm & Stable") {
    bodyText(t.s11Calm);
    gap(2); subLabel(t.s11Advice); bodyText(t.s11CalmAdv, 4);
  } else {
    bodyText(t.s11Elevated);
    gap(2); subLabel(t.s11Reasons);
    bullet(t.s11R1); bullet(t.s11R2); bullet(t.s11R3);
    gap(2); subLabel(t.s11Advice);
    bullet(t.s11A1); bullet(t.s11A2); bullet(t.s11A3);
  }
  gap(); divider();

  // ─── 12. Relationship ───
  sectionHeader(t.s12Title);
  bigLabel(report.relationshipStyle);
  bodyText(t.s12Body);
  bullet(t.s12B1); bullet(t.s12B2); bullet(t.s12B3);
  gap(2);
  subLabel(t.s12Strength); bodyText(t.s12StrBody, 4);
  gap(2);
  subLabel(t.s12Risk); bodyText(t.s12RiskBody, 4);
  gap(); divider();

  // ─── 13. Career ───
  sectionHeader(t.s13Title);
  bodyText(t.s13Intro);
  gap(3);
  const careers = report.careerMatch.split(",");
  careers.forEach(c => bullet(`✔ ${c.trim()}`));
  gap(2);
  subLabel(t.s13Why); bodyText(t.s13WhyBody, 4);
  gap(); divider();

  // ─── 14. Hidden Strengths ───
  sectionHeader(t.s14Title);
  bodyText(t.s14Intro);
  gap(3);
  bullet(t.s14B1); bullet(t.s14B2); bullet(t.s14B3);
  bullet(t.s14B4); bullet(t.s14B5);
  gap(); divider();

  // ─── 15. Growth Plan ───
  sectionHeader(t.s15Title);
  subLabel(t.s15D1); bullet(t.s15D1B1); bullet(t.s15D1B2); gap(3);
  subLabel(t.s15D2); bullet(t.s15D2B1); bullet(t.s15D2B2); gap(3);
  subLabel(t.s15D3); bullet(t.s15D3B1); bullet(t.s15D3B2); gap(3);
  subLabel(t.s15D4); bullet(t.s15D4B1); bullet(t.s15D4B2);
  gap(); divider();

  // ─── Action Tips ───
  if (report.actionTips && report.actionTips.length > 0) {
    sectionHeader(t.actionTipsTitle);
    report.actionTips.forEach(tip => bullet(tip));
    gap(); divider();
  }

  // ─── Final Summary ───
  const rating = Math.min(10, (report.score / 10)).toFixed(1);
  callout(
    t.finalSummaryTitle,
    `${t.finalSummaryBody}\n\n${t.voicePotential}: ${rating} / 10`
  );

  // ─── Footer on every page ───
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = doc.internal.pageSize.getHeight() - 12;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text(t.footer, margin, footerY);
    doc.setFont("helvetica", "normal");
    doc.text(`${t.page} ${i} ${t.of} ${totalPages}`, pageWidth / 2, footerY, { align: "center" });
    doc.text(reportId, pageWidth - margin, footerY, { align: "right" });
  }

  const langNames = { en: "English", hi: "Hindi", gu: "Gujarati" };
  doc.save(`VoiceAuras-Premium-Report-${langNames[lang] || "Report"}.pdf`);
}
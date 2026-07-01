import jsPDF from "jspdf";

function generateReportId() {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VA-${rand}`;
}

function addPageIfNeeded(doc, y, needed = 30) {
  if (y + needed > 272) {
    doc.addPage();
    return 20;
  }
  return y;
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
  const textMuted = [110, 110, 110];
  const textLight = [80, 80, 80];

  const reportId = generateReportId();
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const pitchDisplay = report.avgPitch > 0 ? `${report.avgPitch} Hz` : "Not Detected";

  // ── Header band ──
  doc.setFillColor(...gold);
  doc.rect(0, 0, pageWidth, 42, "F");
  doc.setFillColor(...goldDark);
  doc.rect(0, 40, pageWidth, 1.5, "F");

  doc.setTextColor(...navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("VoiceAuras", margin, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Premium Deep Analysis Report", margin, 27);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Report ID: ${reportId}`, pageWidth - margin, 16, { align: "right" });
  doc.text(`Date: ${dateStr}`, pageWidth - margin, 23, { align: "right" });

  let y = 55;

  // ── helpers ──
  const sectionHeader = (num, title) => {
    y = addPageIfNeeded(doc, y, 20);
    doc.setFillColor(...gold);
    doc.rect(margin, y - 4, 3.5, 7, "F");
    doc.setTextColor(...navy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`${num}. ${title}`, margin + 6, y + 1);
    y += 10;
  };

  const subLabel = (label) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...goldDark);
    doc.text(label, margin, y);
    y += 6;
  };

  const bodyText = (text, indent = 0) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...textDark);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    y = addPageIfNeeded(doc, y, lines.length * 5.5 + 2);
    doc.text(lines, margin + indent, y);
    y += lines.length * 5.5 + 2;
  };

  const bulletPoint = (text) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...textDark);
    const lines = doc.splitTextToSize(text, contentWidth - 8);
    y = addPageIfNeeded(doc, y, lines.length * 5.5 + 1);
    doc.text("•", margin + 2, y);
    doc.text(lines, margin + 8, y);
    y += lines.length * 5.5 + 1;
  };

  const metricRow = (label, value) => {
    y = addPageIfNeeded(doc, y, 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...textLight);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...goldDark);
    doc.text(String(value), pageWidth - margin, y, { align: "right" });
    y += 6;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y - 2.5, pageWidth - margin, y - 2.5);
  };

  const callout = (title, text) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
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
    y += 5;
  };

  const gap = (n = 6) => { y += n; };

  // ═══════════════════════════════════════
  // 1. Voice Identity Overview
  // ═══════════════════════════════════════
  sectionHeader(1, "Voice Identity Overview");
  bodyText("Your voice reflects a natural sense of confidence and conversational influence. This report reveals that your speaking style is not just about words — your voice creates emotional, social, and psychological impressions on the people around you.");
  gap(2);
  bodyText("Your vocal profile suggests someone who can leave an impact in conversations, hold attention, and communicate thoughts with clarity.");
  gap(6);
  divider();

  // ═══════════════════════════════════════
  // 2. Vocal Confidence Analysis
  // ═══════════════════════════════════════
  sectionHeader(2, `Vocal Confidence Analysis (${report.score}%)`);

  const confDesc = report.score >= 85
    ? `A ${report.score}% Vocal Confidence Score indicates exceptional vocal presence — your voice projects authority and trust with strong, consistent delivery.`
    : report.score >= 70
    ? `A ${report.score}% Vocal Confidence Score indicates that your voice carries noticeable confidence, with room for refinement and stronger control.`
    : `A ${report.score}% Vocal Confidence Score shows a developing vocal foundation with good potential for growth through focused practice.`;
  bodyText(confDesc);
  gap(3);

  subLabel("Deep Insight:");
  bulletPoint("Your speech delivery feels natural and believable.");
  bulletPoint("You show low hesitation while speaking.");
  bulletPoint("Listeners are likely to trust your words.");
  if (report.score < 85) bulletPoint("There are moments where confidence slightly fluctuates.");
  gap(2);

  subLabel("Impact on Listener:");
  bodyText("Your voice creates authority and trust.", 4);
  gap(2);

  subLabel("Improvement Tip:");
  bulletPoint("Make your sentence endings stronger.");
  bulletPoint("Reduce filler words.");
  bulletPoint("Practice reading aloud daily.");
  gap(6);
  divider();

  // ═══════════════════════════════════════
  // 3. Voice Energy Analysis
  // ═══════════════════════════════════════
  sectionHeader(3, "Voice Energy Analysis");
  bodyText(`Your Voice Energy is at a ${report.energyLevel} level.`);
  gap(3);

  subLabel("This means:");
  if (report.energyLevel === "High") {
    bulletPoint("You are an energetic and assertive speaker.");
    bulletPoint("Your energy commands attention and presence.");
    bulletPoint("You project enthusiasm and confidence naturally.");
    gap(2);
    subLabel("Psychological Effect:");
    bodyText("This kind of voice motivates and energizes people around you.", 4);
    gap(2);
    subLabel("Tip:");
    bodyText("Balance your energy with strategic pauses to let key points land.", 4);
  } else if (report.energyLevel === "Medium") {
    bulletPoint("You are a calm yet expressive speaker.");
    bulletPoint("Your energy feels balanced and stable.");
    bulletPoint("You do not sound overly aggressive or too passive.");
    gap(2);
    subLabel("Psychological Effect:");
    bodyText("This kind of voice makes people feel comfortable and open around you.", 4);
    gap(2);
    subLabel("Upgrade Suggestion:");
    bodyText("Add stronger emphasis to important words.", 4);
  } else {
    bulletPoint("Your speaking energy is measured and thoughtful.");
    bulletPoint("You come across as calm, composed, and deliberate.");
    bulletPoint("Listeners perceive you as a careful, focused communicator.");
    gap(2);
    subLabel("Psychological Effect:");
    bodyText("Your quiet confidence can feel authoritative in intimate settings.", 4);
    gap(2);
    subLabel("Tip:");
    bodyText("Project your voice slightly more to fill larger spaces confidently.", 4);
  }
  gap(6);
  divider();

  // ═══════════════════════════════════════
  // 4. Vocal Tone Analysis
  // ═══════════════════════════════════════
  sectionHeader(4, `Vocal Tone Analysis (${report.tone})`);
  bodyText("Your voice contains natural variation, making your speech more engaging and lively.");
  gap(3);

  subLabel("This Means:");
  bulletPoint("You are emotionally expressive.");
  bulletPoint("You likely have strong storytelling ability.");
  bulletPoint("People can connect with your words quickly.");
  gap(2);

  subLabel("Social Impression:");
  bodyText("You come across as approachable, energetic, and engaging.", 4);
  gap(6);
  divider();

  // ═══════════════════════════════════════
  // 5. Pitch Profile Analysis
  // ═══════════════════════════════════════
  sectionHeader(5, `Pitch Profile Analysis — ${report.pitchProfile} (${pitchDisplay})`);

  if (report.pitchProfile === "Low Register") {
    subLabel("What It Says:");
    bulletPoint("Lower voices are often associated with authority and maturity.");
    bulletPoint("People may perceive you as grounded and confident.");
    bulletPoint("Your vocal presence feels stronger.");
    gap(2);
    subLabel("Advantage:");
    bodyText("A lower pitch often enhances leadership perception.", 4);
    gap(2);
    subLabel("Improvement:");
    bodyText("Increasing pitch flexibility can strengthen emotional impact even more.", 4);
  } else if (report.pitchProfile === "Mid Register") {
    subLabel("What It Says:");
    bulletPoint("Mid-range voices are highly versatile and universally clear.");
    bulletPoint("People find your voice easy to follow and pleasant to listen to.");
    bulletPoint("You can easily shift between formal and conversational tones.");
    gap(2);
    subLabel("Advantage:");
    bodyText("Versatility — your voice works equally well in meetings, presentations, and casual conversation.", 4);
  } else {
    subLabel("What It Says:");
    bulletPoint("Higher-register voices often convey energy and enthusiasm.");
    bulletPoint("Your vocal presence feels dynamic and expressive.");
    bulletPoint("Listeners perceive you as passionate and emotionally engaged.");
    gap(2);
    subLabel("Improvement:");
    bodyText("Practicing deeper breath support can give your voice more grounded resonance.", 4);
  }
  gap(6);
  divider();

  // ═══════════════════════════════════════
  // 6. Pitch Steadiness Analysis
  // ═══════════════════════════════════════
  sectionHeader(6, `Pitch Steadiness Analysis (${report.steadiness})`);

  if (report.steadiness === "Steady") {
    bodyText("Your pitch stayed remarkably consistent throughout the recording.");
    gap(3);
    subLabel("Interpretation:");
    bulletPoint("You demonstrate strong vocal control.");
    bulletPoint("Your delivery comes across as calm, confident, and professional.");
    bulletPoint("Listeners perceive you as prepared and composed.");
    gap(2);
    subLabel("Recommendation:");
    bodyText("Maintain this consistency while adding intentional variation at key moments for extra impact.", 4);
  } else if (report.steadiness === "Moderate") {
    bodyText("Your pitch shows moderate variation — naturally expressive without being erratic.");
    gap(3);
    subLabel("Interpretation:");
    bulletPoint("You do not sound robotic or overly controlled.");
    bulletPoint("Your emotional expression feels natural.");
    bulletPoint("Minor inconsistencies can be smoothed with focused practice.");
    gap(2);
    subLabel("Recommendation:");
    bodyText("Improve breath control for better vocal consistency.", 4);
  } else {
    bodyText("Your pitch movement is flexible and dynamic throughout the recording.");
    gap(3);
    subLabel("Interpretation:");
    bulletPoint("You do not sound robotic or overly controlled.");
    bulletPoint("Your emotional expression feels natural.");
    subLabel("Hidden Meaning:");
    bodyText("At times, inconsistency may suggest nervousness or tension.", 4);
    gap(2);
    subLabel("Recommendation:");
    bodyText("Improve breath control for better vocal consistency.", 4);
  }
  gap(6);
  divider();

  // ═══════════════════════════════════════
  // 7. Pause Pattern Analysis
  // ═══════════════════════════════════════
  sectionHeader(7, `Pause Pattern Analysis (${report.pauseRatio}%)`);

  const pauseDesc = report.pauseRatio < 25
    ? "Your pause usage appears balanced and efficient."
    : report.pauseRatio < 40
    ? "Your pause usage is slightly above ideal — pauses are present but manageable."
    : "Your recording shows a higher pause ratio — indicating thoughtful but sometimes slow delivery.";
  bodyText(pauseDesc);
  gap(3);

  subLabel("What It Means:");
  bulletPoint("You think before speaking.");
  bulletPoint("Your speech processing feels clear and structured.");
  gap(2);
  subLabel("Positive:");
  bodyText("Pauses add power and clarity to your communication.", 4);
  gap(2);
  subLabel("Risk:");
  bodyText("Too many pauses may reduce perceived confidence.", 4);
  gap(6);
  divider();

  // ═══════════════════════════════════════
  // Fun Insights header page break buffer
  // ═══════════════════════════════════════
  y = addPageIfNeeded(doc, y, 40);
  doc.setFillColor(255, 248, 220);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...navy);
  doc.text("Fun Insights — For Entertainment & Self-Reflection", pageWidth / 2, y + 8, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...textMuted);
  const fiDisclaimer = "Designed for self-awareness & reflection — not as an absolute truth.";
  doc.text(fiDisclaimer, pageWidth / 2, y + 15, { align: "center" });
  y += 28;

  // ═══════════════════════════════════════
  // 8. Personality Blueprint
  // ═══════════════════════════════════════
  sectionHeader(8, "Personality Blueprint");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...goldDark);
  doc.text(report.personalityType, margin, y);
  y += 8;

  bodyText("Your communication style suggests that:");
  bulletPoint("You naturally connect well with people.");
  bulletPoint("You have strong social adaptability.");
  bulletPoint("Emotional intelligence is present in your interactions.");
  gap(2);
  subLabel("Core Strength:");
  bodyText("Building genuine connections.", 4);
  gap(2);
  subLabel("Growth Area:");
  bodyText("A tendency to over-explain at times.", 4);
  gap(6);
  divider();

  // ═══════════════════════════════════════
  // 9. Leadership Aura Analysis
  // ═══════════════════════════════════════
  sectionHeader(9, "Leadership Aura Analysis");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...goldDark);
  doc.text(report.leadershipAura, margin, y);
  y += 8;

  bodyText("Your voice shows leadership potential with a strong communication foundation.");
  gap(3);
  subLabel("Indicators:");
  bulletPoint("Strong vocal foundation");
  bulletPoint("Ability to hold listener attention");
  bulletPoint("Emotional influence in communication");
  gap(2);
  subLabel("Growth Path:");
  bodyText("Build stronger decision-making confidence.", 4);
  gap(6);
  divider();

  // ═══════════════════════════════════════
  // 10. Persuasion Power Analysis
  // ═══════════════════════════════════════
  sectionHeader(10, "Persuasion Power Analysis");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...goldDark);
  doc.text(report.persuasionPower, margin, y);
  y += 8;

  bodyText("Your voice has strong persuasive qualities. This suggests high potential in:");
  bulletPoint("Sales & Negotiation");
  bulletPoint("Public speaking");
  bulletPoint("Teaching & Mentoring");
  gap(2);
  bodyText("Your speaking style helps influence and guide others effectively.", 4);
  gap(6);
  divider();

  // ═══════════════════════════════════════
  // 11. Stress Detection Analysis
  // ═══════════════════════════════════════
  sectionHeader(11, "Stress Detection Analysis");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...goldDark);
  doc.text(report.stressLevel, margin, y);
  y += 8;

  if (report.stressLevel === "Calm & Stable") {
    bodyText("No significant tension markers were detected in your voice — you sound relaxed and in control.");
    gap(2);
    subLabel("Advice:");
    bodyText("Maintain this composure. Before important conversations, take a few slow, deep breaths.", 4);
  } else {
    bodyText("Some subtle tension markers were detected in your voice.");
    gap(2);
    subLabel("Possible reasons:");
    bulletPoint("Internal pressure");
    bulletPoint("Overthinking");
    bulletPoint("Performance stress");
    gap(2);
    subLabel("Advice:");
    bulletPoint("Deep breathing exercises before speaking");
    bulletPoint("Slower speech pacing");
    bulletPoint("Staying hydrated");
  }
  gap(6);
  divider();

  // ═══════════════════════════════════════
  // 12. Relationship Communication Style
  // ═══════════════════════════════════════
  sectionHeader(12, "Relationship Communication Style");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...goldDark);
  doc.text(report.relationshipStyle, margin, y);
  y += 8;

  bodyText("In relationships, your communication style appears:");
  bulletPoint("Honest and direct");
  bulletPoint("Expressive and emotionally present");
  bulletPoint("Capable of building deep connections");
  gap(2);
  subLabel("Strength:");
  bodyText("Clear and direct communication.", 4);
  gap(2);
  subLabel("Risk:");
  bodyText("Your intensity may sometimes feel overwhelming to others.", 4);
  gap(6);
  divider();

  // ═══════════════════════════════════════
  // 13. Career Alignment
  // ═══════════════════════════════════════
  sectionHeader(13, "Career Alignment");
  bodyText("Best matched career fields based on your vocal profile:");
  gap(3);

  const careers = report.careerMatch.split(",");
  careers.forEach(c => bulletPoint(c.trim()));
  gap(3);
  subLabel("Why:");
  bodyText("Your vocal profile creates trust, engagement, and attention retention — essential qualities for these fields.", 4);
  gap(6);
  divider();

  // ═══════════════════════════════════════
  // 14. Hidden Voice Strengths
  // ═══════════════════════════════════════
  sectionHeader(14, "Hidden Voice Strengths");
  bodyText("Your voice carries several hidden strengths:");
  gap(3);
  bulletPoint("Natural trust-building ability");
  bulletPoint("Emotional engagement");
  bulletPoint("Leadership potential");
  bulletPoint("Strong conversational flow");
  bulletPoint("Listener retention power");
  gap(6);
  divider();

  // ═══════════════════════════════════════
  // 15. Your Voice Growth Plan (30 days)
  // ═══════════════════════════════════════
  sectionHeader(15, "Your Voice Growth Plan");

  subLabel("Days 1–7:");
  bulletPoint("Read aloud for 10 minutes daily");
  bulletPoint("Practice breath control for 5 minutes");
  gap(3);

  subLabel("Days 8–14:");
  bulletPoint("Record and review your speech");
  bulletPoint("Reduce filler words");
  gap(3);

  subLabel("Days 15–21:");
  bulletPoint("Practice emotional range");
  bulletPoint("Improve pitch variation");
  gap(3);

  subLabel("Days 22–30:");
  bulletPoint("Storytelling practice");
  bulletPoint("Public speaking simulation");
  gap(6);

  // ═══════════════════════════════════════
  // Action Tips
  // ═══════════════════════════════════════
  if (report.actionTips && report.actionTips.length > 0) {
    divider();
    sectionHeader("", "Your Personalised Action Tips");
    report.actionTips.forEach(tip => bulletPoint(tip));
    gap(6);
  }

  // ═══════════════════════════════════════
  // Final AI Summary callout
  // ═══════════════════════════════════════
  divider();
  y = addPageIfNeeded(doc, y, 40);
  callout(
    "Final AI Summary",
    `Your voice has a strong communication foundation. You are naturally engaging and capable of leaving a lasting impression on others. By improving pitch control, energy placement, and pause mastery, your voice can become more professional, persuasive, and leadership-grade.\n\nVoice Potential Rating: ${Math.min(10, (report.score / 10)).toFixed(1)} / 10`
  );

  // ═══════════════════════════════════════
  // Footer on every page
  // ═══════════════════════════════════════
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = doc.internal.pageSize.getHeight() - 12;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text(
      "This report reflects acoustic patterns from a single 30-second recording. For entertainment & self-reflection purposes.",
      margin,
      footerY
    );
    doc.setFont("helvetica", "normal");
    doc.text(`${reportId}`, pageWidth - margin - 20, footerY);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, footerY, { align: "center" });
  }

  doc.save("VoiceAuras-Premium-Report.pdf");
}
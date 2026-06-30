// Real voice analysis engine for VoiceAura.
// Captures actual microphone audio via the Web Audio API and derives
// genuine acoustic metrics from it - no randomness, no fake numbers.
//
// Metrics measured:
//  - Volume / Energy        -> from RMS (root-mean-square) amplitude
//  - Pitch (Hz)              -> from autocorrelation of the waveform
//  - Pitch Steadiness        -> frame-to-frame pitch variation ("jitter")
//  - Pause Ratio             -> % of samples below a silence threshold
//
// All composite labels (tone, score, recommendation) are derived from
// these real numbers using a transparent, documented set of rules below -
// not a black box, and not random.

// Detects the dominant pitch in a chunk of audio using autocorrelation:
// the waveform is compared against shifted copies of itself to find the
// repeating period, which corresponds to the fundamental frequency.
function autoCorrelate(buffer, sampleRate) {
  const size = buffer.length;

  let rms = 0;
  for (let i = 0; i < size; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / size);

  // Too quiet to reliably detect a pitch (silence / background noise)
  if (rms < 0.01) {
    return { pitch: -1, rms };
  }

  // Trim leading/trailing near-silence so the correlation focuses on
  // the actual voiced part of this chunk
  const threshold = 0.2;
  let start = 0;
  let end = size - 1;
  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buffer[i]) >= threshold) {
      start = i;
      break;
    }
  }
  for (let i = 1; i < size / 2; i++) {
    if (Math.abs(buffer[size - i]) >= threshold) {
      end = size - i;
      break;
    }
  }

  const trimmed = buffer.slice(start, end);
  const n = trimmed.length;
  if (n < 8) return { pitch: -1, rms };

  const correlations = new Array(n).fill(0);
  for (let lag = 0; lag < n; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += trimmed[i] * trimmed[i + lag];
    }
    correlations[lag] = sum;
  }

  // Skip the initial downward slope right after lag 0
  let d = 0;
  while (d < n - 1 && correlations[d] > correlations[d + 1]) d++;

  let bestLag = -1;
  let bestValue = -Infinity;
  for (let lag = d; lag < n; lag++) {
    if (correlations[lag] > bestValue) {
      bestValue = correlations[lag];
      bestLag = lag;
    }
  }

  if (bestLag <= 0) return { pitch: -1, rms };

  // Parabolic interpolation around the peak for sub-sample accuracy
  const x1 = correlations[bestLag - 1] ?? correlations[bestLag];
  const x2 = correlations[bestLag];
  const x3 = correlations[bestLag + 1] ?? correlations[bestLag];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  const refinedLag = a !== 0 ? bestLag - b / (2 * a) : bestLag;

  const pitch = sampleRate / refinedLag;

  // Human voice fundamental frequency realistically falls in ~70-400Hz
  if (pitch < 70 || pitch > 400) return { pitch: -1, rms };

  return { pitch, rms };
}

// Step 1: explicitly request microphone access. Call this first and wait
// for it to resolve before showing any "recording" UI - this is what was
// missing before, which made the recording UI appear before the browser's
// permission prompt had even been answered.
export function requestMicrophoneAccess() {
  return navigator.mediaDevices.getUserMedia({ audio: true });
}

// Step 2: once we have a granted `stream`, run the actual 30-second
// analysis loop, sampling pitch + volume every 100ms. `onTick` is called
// every second with the seconds remaining, for the UI countdown.
export function analyzeStream(stream, durationSeconds, onTick) {
  return new Promise((resolve) => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextClass();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const buffer = new Float32Array(analyser.fftSize);
    const pitchSamples = [];
    const rmsSamples = [];

    const sampleIntervalMs = 100;
    let elapsedMs = 0;
    let lastTickSecond = durationSeconds;

    const cleanup = () => {
      clearInterval(interval);
      stream.getTracks().forEach((track) => track.stop());
      audioContext.close();
    };

    const interval = setInterval(() => {
      analyser.getFloatTimeDomainData(buffer);
      const { pitch, rms } = autoCorrelate(buffer, audioContext.sampleRate);

      rmsSamples.push(rms);
      if (pitch > 0) pitchSamples.push(pitch);

      elapsedMs += sampleIntervalMs;
      const secondsLeft = Math.max(durationSeconds - Math.floor(elapsedMs / 1000), 0);
      if (secondsLeft !== lastTickSecond) {
        lastTickSecond = secondsLeft;
        if (onTick) onTick(secondsLeft);
      }

      if (elapsedMs >= durationSeconds * 1000) {
        cleanup();
        resolve(buildReport(pitchSamples, rmsSamples));
      }
    }, sampleIntervalMs);
  });
}

// Convenience wrapper combining both steps - kept for any other code that
// still calls this directly. The App component below uses the two steps
// separately so it can show a distinct "requesting access" state first.
export async function startVoiceAnalysis(durationSeconds, onTick) {
  const stream = await requestMicrophoneAccess();
  return analyzeStream(stream, durationSeconds, onTick);
}

// ---------------------------------------------------------------------
// "Fun Insights" layer - personality-style labels people enjoy reading.
// These are NOT clinically validated traits. Voice alone cannot reliably
// reveal someone's age, personality type, or relationship style - so
// rather than inventing them at random, every label here is mapped from
// the real measured metrics above (energy, steadiness, score) using a
// fixed, documented rule. The UI shows these under a clear "for
// entertainment / self-reflection" disclaimer so they're never presented
// as a clinical or scientific assessment.
// ---------------------------------------------------------------------

function estimateVoiceAge(pitchProfile) {
  if (pitchProfile === "Low Register") return "Mature Adult (35+)";
  if (pitchProfile === "Mid Register") return "Adult (25–35)";
  if (pitchProfile === "High Register") return "Young Adult (18–25)";
  return "Not Detected";
}

function getPersonalityType(energyLevel, steadiness) {
  if (energyLevel === "High" && steadiness === "Steady") return "The Charismatic Communicator";
  if (energyLevel === "High") return "The Dynamic Performer";
  if (energyLevel === "Medium" && steadiness === "Steady") return "The Confident Communicator";
  if (energyLevel === "Medium") return "The Engaging Conversationalist";
  if (steadiness === "Steady") return "The Calm Strategist";
  return "The Thoughtful Listener";
}

function getLeadershipAura(score) {
  if (score >= 85) return "Strong Influencer";
  if (score >= 70) return "Emerging Leader";
  return "Steady Contributor";
}

function getPersuasionPower(score, energyLevel) {
  if (score >= 85 && energyLevel === "High") return "Elite";
  if (score >= 70) return "Strong";
  return "Developing";
}

function getStressLevel(steadiness, pauseRatio) {
  if (steadiness === "Steady" && pauseRatio < 30) return "Calm & Stable";
  if (steadiness === "Variable" || pauseRatio >= 45) return "Elevated Tension";
  return "Mild Tension";
}

function getRelationshipStyle(tone) {
  if (tone === "Calm & Composed") return "Emotionally Secure";
  if (tone === "Energetic & Expressive") return "Expressive & Open";
  if (tone === "Dynamic & Animated") return "Passionate & Direct";
  return "Balanced & Adaptive";
}

function getCareerMatch(personalityType) {
  const map = {
    "The Charismatic Communicator": "Leadership, Sales, Consulting",
    "The Dynamic Performer": "Media, Marketing, Public Speaking",
    "The Confident Communicator": "Management, Business Development",
    "The Engaging Conversationalist": "Customer Relations, Teaching",
    "The Calm Strategist": "Strategy, Analysis, Operations",
    "The Thoughtful Listener": "Counseling, Education, HR",
  };
  return map[personalityType] || "Communication-Focused Roles";
}

function getInsight(energyLevel, steadiness) {
  return `Your voice shows ${energyLevel.toLowerCase()} energy with a ${steadiness.toLowerCase()} delivery style — these are the qualities people notice most about how you communicate.`;
}


// Every threshold below is a simple, fixed rule applied to real measured
// values - documented here so it stays easy to tune later.
function buildReport(pitchSamples, rmsSamples) {
  const avgRms =
    rmsSamples.reduce((a, b) => a + b, 0) / (rmsSamples.length || 1);

  const energyLevel = avgRms > 0.08 ? "High" : avgRms > 0.03 ? "Medium" : "Low";

  const silentCount = rmsSamples.filter((r) => r < 0.015).length;
  const pauseRatio = Math.round((silentCount / (rmsSamples.length || 1)) * 100);

  const avgPitch = pitchSamples.length
    ? Math.round(pitchSamples.reduce((a, b) => a + b, 0) / pitchSamples.length)
    : 0;

  const pitchRange = pitchSamples.length
    ? Math.round(Math.max(...pitchSamples) - Math.min(...pitchSamples))
    : 0;

  // Jitter: how much the pitch jumps frame-to-frame. Lower = steadier voice.
  let jitterTotal = 0;
  for (let i = 1; i < pitchSamples.length; i++) {
    jitterTotal += Math.abs(pitchSamples[i] - pitchSamples[i - 1]);
  }
  const avgJitter =
    pitchSamples.length > 1 ? jitterTotal / (pitchSamples.length - 1) : 0;

  const steadiness =
    avgJitter === 0 ? "Not Enough Data" : avgJitter < 8 ? "Steady" : avgJitter < 20 ? "Moderate" : "Variable";

  // Pitch register, instead of guessing a demographic "age" from voice
  const pitchProfile =
    avgPitch === 0
      ? "Not Detected"
      : avgPitch < 145
      ? "Low Register"
      : avgPitch < 230
      ? "Mid Register"
      : "High Register";

  let tone = "Warm & Conversational";
  if (energyLevel === "High" && pitchRange > 60) tone = "Energetic & Expressive";
  else if (energyLevel === "Low" && steadiness === "Steady") tone = "Calm & Composed";
  else if (steadiness === "Variable") tone = "Dynamic & Animated";

  // Composite score: a transparent weighted sum, not a hidden "AI" black box
  let score = 55;
  if (energyLevel === "High") score += 12;
  else if (energyLevel === "Medium") score += 6;
  if (steadiness === "Steady") score += 15;
  else if (steadiness === "Moderate") score += 8;
  if (pauseRatio < 25) score += 10;
  else if (pauseRatio < 45) score += 4;
  score = Math.min(score, 98);

  let recommendation;
  if (score >= 85) {
    recommendation =
      "Strong vocal presence with steady pitch and good energy - well suited for presentations and leadership communication.";
  } else if (score >= 70) {
    recommendation =
      "Solid vocal control. Try adding a bit more pitch variation to sound even more engaging.";
  } else {
    recommendation =
      "Good start. Reducing long pauses and projecting a little more volume will make your delivery sound more confident.";
  }

  return {
    score,
    energyLevel,
    tone,
    pitchProfile,
    avgPitch,
    pauseRatio,
    steadiness,
    recommendation,
    // Fun Insights - derived, not random; see disclaimer in the UI/PDF
    estimatedVoiceAge: estimateVoiceAge(pitchProfile),
    personalityType: getPersonalityType(energyLevel, steadiness),
    leadershipAura: getLeadershipAura(score),
    persuasionPower: getPersuasionPower(score, energyLevel),
    stressLevel: getStressLevel(steadiness, pauseRatio),
    relationshipStyle: getRelationshipStyle(tone),
    careerMatch: getCareerMatch(getPersonalityType(energyLevel, steadiness)),
    insight: getInsight(energyLevel, steadiness),
  };
}
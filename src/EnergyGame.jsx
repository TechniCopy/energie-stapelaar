import { useState, useEffect, useCallback, useRef } from "react";
import {
  Flame,
  Droplets,
  Snowflake,
  Cloud,
  CheckCircle,
  XCircle,
  Star,
  Play,
  Pause,
  ArrowRight,
  RotateCcw,
  Heart,
} from "lucide-react";

// ─── SOUND EFFECTS (Web Audio API) ───

const audioCtxRef = { current: null };
function getAudioCtx() {
  if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtxRef.current;
}

function playSound(type) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;

    if (type === "correct") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523, t);       // C5
      osc.frequency.setValueAtTime(659, t + 0.08); // E5
      osc.frequency.setValueAtTime(784, t + 0.16); // G5
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    } else if (type === "wrong") {
      osc.type = "square";
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.setValueAtTime(150, t + 0.1);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    } else if (type === "levelup") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523, t);
      osc.frequency.setValueAtTime(659, t + 0.1);
      osc.frequency.setValueAtTime(784, t + 0.2);
      osc.frequency.setValueAtTime(1047, t + 0.3);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
    } else if (type === "drop") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  } catch (e) { /* audio not available */ }
}

// ─── COMPLIMENTS ───

const COMPLIMENTS = ["Top!", "Netjes!", "Goed zo!", "Geweldig!", "Mooi!", "Knap!", "Lekker bezig!", "Yes!"];
let complimentIdx = 0;
function getCompliment() {
  const c = COMPLIMENTS[complimentIdx % COMPLIMENTS.length];
  complimentIdx++;
  return c;
}

// ─── FLOATING POINTS COMPONENT ───

function FloatingPoints({ points, x, y, onDone }) {
  const [opacity, setOpacity] = useState(1);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / 800);
      setOffsetY(-60 * progress);
      setOpacity(1 - progress);
      if (progress < 1) frame = requestAnimationFrame(animate);
      else onDone();
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="fixed pointer-events-none z-[100] font-bold text-xl italic"
      style={{
        left: x - 30,
        top: y + offsetY,
        opacity,
        color: C.green,
        textShadow: "0 2px 4px rgba(0,0,0,0.2)",
      }}
    >
      +{points}
    </div>
  );
}

// ─── CONFETTI BURST ───

function ConfettiBurst({ x, y, onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const particles = Array.from({ length: 30 }, () => ({
      x: 0, y: 0,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12 - 4,
      size: 4 + Math.random() * 4,
      color: ["#30B5AE", "#1E8F6E", "#99D3D8", "#0D4868", "#FBBF24", "#E08A00"][Math.floor(Math.random() * 6)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 20,
    }));

    const start = performance.now();
    let frame;
    const animate = (now) => {
      const elapsed = (now - start) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.vy += 0.3;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        const alpha = Math.max(0, 1 - elapsed / 0.8);
        if (alpha <= 0) return;
        alive = true;
        ctx.save();
        ctx.translate(canvas.width / 2 + p.x, canvas.height / 2 + p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      if (alive) frame = requestAnimationFrame(animate);
      else onDone();
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className="fixed pointer-events-none z-[99]"
      style={{ left: x - 100, top: y - 100 }}
    />
  );
}

// ─── STREAK INDICATOR ───

function StreakIndicator({ streak }) {
  if (streak < 2) return null;
  return (
    <div className="fixed top-20 right-4 z-[90] animate-bounce">
      <div className="rounded-xl px-4 py-2 shadow-lg border-2 font-bold italic text-sm"
        style={{ backgroundColor: "#99D3D8", borderColor: "#0D4868", color: "#0D4868" }}>
        {streak}x op rij! {streak >= 5 ? "ONSTOPBAAR!" : streak >= 3 ? "COMBO!" : ""}
      </div>
    </div>
  );
}

// ─── GAME JUICE HOOK ───

function useGameJuice() {
  const [floatingPoints, setFloatingPoints] = useState([]);
  const [confettis, setConfettis] = useState([]);
  const [streak, setStreak] = useState(0);
  const [shaking, setShaking] = useState(false);
  const idRef = useRef(0);

  const triggerCorrect = useCallback((pts, mouseEvent) => {
    const id = ++idRef.current;
    const x = mouseEvent?.clientX ?? window.innerWidth / 2;
    const y = mouseEvent?.clientY ?? 200;

    playSound("correct");
    setStreak((s) => s + 1);

    // Floating points
    setFloatingPoints((prev) => [...prev, { id, pts, x, y }]);

    // Confetti
    setConfettis((prev) => [...prev, { id, x, y }]);
  }, []);

  const triggerWrong = useCallback(() => {
    playSound("wrong");
    setStreak(0);
    setShaking(true);
    setTimeout(() => setShaking(false), 300);
  }, []);

  const triggerLevelUp = useCallback(() => {
    playSound("levelup");
  }, []);

  const removeFloat = useCallback((id) => {
    setFloatingPoints((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const removeConfetti = useCallback((id) => {
    setConfettis((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const JuiceOverlay = useCallback(() => (
    <>
      {floatingPoints.map((f) => (
        <FloatingPoints key={f.id} points={f.pts} x={f.x} y={f.y} onDone={() => removeFloat(f.id)} />
      ))}
      {confettis.map((c) => (
        <ConfettiBurst key={c.id} x={c.x} y={c.y} onDone={() => removeConfetti(c.id)} />
      ))}
      <StreakIndicator streak={streak} />
    </>
  ), [floatingPoints, confettis, streak]);

  return { triggerCorrect, triggerWrong, triggerLevelUp, shaking, streak, JuiceOverlay };
}

// ─── THEME COLORS ───

const GRAD = "linear-gradient(120deg,#0D4868 0%,#1b7f96 55%,#30B5AE 100%)";

const C = {
  bgPage: "#f2f7f8",
  bgCard: "#ffffff",
  bgHeader: "#0D4868",
  brown: "#5b7280",
  brownDark: "#0D4868",
  brownText: "#0D4868",
  green: "#1E8F6E",
  greenLight: "#E6F4EF",
  red: "#D92C2C",
  redLight: "#FDEAEA",
  beigeMid: "#dbe7ea",
  beigeLight: "#eaf3f5",
};

// ─── DATA CONSTANTS ───

const TRANSITIONS = [
  { from: "vast", to: "vloeibaar", name: "smelten", absorbs: true },
  { from: "vloeibaar", to: "gas", name: "verdampen", absorbs: true },
  { from: "gas", to: "vloeibaar", name: "condenseren", absorbs: false },
  { from: "vloeibaar", to: "vast", name: "stollen", absorbs: false },
  { from: "vast", to: "gas", name: "sublimeren", absorbs: true },
  { from: "gas", to: "vast", name: "rijpen", absorbs: false },
];

const ENERGY_PHASES = [
  { label: "Ijs opwarmen", energy: 42, blocks: 1, startTemp: -20, endTemp: 0, type: "voelbaar", color: "#93C5FD", duration: 1500 },
  { label: "Smelten", energy: 334, blocks: 7, startTemp: 0, endTemp: 0, type: "latent", color: "#67E8F9", duration: 3000 },
  { label: "Water opwarmen", energy: 419, blocks: 8, startTemp: 0, endTemp: 100, type: "voelbaar", color: "#86EFAC", duration: 2000 },
  { label: "Verdampen", energy: 2257, blocks: 45, startTemp: 100, endTemp: 100, type: "latent", color: "#FDBA74", duration: 5000 },
  { label: "Stoom opwarmen", energy: 40, blocks: 1, startTemp: 100, endTemp: 120, type: "voelbaar", color: "#FCA5A5", duration: 1000 },
];

const TOTAL_ENERGY = 3092;
const BLOCK_SIZE = 50;

const QUIZ_QUESTIONS = [
  {
    question: "Welke bevat meer energie: 1 kg water van 100°C of 1 kg stoom van 100°C?",
    options: [
      "Water — want vloeibaar is zwaarder",
      "Stoom — want daar is verdampingsenergie aan toegevoegd",
      "Allebei evenveel — want dezelfde temperatuur",
    ],
    correct: 1,
    feedbackCorrect: "Precies! Stoom van 100°C bevat veel meer energie dan water van 100°C. Daarom is stoom zo gevaarlijk — al die extra energie komt vrij als de stoom condenseert op je huid.",
    feedbackWrong: "Dezelfde temperatuur betekent niet dezelfde hoeveelheid energie! Denk terug aan alle blokjes die je moest slepen om water te verdampen.",
  },
  {
    question: "De latente verdampingswarmte van water is 2257 kJ/kg. Hoeveel extra energie zit er in 2 kg stoom van 100°C ten opzichte van 2 kg water van 100°C?",
    options: ["2257 kJ", "4514 kJ", "1128 kJ", "6771 kJ"],
    correct: 1,
    feedbackCorrect: "Goed gerekend! 2 kg × 2257 kJ/kg = 4514 kJ.",
    feedbackWrong: "De berekening: massa × latente warmte = 2 kg × 2257 kJ/kg = 4514 kJ.",
  },
  {
    question: "Waarom is stoom van 100°C veel gevaarlijker dan water van 100°C als het op je huid komt?",
    options: [
      "Stoom is heter dan water",
      "Bij condensatie komt alle latente warmte vrij op je huid",
      "Stoom beweegt sneller dan water",
      "Water koelt sneller af",
    ],
    correct: 1,
    feedbackCorrect: "Juist! Bij condensatie wordt stoom weer water en komt al die latente warmte (2257 kJ per kg!) in een keer vrij. Daarom geeft stoom zoveel ernstigere brandwonden.",
    feedbackWrong: "Stoom en water van 100°C hebben dezelfde temperatuur. Maar stoom bevat ook nog eens 2257 kJ/kg extra. Als stoom condenseert op je huid, komt al die energie vrij.",
  },
];

const ANIM_STEP_TEXTS = [
  "Het ijs warmt op van -20°C naar 0°C. De temperatuur stijgt — dat voel je. Dit noemen we voelbare warmte.",
  "We zijn op 0°C. Het ijs begint te smelten. Kijk naar de thermometer — die staat stil! Maar de energiebalk loopt gewoon door. Alle energie gaat nu naar het smelten. Dit noemen we latente warmte.",
  "Al het ijs is gesmolten. Nu warmt het water op van 0°C naar 100°C. De thermometer stijgt weer.",
  "We zijn op 100°C. Het water begint te verdampen. Weer staat de thermometer stil! Maar kijk eens hoeveel energie er nodig is... Veel meer dan bij het smelten! Dit is de latente verdampingswarmte.",
  "Alle water is nu stoom. De temperatuur stijgt weer naar 120°C.",
];

const PHASE_MARGINS = [
  [0, 2], [6, 8], [7, 9], [44, 46], [0, 2],
];

const PHASE_FEEDBACK = [
  null,
  "Goed! 7 blokjes om ijs te smelten. Best veel, toch? Maar wacht tot je bij het verdampen komt...",
  null,
  "Wow — 45 blokjes! Dat is meer dan 5 keer zoveel als alle vorige stappen bij elkaar! En toch bleef de thermometer op 100°C staan. Dat is de kracht van latente warmte.",
  null,
];

// ─── REUSABLE COMPONENTS ───

function ProgressBar({ currentMission, currentRound, score, lives }) {
  const missions = [1, 2];
  const rounds = [1, 2, 3];
  const [displayScore, setDisplayScore] = useState(score);
  const [scorePop, setScorePop] = useState(false);

  useEffect(() => {
    if (score === displayScore) return;
    setScorePop(true);
    const step = score > displayScore ? 1 : -1;
    const timer = setInterval(() => {
      setDisplayScore((prev) => {
        if (prev === score) { clearInterval(timer); return prev; }
        return prev + step;
      });
    }, 30);
    const popTimer = setTimeout(() => setScorePop(false), 400);
    return () => { clearInterval(timer); clearTimeout(popTimer); };
  }, [score]);

  return (
    <div className="flex items-center justify-between py-3 px-5" style={{ background: GRAD }}>
      <div className="flex items-center gap-4">
        <img src="/studium-beeldmerk.png" alt="Studium" className="h-6 w-auto" />
        <span className="text-white font-bold text-sm">Ronde:</span>
        <div className="flex gap-1.5">
          {missions.map((m) =>
            rounds.map((r) => {
              const idx = (m - 1) * 3 + r;
              const currentIdx = (currentMission - 1) * 3 + currentRound;
              const isComplete = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div
                  key={`${m}-${r}`}
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all duration-300"
                  style={{
                    backgroundColor: isComplete || isCurrent ? "#ffffff" : "transparent",
                    borderColor: isComplete || isCurrent ? "#ffffff" : "#99D3D8",
                  }}
                >
                  {isComplete && <span className="text-[8px]" style={{ color: "#0D4868" }}>&#10003;</span>}
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((h) => (
            <Heart
              key={h}
              className="w-4 h-4 transition-all duration-300"
              fill={h <= lives ? "#D92C2C" : "transparent"}
              stroke={h <= lives ? "#D92C2C" : "#99D3D8"}
              style={{ opacity: h <= lives ? 1 : 0.3 }}
            />
          ))}
        </div>
        <span className="text-white font-bold text-sm">Score: <span
          className="text-lg inline-block transition-transform duration-200"
          style={{ transform: scorePop ? "scale(1.5)" : "scale(1)", color: scorePop ? "#99D3D8" : "white" }}
        >{displayScore}</span></span>
      </div>
    </div>
  );
}

function ThermometerComponent({ temperature, minTemp = -20, maxTemp = 120 }) {
  const height = 260;
  const fillH = Math.max(0, ((temperature - minTemp) / (maxTemp - minTemp)) * height);
  const ticks = [];
  for (let t = minTemp; t <= maxTemp; t += 20) {
    const y = height - ((t - minTemp) / (maxTemp - minTemp)) * height;
    ticks.push({ t, y });
  }
  const fillY = height - fillH + 20;

  return (
    <div className="flex items-center gap-2">
      <div className="text-lg font-bold w-16 text-right" style={{ color: C.brownText }}>{Math.round(temperature)}°C</div>
      <svg width="90" height="320" viewBox="0 0 90 320">
        <rect x="15" y="15" width="30" height="270" rx="15" fill={C.beigeMid} stroke={C.brownText} strokeWidth="2" />
        <clipPath id="thermClip">
          <rect x="16" y="16" width="28" height="268" rx="14" />
        </clipPath>
        <rect
          x="16"
          y={fillY}
          width="28"
          height={fillH}
          fill="#E74C3C"
          clipPath="url(#thermClip)"
          style={{ transition: "y 100ms ease-out, height 100ms ease-out" }}
        />
        <circle cx="30" cy="295" r="12" fill="#E74C3C" stroke={C.brownText} strokeWidth="2" />
        {ticks.map(({ t, y }) => (
          <g key={t}>
            <line x1="46" y1={y + 20} x2="52" y2={y + 20} stroke={C.brownText} strokeWidth="1" />
            <text x="56" y={y + 24} fontSize="10" fill={C.brownText} textAnchor="start">{t}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function EnergyBarComponent({ phases, filledAmounts, activePhase = -1 }) {
  return (
    <div className="w-full">
      <div className="flex h-10 rounded-xl overflow-hidden border-2" style={{ borderColor: C.brownText, backgroundColor: C.beigeMid }}>
        {phases.map((phase, i) => {
          const widthPct = (phase.energy / TOTAL_ENERGY) * 100;
          const fillPct = filledAmounts ? (filledAmounts[i] || 0) : 0;
          return (
            <div
              key={i}
              className={`relative ${activePhase === i ? "ring-2 ring-[#30B5AE] ring-inset z-10" : ""}`}
              style={{ width: `${widthPct}%` }}
            >
              <div
                className="h-full transition-all duration-200"
                style={{ width: `${fillPct}%`, backgroundColor: phase.color }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex mt-1">
        {phases.map((phase, i) => {
          const widthPct = (phase.energy / TOTAL_ENERGY) * 100;
          return (
            <div key={i} style={{ width: `${widthPct}%` }} className="text-center overflow-hidden">
              {widthPct > 8 ? (
                <>
                  <div className="text-[9px] truncate px-0.5 font-medium" style={{ color: C.brownText }}>{phase.label}</div>
                  <div className="text-[8px]" style={{ color: C.brown }}>{phase.energy} kJ</div>
                </>
              ) : (
                <div className="text-[7px] truncate" style={{ color: C.brown }} title={`${phase.label}: ${phase.energy} kJ`}>
                  {phase.energy}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeedbackPopup({ type, text, onClose, buttonText = "Volgende" }) {
  useEffect(() => {
    if (type === "correct") {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  const isCorrect = type === "correct";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div
        className="w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl p-6 transform transition-all duration-200"
        style={{
          backgroundColor: isCorrect ? C.green : C.red,
          borderTop: `4px solid ${isCorrect ? "#166F56" : "#A81F1F"}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          {isCorrect ? (
            <CheckCircle className="w-8 h-8 text-white" />
          ) : (
            <XCircle className="w-8 h-8 text-white" />
          )}
          <span className="font-bold text-lg text-white">
            {isCorrect ? "CORRECT!" : "Niet helemaal..."}
          </span>
        </div>
        <p className="text-sm leading-relaxed mb-4 text-white/90 italic">
          {text}
        </p>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-bold text-sm transition-colors"
          style={{
            backgroundColor: isCorrect ? "#166F56" : "#A81F1F",
            color: "white",
          }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

// ─── DRAG LABEL ───

function DragLabel({ name, onDragStart, disabled }) {
  return (
    <div
      draggable={!disabled}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", name);
        onDragStart?.(name);
      }}
      className="px-5 py-2.5 rounded-xl font-bold text-sm select-none cursor-grab active:cursor-grabbing border-2 transition-all italic"
      style={{
        backgroundColor: disabled ? C.beigeMid : C.green,
        color: disabled ? "#7d94a3" : "white",
        borderColor: disabled ? "#c9dade" : "#166F56",
        boxShadow: disabled ? "none" : "0 3px 0 #166F56",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "default" : undefined,
      }}
    >
      {name.charAt(0).toUpperCase() + name.slice(1)}
    </div>
  );
}

// ─── DROP ZONE ───

function DropZone({ expected, value, onDrop, label }) {
  const [hover, setHover] = useState(false);
  const [flash, setFlash] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setHover(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setHover(false);
    const data = e.dataTransfer.getData("text/plain");
    if (data === expected) {
      onDrop(data, true, e);
      setFlash("correct");
      setTimeout(() => setFlash(null), 500);
    } else {
      setFlash("incorrect");
      setTimeout(() => setFlash(null), 400);
      onDrop(data, false, e);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setHover(false)}
      onDrop={handleDrop}
      className="min-w-[100px] h-full rounded-xl flex items-center justify-center text-[11px] font-bold transition-all duration-200 border-2"
      style={{
        backgroundColor: value
          ? C.greenLight
          : hover
          ? "#E7F4F3"
          : flash === "incorrect"
          ? C.redLight
          : C.bgCard,
        borderColor: value
          ? C.green
          : hover
          ? "#30B5AE"
          : flash === "incorrect"
          ? C.red
          : C.beigeMid,
        borderStyle: value ? "solid" : "dashed",
        color: value ? C.green : "#7d94a3",
      }}
    >
      {value ? (
        <span className="flex items-center gap-1" style={{ color: C.green }}>
          <CheckCircle className="w-3 h-3" />
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ) : (
        <span style={{ color: "#7d94a3" }}>{label || "Sleep hier"}</span>
      )}
    </div>
  );
}

// ─── PHASE TRIANGLE ───

function PhaseTriangle({ transitions, answers, onDrop }) {
  const W = 700, H = 600;
  const cx = W / 2, cy = H / 2 + 10;
  const triR = 235; // radius of the triangle (center to vertex)

  // Equilateral triangle: GAS top, VAST bottom-left, VLOEIBAAR bottom-right
  const angle = (deg) => (deg * Math.PI) / 180;
  const nodes = {
    gas:       { x: cx + triR * Math.sin(angle(0)),   y: cy - triR * Math.cos(angle(0)),   Icon: Cloud,    iconColor: "#6B7280" },
    vast:      { x: cx + triR * Math.sin(angle(240)), y: cy - triR * Math.cos(angle(240)), Icon: Snowflake, iconColor: "#3B82F6" },
    vloeibaar: { x: cx + triR * Math.sin(angle(120)), y: cy - triR * Math.cos(angle(120)), Icon: Droplets,  iconColor: "#60A5FA" },
  };
  const R = 44;

  const OFF_IN = 28;  // toward center of triangle
  const OFF_OUT = 56; // away from center of triangle

  // For each transition, compute the arrow line with offset
  const arrows = transitions.map((t) => {
    const from = nodes[t.from], to = nodes[t.to];
    const dx = to.x - from.x, dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / len, ny = dy / len;
    // Find the inward perpendicular (toward triangle center)
    const edgeMidX = (from.x + to.x) / 2;
    const edgeMidY = (from.y + to.y) / 2;
    const towardCX = cx - edgeMidX, towardCY = cy - edgeMidY;
    const dot = (-ny) * towardCX + nx * towardCY;
    const inX = dot > 0 ? -ny : ny;
    const inY = dot > 0 ? nx : -nx;
    // Check if there's a reverse arrow on the same edge
    const hasReverse = transitions.some(t2 => t2.from === t.to && t2.to === t.from);
    let px = 0, py = 0;
    if (hasReverse) {
      // Use canonical sort to consistently put one arrow inside, one outside
      const goesInward = t.from < t.to; // alphabetically first→second goes inside
      if (goesInward) {
        px = inX * OFF_IN; py = inY * OFF_IN;
      } else {
        px = -inX * OFF_OUT; py = -inY * OFF_OUT;
      }
    }
    const gap = R + 12;
    return {
      ...t,
      x1: from.x + nx * gap + px,
      y1: from.y + ny * gap + py,
      x2: to.x - nx * gap + px,
      y2: to.y - ny * gap + py,
      key: `${t.from}-${t.to}`,
      // Only shift drop zones on diagonal edges (not the horizontal bottom edge)
      _isBottomEdge: (t.from === "vast" && t.to === "vloeibaar") || (t.from === "vloeibaar" && t.to === "vast"),
      _isInward: hasReverse ? (t.from < t.to) : true,
      get midX() { return (this.x1 + this.x2) / 2; },
      get midY() { return (this.y1 + this.y2) / 2; },
      get dropX() {
        const ratio = (!this._isBottomEdge && this._isInward) ? 0.6 : 0.5;
        return this.x1 + (this.x2 - this.x1) * ratio;
      },
      get dropY() {
        const ratio = (!this._isBottomEdge && this._isInward) ? 0.6 : 0.5;
        return this.y1 + (this.y2 - this.y1) * ratio;
      },
    };
  });

  return (
    <div className="relative mx-auto mb-2" style={{ width: W, height: H + 25 }}>
      <svg width={W} height={H + 25} viewBox={`0 0 ${W} ${H + 25}`} className="absolute inset-0">
        <defs>
          <marker id="arrB" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <path d="M0,0 L10,4 L0,8 Z" fill={C.brownText} />
          </marker>
          <marker id="arrG" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <path d="M0,0 L10,4 L0,8 Z" fill={C.green} />
          </marker>
        </defs>
        {/* Arrows */}
        {arrows.map((a) => {
          const filled = !!answers[a.key];
          return (
            <line key={a.key}
              x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
              stroke={filled ? C.green : C.brownText}
              strokeWidth={filled ? 3 : 2.5}
              markerEnd={filled ? "url(#arrG)" : "url(#arrB)"}
              opacity={filled ? 1 : 0.5}
            />
          );
        })}
        {/* Node circles */}
        {Object.values(nodes).map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={R} fill={C.beigeLight} stroke={C.brownText} strokeWidth="3" />
        ))}
      </svg>

      {/* Icons */}
      {Object.entries(nodes).map(([key, n]) => {
        const IC = n.Icon;
        return (
          <div key={key} className="absolute flex items-center justify-center" style={{ left: n.x - 22, top: n.y - 22, width: 44, height: 44, pointerEvents: "none" }}>
            <IC className="w-8 h-8" style={{ color: n.iconColor }} />
          </div>
        );
      })}

      {/* Node labels */}
      <div className="absolute font-bold italic text-sm text-center" style={{ color: C.brownText, left: nodes.gas.x - 25, top: nodes.gas.y - R - 20, width: 50 }}>GAS</div>
      <div className="absolute font-bold italic text-sm text-center" style={{ color: C.brownText, left: nodes.vast.x - 30, top: nodes.vast.y + R + 4, width: 60 }}>VAST</div>
      <div className="absolute font-bold italic text-xs text-center" style={{ color: C.brownText, left: nodes.vloeibaar.x - 45, top: nodes.vloeibaar.y + R + 4, width: 90 }}>VLOEIBAAR</div>

      {/* Drop zones — one per arrow */}
      {arrows.map((a) => {
        // Rotate the drop zone to align with the arrow direction
        const dx = a.x2 - a.x1, dy = a.y2 - a.y1;
        const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <div
            key={a.key}
            className="absolute"
            style={{
              left: a.dropX - 90,
              top: a.dropY - 32,
              width: 180,
              height: 64,
              padding: "15px 20px",
            }}
          >
            <DropZone expected={a.expected} value={answers[a.key]} onDrop={(v, c, e) => onDrop(a.key, v, c, e)} />
          </div>
        );
      })}
    </div>
  );
}

// ─── BUTTON COMPONENT ───

function GameButton({ onClick, children, variant = "primary", disabled = false, className = "" }) {
  const styles = {
    primary: { backgroundColor: "#30B5AE", hoverBg: "#2AA39D", color: "white", shadow: "0 3px 0 #1F8A84" },
    green: { backgroundColor: C.green, hoverBg: "#17795C", color: "white", shadow: "0 3px 0 #166F56" },
    secondary: { backgroundColor: C.beigeMid, hoverBg: "#c9dade", color: C.brownText, shadow: "0 3px 0 #b9cdd2" },
    danger: { backgroundColor: C.red, hoverBg: "#B02121", color: "white", shadow: "0 3px 0 #A81F1F" },
  };
  const s = styles[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border-2 ${
        disabled ? "opacity-40 cursor-not-allowed" : "active:scale-[0.98]"
      } ${className}`}
      style={{
        backgroundColor: disabled ? C.beigeMid : s.backgroundColor,
        borderColor: disabled ? "#c9dade" : s.backgroundColor,
        color: disabled ? "#7d94a3" : s.color,
        boxShadow: disabled ? "none" : s.shadow,
      }}
      onMouseEnter={(e) => { if (!disabled) e.target.style.backgroundColor = s.hoverBg; }}
      onMouseLeave={(e) => { if (!disabled) e.target.style.backgroundColor = s.backgroundColor; }}
    >
      {children}
    </button>
  );
}

// ─── SCREENS ───

function StartScreen({ onStart }) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Title bar */}
      <div className="py-3 px-5 text-center relative" style={{ background: GRAD }}>
        <img src="/studium-beeldmerk.png" alt="Studium" className="h-6 w-auto absolute left-5 top-1/2 -translate-y-1/2" />
        <span className="text-white font-bold italic text-lg">De Energie-Stapelaar</span>
      </div>
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
        <div className="rounded-full p-7 border-4" style={{ background: GRAD, borderColor: "#99D3D8" }}>
          <Flame className="w-20 h-20 text-white" />
        </div>
        <h1 className="text-3xl font-bold italic" style={{ color: C.brownText }}>De Energie-Stapelaar</h1>
        <p className="max-w-sm text-center font-medium" style={{ color: C.brown }}>
          Ontdek wat er met energie gebeurt bij faseovergangen
        </p>
        <GameButton onClick={onStart}>
          Start de game
        </GameButton>
      </div>
    </div>
  );
}

function IntroScreen({ title, text, children, buttonText, onNext }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
      <h2 className="text-2xl font-bold italic" style={{ color: C.brownText }}>{title}</h2>
      <div className="border-2 rounded-2xl p-6 max-w-lg" style={{ backgroundColor: C.bgCard, borderColor: C.brownText }}>
        {children || <p className="leading-relaxed text-center" style={{ color: C.brownText }}>{text}</p>}
      </div>
      <GameButton onClick={onNext}>
        {buttonText}
        <ArrowRight className="w-4 h-4" />
      </GameButton>
    </div>
  );
}

// ─── MISSION 1 ROUND 1: Basic transitions ───

function M1R1({ onComplete, addScore, loseLife }) {
  const [answers, setAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);

  const transitions = [
    { from: "vast", to: "vloeibaar", expected: "smelten" },
    { from: "vloeibaar", to: "vast", expected: "stollen" },
    { from: "vloeibaar", to: "gas", expected: "verdampen" },
    { from: "gas", to: "vloeibaar", expected: "condenseren" },
    { from: "vast", to: "gas", expected: "sublimeren" },
    { from: "gas", to: "vast", expected: "rijpen" },
  ];

  const labels = ["smelten", "verdampen", "stollen"];
  const targetKeys = ["vast-vloeibaar", "vloeibaar-gas", "vloeibaar-vast"];
  const placedLabels = Object.values(answers);
  const allCorrect = targetKeys.every((k) => {
    const t = transitions.find((tr) => `${tr.from}-${tr.to}` === k);
    return t && answers[k] === t.expected;
  });

  const handleDrop = (key, value, correct, e) => {
    if (correct) {
      setAnswers((prev) => ({ ...prev, [key]: value }));
      addScore(5, e);
    } else {
      loseLife();
    }
  };

  useEffect(() => {
    if (allCorrect && targetKeys.every((k) => answers[k])) {
      setTimeout(() => setShowFeedback(true), 300);
    }
  }, [answers]);

  return (
    <div className="flex-1 flex flex-col items-center p-6">
      <h2 className="text-xl font-bold italic mb-2" style={{ color: C.brownText }}>Ronde 1: Basisovergangen</h2>
      <p className="text-sm mb-6 max-w-md text-center font-medium" style={{ color: C.brown }}>
        Sleep het juiste woord naar de pijl tussen de twee toestanden.
      </p>

      <PhaseTriangle
        transitions={transitions}
        answers={answers}
        onDrop={handleDrop}
      />

      {/* Draggable label — one at a time */}
      <div className="flex gap-3 flex-wrap justify-center">
        {(() => {
          const nextLabel = labels.find((l) => !placedLabels.includes(l));
          return nextLabel ? <DragLabel key={nextLabel} name={nextLabel} /> : null;
        })()}
      </div>

      {showFeedback && (
        <FeedbackPopup
          type="correct"
          text="Goed gedaan! Smelten, verdampen en stollen — dat zijn de drie basisovergangen die je het meest tegenkomt."
          onClose={onComplete}
        />
      )}
    </div>
  );
}

// ─── MISSION 1 ROUND 2: All six transitions ───

function M1R2({ onComplete, addScore, loseLife }) {
  const [answers, setAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);

  const transitions = [
    { from: "vast", to: "vloeibaar", expected: "smelten" },
    { from: "vloeibaar", to: "gas", expected: "verdampen" },
    { from: "gas", to: "vloeibaar", expected: "condenseren" },
    { from: "vloeibaar", to: "vast", expected: "stollen" },
    { from: "vast", to: "gas", expected: "sublimeren" },
    { from: "gas", to: "vast", expected: "rijpen" },
  ];

  const labels = ["smelten", "stollen", "verdampen", "condenseren", "sublimeren", "rijpen"];
  const placedLabels = Object.values(answers);
  const allCorrect = transitions.every((t) => answers[`${t.from}-${t.to}`] === t.expected);

  const handleDrop = (key, value, correct, e) => {
    if (correct) {
      setAnswers((prev) => ({ ...prev, [key]: value }));
      addScore(3, e);
    } else {
      loseLife();
    }
  };

  useEffect(() => {
    if (allCorrect && Object.keys(answers).length === 6) {
      setTimeout(() => setShowFeedback(true), 300);
    }
  }, [answers]);

  return (
    <div className="flex-1 flex flex-col items-center p-6">
      <h2 className="text-xl font-bold italic mb-2" style={{ color: C.brownText }}>Ronde 2: Alle zes faseovergangen</h2>
      <p className="text-sm mb-6 max-w-md text-center font-medium" style={{ color: C.brown }}>
        Nu alle zes! Sleep elk woord naar de juiste pijl.
      </p>

      <PhaseTriangle
        transitions={transitions}
        answers={answers}
        onDrop={handleDrop}
      />

      {/* Label — one at a time */}
      <div className="flex gap-3 flex-wrap justify-center">
        {(() => {
          const nextLabel = labels.find((l) => !placedLabels.includes(l));
          return nextLabel ? <DragLabel key={nextLabel} name={nextLabel} /> : null;
        })()}
      </div>

      {showFeedback && (
        <FeedbackPopup
          type="correct"
          text="Alle zes goed! Sublimeren en rijpen komen minder vaak voor, maar zijn belangrijk om te kennen."
          onClose={onComplete}
        />
      )}
    </div>
  );
}

// ─── MISSION 1 ROUND 3: Energy direction sorting ───

function M1R3({ onComplete, addScore, loseLife }) {
  const [absorbs, setAbsorbs] = useState([]);
  const [releases, setReleases] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);

  const items = [
    { name: "smelten", shouldAbsorb: true },
    { name: "verdampen", shouldAbsorb: true },
    { name: "sublimeren", shouldAbsorb: true },
    { name: "stollen", shouldAbsorb: false },
    { name: "condenseren", shouldAbsorb: false },
    { name: "rijpen", shouldAbsorb: false },
  ];

  const placed = [...absorbs, ...releases];
  const allPlaced = placed.length === 6;

  const handleDrop = (column, e) => {
    e.preventDefault();
    const name = e.dataTransfer.getData("text/plain");
    const item = items.find((i) => i.name === name);
    if (!item) return;

    setAbsorbs((prev) => prev.filter((n) => n !== name));
    setReleases((prev) => prev.filter((n) => n !== name));

    const correct = column === "absorbs" ? item.shouldAbsorb : !item.shouldAbsorb;
    if (correct) {
      if (column === "absorbs") setAbsorbs((prev) => [...prev, name]);
      else setReleases((prev) => [...prev, name]);
      addScore(2, e);
    } else {
      loseLife();
    }
  };

  useEffect(() => {
    if (allPlaced) {
      const allCorrect = absorbs.every((n) => items.find((i) => i.name === n)?.shouldAbsorb) &&
                          releases.every((n) => !items.find((i) => i.name === n)?.shouldAbsorb);
      if (allCorrect) {
        setTimeout(() => setShowFeedback(true), 300);
      }
    }
  }, [absorbs, releases]);

  const columnStyle = (color) => ({
    borderColor: color,
    backgroundColor: color === "#D92C2C" ? "#FDF2F0" : "#F0F7EE",
  });

  return (
    <div className="flex-1 flex flex-col items-center p-6">
      <h2 className="text-xl font-bold italic mb-2" style={{ color: C.brownText }}>Ronde 3: Energie richting</h2>
      <p className="text-sm mb-6 max-w-md text-center font-medium" style={{ color: C.brown }}>
        Sleep elke faseovergang naar de juiste kolom.
      </p>

      <div className="flex gap-4 mb-6 w-full max-w-lg">
        {/* Absorbs column */}
        <div
          className="flex-1 border-3 rounded-2xl p-4 min-h-[200px]"
          style={{ ...columnStyle(C.red), borderWidth: "3px" }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop("absorbs", e)}
        >
          <div className="flex items-center gap-2 mb-3 justify-center">
            <Flame className="w-5 h-5" style={{ color: C.red }} />
            <span className="font-bold text-sm italic" style={{ color: C.red }}>Neemt warmte op</span>
          </div>
          <div className="flex flex-col gap-2">
            {absorbs.map((name) => (
              <div
                key={name}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", name)}
                className="rounded-xl px-3 py-2 text-sm font-bold cursor-grab flex items-center gap-1 border-2 italic"
                style={{ backgroundColor: C.greenLight, borderColor: C.green, color: C.green }}
              >
                <CheckCircle className="w-3 h-3" />
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </div>
            ))}
          </div>
        </div>

        {/* Releases column */}
        <div
          className="flex-1 border-3 rounded-2xl p-4 min-h-[200px]"
          style={{ ...columnStyle("#2E86C1"), borderWidth: "3px", backgroundColor: "#EBF5FB" }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop("releases", e)}
        >
          <div className="flex items-center gap-2 mb-3 justify-center">
            <Snowflake className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-sm italic text-blue-700">Geeft warmte af</span>
          </div>
          <div className="flex flex-col gap-2">
            {releases.map((name) => (
              <div
                key={name}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", name)}
                className="rounded-xl px-3 py-2 text-sm font-bold cursor-grab flex items-center gap-1 border-2 italic"
                style={{ backgroundColor: C.greenLight, borderColor: C.green, color: C.green }}
              >
                <CheckCircle className="w-3 h-3" />
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Draggable items */}
      <div className="flex gap-2 flex-wrap justify-center">
        {items.map(({ name }) => (
          <DragLabel key={name} name={name} disabled={placed.includes(name)} />
        ))}
      </div>

      {showFeedback && (
        <FeedbackPopup
          type="correct"
          text="Precies! Verdampen, smelten en sublimeren kosten energie. Condenseren, stollen en rijpen geven energie af. Onthoud dit goed — het is de basis voor missie 2!"
          onClose={onComplete}
          buttonText="Naar missie 2"
        />
      )}
    </div>
  );
}

// ─── HEATING CURVE GRAPH ───

function HeatingCurveGraph({ phase, progress, energyKJ }) {
  const W = 580, H = 340;
  const pad = { top: 30, right: 30, bottom: 50, left: 65 };
  const gW = W - pad.left - pad.right;
  const gH = H - pad.top - pad.bottom;

  const minT = -20, maxT = 120;
  const totalE = TOTAL_ENERGY;

  const toX = (energy) => pad.left + (energy / totalE) * gW;
  const toY = (temp) => pad.top + gH - ((temp - minT) / (maxT - minT)) * gH;

  // Key points on the heating curve
  let cumE = 0;
  const keyPoints = [{ e: 0, t: -20 }];
  ENERGY_PHASES.forEach((p) => {
    cumE += p.energy;
    keyPoints.push({ e: cumE, t: p.endTemp });
  });

  // If energyKJ is provided, calculate phase/progress from total energy (for M2R2)
  let effectivePhase = phase;
  let effectiveProgress = progress;
  if (energyKJ !== undefined) {
    let remaining = Math.max(0, energyKJ);
    effectivePhase = 0;
    effectiveProgress = 0;
    for (let i = 0; i < ENERGY_PHASES.length; i++) {
      if (remaining >= ENERGY_PHASES[i].energy) {
        remaining -= ENERGY_PHASES[i].energy;
        effectivePhase = i + 1;
        effectiveProgress = 0;
      } else {
        effectivePhase = i;
        effectiveProgress = remaining / ENERGY_PHASES[i].energy;
        break;
      }
    }
    if (effectivePhase >= ENERGY_PHASES.length) {
      effectivePhase = ENERGY_PHASES.length - 1;
      effectiveProgress = 1;
    }
  }

  // Build the animated path
  const animPoints = [keyPoints[0]];
  for (let i = 0; i <= effectivePhase && i < ENERGY_PHASES.length; i++) {
    const p = i < effectivePhase ? 1 : effectiveProgress;
    const start = keyPoints[i];
    const end = keyPoints[i + 1];
    animPoints.push({
      e: start.e + (end.e - start.e) * p,
      t: start.t + (end.t - start.t) * p,
    });
  }

  // Build filled area polygons per completed phase
  const phasePolygons = [];
  let prevE = 0;
  for (let i = 0; i < ENERGY_PHASES.length; i++) {
    const p = i < effectivePhase ? 1 : i === effectivePhase ? effectiveProgress : 0;
    if (p <= 0) break;
    const startPt = keyPoints[i];
    const endPt = keyPoints[i + 1];
    const curE = startPt.e + (endPt.e - startPt.e) * p;
    const curT = startPt.t + (endPt.t - startPt.t) * p;
    const x0 = toX(startPt.e), y0 = toY(startPt.t);
    const x1 = toX(curE), y1 = toY(curT);
    const yBase = toY(minT);
    phasePolygons.push({
      color: ENERGY_PHASES[i].color,
      points: `${x0},${y0} ${x1},${y1} ${x1},${yBase} ${x0},${yBase}`,
    });
  }

  // Path string for the animated line
  const pathD = animPoints
    .map((pt, i) => `${i === 0 ? "M" : "L"}${toX(pt.e).toFixed(1)},${toY(pt.t).toFixed(1)}`)
    .join(" ");

  // Current position (dot)
  const lastPt = animPoints[animPoints.length - 1];
  const dotX = toX(lastPt.e);
  const dotY = toY(lastPt.t);

  // Y-axis ticks
  const yTicks = [-20, 0, 20, 40, 60, 80, 100, 120];

  // Phase labels
  const phaseLabels = [
    { label: "IJS", e: 21, t: -10 },
    { label: "SMELTEN", e: 210, t: -10 },
    { label: "WATER", e: 590, t: 50 },
    { label: "VERDAMPEN", e: 1920, t: 50 },
    { label: "STOOM", e: 3072, t: 110 },
  ];

  return (
    <div className="w-full max-w-xl mx-auto mb-4">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Background */}
        <rect x={pad.left} y={pad.top} width={gW} height={gH} fill={C.bgCard} rx="4" />

        {/* Grid lines */}
        {yTicks.map((t) => (
          <line key={t} x1={pad.left} y1={toY(t)} x2={W - pad.right} y2={toY(t)}
            stroke={C.beigeMid} strokeWidth="0.5" strokeDasharray={t === 0 || t === 100 ? "none" : "4,4"} />
        ))}

        {/* Filled phase areas */}
        {phasePolygons.map((pp, i) => (
          <polygon key={i} points={pp.points} fill={pp.color} opacity="0.4" />
        ))}

        {/* Animated line */}
        <path d={pathD} fill="none" stroke={C.brownText} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Moving dot */}
        <circle cx={dotX} cy={dotY} r="6" fill="#E74C3C" stroke={C.brownText} strokeWidth="2" />

        {/* Horizontal reference lines at 0°C and 100°C */}
        {[0, 100].map((t) => (
          <line key={`ref-${t}`} x1={pad.left} y1={toY(t)} x2={W - pad.right} y2={toY(t)}
            stroke={C.brownText} strokeWidth="0.8" opacity="0.3" />
        ))}

        {/* Y-axis */}
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + gH} stroke={C.brownText} strokeWidth="2" />
        {yTicks.map((t) => (
          <g key={`yt-${t}`}>
            <line x1={pad.left - 5} y1={toY(t)} x2={pad.left} y2={toY(t)} stroke={C.brownText} strokeWidth="1.5" />
            <text x={pad.left - 10} y={toY(t) + 4} textAnchor="end" fontSize="11" fontWeight="600" fill={C.brownText}>{t}°</text>
          </g>
        ))}
        <text x="15" y={pad.top + gH / 2} textAnchor="middle" fontSize="12" fontWeight="700" fontStyle="italic" fill={C.brownText}
          transform={`rotate(-90, 15, ${pad.top + gH / 2})`}>
          Temperatuur (°C)
        </text>

        {/* X-axis */}
        <line x1={pad.left} y1={pad.top + gH} x2={W - pad.right} y2={pad.top + gH} stroke={C.brownText} strokeWidth="2" />
        {[0, 500, 1000, 1500, 2000, 2500, 3000].map((e) => (
          <g key={`xt-${e}`}>
            <line x1={toX(e)} y1={pad.top + gH} x2={toX(e)} y2={pad.top + gH + 5} stroke={C.brownText} strokeWidth="1.5" />
            <text x={toX(e)} y={pad.top + gH + 18} textAnchor="middle" fontSize="9" fontWeight="600" fill={C.brownText}>{e}</text>
          </g>
        ))}
        <text x={pad.left + gW / 2} y={H - 5} textAnchor="middle" fontSize="12" fontWeight="700" fontStyle="italic" fill={C.brownText}>
          Enthalpie (kJ)
        </text>

        {/* Phase labels (show only completed/active phases) */}
        {phaseLabels.map((pl, i) => {
          if (i > effectivePhase) return null;
          return (
            <text key={i} x={toX(pl.e)} y={toY(pl.t)} textAnchor="middle" fontSize="9" fontWeight="700"
              fill={C.brownText} opacity="0.6" fontStyle="italic">
              {pl.label}
            </text>
          );
        })}

        {/* Current temp label next to dot */}
        <text x={dotX + 12} y={dotY - 10} fontSize="13" fontWeight="700" fill="#E74C3C">
          {Math.round(lastPt.t)}°C
        </text>
      </svg>
    </div>
  );
}

// ─── MISSION 2 ROUND 1: Animation ───

function M2R1({ onComplete, addScore, loseLife }) {
  const [phase, setPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animDone, setAnimDone] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const animRef = useRef(null);
  const startTimeRef = useRef(null);
  const phaseStartRef = useRef(0);

  const currentTemp = (() => {
    if (phase >= ENERGY_PHASES.length) return 120;
    const p = ENERGY_PHASES[phase];
    return p.startTemp + progress * (p.endTemp - p.startTemp);
  })();

  const filledAmounts = ENERGY_PHASES.map((p, i) => {
    if (i < phase) return 100;
    if (i === phase) return progress * 100;
    return 0;
  });

  useEffect(() => {
    if (paused || animDone) return;

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
        phaseStartRef.current = timestamp;
      }

      const elapsed = timestamp - phaseStartRef.current;
      const currentPhase = ENERGY_PHASES[phase];
      if (!currentPhase) {
        setAnimDone(true);
        return;
      }

      const p = Math.min(1, elapsed / currentPhase.duration);
      setProgress(p);

      if (p >= 1) {
        if (phase < ENERGY_PHASES.length - 1) {
          setTimeout(() => {
            setPhase((prev) => prev + 1);
            setProgress(0);
            phaseStartRef.current = 0;
            startTimeRef.current = null;
          }, 800);
        } else {
          setAnimDone(true);
        }
        return;
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [phase, paused, animDone]);

  const handleQuizCheck = () => {
    setQuizChecked(true);
    setAttempts((prev) => prev + 1);
    if (quizAnswer === 1) {
      addScore(attempts === 0 ? 10 : 5);
    } else {
      loseLife();
    }
  };

  const handleQuizRetry = () => {
    setQuizAnswer(null);
    setQuizChecked(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center p-6">
      <h2 className="text-xl font-bold italic mb-2" style={{ color: C.brownText }}>Ronde 1: Het experiment</h2>
      <p className="text-sm mb-4 max-w-md text-center font-medium" style={{ color: C.brown }}>
        Bekijk hoe 1 kg ijs van -20°C wordt opgewarmd naar stoom van 120°C.
      </p>

      <HeatingCurveGraph phase={phase} progress={progress} />

      {/* Step text */}
      <div className="border-2 rounded-2xl p-4 mb-4 max-w-xl w-full" style={{ backgroundColor: C.bgCard, borderColor: C.brownText }}>
        <p className="text-sm leading-relaxed italic" style={{ color: C.brownText }}>
          {phase < ANIM_STEP_TEXTS.length ? ANIM_STEP_TEXTS[phase] : ANIM_STEP_TEXTS[ANIM_STEP_TEXTS.length - 1]}
        </p>
      </div>

      {!animDone && (
        <GameButton onClick={() => setPaused((p) => !p)} variant="secondary">
          {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          {paused ? "Afspelen" : "Pauze"}
        </GameButton>
      )}

      {/* Quiz after animation */}
      {animDone && (
        <div className="border-2 rounded-2xl p-6 max-w-xl w-full shadow-md" style={{ backgroundColor: C.bgCard, borderColor: C.brownText }}>
          <h3 className="font-bold mb-3 italic" style={{ color: C.brownText }}>Waar ging de meeste energie naartoe?</h3>
          <div className="flex flex-col gap-2 mb-4">
            {[
              "Het opwarmen van water van 0°C naar 100°C",
              "Het verdampen van water bij 100°C",
              "Het opwarmen van ijs van -20°C naar 0°C",
              "Het smelten van ijs bij 0°C",
            ].map((opt, i) => (
              <button
                key={i}
                onClick={() => !quizChecked && setQuizAnswer(i)}
                disabled={quizChecked && quizAnswer !== i}
                className="text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all"
                style={{
                  backgroundColor: quizChecked && i === 1
                    ? C.greenLight
                    : quizChecked && quizAnswer === i && i !== 1
                    ? C.redLight
                    : quizAnswer === i
                    ? "#E7F4F3"
                    : C.bgCard,
                  borderColor: quizChecked && i === 1
                    ? C.green
                    : quizChecked && quizAnswer === i && i !== 1
                    ? C.red
                    : quizAnswer === i
                    ? "#30B5AE"
                    : C.beigeMid,
                  color: C.brownText,
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          {!quizChecked && (
            <GameButton onClick={handleQuizCheck} disabled={quizAnswer === null} className="w-full">
              Controleer
            </GameButton>
          )}
          {quizChecked && quizAnswer === 1 && (
            <div className="mt-3">
              <p className="text-sm mb-3 italic font-medium" style={{ color: C.green }}>
                Klopt! Het verdampen van water kost veruit de meeste energie — maar de temperatuur verandert niet! Dat is het bijzondere aan latente warmte.
              </p>
              <GameButton onClick={onComplete} variant="green" className="w-full">Volgende</GameButton>
            </div>
          )}
          {quizChecked && quizAnswer !== 1 && (
            <div className="mt-3">
              <p className="text-sm mb-3 italic font-medium" style={{ color: C.red }}>
                Niet helemaal. Kijk nog eens: waar was de energiebalk het langst bezig terwijl de thermometer stilstond?
              </p>
              {attempts < 2 ? (
                <GameButton onClick={handleQuizRetry} variant="danger" className="w-full">Probeer opnieuw</GameButton>
              ) : (
                <GameButton onClick={onComplete} className="w-full">Volgende</GameButton>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MISSION 2 ROUND 2: Energy Stacker ───

function M2R2({ onComplete, addScore, loseLife }) {
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [blocksPlaced, setBlocksPlaced] = useState(0);
  const [phaseFeedback, setPhaseFeedback] = useState(null);
  const [allDone, setAllDone] = useState(false);
  const [completedPhases, setCompletedPhases] = useState([]);

  const currentPhase = ENERGY_PHASES[currentPhaseIdx];
  const isLatent = currentPhase?.type === "latent";

  const getCurrentTemp = () => {
    if (!currentPhase) return 120;
    if (isLatent) return currentPhase.startTemp;
    const ratio = Math.min(1, blocksPlaced / currentPhase.blocks);
    return currentPhase.startTemp + ratio * (currentPhase.endTemp - currentPhase.startTemp);
  };

  const filledAmounts = ENERGY_PHASES.map((p, i) => {
    if (i < currentPhaseIdx) return 100;
    if (i === currentPhaseIdx) return Math.min(100, (blocksPlaced / Math.max(1, p.blocks)) * 100);
    return 0;
  });

  // Cumulative energy from completed phases
  const cumulativeEnergy = ENERGY_PHASES.slice(0, currentPhaseIdx).reduce((sum, p) => sum + p.energy, 0);

  const addBlock = () => setBlocksPlaced((prev) => prev + 1);
  const removeBlock = () => setBlocksPlaced((prev) => Math.max(0, prev - 1));

  const checkPhase = () => {
    const [min, max] = PHASE_MARGINS[currentPhaseIdx];
    if (blocksPlaced >= min && blocksPlaced <= max) {
      addScore(3);
      setCompletedPhases((prev) => [...prev, currentPhaseIdx]);
      const fb = PHASE_FEEDBACK[currentPhaseIdx];
      if (fb) {
        setPhaseFeedback(fb);
      } else if (currentPhaseIdx < ENERGY_PHASES.length - 1) {
        setCurrentPhaseIdx((prev) => prev + 1);
        setBlocksPlaced(0);
      } else {
        setAllDone(true);
      }
    } else {
      loseLife();
      setPhaseFeedback(
        `Je hebt ${blocksPlaced} blokjes geplaatst, maar je hebt er ongeveer ${currentPhase.blocks} nodig. Probeer het opnieuw.`
      );
    }
  };

  const handleFeedbackClose = () => {
    setPhaseFeedback(null);
    if (completedPhases.includes(currentPhaseIdx)) {
      if (currentPhaseIdx < ENERGY_PHASES.length - 1) {
        setCurrentPhaseIdx((prev) => prev + 1);
        setBlocksPlaced(0);
      } else {
        setAllDone(true);
      }
    } else {
      setBlocksPlaced(0);
    }
  };

  if (allDone) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
        <CheckCircle className="w-16 h-16" style={{ color: C.green }} />
        <h2 className="text-xl font-bold italic" style={{ color: C.brownText }}>Alle fasen voltooid!</h2>
        <div className="border-2 rounded-2xl p-4 max-w-md" style={{ backgroundColor: C.bgCard, borderColor: C.brownText }}>
          <p className="text-sm text-center leading-relaxed italic" style={{ color: C.brownText }}>
            Je hebt in totaal zo'n 3092 kJ nodig gehad. Bijna driekwart (2257 kJ) ging naar een ding: het verdampen. En dat zonder dat de temperatuur ook maar een graadje steeg!
          </p>
        </div>
        <GameButton onClick={onComplete} variant="green">Volgende</GameButton>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center p-6">
      <h2 className="text-xl font-bold italic mb-2" style={{ color: C.brownText }}>Ronde 2: Zelf energie stapelen</h2>
      <p className="text-sm mb-4 max-w-md text-center font-medium" style={{ color: C.brown }}>
        Sleep energieblokjes naar de balk om 1 kg ijs helemaal naar stoom te brengen.
      </p>

      <div className="rounded-xl px-4 py-2 mb-4 text-sm font-bold border-2 italic" style={{ backgroundColor: C.bgCard, borderColor: C.brownText, color: C.brownText }}>
        Fase {currentPhaseIdx + 1}/5: {currentPhase.label} ({currentPhase.startTemp}°C → {currentPhase.endTemp}°C)
      </div>

      <HeatingCurveGraph
        phase={currentPhaseIdx}
        progress={0}
        energyKJ={cumulativeEnergy + blocksPlaced * BLOCK_SIZE}
      />
      <div className="text-sm text-center font-medium mb-2" style={{ color: C.brown }}>
        Geplaatst: <span className="font-bold">{blocksPlaced}</span> blokjes ({blocksPlaced * BLOCK_SIZE} kJ)
      </div>

      {/* Energy blocks area — fixed layout with buttons at edges */}
      <div
        className="w-full max-w-xl border-2 border-dashed rounded-2xl mb-4 min-h-[70px] flex items-center"
        style={{ borderColor: C.brown, backgroundColor: C.beigeLight }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.getData("text/plain") === "energy-block") addBlock();
        }}
      >
        {/* - button fixed left */}
        <button
          onClick={removeBlock}
          disabled={blocksPlaced === 0}
          className="flex-shrink-0 w-12 h-full min-h-[70px] rounded-l-2xl font-bold text-2xl border-r-2 disabled:opacity-20 transition-all flex items-center justify-center"
          style={{ backgroundColor: C.redLight, borderColor: C.brown, color: C.red }}
        >
          -
        </button>

        {/* Blocks area center */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 min-h-[70px]">
          <div className="flex flex-wrap gap-1 justify-center max-w-[350px]">
            {Array.from({ length: Math.min(blocksPlaced, 80) }).map((_, i) => (
              <div key={i} className="w-5 h-5 bg-amber-400 rounded-sm border border-amber-600 text-[7px] flex items-center justify-center text-amber-800 font-bold">
                50
              </div>
            ))}
            {blocksPlaced > 80 && <span className="text-xs font-bold" style={{ color: C.brown }}>+{blocksPlaced - 80}</span>}
            {blocksPlaced === 0 && <span className="text-xs" style={{ color: "#7d94a3" }}>Sleep blokjes hierheen of gebruik +/-</span>}
          </div>
        </div>

        {/* + button fixed right */}
        <button
          onClick={addBlock}
          className="flex-shrink-0 w-12 h-full min-h-[70px] rounded-r-2xl font-bold text-2xl border-l-2 transition-all flex items-center justify-center"
          style={{ backgroundColor: C.greenLight, borderColor: C.brown, color: C.green }}
        >
          +
        </button>
      </div>

      <GameButton onClick={checkPhase} variant="green">Klaar met deze fase</GameButton>

      {phaseFeedback && (
        <FeedbackPopup
          type={completedPhases.includes(currentPhaseIdx) ? "correct" : "incorrect"}
          text={phaseFeedback}
          onClose={handleFeedbackClose}
        />
      )}
    </div>
  );
}

// ─── MISSION 2 ROUND 3: Quiz ───

function M2R3({ onComplete, addScore, loseLife }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [questionScores, setQuestionScores] = useState([]);

  const q = QUIZ_QUESTIONS[currentQ];
  const isCorrect = selected === q.correct;

  const handleCheck = () => {
    setChecked(true);
    setAttempts((prev) => prev + 1);
    if (isCorrect) {
      const pts = attempts === 0 ? 10 : 5;
      addScore(pts);
      setQuestionScores((prev) => [...prev, pts]);
    } else {
      loseLife();
    }
  };

  const handleNext = () => {
    if (!isCorrect && attempts < 2) {
      setSelected(null);
      setChecked(false);
      return;
    }
    if (!isCorrect) {
      setQuestionScores((prev) => [...prev, 0]);
    }
    if (currentQ < QUIZ_QUESTIONS.length - 1) {
      setCurrentQ((prev) => prev + 1);
      setSelected(null);
      setChecked(false);
      setAttempts(0);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center p-6">
      <h2 className="text-xl font-bold italic mb-2" style={{ color: C.brownText }}>Ronde 3: De grote vergelijking</h2>

      {currentQ === 0 && !checked && (
        <div className="mb-4 max-w-xl">
          <div className="flex gap-8 justify-center mb-4">
            <div className="flex flex-col items-center">
              <div className="text-xs font-bold mb-1" style={{ color: C.brownText }}>100°C</div>
              <div className="w-20 h-24 bg-blue-200 border-3 border-blue-400 rounded-b-xl flex items-center justify-center" style={{ borderWidth: "3px" }}>
                <Droplets className="w-8 h-8 text-blue-500" />
              </div>
              <span className="text-xs mt-1 font-bold italic" style={{ color: C.brownText }}>Water</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-xs font-bold mb-1" style={{ color: C.brownText }}>100°C</div>
              <div className="w-20 h-24 border-3 rounded-b-xl flex items-center justify-center" style={{ backgroundColor: C.beigeLight, borderColor: C.beigeMid, borderWidth: "3px" }}>
                <Cloud className="w-8 h-8 text-gray-400" />
              </div>
              <span className="text-xs mt-1 font-bold italic" style={{ color: C.brownText }}>Stoom</span>
            </div>
          </div>
          <p className="text-sm text-center italic font-medium" style={{ color: C.brownText }}>
            Hier staan twee 'stoffen' van 100°C: water en stoom. Dezelfde temperatuur. Maar is dat het hele verhaal?
          </p>
        </div>
      )}

      <div className="border-2 rounded-2xl p-6 max-w-xl w-full shadow-md" style={{ backgroundColor: C.bgCard, borderColor: C.brownText }}>
        <div className="text-xs font-medium mb-2" style={{ color: C.brown }}>Vraag {currentQ + 1} van {QUIZ_QUESTIONS.length}</div>
        <h3 className="font-bold mb-4 text-sm italic" style={{ color: C.brownText }}>{q.question}</h3>
        <div className="flex flex-col gap-2 mb-4">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => !checked && setSelected(i)}
              className="text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all"
              style={{
                backgroundColor: checked && i === q.correct
                  ? C.greenLight
                  : checked && selected === i && i !== q.correct
                  ? C.redLight
                  : selected === i
                  ? "#E7F4F3"
                  : C.bgCard,
                borderColor: checked && i === q.correct
                  ? C.green
                  : checked && selected === i && i !== q.correct
                  ? C.red
                  : selected === i
                  ? "#30B5AE"
                  : C.beigeMid,
                color: C.brownText,
              }}
            >
              {opt}
            </button>
          ))}
        </div>

        {!checked && (
          <GameButton onClick={handleCheck} disabled={selected === null} className="w-full">
            Controleer
          </GameButton>
        )}

        {checked && (
          <div className="mt-2">
            <p className="text-sm mb-3 italic font-medium" style={{ color: isCorrect ? C.green : C.red }}>
              {isCorrect ? q.feedbackCorrect : q.feedbackWrong}
            </p>
            <GameButton
              onClick={handleNext}
              variant={isCorrect || attempts >= 2 ? "green" : "danger"}
              className="w-full"
            >
              {isCorrect || attempts >= 2
                ? currentQ < QUIZ_QUESTIONS.length - 1 ? "Volgende vraag" : "Bekijk je resultaat"
                : "Probeer opnieuw"}
            </GameButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── END SCREEN ───

function EndScreen({ score, onRestart }) {
  const stars = score >= 80 ? 3 : score >= 60 ? 2 : 1;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <Star
            key={s}
            className={`w-14 h-14 transition-all duration-500 ${
              s <= stars ? "fill-amber-400 text-amber-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
      <div className="text-5xl font-bold italic" style={{ color: C.brownText }}>{score}/100</div>
      <div className="border-2 rounded-2xl p-6 max-w-lg" style={{ backgroundColor: C.bgCard, borderColor: C.brownText }}>
        <p className="text-sm text-center leading-relaxed" style={{ color: C.brownText }}>
          Gefeliciteerd! Je weet nu dat verdampen en condenseren niet zomaar faseovergangen zijn — er gaat een enorme hoeveelheid energie in om. Water van 100°C en stoom van 100°C hebben dezelfde temperatuur, maar stoom bevat ruim 2200 kJ per kg meer energie. Dit principe is de basis van hoe cv-ketels en warmtepompen werken.
        </p>
      </div>
      <GameButton onClick={onRestart}>
        <RotateCcw className="w-4 h-4" />
        Opnieuw spelen
      </GameButton>
    </div>
  );
}

// ─── MAIN GAME COMPONENT ───

export default function EnergyGame() {
  const [screen, setScreen] = useState("start");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const juice = useGameJuice();

  const addScore = useCallback((pts, e) => {
    setScore((prev) => Math.min(100, prev + pts));
    juice.triggerCorrect(pts, e);
  }, [juice.triggerCorrect]);

  const loseLife = useCallback(() => {
    setLives((prev) => Math.max(0, prev - 1));
    juice.triggerWrong();
  }, [juice.triggerWrong]);

  const resetGame = () => {
    setScreen("start");
    setScore(0);
    setLives(5);
  };

  const getMissionRound = () => {
    const map = {
      m1r1: [1, 1], m1r2: [1, 2], m1r3: [1, 3],
      mission2_intro: [2, 0],
      m2r1: [2, 1], m2r2: [2, 2], m2r3: [2, 3],
    };
    return map[screen] || [1, 0];
  };

  const [mission, round] = getMissionRound();
  const showProgress = !["start", "end", "mission1_intro", "mission2_intro"].includes(screen);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ backgroundColor: C.bgPage }}>
      <juice.JuiceOverlay />
      <div
        className="max-w-[800px] w-full mx-auto flex flex-col min-h-screen shadow-lg overflow-x-hidden transition-transform"
        style={{
          backgroundColor: C.bgPage,
          animation: juice.shaking ? "shake 0.3s ease-in-out" : "none",
        }}
      >
        {showProgress && <ProgressBar currentMission={mission} currentRound={round} score={score} lives={lives} />}

        {screen === "start" && <StartScreen onStart={() => setScreen("mission1_intro")} />}

        {screen === "mission1_intro" && (
          <IntroScreen
            title="Missie 1: Faseovergangen"
            buttonText="Aan de slag"
            onNext={() => setScreen("m1r1")}
          >
            <div className="leading-relaxed" style={{ color: C.brownText }}>
              <p className="mb-2">Water ken je in drie vormen:</p>
              <ul className="list-disc list-inside mb-3 ml-2">
                <li>ijs</li>
                <li>vloeibaar water</li>
                <li>stoom</li>
              </ul>
              <p className="mb-2">Dit noemen we <strong>aggregatietoestanden</strong>.</p>
              <p>Het veranderen van de ene vorm naar de andere heet een <strong>faseovergang</strong>. In deze missie leer je alle zes de faseovergangen kennen.</p>
            </div>
          </IntroScreen>
        )}

        {screen === "m1r1" && <M1R1 onComplete={() => setScreen("m1r2")} addScore={addScore} loseLife={loseLife} />}
        {screen === "m1r2" && <M1R2 onComplete={() => setScreen("m1r3")} addScore={addScore} loseLife={loseLife} />}
        {screen === "m1r3" && <M1R3 onComplete={() => setScreen("mission2_intro")} addScore={addScore} loseLife={loseLife} />}

        {screen === "mission2_intro" && (
          <IntroScreen
            title="Missie 2: Energie & Latente Warmte"
            text="We gaan een experiment doen. Je hebt 1 kg ijs van -20°C. Jouw opdracht: breng het helemaal naar stoom van 120°C door er energie aan toe te voegen. Maar let goed op de thermometer — want die gaat iets raars doen!"
            buttonText="Bekijk het experiment"
            onNext={() => setScreen("m2r1")}
          />
        )}

        {screen === "m2r1" && <M2R1 onComplete={() => setScreen("m2r2")} addScore={addScore} loseLife={loseLife} />}
        {screen === "m2r2" && <M2R2 onComplete={() => setScreen("m2r3")} addScore={addScore} loseLife={loseLife} />}
        {screen === "m2r3" && <M2R3 onComplete={() => setScreen("end")} addScore={addScore} loseLife={loseLife} />}

        {screen === "end" && <EndScreen score={score} onRestart={resetGame} />}
      </div>
    </div>
  );
}

// File: src/App.tsx
import React, { useState, useRef } from "react";

/* ============================================================
   EXACT SEQUENCES
   ------------------------------------------------------------
   Outer: 60 wedges (6° each)
   Middle: 30 wedges (12° each)
   Inner: 30 wedges (12° each)
============================================================ */
const OUTER_SEQUENCE: string[] = [
  "BONUS",
  "1",
  "2",
  "1",
  "5",
  "1",
  "2",
  "10",
  "1",
  "2",
  "1",
  "5",
  "2",
  "1",
  "Logo1",
  "1",
  "2",
  "1",
  "5",
  "1",
  "2",
  "10",
  "1",
  "2",
  "1",
  "5",
  "2",
  "1",
  "2",
  "1",
  "Logo2",
  "1",
  "5",
  "2",
  "1",
  "10",
  "1",
  "2",
  "1",
  "5",
  "1",
  "2",
  "1",
  "Logo1",
  "1",
  "2",
  "1",
  "2",
  "5",
  "1",
  "2",
  "1",
  "10",
  "1",
  "2",
  "1",
  "5",
  "1",
  "2",
  "1",
];

const MIDDLE_SEQUENCE: string[] = [
  "BONUS",
  "30",
  "50",
  "60",
  "50",
  "40",
  "50",
  "60",
  "50",
  "30",
  "75",
  "40",
  "50",
  "60",
  "40",
  "50",
  "40",
  "60",
  "50",
  "40",
  "75",
  "30",
  "50",
  "60",
  "40",
  "50",
  "40",
  "60",
  "50",
  "30",
];

const INNER_SEQUENCE: string[] = [
  "250",
  "75",
  "100",
  "125",
  "100",
  "75",
  "100",
  "150",
  "75",
  "100",
  "125",
  "100",
  "75",
  "125",
  "100",
  "200",
  "75",
  "100",
  "125",
  "100",
  "75",
  "100",
  "150",
  "75",
  "100",
  "125",
  "75",
  "100",
  "125",
  "75",
];

/* ============================================================
   TYPE DEFINITIONS
============================================================ */
type BetLabels = "1" | "2" | "5" | "10" | "Logo1" | "Logo2" | "BONUS";

interface Bets {
  "1": number;
  "2": number;
  "5": number;
  "10": number;
  Logo1: number;
  Logo2: number;
  BONUS: number;
}

interface SpinResult {
  ring: "Outer" | "Middle" | "Inner";
  label: string;
  winnings: number;
}

interface WedgeData {
  label: string;
  color: string;
  startAngle: number;
  endAngle: number;
}

/* ============================================================
   HELPER FUNCTIONS
============================================================ */

// Convert degrees to radians.
function deg2rad(deg: number): number {
  return (Math.PI / 180) * deg;
}

/**
 * buildRing:
 * For outer ring, wedgeAngle = 6°; for middle/inner, wedgeAngle = 12°.
 */
function buildRing(
  sequence: string[],
  wedgeAngle: number,
  colorFn: (lbl: string) => string
): WedgeData[] {
  return sequence.map((lbl, i) => ({
    label: lbl,
    color: colorFn(lbl),
    startAngle: i * wedgeAngle,
    endAngle: (i + 1) * wedgeAngle,
  }));
}

/**
 * describeArc:
 * Returns an SVG path string for a wedge arc from rInner to rOuter
 * spanning angles [startAngle, endAngle].
 */
function describeArc(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number
): string {
  const sa = deg2rad(startAngle);
  const ea = deg2rad(endAngle);

  const xOuterStart = cx + rOuter * Math.cos(sa);
  const yOuterStart = cy + rOuter * Math.sin(sa);
  const xOuterEnd = cx + rOuter * Math.cos(ea);
  const yOuterEnd = cy + rOuter * Math.sin(ea);

  const xInnerEnd = cx + rInner * Math.cos(ea);
  const yInnerEnd = cy + rInner * Math.sin(ea);
  const xInnerStart = cx + rInner * Math.cos(sa);
  const yInnerStart = cy + rInner * Math.sin(sa);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `
    M ${xOuterStart} ${yOuterStart}
    A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${xOuterEnd} ${yOuterEnd}
    L ${xInnerEnd} ${yInnerEnd}
    A ${rInner} ${rInner} 0 ${largeArc} 0 ${xInnerStart} ${yInnerStart}
    Z
  `;
}

/**
 * getWedgeIndex:
 * Given a final rotation, returns the wedge index that appears at the top.
 */
function getWedgeIndex(rotation: number, totalWedges: number): number {
  const wedgeAngle = 360 / totalWedges;
  const corrected = (360 - (rotation % 360) + wedgeAngle / 2) % 360;
  return Math.floor(corrected / wedgeAngle);
}

/* ============================================================
   COLOR FUNCTIONS
============================================================ */
function outerColor(lbl: string): string {
  return lbl === "BONUS" ? "#fed700" : "#d40000";
}

function middleColor(lbl: string): string {
  return lbl === "BONUS" ? "#fed700" : "#f9f9f9";
}

function innerColor(_lbl: string): string {
  return "#3c8df7";
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
function App(): JSX.Element {
  // -------- States --------
  const [bets, setBets] = useState<Bets>({
    "1": 0,
    "2": 0,
    "5": 0,
    "10": 0,
    Logo1: 0,
    Logo2: 0,
    BONUS: 0,
  });
  const [balance, setBalance] = useState<number>(2000);
  const [outerRotation, setOuterRotation] = useState<number>(0);
  const [spinningOuter, setSpinningOuter] = useState<boolean>(false);
  const [middleRotation, setMiddleRotation] = useState<number>(0);
  const [spinningMiddle, setSpinningMiddle] = useState<boolean>(false);
  const [innerRotation, setInnerRotation] = useState<number>(0);
  const [spinningInner, setSpinningInner] = useState<boolean>(false);
  const [activeBonusBet, setActiveBonusBet] = useState<number>(0);
  const [spinResults, setSpinResults] = useState<SpinResult[]>([]);
  // Winning wedge indices for each ring
  const [winningOuterIndex, setWinningOuterIndex] = useState<number | null>(
    null
  );
  const [winningMiddleIndex, setWinningMiddleIndex] = useState<number | null>(
    null
  );
  const [winningInnerIndex, setWinningInnerIndex] = useState<number | null>(
    null
  );

  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  // -------- Build Rings --------
  const outerRing = buildRing(OUTER_SEQUENCE, 6, outerColor);
  const middleRing = buildRing(MIDDLE_SEQUENCE, 12, middleColor);
  const innerRing = buildRing(INNER_SEQUENCE, 12, innerColor);

  // -------- Radii & SVG Size --------
  const outerR1 = 240,
    outerR2 = 300;
  const middleR1 = 200,
    middleR2 = 240;
  const innerR1 = 140,
    innerR2 = 200;

  // -------- Offsets for Rings --------
  const outerOffset = 264;
  const middleOffset = 264;
  const innerOffset = 264;

  // -------- Reset Function --------
  function resetGame(): void {
    setSpinResults([]);
    setWinningOuterIndex(null);
    setWinningMiddleIndex(null);
    setWinningInnerIndex(null);
    setActiveBonusBet(0);
  }

  // -------- Bet Logic --------
  function placeBet(label: BetLabels, amt: number): void {
    if (balance < amt) {
      alert("Insufficient balance!");
      return;
    }
    setBalance((prev) => prev - amt);
    setBets((prev) => ({ ...prev, [label]: prev[label] + amt }));
  }

  function clearBets(): void {
    const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);
    setBalance((prev) => prev + totalBet);
    setBets({
      "1": 0,
      "2": 0,
      "5": 0,
      "10": 0,
      Logo1: 0,
      Logo2: 0,
      BONUS: 0,
    });
  }

  // -------- Spin Logic --------
  function spinOuterRing(): void {
    const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);
    if (!totalBet) {
      alert("Place a bet first!");
      return;
    }
    if (spinningOuter || spinningMiddle || spinningInner) return;

    resetGame();
    setSpinningOuter(true);
    const total = outerRing.length; // 60
    const wedgeAngle = 6;
    const randomIndex = Math.floor(Math.random() * total);
    const randomSpins = Math.floor(4 + Math.random() * 3);
    const finalRotation =
      outerRotation + randomSpins * 360 - randomIndex * wedgeAngle;
    setOuterRotation(finalRotation);

    // Play spin audio
    if (spinAudioRef.current) {
      spinAudioRef.current.currentTime = 0;
      void spinAudioRef.current.play().catch(() => {});
    }

    setTimeout(() => {
      setSpinningOuter(false);
      const idx = getWedgeIndex(finalRotation, total);
      setWinningOuterIndex(idx);
      const wedge = outerRing[idx];
      let winnings = 0;

      // If the outer wedge lands on BONUS:
      if (wedge.label === "BONUS") {
        // All number bets win:
        winnings += bets["1"] * (1 + 1);
        winnings += bets["2"] * (2 + 1);
        winnings += bets["5"] * (5 + 1);
        winnings += bets["10"] * (10 + 1);

        // Transfer BONUS bet to bonus round (no immediate payout).
        if (bets["BONUS"] > 0) {
          setActiveBonusBet(bets["BONUS"]);
        }
        setSpinResults([{ ring: "Outer", label: "BONUS", winnings }]);
      } else if (["1", "2", "5", "10"].includes(wedge.label)) {
        // Only the matching bet wins
        const numericVal = parseInt(wedge.label, 10);
        winnings = bets[wedge.label as BetLabels] * (numericVal + 1);
        setSpinResults([{ ring: "Outer", label: wedge.label, winnings }]);
      } else if (wedge.label === "Logo1" || wedge.label === "Logo2") {
        const multiplier = wedge.label === "Logo1" ? 25 : 50;
        winnings = bets[wedge.label as BetLabels] * (multiplier + 1);
        setSpinResults([{ ring: "Outer", label: wedge.label, winnings }]);
      }

      // If there's a payout, update balance and play win audio
      if (winnings > 0) {
        setBalance((prev) => prev + winnings);
        if (winAudioRef.current) {
          winAudioRef.current.currentTime = 0;
          void winAudioRef.current.play().catch(() => {});
        }
      }

      // Reset all bets.
      setBets({
        "1": 0,
        "2": 0,
        "5": 0,
        "10": 0,
        Logo1: 0,
        Logo2: 0,
        BONUS: 0,
      });

      // If BONUS was triggered and a BONUS bet exists, begin bonus round.
      if (wedge.label === "BONUS" && bets["BONUS"] > 0) {
        setTimeout(() => spinMiddleRing(), 1200);
      } else {
        setTimeout(() => resetGame(), 3000);
      }
    }, 4500);
  }

  function spinMiddleRing(): void {
    setSpinningMiddle(true);
    const total = middleRing.length; // 30
    const wedgeAngle = 12;
    const randomIndex = Math.floor(Math.random() * total);
    const randomSpins = Math.floor(4 + Math.random() * 3);
    const finalRotation =
      middleRotation + randomSpins * 360 - randomIndex * wedgeAngle;
    setMiddleRotation(finalRotation);

    // Play spin audio
    if (spinAudioRef.current) {
      spinAudioRef.current.currentTime = 0;
      void spinAudioRef.current.play().catch(() => {});
    }

    setTimeout(() => {
      setSpinningMiddle(false);
      const idx = getWedgeIndex(finalRotation, total);
      setWinningMiddleIndex(idx);
      const wedge = middleRing[idx];
      let winnings = 0;

      if (wedge.label === "BONUS") {
        // If BONUS is spun again in the middle round, move bonus wager to inner round
        setSpinResults((prev) => [
          ...prev,
          { ring: "Middle", label: "BONUS", winnings: 0 },
        ]);
        setTimeout(() => spinInnerRing(), 1200);
      } else {
        const multiplier = parseInt(wedge.label, 10) || 0;
        winnings = activeBonusBet * (multiplier + 1);

        if (winnings > 0) {
          setBalance((prev) => prev + winnings);
          if (winAudioRef.current) {
            winAudioRef.current.currentTime = 0;
            void winAudioRef.current.play().catch(() => {});
          }
        }
        setSpinResults((prev) => [
          ...prev,
          { ring: "Middle", label: wedge.label, winnings },
        ]);

        setTimeout(() => resetGame(), 3000);
      }
    }, 4500);
  }

  function spinInnerRing(): void {
    setSpinningInner(true);
    const total = innerRing.length; // 30
    const wedgeAngle = 12;
    const randomIndex = Math.floor(Math.random() * total);
    const randomSpins = Math.floor(4 + Math.random() * 3);
    const finalRotation =
      innerRotation + randomSpins * 360 - randomIndex * wedgeAngle;
    setInnerRotation(finalRotation);

    // Play spin audio
    if (spinAudioRef.current) {
      spinAudioRef.current.currentTime = 0;
      void spinAudioRef.current.play().catch(() => {});
    }

    setTimeout(() => {
      setSpinningInner(false);
      const idx = getWedgeIndex(finalRotation, total);
      setWinningInnerIndex(idx);
      const wedge = innerRing[idx];
      const multiplier = parseInt(wedge.label, 10) || 0;
      const winnings = activeBonusBet * (multiplier + 1);

      if (winnings > 0) {
        setBalance((prev) => prev + winnings);
        if (winAudioRef.current) {
          winAudioRef.current.currentTime = 0;
          void winAudioRef.current.play().catch(() => {});
        }
      }
      setSpinResults((prev) => [
        ...prev,
        { ring: "Inner", label: wedge.label, winnings },
      ]);

      setTimeout(() => resetGame(), 3000);
    }, 4500);
  }

  /**
   * renderRing:
   * Renders a ring by rotating it by the specified offset so that wedge 0 appears at the top.
   * All wedge labels are drawn at the center of the wedge's thickness.
   * Accepts a winningIndex parameter to highlight the winning wedge.
   */
  function renderRing(
    ringData: WedgeData[],
    wedgeAngle: number,
    rotation: number,
    spinning: boolean,
    offset: number,
    rInner: number,
    rOuter: number,
    ringName: "Outer" | "Middle" | "Inner",
    winningIndex: number | null
  ): JSX.Element {
    return (
      <g
        style={{
          transformOrigin: "50% 50%",
          transform: `rotateZ(${offset + rotation}deg)`,
          transition: spinning
            ? "transform 4.5s cubic-bezier(0.33,1,0.68,1)"
            : "none",
        }}
      >
        {ringData.map((w: WedgeData, i: number) => {
          const isWinning = i === winningIndex;
          const pathD = describeArc(
            300,
            300,
            rInner,
            rOuter,
            w.startAngle,
            w.endAngle
          );
          const midAngle = (w.startAngle + w.endAngle) / 2;
          const textRadius = (rInner + rOuter) / 2;
          const rad = deg2rad(midAngle);
          const tx = 300 + textRadius * Math.cos(rad);
          const ty = 300 + textRadius * Math.sin(rad);

          return (
            <g key={i}>
              <path
                d={pathD}
                fill={w.color}
                stroke={isWinning ? "#ffd700" : "#111"}
                strokeWidth={isWinning ? 3 : 1}
                filter={isWinning ? "url(#glow)" : undefined}
              />
              <text
                x={tx}
                y={ty}
                fill="#000"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                alignmentBaseline="middle"
                style={{ pointerEvents: "none", textShadow: "0 0 2px #fff" }}
              >
                {w.label}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  const isSpinning = spinningOuter || spinningMiddle || spinningInner;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle, #2c2c2c 0%, #000 90%)",
        color: "#fff",
        fontFamily: "Trebuchet MS, sans-serif",
        padding: "20px",
        textAlign: "center",
      }}
    >
      {/* Keyframes for arrow tip animation */}
      <style>
        {`
          @keyframes arrowTipMotion {
            0% { transform: translateX(calc(-50% - 2mm)) rotate(0deg); }
            50% { transform: translateX(calc(-50% - 2mm)) rotate(-3deg); }
            100% { transform: translateX(calc(-50% - 2mm)) rotate(0deg); }
          }
        `}
      </style>

      {/* Audio */}
      <audio
        ref={spinAudioRef}
        src="https://www.myinstants.com/media/sounds/realistic_wheel_spin.mp3"
        preload="auto"
      />
      <audio
        ref={winAudioRef}
        src="https://www.myinstants.com/media/sounds/coins-win.mp3"
        preload="auto"
      />

      <h1
        style={{
          color: "#ffd700",
          textShadow: "0 0 8px rgba(255,215,0,0.7)",
          marginBottom: "0.5rem",
        }}
      >
        SuperWheel
      </h1>
      <div style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
        Balance: ${balance}
      </div>

      {/* Bet Panel */}
      <div
        style={{
          background: "#333",
          padding: "1rem",
          borderRadius: "8px",
          margin: "0 auto 1rem",
          boxShadow: "0 0 10px rgba(0,0,0,0.7)",
          width: "300px",
          textAlign: "left",
        }}
      >
        <h2 style={{ marginTop: 0, textAlign: "center" }}>Place Your Bets</h2>
        {(["1", "2", "5", "10", "Logo1", "Logo2", "BONUS"] as BetLabels[]).map(
          (lbl) => (
            <div
              key={lbl}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ fontWeight: "bold", flex: 1 }}>{lbl}</span>
              <div>
                <button
                  onClick={() => placeBet(lbl, 5)}
                  style={{ marginRight: 5 }}
                >
                  +5
                </button>
                <button
                  onClick={() => placeBet(lbl, 10)}
                  style={{ marginRight: 5 }}
                >
                  +10
                </button>
                <button onClick={() => placeBet(lbl, 25)}>+25</button>
              </div>
              <span style={{ width: "50px", textAlign: "right" }}>
                ${bets[lbl]}
              </span>
            </div>
          )
        )}
        <button
          onClick={clearBets}
          style={{
            display: "block",
            width: "100%",
            marginTop: "0.75rem",
            padding: "0.5rem",
            background: "#a22a2a",
            border: "1px solid #777",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Clear All Bets
        </button>
      </div>

      {/* Spin Button */}
      <button
        onClick={spinOuterRing}
        disabled={isSpinning}
        style={{
          margin: "1rem",
          padding: "0.75rem 2.5rem",
          fontSize: "1.3rem",
          background: "linear-gradient(to bottom, #d69500, #8b6508)",
          border: "1px solid #333",
          borderRadius: "8px",
          color: "#fff",
          cursor: "pointer",
          fontWeight: "bold",
          textShadow: "0 1px 2px #000",
          boxShadow: "0 0 10px rgba(139,101,8,0.7)",
          transition: "transform 0.2s ease",
          opacity: isSpinning ? 0.6 : 1,
        }}
      >
        {isSpinning ? "Spinning..." : "SPIN"}
      </button>

      {/* Wheel Stage with Animated Arrow Tip */}
      <div
        style={{
          position: "relative",
          width: "600px",
          height: "600px",
          margin: "1rem auto",
        }}
      >
        {/* Pointer Arrow */}
        <div
          style={{
            position: "absolute",
            top: "-15px", // Only the tip overlaps the wheel
            left: "50%",
            zIndex: 2,
            transform: isSpinning
              ? undefined
              : "translateX(calc(-50% - 2mm)) rotate(0deg)",
            animation: isSpinning
              ? "arrowTipMotion 0.5s infinite ease-in-out"
              : "none",
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "15px solid transparent",
              borderRight: "15px solid transparent",
              borderTop: "30px solid #d4af37",
            }}
          />
        </div>

        <svg
          width={600}
          height={600}
          style={{
            borderRadius: "50%",
            boxShadow: "inset 0 0 10px #000, 0 0 20px #000",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {/* SVG Filter for the winning glow */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="3"
                floodColor="#ffd700"
              />
            </filter>
          </defs>

          {/* Outer ring: 60 wedges */}
          {renderRing(
            outerRing,
            6,
            outerRotation,
            spinningOuter,
            outerOffset,
            outerR1,
            outerR2,
            "Outer",
            winningOuterIndex
          )}

          {/* Middle ring: 30 wedges */}
          {renderRing(
            middleRing,
            12,
            middleRotation,
            spinningMiddle,
            middleOffset,
            middleR1,
            middleR2,
            "Middle",
            winningMiddleIndex
          )}

          {/* Inner ring: 30 wedges */}
          {renderRing(
            innerRing,
            12,
            innerRotation,
            spinningInner,
            innerOffset,
            innerR1,
            innerR2,
            "Inner",
            winningInnerIndex
          )}

          {/* Central Title */}
          <text
            x={300}
            y={300}
            textAnchor="middle"
            alignmentBaseline="middle"
            fill="#fff"
            fontSize="32"
            fontWeight="bold"
            style={{ pointerEvents: "none", textShadow: "0 0 4px #000" }}
          >
            SUPERWHEEL
          </text>
        </svg>
      </div>

      {/* Results Panel */}
      {spinResults.length > 0 && (
        <div
          style={{
            background: "#444",
            color: "#ffd700",
            padding: "1rem",
            borderRadius: "8px",
            marginTop: "1.5rem",
            minWidth: "300px",
            textAlign: "center",
            boxShadow: "0 0 10px rgba(0,0,0,0.7)",
            margin: "0 auto",
          }}
        >
          {spinResults.map((res, idx) => (
            <div key={idx} style={{ margin: "0.25rem 0", fontSize: "1.1rem" }}>
              {res.ring} Ring: {res.label} – You won ${res.winnings}!
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Only ONE default export:
export default App;

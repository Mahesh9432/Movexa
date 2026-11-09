import React, { useState, useEffect } from 'react';

export default function PatientSession({ onLogout, onNavigate }) {
  // Session States
  const [sessionState, setSessionState] = useState('ready'); // 'ready' | 'active' | 'paused' | 'completed'
  const [currentSet, setCurrentSet] = useState(1);
  const totalSets = 3;
  const [currentRep, setCurrentRep] = useState(0);
  const targetReps = 10;
  const [timerSeconds, setTimerSeconds] = useState(0);

  // AI Feedback Mock States
  const [formFeedback, setFormFeedback] = useState('Optimal Alignment (98%)');
  const [feedbackType, setFeedbackType] = useState('success'); // 'success' | 'warning' | 'alert'
  const [kneeAngle, setKneeAngle] = useState(85);

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (sessionState === 'active') {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [sessionState]);

  // Simulated Repetition Progress Loop
  useEffect(() => {
    let repInterval = null;
    if (sessionState === 'active') {
      repInterval = setInterval(() => {
        setCurrentRep((prevRep) => {
          if (prevRep + 1 >= targetReps) {
            if (currentSet < totalSets) {
              setCurrentSet((s) => s + 1);
              return 0;
            } else {
              setSessionState('completed');
              return targetReps;
            }
          }
          // Simulate slight dynamic angle changes
          setKneeAngle(Math.floor(Math.random() * (92 - 82 + 1)) + 82);
          return prevRep + 1;
        });
      }, 3500);
    }
    return () => clearInterval(repInterval);
  }, [sessionState, currentSet]);

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#111827] text-white flex flex-col justify-between">

      {/* 1. EXERCISE DETAILS & TOP HEADER */}
      <header className="bg-[#1F2937] border-b border-gray-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('exercises')}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          >
            ← Back to Exercises
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#087F73] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Active Protocol
              </span>
              <span className="text-xs text-gray-400">• Prescribed by Dr. Marcus Vance, PT</span>
            </div>
            <h1 className="text-base font-bold mt-0.5 text-white">Terminal Knee Extensions (TKE)</h1>
          </div>
        </div>

        {/* SESSION QUICK METRICS */}
        <div className="flex items-center gap-6 bg-gray-900/60 border border-gray-800 px-4 py-2 rounded-xl">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold">Target Prescription</p>
            <p className="text-xs font-semibold text-gray-200">{totalSets} Sets × {targetReps} Reps</p>
          </div>
          <div className="border-l border-gray-800 pl-4">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Duration</p>
            <p className="text-xs font-mono font-bold text-[#087F73]">{formatTime(timerSeconds)}</p>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        
        {/* 2. CAMERA PREVIEW & 4. AI FEEDBACK OVERLAY (2 Cols) */}
        <div className="lg:col-span-2 relative bg-gray-900 border border-gray-800 rounded-2xl h-[440px] md:h-[540px] overflow-hidden flex items-center justify-center shadow-2xl">
          
          {/* Camera Feed Background Simulation */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/20 to-black/90 flex items-center justify-center">
            <div className="text-center space-y-2 opacity-40">
              <span className="text-5xl">📷</span>
              <p className="text-xs font-mono text-gray-400">MediaPipe Pose Stream Ready [Webcam Feed Active]</p>
            </div>
          </div>

          {/* AI Tracking & Posture Feedback Overlay Elements */}
          <div className="absolute inset-6 border border-dashed border-[#087F73]/40 rounded-xl pointer-events-none flex flex-col justify-between p-4">
            
            {/* Top Status Tags */}
            <div className="flex flex-wrap justify-between items-start gap-2">
              <span className="bg-black/70 backdrop-blur-md text-[#087F73] border border-[#087F73]/30 text-xs font-mono px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-[#087F73] animate-pulse" />
                JOINT ANGLE: {kneeAngle}° [TARGET: 90°]
              </span>

              <span className={`bg-black/70 backdrop-blur-md border text-xs font-mono px-3.5 py-1.5 rounded-full shadow-lg ${
                feedbackType === 'success' ? 'text-emerald-400 border-emerald-500/30' :
                feedbackType === 'warning' ? 'text-amber-400 border-amber-500/30' : 'text-red-400 border-red-500/30'
              }`}>
                {formFeedback}
              </span>
            </div>

            {/* Center State Messages (Ready, Paused, or Completed) */}
            <div className="text-center">
              {sessionState === 'ready' && (
                <div className="bg-black/80 backdrop-blur-md border border-gray-700 p-6 rounded-2xl max-w-sm mx-auto space-y-3 shadow-2xl pointer-events-auto">
                  <span className="text-3xl">🚀</span>
                  <h3 className="text-sm font-bold text-white">Ready to Begin Session</h3>
                  <p className="text-xs text-gray-400">Position yourself in frame so the optical sensor can calibrate your skeletal alignment.</p>
                  <button
                    onClick={() => setSessionState('active')}
                    className="w-full bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer shadow-md transition-all"
                  >
                    Start Session Now
                  </button>
                </div>
              )}

              {sessionState === 'paused' && (
                <div className="bg-black/80 backdrop-blur-md border border-amber-500/50 p-6 rounded-2xl max-w-sm mx-auto space-y-3 shadow-2xl pointer-events-auto">
                  <span className="text-3xl">⏸️</span>
                  <h3 className="text-sm font-bold text-amber-400">Session Paused</h3>
                  <p className="text-xs text-gray-300">Take a breather. Resume whenever you are ready to continue.</p>
                  <button
                    onClick={() => setSessionState('active')}
                    className="w-full bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer shadow-md transition-all"
                  >
                    Resume Session
                  </button>
                </div>
              )}

              {sessionState === 'completed' && (
                <div className="bg-black/90 backdrop-blur-md border border-emerald-500/50 p-6 rounded-2xl max-w-md mx-auto space-y-3 shadow-2xl pointer-events-auto">
                  <span className="text-4xl">🎉</span>
                  <h3 className="text-base font-bold text-emerald-400">Session Successfully Completed!</h3>
                  <p className="text-xs text-gray-300">Great job! All prescribed sets and repetitions were verified by AI motion tracking.</p>
                  <div className="grid grid-cols-3 gap-2 bg-gray-900 p-3 rounded-xl border border-gray-800 text-left text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Total Sets</span>
                      <strong className="text-white">{totalSets} / {totalSets}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Duration</span>
                      <strong className="text-white">{formatTime(timerSeconds)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Form Accuracy</span>
                      <strong className="text-emerald-400">96.8%</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('exercises')}
                    className="w-full bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer shadow-md transition-all"
                  >
                    Return to Exercises →
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Overlay Info */}
            <div className="flex justify-between items-end text-[10px] font-mono text-gray-400">
              <span>SKELETAL MESH: 33 Keypoints Locked</span>
              <span className="text-emerald-400">● Live Confidence: 99.1%</span>
            </div>
          </div>
        </div>

        {/* 3. LIVE TRACKING & TELEMETRY PANEL (1 Col) */}
        <div className="space-y-4">
          
          {/* LIVE REPETITION & SET COUNTER */}
          <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-6 text-center space-y-2 shadow-lg">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Set {currentSet} of {totalSets}</p>
            <div className="text-6xl font-black text-[#087F73] font-mono">
              {currentRep}<span className="text-2xl text-gray-500 font-normal">/{targetReps}</span>
            </div>
            <p className="text-xs text-gray-300 font-semibold pt-1">Repetitions completed in current set</p>
          </div>

          {/* REAL-TIME KINEMATIC METRICS */}
          <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-bold border-b border-gray-800 pb-2">
              Live AI Telemetry
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Target Angle Range:</span>
                <span className="font-mono font-bold text-gray-200">0° - 90°</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Movement Tempo:</span>
                <span className="font-mono font-bold text-gray-200">2s Hold • 3s Return</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Compensation Alerts:</span>
                <span className="font-mono font-bold text-emerald-400">None detected</span>
              </div>
            </div>
          </div>

          {/* INSTRUCTIONS & GUIDANCE */}
          <div className="bg-[#1F2937]/50 border border-gray-800 rounded-xl p-4 text-xs space-y-1">
            <p className="font-bold text-[#087F73]">Execution Instructions:</p>
            <p className="text-gray-400">Slow controlled return. Do not allow knee to hyperextend quickly under band snapback.</p>
          </div>

        </div>

      </main>

      {/* 5. SESSION CONTROLS FOOTER */}
      <footer className="bg-[#1F2937] border-t border-gray-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="text-xs text-gray-400">
          Audio Guidance: <span className="text-emerald-400 font-semibold">Enabled (Voice Feedback Active)</span>
        </div>
        
        <div className="flex items-center gap-3">
          {sessionState === 'active' && (
            <button
              onClick={() => setSessionState('paused')}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-all"
            >
              ⏸ Pause Session
            </button>
          )}

          {sessionState === 'paused' && (
            <button
              onClick={() => setSessionState('active')}
              className="bg-[#087F73] hover:bg-[#06655c] text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-md"
            >
              ▶ Resume Session
            </button>
          )}

          <button
            onClick={() => setSessionState('completed')}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer transition-all"
          >
            🏁 Finish & Submit Session
          </button>
        </div>
      </footer>

    </div>
  );
}
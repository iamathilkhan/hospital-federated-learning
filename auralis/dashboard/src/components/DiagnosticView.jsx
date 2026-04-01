import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, XCircle, Edit3, Loader2 } from 'lucide-react';

const DiagnosticView = ({ diagnosticData, onAuditAction }) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!diagnosticData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = diagnosticData.image_url;
    
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Mock GradCAM overlay with a glowing gradient
        const gradient = ctx.createRadialGradient(
            canvas.width * 0.4, canvas.height * 0.5, 20,
            canvas.width * 0.45, canvas.height * 0.55, 120
        );
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.5)'); // Core (High Activation)
        gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.3)'); // Mid
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)'); // Edge
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
  }, [diagnosticData]);

  const handleAction = async (action) => {
    setLoading(true);
    await onAuditAction(action);
    setLoading(false);
  };

  if (!diagnosticData) return (
      <div className="bg-slate-900 border border-slate-700 p-8 rounded-xl h-full flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="animate-spin mb-4" size={32} />
          Fetching real-time diagnostic sample...
      </div>
  );

  const isLowConfidence = diagnosticData.confidence < 82;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
        <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-indigo-400" /> Physician Audit Interface
            </h2>
            <p className="text-slate-500 text-xs mt-1">Diagnostic Sample ID: GMIS-CXR-{Math.floor(Math.random()*9000)+1000}</p>
        </div>
        {isLowConfidence && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] px-3 py-1.5 rounded flex items-center gap-2 uppercase font-bold animate-pulse">
                <AlertCircle size={14} /> Below Baseline Confidence — Specialist Review Recommended
            </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 p-6 flex flex-col bg-black/60 items-center justify-center">
            <div className="relative group rounded-lg overflow-hidden border-2 border-slate-700">
                <canvas 
                    ref={canvasRef} 
                    width={400} 
                    height={400} 
                    className="max-w-full h-auto cursor-zoom-in"
                />
                <div className="absolute top-2 right-2 bg-black/70 text-[10px] text-white px-2 py-1 rounded border border-slate-600 uppercase tracking-widest font-mono">
                    GradCAM Overlay: ON
                </div>
            </div>
            <p className="text-slate-500 text-[10px] mt-4 uppercase tracking-widest">Global Medical Intelligence Swarm | Diagnostic Attribution</p>
        </div>

        <div className="flex-1 p-8 flex flex-col border-l border-slate-800">
            <div className="mb-8">
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Top Differential</p>
                <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-bold text-white uppercase tracking-tight">{diagnosticData.top_diagnosis}</h3>
                    <span className={`text-2xl font-mono ${isLowConfidence ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {diagnosticData.confidence.toFixed(1)}%
                    </span>
                </div>
                <div className="w-full bg-slate-800 h-1 mt-4 rounded-full">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isLowConfidence ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${diagnosticData.confidence}%` }}
                    />
                </div>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-4">
                <div>
                   <h4 className="text-slate-400 text-[10px] uppercase tracking-widest mb-3 pb-1 border-b border-slate-800">Swarm Differential List</h4>
                   {diagnosticData.differential_diagnoses.map((d, i) => (
                       <div key={i} className="flex justify-between items-center mb-2 hover:bg-slate-800/50 p-2 rounded transition-colors">
                           <span className="text-slate-300 text-sm font-semibold">{d.name}</span>
                           <span className="text-slate-500 font-mono text-sm">{(d.prob * 100).toFixed(1)}%</span>
                       </div>
                   ))}
                </div>

                <div>
                   <h4 className="text-slate-400 text-[10px] uppercase tracking-widest mb-3 pb-1 border-b border-slate-800">SHAP Driving Signals</h4>
                   <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700 italic text-slate-400 text-xs leading-relaxed">
                       {diagnosticData.driving_signals}
                   </div>
                </div>
            </div>

            <div className="mt-8 flex gap-3">
                <button 
                  disabled={loading}
                  onClick={() => handleAction('ACCEPT')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Accept
                </button>
                <button 
                  disabled={loading}
                  onClick={() => handleAction('MODIFY')}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Edit3 size={18} />} Modify
                </button>
                <button 
                  disabled={loading}
                  onClick={() => handleAction('REJECT')}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />} Reject
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticView;

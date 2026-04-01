import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, XCircle, Edit3, Loader2, Info, LayoutTemplate, ScanSearch, Microscope } from 'lucide-react';

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
        
        // Premium GradCAM overlay with a glowing gradient (clinical amber/indigo)
        const gradient = ctx.createRadialGradient(
            canvas.width * 0.4, canvas.height * 0.5, 20,
            canvas.width * 0.45, canvas.height * 0.55, 140
        );
        gradient.addColorStop(0, 'rgba(14, 165, 233, 0.4)'); // Deep Indigo Core
        gradient.addColorStop(0.4, 'rgba(56, 189, 248, 0.2)'); // Mid Blue
        gradient.addColorStop(1, 'rgba(224, 242, 254, 0)'); // Soft Edge
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Scan line effect
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.1)';
        ctx.setLineDash([5, 10]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * 0.5);
        ctx.lineTo(canvas.width, canvas.height * 0.5);
        ctx.stroke();
    };
  }, [diagnosticData]);

  const handleAction = async (action) => {
    setLoading(true);
    await onAuditAction(action);
    setLoading(false);
  };

  if (!diagnosticData) return (
      <div className="bg-white border border-slate-200 p-20 rounded-3xl shadow-premium h-full flex flex-col items-center justify-center text-slate-400">
          <div className="bg-medical-50 p-6 rounded-3xl animate-bounce mb-6">
            <Microscope className="text-medical-600" size={48} />
          </div>
          <p className="text-lg font-bold text-slate-700 tracking-tight">Accessing Global Clinical Vault...</p>
          <p className="text-xs mt-2 uppercase tracking-[0.2em] font-medium">Federated Query in Progress</p>
      </div>
  );

  const isLowConfidence = diagnosticData.confidence < 82;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-premium h-full flex flex-col overflow-hidden hover:shadow-premium-hover transition-all duration-500">
      <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
        <div className="flex items-center gap-4">
            <div className="bg-medical-50 p-3 rounded-2xl border border-medical-100">
                <ShieldCheck className="text-medical-600" size={24} />
            </div>
            <div>
                <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                    Physician Swarm Audit Interface
                </h2>
                <p className="text-slate-400 text-xs mt-0.5 font-medium uppercase tracking-widest">Global Sample ID: GMIS-CXR-{Math.floor(Math.random()*9000)+1000}</p>
            </div>
        </div>
        {isLowConfidence && (
            <div className="bg-amber-50 border border-amber-100 text-amber-600 text-[11px] px-4 py-2 rounded-2xl flex items-center gap-3 uppercase font-bold animate-pulse-slow">
                <AlertCircle size={16} /> Confidence Divergence — Mandatory Review
            </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 p-10 flex flex-col items-center justify-center bg-slate-50 relative">
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
            <div className="relative group rounded-3xl overflow-hidden border-2 border-white shadow-premium-hover ring-8 ring-slate-100/50">
                <canvas 
                    ref={canvasRef} 
                    width={400} 
                    height={400} 
                    className="max-w-full h-auto cursor-zoom-in"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-[10px] text-medical-700 px-3 py-1.5 rounded-full border border-medical-100 uppercase tracking-widest font-black shadow-sm">
                    GradCAM Diagnostic Overlay: ACTIVE
                </div>
            </div>
            <div className="mt-8 flex items-center gap-3 bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
                <ScanSearch size={18} className="text-medical-600" />
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.1em]">Verified by GMIS Swarm Consensus</p>
            </div>
        </div>

        <div className="flex-1 p-10 flex flex-col border-l border-slate-50 bg-white">
            <div className="mb-10">
                <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black mb-2">Differential Assessment</p>
                <div className="flex items-end justify-between">
                    <div>
                        <h3 className="text-4xl font-display font-black text-slate-900 tracking-tight uppercase">{diagnosticData.top_diagnosis}</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider">Validated Site {Math.floor(Math.random()*5)+1}</span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                            <span className="text-[10px] font-medium text-slate-400">Last Synced: Just now</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`text-3xl font-display font-black tabular-nums ${isLowConfidence ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {diagnosticData.confidence.toFixed(1)}%
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Swarm Probability</p>
                    </div>
                </div>
                <div className="w-full bg-slate-100 h-2 mt-6 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-1500 ${isLowConfidence ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${diagnosticData.confidence}%` }}
                    />
                </div>
            </div>

            <div className="space-y-8 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <div>
                   <h4 className="text-slate-900 text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b border-slate-50 flex items-center justify-between">
                       <span>Swarm Distribution Differential</span>
                       <LayoutTemplate size={14} className="text-slate-300" />
                   </h4>
                   <div className="space-y-3">
                       {diagnosticData.differential_diagnoses.map((d, i) => (
                           <div key={i} className="flex justify-between items-center group hover:bg-slate-50 p-3 rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-100">
                               <span className="text-slate-700 text-sm font-semibold">{d.name}</span>
                               <div className="flex items-center gap-4">
                                   <div className="w-24 bg-slate-100 h-1 rounded-full overflow-hidden opacity-40 group-hover:opacity-100 transition-opacity">
                                       <div className="bg-medical-500 h-full" style={{ width: `${d.prob * 100}%` }} />
                                   </div>
                                   <span className="text-slate-500 font-bold tabular-nums text-xs">{(d.prob * 100).toFixed(1)}%</span>
                               </div>
                           </div>
                       ))}
                   </div>
                </div>

                <div className="bg-medical-50/50 p-6 rounded-3xl border border-medical-100 shadow-sm">
                   <h4 className="text-medical-900 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Info size={14} className="text-medical-600" /> Swarm Attention Signals (SHAP)
                   </h4>
                   <p className="italic text-medical-900/70 text-xs leading-relaxed font-medium bg-white/60 p-4 rounded-2xl border border-medical-100">
                       "{diagnosticData.driving_signals}"
                   </p>
                </div>
            </div>

            <div className="mt-10 flex gap-4">
                <button 
                  disabled={loading}
                  onClick={() => handleAction('ACCEPT')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all duration-300 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />} 
                    <span className="uppercase tracking-widest text-xs">Validate Result</span>
                </button>
                <button 
                  disabled={loading}
                  onClick={() => handleAction('MODIFY')}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all duration-300 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Edit3 size={20} />} 
                    <span className="uppercase tracking-widest text-xs">Clinical Modification</span>
                </button>
                <button 
                  disabled={loading}
                  onClick={() => handleAction('REJECT')}
                  className="flex-[0.5] border-2 border-rose-100 hover:bg-rose-50 text-rose-600 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all duration-300 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <XCircle size={20} />} 
                    <span className="uppercase tracking-widest text-xs">Discard</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticView;

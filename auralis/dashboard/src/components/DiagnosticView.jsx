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
    <div className="bg-white border border-slate-200 rounded-2xl lg:rounded-3xl shadow-premium h-full flex flex-col overflow-hidden hover:shadow-premium-hover transition-all duration-500 pb-24 lg:pb-0">
      <div className="p-4 lg:p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/20">
        <div className="flex items-center gap-4">
            <div className="bg-medical-50 p-2 lg:p-3 rounded-xl lg:rounded-2xl border border-medical-100">
                <ShieldCheck className="text-medical-600" size={24} />
            </div>
            <div>
                <h2 className="text-lg lg:text-xl font-display font-bold text-slate-900">
                    Swarm Audit Interface
                </h2>
                <p className="text-slate-400 text-[10px] mt-0.5 font-medium uppercase tracking-widest truncate">Sample ID: GMIS-CXR-{Math.floor(Math.random()*9000)+1000}</p>
            </div>
        </div>
        {isLowConfidence && (
            <div className="bg-amber-50 border border-amber-100 text-amber-600 text-[9px] lg:text-[11px] px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl lg:rounded-2xl flex items-center gap-2 lg:gap-3 uppercase font-bold animate-pulse-slow">
                <AlertCircle size={14} /> Confidence Divergence
            </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-visible lg:overflow-hidden">
        <div className="w-full lg:w-1/2 p-4 lg:p-10 flex flex-col items-center justify-center bg-slate-50 relative min-h-[300px] lg:min-h-0">
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
            <div className="relative group rounded-3xl overflow-hidden border-2 border-white shadow-premium-hover ring-4 lg:ring-8 ring-slate-100/50">
                <canvas 
                    ref={canvasRef} 
                    width={400} 
                    height={400} 
                    className="w-full max-w-[300px] lg:max-w-full h-auto cursor-zoom-in"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-[8px] lg:text-[10px] text-medical-700 px-3 py-1.5 rounded-full border border-medical-100 uppercase tracking-widest font-black shadow-sm">
                    GradCAM: ACTIVE
                </div>
            </div>
        </div>

        <div className="flex-1 p-6 lg:p-10 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-50 bg-white">
            <div className="mb-8 lg:mb-10">
                <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black mb-2">Assessment</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                    <div>
                        <h3 className="text-2xl lg:text-4xl font-display font-black text-slate-900 tracking-tight uppercase truncate">{diagnosticData.top_diagnosis}</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] lg:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 lg:px-2.5 py-1 rounded-md uppercase tracking-wider">Validated Site</span>
                        </div>
                    </div>
                </div>
                <div className="w-full bg-slate-100 h-2 mt-6 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-1500 ${isLowConfidence ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${diagnosticData.confidence}%` }}
                    />
                </div>
            </div>

            <div className="space-y-6 lg:space-y-8 flex-1 overflow-y-visible lg:overflow-y-auto pr-0 lg:pr-4 custom-scrollbar lg:max-h-[400px]">
                <div>
                   <h4 className="text-slate-900 text-[10px] lg:text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b border-slate-50 flex items-center justify-between">
                       <span>Swarm Differential</span>
                   </h4>
                   <div className="space-y-3">
                       {diagnosticData.differential_diagnoses.map((d, i) => (
                           <div key={i} className="flex justify-between items-center group hover:bg-slate-50 p-2 lg:p-3 rounded-xl lg:rounded-2xl transition-all duration-300">
                               <span className="text-slate-700 text-xs lg:text-sm font-semibold">{d.name}</span>
                               <span className="text-slate-500 font-bold tabular-nums text-[10px] lg:text-xs">{(d.prob * 100).toFixed(1)}%</span>
                           </div>
                       ))}
                   </div>
                </div>

                <div className="bg-medical-50/50 p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-medical-100">
                   <h4 className="text-medical-900 text-[10px] lg:text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Info size={14} className="text-medical-600" /> Attention Signals
                   </h4>
                   <p className="italic text-medical-900/70 text-[10px] lg:text-xs leading-relaxed font-medium">
                       "{diagnosticData.driving_signals}"
                   </p>
                </div>
            </div>

            <div className="mt-8 lg:mt-10 flex flex-col sm:flex-row gap-3 lg:gap-4">
                <button 
                  disabled={loading}
                  onClick={() => handleAction('ACCEPT')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl lg:rounded-2xl flex items-center justify-center gap-3 font-bold transition-all duration-300 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} 
                    <span className="uppercase tracking-widest text-[10px] lg:text-xs">Validate</span>
                </button>
                <button 
                  disabled={loading}
                  onClick={() => handleAction('MODIFY')}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-xl lg:rounded-2xl flex items-center justify-center gap-3 font-bold transition-all duration-300 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Edit3 size={18} />} 
                    <span className="uppercase tracking-widest text-[10px] lg:text-xs">Modify</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticView;

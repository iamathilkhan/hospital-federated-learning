import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Globe, Activity, FileText, AlertCircle, Signal, Terminal, FlaskConical, ShieldAlert } from 'lucide-react';
import WorldMap from './components/WorldMap';
import LeaderElection from './components/LeaderElection';
import DriftMonitor from './components/DriftMonitor';
import TrainingGraph from './components/TrainingGraph';
import DiagnosticView from './components/DiagnosticView';

const API_BASE = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws/events";

function App() {
  const [activeTab, setActiveTab] = useState('world-map');
  const [systemHealth, setSystemHealth] = useState('healthy');
  const [nodes, setNodes] = useState([]);
  const [leader, setLeader] = useState(null);
  const [round, setRound] = useState(0);
  const [accuracyHistory, setAccuracyHistory] = useState([]);
  const [driftHistory, setDriftHistory] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [electionEvents, setElectionEvents] = useState([]);
  const [diagnosticSample, setDiagnosticSample] = useState(null);
  const [recentElection, setRecentElection] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const ws = useRef(null);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nodesRes, statusRes, accRes, diagRes] = await Promise.all([
          fetch(`${API_BASE}/nodes`),
          fetch(`${API_BASE}/status`),
          fetch(`${API_BASE}/accuracy`),
          fetch(`${API_BASE}/diagnosis/sample`)
        ]);
        
        const nodesData = await nodesRes.json();
        const statusData = await statusRes.json();
        const accData = await accRes.json();
        const diagData = await diagRes.json();

        setNodes(nodesData);
        setLeader(statusData.raft_leader);
        setRound(statusData.current_round);
        setAccuracyHistory(accData.map(a => ({ ...a, baseline: 71 })));
        setDiagnosticSample(diagData);
      } catch (err) {
        console.error("Failed to fetch initial state:", err);
      }
    };
    fetchData();
  }, []);

  // WebSocket Connection
  useEffect(() => {
    const connect = () => {
        ws.current = new WebSocket(WS_URL);
        ws.current.onopen = () => {
            setConnected(true);
            console.log("WebSocket Connected");
        };
        ws.current.onclose = () => {
            setConnected(false);
            console.log("WebSocket Disconnected, retrying...");
            setTimeout(connect, 3000);
        };
        ws.current.onmessage = (event) => {
            const payload = JSON.parse(event.data);
            handleWsEvent(payload);
        };
    };
    connect();
    return () => ws.current?.close();
  }, []);

  const handleWsEvent = (payload) => {
    const { type, data } = payload;
    const time = new Date().toLocaleTimeString();

    switch (type) {
      case 'round_complete':
        setRound(r => r + 1);
        setAccuracyHistory(prev => [...prev, { round: data.round, accuracy: data.accuracy, baseline: 71 }]);
        break;
      case 'DRIFT_ALERT':
        setActiveAlerts(prev => [data, ...prev]);
        setSystemHealth('warning');
        break;
      case 'BYZANTINE_QUARANTINE':
        setElectionEvents(prev => [{ time, type, message: `Node ${data.node_id} QUARANTINED (norm: ${data.norm.toFixed(2)})` }, ...prev.slice(0, 4)]);
        break;
      case 'leader_failover':
        setRecentElection(true);
        setElectionEvents(prev => [{ time, type, message: `Leader failure detected. Triggering election term ${data.term}` }, ...prev.slice(0, 4)]);
        setTimeout(() => setRecentElection(false), 3000);
        break;
      case 'new_leader':
        setLeader(data.leader);
        setElectionEvents(prev => [{ time, type, message: `Consensus reached: ${data.leader} is new leader.` }, ...prev.slice(0, 4)]);
        break;
      default:
        console.log("Unhandled event:", type, data);
    }
  };

  const handleAuditAction = async (action) => {
    try {
        await fetch(`${API_BASE}/audit/log`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action, timestamp: new Date().toISOString() })
        });
    } catch (err) {
        console.error("Audit log failed:", err);
    }
  };

  const tabs = [
    { id: 'world-map', label: 'Global Swarm', icon: <Globe size={18} /> },
    { id: 'training', label: 'Swarm Learning', icon: <Activity size={18} /> },
    { id: 'drift', label: 'Clinical Drift', icon: <AlertCircle size={18} /> },
    { id: 'diagnosis', label: 'Diagnostic Audit', icon: <FileText size={18} /> },
    { id: 'election', label: 'Consensus Health', icon: <Terminal size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-medical-100 selection:text-medical-900">
      {/* Top Status Bar */}
      <header className="h-20 border-b border-slate-200 bg-white/70 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-5">
            <div className="bg-medical-600 p-2.5 rounded-2xl shadow-lg shadow-medical-600/20">
                <FlaskConical className="text-white" size={26} />
            </div>
            <div>
                <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  GMIS <span className="text-slate-400 font-light">Global Swarm Intelligence</span>
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        {connected ? 'Federated Nexus Active' : 'Nexus Synchronizing...'}
                    </span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-10">
            <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Network Status</p>
                <div className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase border transition-all ${systemHealth === 'healthy' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                    {systemHealth === 'healthy' ? 'System Optimized' : 'Attention Required'}
                </div>
            </div>
            <div className="w-px h-10 bg-slate-100" />
            <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Learning Round</p>
                <p className="text-2xl font-display font-extrabold text-medical-600 tabular-nums">#{round}</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Compute Nodes</p>
                <p className="text-2xl font-display font-extrabold text-slate-900 tabular-nums">05/05</p>
            </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <nav className="w-72 border-r border-slate-200 bg-white p-6 space-y-3">
            <div className="px-4 py-2 border-b border-slate-50 mb-4">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Navigation Portfolio</span>
            </div>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 ${activeTab === tab.id ? 'bg-medical-50 text-medical-700 shadow-sm border border-medical-100/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                    <div className={`${activeTab === tab.id ? 'text-medical-600' : 'text-slate-400 group-hover:text-slate-600'}`}>{tab.icon}</div>
                    {tab.label}
                </button>
            ))}
            
            <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-8 self-end">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Hospital Authority</p>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-medical-200 flex items-center justify-center text-medical-700 font-bold text-xs">AD</div>
                    <div>
                        <p className="text-xs font-bold text-slate-800 leading-none">Admin Terminal</p>
                        <p className="text-[10px] text-slate-500">Clearance: LVL 4</p>
                    </div>
                </div>
            </div>
        </nav>

        {/* Content Area */}
        <main className="flex-1 p-10 overflow-y-auto bg-slate-25 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]">
            <div className="max-w-7xl mx-auto h-full">
              {activeTab === 'world-map' && <WorldMap nodes={nodes} leader={leader} recentElection={recentElection} />}
              {activeTab === 'training' && <TrainingGraph trainingData={accuracyHistory} />}
              {activeTab === 'drift' && <DriftMonitor driftData={accuracyHistory} activeAlerts={activeAlerts} onDismissAlert={(i) => setActiveAlerts(a => a.filter((_, idx) => idx !== i))} />}
              {activeTab === 'diagnosis' && <DiagnosticView diagnosticData={diagnosticSample} onAuditAction={handleAuditAction} />}
              {activeTab === 'election' && <LeaderElection currentLeader={leader} term={12} lastElectionTime={45} electionEvents={electionEvents} roundInProgress={round} gradientsCollected={3} />}
            </div>
        </main>
      </div>

      <footer className="h-12 border-t border-slate-200 bg-white flex items-center justify-between px-8 text-[11px] text-slate-400 font-sans font-medium tracking-tight">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-medical-500 rounded-full animate-pulse" />
            GLOBAL MEDICAL INTELLIGENCE SWARM (GMIS) INFRASTRUCTURE • v1.0.4-LOCKED
          </div>
          <div className="flex items-center gap-8">
              <span className="flex items-center gap-1.5"><Signal size={12} className="text-emerald-500" /> Latency: 18ms (Stabilized)</span>
              <span>Ref-Time: {new Date().toLocaleTimeString()} (UTC)</span>
          </div>
      </footer>
    </div>
  );
}

export default App;

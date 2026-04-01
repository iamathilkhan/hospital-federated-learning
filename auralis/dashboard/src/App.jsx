import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Globe, Activity, FileText, AlertCircle, Signal, Terminal } from 'lucide-react';
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
    { id: 'world-map', label: 'World Map', icon: <Globe size={18} /> },
    { id: 'training', label: 'Training Progress', icon: <Activity size={18} /> },
    { id: 'drift', label: 'Drift Monitor', icon: <AlertCircle size={18} /> },
    { id: 'diagnosis', label: 'Clinical Audit', icon: <FileText size={18} /> },
    { id: 'election', label: 'Leader Election', icon: <Terminal size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
      {/* Top Status Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <LayoutDashboard className="text-white" size={24} />
            </div>
            <div>
                <h1 className="text-lg font-bold text-white tracking-tight">AURALIS <span className="text-slate-500 font-light">| Swarm Dashboard</span></h1>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        {connected ? 'Real-time Nexus Connected' : 'Connection Interrupted'}
                    </span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-8">
            <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Global Health</p>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${systemHealth === 'healthy' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                    {systemHealth}
                </div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Active Round</p>
                <p className="text-xl font-mono font-bold text-white leading-none">{round}</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Nodes</p>
                <p className="text-xl font-mono font-bold text-white leading-none">5/5</p>
            </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <nav className="w-64 border-r border-slate-800 bg-slate-900/20 p-4 space-y-2">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </nav>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
            {activeTab === 'world-map' && <WorldMap nodes={nodes} leader={leader} recentElection={recentElection} />}
            {activeTab === 'training' && <TrainingGraph trainingData={accuracyHistory} />}
            {activeTab === 'drift' && <DriftMonitor driftData={accuracyHistory} activeAlerts={activeAlerts} onDismissAlert={(i) => setActiveAlerts(a => a.filter((_, idx) => idx !== i))} />}
            {activeTab === 'diagnosis' && <DiagnosticView diagnosticData={diagnosticSample} onAuditAction={handleAuditAction} />}
            {activeTab === 'election' && <LeaderElection currentLeader={leader} term={12} lastElectionTime={45} electionEvents={electionEvents} roundInProgress={round} gradientsCollected={3} />}
        </main>
      </div>

      <footer className="h-10 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between px-8 text-[10px] text-slate-600 font-mono">
          <div>GMIS INFRASTRUCTURE v1.0.4 r-alpha</div>
          <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Signal size={10} className="text-emerald-500" /> LATENCY: 24ms</span>
              <span>SYSTEM TIME: {new Date().toISOString()}</span>
          </div>
      </footer>
    </div>
  );
}

export default App;

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { ShieldCheck, Activity, Database, Globe, Signal, Crown } from 'lucide-react';

const hospitalNodes = [
  { id: 0, name: 'Chennai, India', pos: [13.08, 80.27], org: 'Apollo Medical' },
  { id: 1, name: 'Nairobi, Kenya', pos: [-1.29, 36.82], org: 'Kenyatta National' },
  { id: 2, name: 'São Paulo, Brazil', pos: [-23.55, -46.63], org: 'Hospital das Clínicas' },
  { id: 3, name: 'Oslo, Norway', pos: [59.91, 10.75], org: 'Oslo University Hospital' },
  { id: 4, name: 'Chicago, USA', pos: [41.88, -87.63], org: 'Northwestern Memorial' },
];

const WorldMap = ({ nodes, leader, recentElection }) => {
  const getMarkerColor = (drift) => {
    if (drift < 0.1) return '#10b981'; // emerald-500
    if (drift <= 0.15) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="bg-white p-1 rounded-3xl shadow-premium border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Globe className="text-medical-600" size={24} /> Global Swarm Topography
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time geospatial distribution of federated compute nodes</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100 italic text-[10px] text-slate-500">
            <ShieldCheck size={12} className="text-emerald-500" /> AES-256 Encrypted Tunnels
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative min-h-[500px]">
        <MapContainer center={[20, 0]} zoom={2.5} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {hospitalNodes.map((h) => {
            const nodeData = nodes.find(n => n.id === `node_${h.id}`) || { drift_score: 0.05, uptime: 99.9, contribution_score: 1.0 };
            const isLeader = leader === `localhost:${4321 + h.id}`;
            
            return (
              <React.Fragment key={h.id}>
                <CircleMarker 
                  center={h.pos} 
                  pathOptions={{ 
                      color: getMarkerColor(nodeData.drift_score),
                      fillColor: getMarkerColor(nodeData.drift_score),
                      fillOpacity: 0.8,
                      weight: 2
                  }}
                  radius={isLeader ? 12 : 9}
                >
                  <Popup className="custom-popup">
                    <div className="p-1 min-w-[200px] font-sans">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-none">{h.name}</h3>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">{h.org}</p>
                        </div>
                        {isLeader && <div className="bg-amber-100 text-amber-700 p-1.5 rounded-lg shadow-sm"><Crown size={14} /></div>}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 flex items-center gap-1"><Activity size={10} /> Drift Score</span>
                          <span className={`font-bold ${nodeData.drift_score > 0.15 ? 'text-rose-600' : 'text-slate-900'}`}>{nodeData.drift_score.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 flex items-center gap-1"><Signal size={10} /> System Uptime</span>
                          <span className="font-bold text-slate-900">{nodeData.uptime}%</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500 flex items-center gap-1"><Database size={10} /> Contribution</span>
                          <span className="font-bold text-slate-900">{nodeData.contribution_score.toFixed(3)}</span>
                        </div>
                      </div>
                      
                      {isLeader && (
                        <div className="mt-3 pt-2 border-t border-slate-50 text-center">
                          <span className="text-[9px] font-black uppercase text-amber-600 tracking-widest bg-amber-50 px-2 py-0.5 rounded-full">Active Consensus Leader</span>
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
                
                {isLeader && (
                  <Marker 
                      position={[h.pos[0] + 1, h.pos[1]]} 
                      icon={L.divIcon({ 
                          html: '<div class="animate-bounce text-amber-500 bg-white p-1 rounded-full shadow-md border border-amber-200" style="display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg></div>', 
                          className: 'leader-icon',
                          iconSize: [24, 24]
                      })} 
                  />
                )}

                {recentElection && (
                  <CircleMarker 
                      center={h.pos} 
                      radius={24} 
                      pathOptions={{ color: '#f59e0b', weight: 1, fillOpacity: 0 }} 
                      className="animate-pulse-ring"
                  />
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default WorldMap;

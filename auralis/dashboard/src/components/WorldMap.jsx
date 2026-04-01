import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';

const hospitalNodes = [
  { id: 0, name: 'Chennai, India', pos: [13.08, 80.27] },
  { id: 1, name: 'Nairobi, Kenya', pos: [-1.29, 36.82] },
  { id: 2, name: 'São Paulo, Brazil', pos: [-23.55, -46.63] },
  { id: 3, name: 'Oslo, Norway', pos: [59.91, 10.75] },
  { id: 4, name: 'Chicago, USA', pos: [41.88, -87.63] },
];

const WorldMap = ({ nodes, leader, recentElection }) => {
  const getMarkerColor = (drift) => {
    if (drift < 0.1) return '#22c55e'; // green
    if (drift <= 0.15) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
      <h2 className="text-xl font-bold mb-4 text-white">Global Swarm Infrastructure</h2>
      <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={false} className="rounded-lg border-2 border-slate-600">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
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
                    fillOpacity: 1,
                    weight: 2
                }}
                radius={8}
              >
                <Popup>
                  <div className="text-slate-900 font-sans">
                    <h3 className="font-bold text-lg border-b mb-1">{h.name}</h3>
                    <p><b>Drift Score:</b> {nodeData.drift_score.toFixed(4)}</p>
                    <p><b>Uptime:</b> {nodeData.uptime}%</p>
                    <p><b>Contribution:</b> {nodeData.contribution_score.toFixed(3)}</p>
                    {isLeader && <p className="text-amber-600 font-bold">👑 Swarm Leader</p>}
                  </div>
                </Popup>
              </CircleMarker>
              
              {isLeader && (
                <Marker 
                    position={[h.pos[0] + 2, h.pos[1]]} 
                    icon={L.divIcon({ 
                        html: '<div style="font-size: 24px;">👑</div>', 
                        className: 'leader-icon' 
                    })} 
                />
              )}

              {recentElection && (
                <CircleMarker 
                    center={h.pos} 
                    radius={20} 
                    pathOptions={{ color: '#eab308', fillOpacity: 0 }} 
                    className="animate-pulse-ring"
                />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default WorldMap;

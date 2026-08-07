import { useState, useEffect } from "react";
import { 
  Ship, 
  Layers, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  Hourglass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Hub {
  code: string;
  name: string;
  balance: number;
  status: string;
  occupancy: number;
  trend: string;
}

interface Voyage {
  id: string;
  vessel: string;
  origin: string;
  destination: string;
  qty: number;
  costAvoided: number;
  co2Saved: number;
  status: string;
  smartStowSynced: boolean;
  housekeepingEfficiency: number;
  smartCraneDirectives: string[];
}

interface PreStagedItem {
  containerId: string;
  size: string;
  currentSlot: string;
  targetStagingSlot: string;
  status: string;
  doubleHandlingAvoided: string;
}

interface EmptyRedistributionProps {
  onStatsUpdate: (updatedStats: any) => void;
}

export default function EmptyRedistribution({ onStatsUpdate }: EmptyRedistributionProps) {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [preStagingQueue, setPreStagingQueue] = useState<PreStagedItem[]>([]);
  const [selectedVoyageId, setSelectedVoyageId] = useState<string>("VOY-MSK-EV-01");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStep, setSyncStep] = useState<string>("");
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");

  const syncSequence = [
    "Maersk Equipment ML forecasting local trade deficit...",
    "CARGOES Smart Housekeeping activating spatial ML algorithm...",
    "Mapping terminal empty-stack density matrices...",
    "EDI transmission initiated: Evacuation container list pushed to CARGOES TOS+...",
    "Smart Stow module dynamically activating yard-crane work queues...",
    "Pre-staging empty boxes at the yard gate prioritized for vessel arrival time..."
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/empty-redistribution/data");
      const data = await response.json();
      if (data.status === "ok") {
        setHubs(data.hubs);
        setVoyages(data.voyages);
        setPreStagingQueue(data.preStagingQueue);
      }
    } catch (error) {
      console.error("Error fetching empty container redistribution data:", error);
    }
  };

  const selectedVoyage = voyages.find(v => v.id === selectedVoyageId);

  const handlePushEvacuation = async () => {
    if (!selectedVoyageId) return;
    setIsSyncing(true);
    setSyncLogs([]);
    
    // Cycle through real-time sync steps
    let stepIdx = 0;
    setSyncStep(syncSequence[0]);
    setSyncLogs(prev => [...prev, syncSequence[0]]);

    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < syncSequence.length) {
        setSyncStep(syncSequence[stepIdx]);
        setSyncLogs(prev => [...prev, syncSequence[stepIdx]]);
      }
    }, 1100);

    try {
      const response = await fetch("/api/empty-redistribution/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voyageId: selectedVoyageId })
      });
      const result = await response.json();
      clearInterval(interval);

      if (result.status === "ok") {
        setVoyages(prev => prev.map(v => v.id === selectedVoyageId ? result.voyage : v));
        setPreStagingQueue(result.preStagingQueue);
        onStatsUpdate(result.updatedStats);
        
        const successLog = `✓ Sync Successful: Empty container evacuation lists active on ${result.voyage.vessel}.`;
        setSyncLogs(prev => [...prev, successLog]);
        setMessage(`Successfully pushed evacuation list for ${result.voyage.vessel} to DP World CARGOES!`);
        setTimeout(() => setMessage(""), 5000);
      } else {
        setSyncLogs(prev => [...prev, `✗ Error: ${result.error || "Failed to push empty list."}`]);
      }
    } catch (error: any) {
      clearInterval(interval);
      console.error(error);
      setSyncLogs(prev => [...prev, `✗ Connection Error: ${error.message || "Failed to contact stowing server."}`]);
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculate cumulative stats from voyages
  const totalCostAvoided = voyages.reduce((sum, v) => v.smartStowSynced ? sum + v.costAvoided : sum, 0);
  const totalCo2Saved = voyages.reduce((sum, v) => v.smartStowSynced ? sum + v.co2Saved : sum, 0);
  const activeSyncedCount = voyages.filter(v => v.smartStowSynced).length;

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER AND INTRODUCTION */}
      <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-200">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
          <Cpu className="h-4.5 w-4.5 mr-2 text-blue-600 animate-pulse" />
          Smart Empty Container Redistribution Center (Maersk Equipment ML × DP World ZMS)
        </h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Predicting where empty containers will be needed next based on global trade imbalances to eliminate costly <strong>"ghost voyages"</strong> (shipping empty boxes). 
          This screen operates as a backend optimization layer within the <strong>Maersk Logistics Hub (Equipment Management)</strong> combined with <strong>DP World’s CARGOES Zone Management System (ZMS)</strong> and <strong>Smart Housekeeping</strong> modules.
        </p>
      </div>

      {/* METRICS HEADER CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Ghost Voyages Avoided</p>
            <p className="text-xl font-black text-emerald-600 mt-1 font-mono">${totalCostAvoided.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Demurrage & repositioning cost saved</p>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">CO2 Emissions Prevented</p>
            <p className="text-xl font-black text-sky-600 mt-1 font-mono">{totalCo2Saved} Metric Tons</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Fuel burn saved from empty hauls</p>
          </div>
          <div className="bg-sky-50 p-2.5 rounded-lg border border-sky-100">
            <TrendingUp className="h-5 w-5 text-sky-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Double-Handling Avoided</p>
            <p className="text-xl font-black text-indigo-600 mt-1 font-mono">96.2%</p>
            <p className="text-[10px] text-slate-500 mt-0.5">CARGOES Smart Housekeeping score</p>
          </div>
          <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
            <Layers className="h-5 w-5 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Active Synced Voyages</p>
            <p className="text-xl font-black text-blue-600 mt-1 font-mono">{activeSyncedCount} of {voyages.length}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Terminal dispatch schedules locked</p>
          </div>
          <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
            <Ship className="h-5 w-5 text-blue-600" />
          </div>
        </div>

      </div>

      {/* CORE INTERACTIVE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: HUBS & PLANNED VOYAGES (3/5 width) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* GLOBAL EMPTY CONTAINER BALANCES */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="h-4.5 w-4.5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Global Empty Container Balances (Maersk Hub Forecasts)</h3>
              </div>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                Predictive Deficit Models
              </span>
            </div>

            <div className="p-4">
              <p className="text-xs text-slate-500 mb-3">
                Maersk's predictive ML models forecast empty container deficits across global markets up to 14 days in advance to pre-empt supply shortages.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase">
                      <th className="pb-2 font-semibold">Port Terminal (Hub)</th>
                      <th className="pb-2 font-semibold text-center">Equipment Status</th>
                      <th className="pb-2 font-semibold text-right">Equipment Balance</th>
                      <th className="pb-2 font-semibold text-right">Yard Occupancy</th>
                      <th className="pb-2 font-semibold text-right">Deficit Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans text-xs">
                    {hubs.map((hub) => (
                      <tr key={hub.code} className="hover:bg-slate-55/30 transition-colors">
                        <td className="py-2.5 font-medium text-slate-900">
                          <span className="bg-slate-100 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-200 mr-2">{hub.code}</span>
                          {hub.name.split(",")[0]}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            hub.status === "Deficit" 
                              ? "bg-rose-50 text-rose-700 border border-rose-200" 
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {hub.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-800">
                          {hub.balance > 0 ? `+${hub.balance.toLocaleString()}` : hub.balance.toLocaleString()} TEUs
                        </td>
                        <td className="py-2.5 text-right font-mono text-slate-600">
                          {hub.occupancy}%
                        </td>
                        <td className="py-2.5 text-right text-slate-500 font-mono text-[11px]">
                          {hub.trend}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PLANNED EVACUATIONS & SYNC ACTION */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Ship className="h-4.5 w-4.5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Maersk Equipment Empty Container Evacuations</h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                Ghost Voyage Mitigator
              </span>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-500">
                Pushes empty container evacuation lists to DP World's CARGOES TOS+ via EDI/API. The terminal’s Smart Stow module dynamically activates work queues to pre-stage boxes at yard gates matching vessel arrivals.
              </p>

              {/* Voyage Selector Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {voyages.map((voy) => {
                  const isSelected = selectedVoyageId === voy.id;
                  return (
                    <button
                      key={voy.id}
                      onClick={() => !isSyncing && setSelectedVoyageId(voy.id)}
                      disabled={isSyncing}
                      className={`text-left p-3 rounded-lg border transition-all relative ${
                        isSelected 
                          ? "border-blue-600 bg-blue-50/20 shadow-md" 
                          : "border-slate-200 hover:border-slate-350 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {voy.id}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                          voy.smartStowSynced 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {voy.smartStowSynced ? "Synced" : "Pending"}
                        </span>
                      </div>
                      
                      <p className="font-bold text-xs text-slate-900 mt-2 truncate">{voy.vessel}</p>
                      
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-600 mt-1 font-mono">
                        <span>{voy.origin}</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span>{voy.destination}</span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                        <span>Qty: {voy.qty} TEUs</span>
                        <span className="font-bold text-emerald-600">${voy.costAvoided.toLocaleString()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* INTEGRATIVE DESCRIPTOR & ACTION DIRECTIVES */}
              {selectedVoyage && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-950 text-xs">
                        Integration Action: {selectedVoyage.vessel} ({selectedVoyage.id})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Rerouting {selectedVoyage.qty} Empty Container Units to avoid ghost voyage from {selectedVoyage.origin} to {selectedVoyage.destination}.
                      </p>
                    </div>

                    <button
                      disabled={isSyncing || selectedVoyage.smartStowSynced}
                      onClick={handlePushEvacuation}
                      className={`font-bold text-xs px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 shadow transition-all ${
                        selectedVoyage.smartStowSynced
                          ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-default"
                          : isSyncing 
                          ? "bg-blue-100 text-blue-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                      }`}
                    >
                      {isSyncing ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-400" />
                          <span>Syncing Stowage...</span>
                        </>
                      ) : selectedVoyage.smartStowSynced ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Pushed to CARGOES TOS+</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Push Evacuation List via EDI/API</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* STEP-BY-STEP LIVE SYNC TICKER */}
                  {isSyncing && (
                    <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 text-xs space-y-2">
                      <div className="flex items-center space-x-2 font-bold text-blue-900 uppercase text-[10px]">
                        <Hourglass className="h-3 w-3 animate-spin text-blue-600" />
                        <span>Real-Time Integration Log:</span>
                      </div>
                      <p className="text-[11px] text-slate-700 font-mono animate-pulse">
                        {syncStep}
                      </p>
                      <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full animate-progress duration-7000"></div>
                      </div>
                    </div>
                  )}

                  {/* DISPLAY AI DIRECTIVES ONCE SYNCED */}
                  {selectedVoyage.smartStowSynced && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="text-[10px] font-mono font-bold text-indigo-700 uppercase tracking-wider flex items-center">
                        <Cpu className="h-3.5 w-3.5 mr-1.5" />
                        CARGOES TOS+ (ZODIAC) Smart Stow Dispatch Directives:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        {selectedVoyage.smartCraneDirectives.map((directive, idx) => (
                          <div key={idx} className="bg-indigo-50 border border-indigo-150 p-2.5 rounded-md text-slate-700 flex items-start space-x-2">
                            <span className="text-indigo-600 font-black mt-0.5 font-mono">0{idx + 1}</span>
                            <span className="font-sans leading-relaxed">{directive}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CARGOES YARD PRE-STAGING MONITOR (2/5 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="h-4.5 w-4.5 text-indigo-650" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">CARGOES Smart Housekeeping Pre-Staging Monitor</h3>
              </div>
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                Spatial ML Yard Block
              </span>
            </div>

            <div className="p-4 flex-1 flex flex-col space-y-4">
              <p className="text-xs text-slate-500">
                CARGOES Smart Housekeeping uses spatial ML algorithms to arrange empty vs. full containers inside the yard to avoid double-handling, pre-staging empty boxes at the yard gate to align with Maersk’s vessel arrival times.
              </p>

              {message && (
                <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-2.5 rounded text-xs flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {/* PRE-STAGING ACTIVE QUEUE */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[420px] pr-1">
                {preStagingQueue.map((item, idx) => (
                  <div 
                    key={item.containerId} 
                    className="border border-slate-200 hover:border-slate-300 p-3 rounded-lg bg-slate-50/50 flex flex-col space-y-1.5 transition-all text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 font-mono text-[11px] flex items-center">
                        <Layers className="h-3.5 w-3.5 text-blue-600 mr-1.5" />
                        {item.containerId}
                      </span>
                      <span className="text-[9px] font-mono uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 rounded font-black">
                        {item.size}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-600 mt-1">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Current Yard Slot</span>
                        <span className="font-bold text-slate-800">{item.currentSlot}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase">Staging Gate / Crane Slot</span>
                        <span className="font-bold text-blue-600">{item.targetStagingSlot}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                      <span className="text-emerald-700 font-bold flex items-center bg-emerald-50/50 border border-emerald-200/55 px-1.5 py-0.5 rounded font-mono text-[9.5px]">
                        ✓ Double-Handling Prevented
                      </span>
                      <span className="text-slate-400 font-mono font-medium text-[9px] uppercase tracking-wider">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* OPERATOR STATS SYNC STAMP */}
              <div className="bg-amber-50/40 border border-amber-200 rounded-lg p-3 text-[11px] text-slate-700">
                <div className="font-bold text-slate-900 uppercase text-[9px] tracking-wider mb-1 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" />
                  Terminal Gate Synchronicity:
                </div>
                Priority empty container allocations are synced with local AGV shuttles. When the Maersk vessel enters the terminal bounds, stowed boxes are loaded instantly.
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

import { useState, useEffect } from "react";
import { 
  Thermometer, 
  Wind, 
  Database, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldAlert, 
  ArrowRight, 
  Server,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Reefer {
  id: string;
  cargoName: string;
  vessel: string;
  destinationPort: string;
  tempTarget: number;
  tempCurrent: number;
  humidity: number;
  co2: number;
  status: string;
  anomalyDesc: string;
  cargoValue: number;
  fastTrackStatus: string;
  selectedFmsSlot: string;
  isFastTracked: boolean;
  aiMitigationPlan: string;
}

interface ColdChainVisibilityProps {
  onStatsUpdate: (updatedStats: any) => void;
}

export default function ColdChainVisibility({ onStatsUpdate }: ColdChainVisibilityProps) {
  const [reefers, setReefers] = useState<Reefer[]>([]);
  const [selectedReeferId, setSelectedReeferId] = useState<string>("MSK-RF-4091");
  const [totalMonitored, setTotalMonitored] = useState<number>(2154800);
  const [rowsCount, setRowsCount] = useState<string>("1.4 Billion/Day");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<string>("");
  const [processLogs, setProcessLogs] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");

  const fastTrackSteps = [
    "Maersk Captain Peter™ edge model detects cooling failure...",
    "Telemetry alert dispatched: Ingesting to Qlik analytics real-time dashboard...",
    "Agentic AI triggers high-priority API handoff to DP World CARGOES TOS+...",
    "DP World CARGOES Smart Yard Crane Scheduler overrides ARMG crane work queue...",
    "Rerouting crane path: prioritizing bay area discharge...",
    "Securing emergency yard ground slot BANK-R3-SLOT-08 with high-output power link."
  ];

  useEffect(() => {
    fetchReefers();
  }, []);

  const fetchReefers = async () => {
    try {
      const response = await fetch("/api/cold-chain/reefers");
      const data = await response.json();
      if (data.status === "ok") {
        setReefers(data.reefers);
        setTotalMonitored(data.totalMonitoredContainers);
        setRowsCount(data.ingestedRowsCount);
      }
    } catch (error) {
      console.error("Error fetching cold chain reefers:", error);
    }
  };

  const selectedReefer = reefers.find(r => r.id === selectedReeferId);

  const handleFastTrack = async () => {
    if (!selectedReeferId) return;
    setIsProcessing(true);
    setProcessLogs([]);

    let stepIdx = 0;
    setActiveStep(fastTrackSteps[0]);
    setProcessLogs(prev => [...prev, fastTrackSteps[0]]);

    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < fastTrackSteps.length) {
        setActiveStep(fastTrackSteps[stepIdx]);
        setProcessLogs(prev => [...prev, fastTrackSteps[stepIdx]]);
      }
    }, 1100);

    try {
      const response = await fetch("/api/cold-chain/trigger-fasttrack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reeferId: selectedReeferId })
      });
      const result = await response.json();
      clearInterval(interval);

      if (result.status === "ok") {
        setReefers(prev => prev.map(r => r.id === selectedReeferId ? result.reefer : r));
        onStatsUpdate(result.updatedStats);
        
        const finishLog = `✓ Emergency complete: Fast-track routing verified. Saved $${result.reefer.cargoValue.toLocaleString()} in fresh cargo.`;
        setProcessLogs(prev => [...prev, finishLog]);
        setMessage(`Emergency bypass confirmed! ${result.reefer.id} prioritized for immediate crane offload.`);
        setTimeout(() => setMessage(""), 6000);
      } else {
        setProcessLogs(prev => [...prev, `✗ AI Override Failed: ${result.error || "TOS Rejected Priority"}`]);
      }
    } catch (error: any) {
      clearInterval(interval);
      console.error(error);
      setProcessLogs(prev => [...prev, `✗ Link Failure: ${error.message || "TOS+ network timeout"}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalValueSaved = reefers.reduce((sum, r) => r.isFastTracked ? sum + r.cargoValue : sum, 0);
  const endangeredCount = reefers.filter(r => r.status === "Imminent Failure" || r.status === "Warning").length;

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER AND INTRODUCTION */}
      <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-200">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
          <Thermometer className="h-4.5 w-4.5 mr-2 text-rose-600 animate-pulse" />
          IoT-Driven Cold Chain Visibility (Maersk Captain Peter™ × DP World CARGOES TOS+ CFS)
        </h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Continuous anomaly detection in refrigerated containers (reefers) to prevent cargo spoilage before it happens. 
          Powered by <strong>Qlik Analytics</strong>, this dashboard processes live telemetry streams from over 2 million containers globally. 
          It bridges <strong>Maersk Captain Peter™</strong> reefer health monitoring with <strong>DP World CARGOES TOS+</strong> Automated Rail Mounted Gantry (ARMG) crane workflows and terminal FMS slotting dynamically.
        </p>
      </div>

      {/* STATS DECK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Spoilage Losses Avoided</p>
            <p className="text-xl font-black text-rose-600 mt-1 font-mono">${totalValueSaved.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">High-value cargo saved by fast-track</p>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-100">
            <ShieldAlert className="h-5 w-5 text-rose-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Qlik Ingest Scale</p>
            <p className="text-xl font-black text-slate-950 mt-1 font-mono">{totalMonitored.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Active containers globally monitored</p>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <Database className="h-5 w-5 text-slate-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Qlik Live Stream Ingest</p>
            <p className="text-xl font-black text-blue-600 mt-1 font-mono">{rowsCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">IoT rows processed per day</p>
          </div>
          <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
            <Server className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Active Thermal Alerts</p>
            <p className="text-xl font-black text-amber-600 mt-1 font-mono">{endangeredCount} Reefers</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Under close anomaly monitoring</p>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-500 animate-pulse" />
          </div>
        </div>

      </div>

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* REEFER DIRECTORY LIST (3/5 width) */}
        <div className="lg:col-span-3 space-y-4">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="h-4.5 w-4.5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Active Qlik Analytics Telemetry Stream</h3>
              </div>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                Captain Peter™ Sync Status
              </span>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-500">
                Real-time reefer list currently monitored in the approaching fleet. Click on any container row to display its temperature health matrices and activate DP World yard-crane priorities.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase">
                      <th className="pb-2 font-semibold">Container ID</th>
                      <th className="pb-2 font-semibold">Cargo Description</th>
                      <th className="pb-2 font-semibold text-center">Current Temp</th>
                      <th className="pb-2 font-semibold text-center">Status</th>
                      <th className="pb-2 font-semibold text-right">Cargo Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans text-xs">
                    {reefers.map((ref) => {
                      const isSelected = selectedReeferId === ref.id;
                      const statusColors = 
                        ref.status === "Imminent Failure" 
                          ? "bg-rose-50 text-rose-700 border-rose-200" 
                          : ref.status === "Warning" 
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200";

                      return (
                        <tr 
                          key={ref.id} 
                          onClick={() => !isProcessing && setSelectedReeferId(ref.id)}
                          className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                            isSelected ? "bg-blue-50/30" : ""
                          }`}
                        >
                          <td className="py-3 font-medium text-slate-900">
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              ref.status === "Imminent Failure" 
                                ? "bg-rose-500 animate-ping" 
                                : ref.status === "Warning" 
                                ? "bg-amber-500 animate-pulse" 
                                : "bg-emerald-500"
                            }`}></span>
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{ref.id}</span>
                          </td>
                          <td className="py-3 text-slate-700 max-w-[180px] truncate">
                            {ref.cargoName}
                            <span className="block text-[10px] text-slate-400 truncate">{ref.vessel}</span>
                          </td>
                          <td className="py-3 text-center font-mono font-bold text-slate-800">
                            {ref.tempCurrent.toFixed(1)}°C <span className="text-slate-400 text-[10px] font-normal">/ {ref.tempTarget}°C</span>
                          </td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors}`}>
                              {ref.status}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono font-black text-slate-700">
                            ${ref.cargoValue.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SYSTEM ARCHITECTURE BLUEPRINT (HOW IT WORKS) */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-4 border border-slate-800 space-y-3">
            <h4 className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-widest flex items-center">
              <Zap className="h-4 w-4 mr-2 text-blue-400" />
              Agentic Integration Map: Vessel-to-Yard Workflow
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-750">
                <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase">1. MAERSK CAPTAIN PETER™</span>
                <p className="mt-1 text-slate-300 leading-normal">
                  Continuous edge ML models track compressor cycles and cooling integrity on moving vessels.
                </p>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-750">
                <span className="text-[9px] font-mono font-bold text-blue-400 block uppercase">2. SLA-SHIELD AGENTIC AI</span>
                <p className="mt-1 text-slate-300 leading-normal">
                  Automatically intercepts Captain Peter™ failure indicators and translates payload directly to DP World API.
                </p>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-750">
                <span className="text-[9px] font-mono font-bold text-indigo-400 block uppercase">3. DP WORLD CARGOES TOS+</span>
                <p className="mt-1 text-slate-300 leading-normal">
                  CARGOES crane dispatcher automatically changes hoisting sequence, moving container immediately to pre-powered FMS reefer slot.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* REEFER TELEMETRY & AGENT OVERRIDE PANEL (2/5 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {selectedReefer && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wind className="h-4.5 w-4.5 text-rose-500" />
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Captain Peter™ Telemetry: {selectedReefer.id}</h3>
                </div>
                <span className="text-[10px] font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 animate-pulse">
                  Live Probe Link
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-6">
                
                {/* Vibe Health indicators */}
                <div className="space-y-4">
                  
                  {/* Gauge design for temperature */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center relative overflow-hidden">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block tracking-wider mb-1">
                      Refrigerated Temperature Monitoring
                    </span>
                    
                    <div className="flex justify-center items-baseline space-x-2 mt-2">
                      <span className={`text-3xl font-black font-mono tracking-tight ${
                        selectedReefer.status === "Imminent Failure" ? "text-rose-600" : "text-emerald-600"
                      }`}>
                        {selectedReefer.tempCurrent.toFixed(1)}°C
                      </span>
                      <span className="text-slate-400 text-xs font-mono">/ Target: {selectedReefer.tempTarget}°C</span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-2 italic px-4 leading-relaxed">
                      "{selectedReefer.anomalyDesc}"
                    </p>

                    {/* Simple progress bar representation */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3 max-w-[200px] mx-auto">
                      <div 
                        className={`h-full rounded-full ${
                          selectedReefer.status === "Imminent Failure" ? "bg-rose-600 w-4/5" : "bg-emerald-600 w-1/3"
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Other IoT Indicators */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase">Relative Humidity</span>
                      <p className="text-base font-bold text-slate-800 font-mono mt-1">{selectedReefer.humidity}%</p>
                      <span className="text-[9px] text-slate-500 font-mono block">Status: Target bound</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase">CO2 Density</span>
                      <p className="text-base font-bold text-slate-800 font-mono mt-1">{selectedReefer.co2}%</p>
                      <span className="text-[9px] text-slate-500 font-mono block">Status: Healthy</span>
                    </div>
                  </div>

                  {/* Cargo Context */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase text-[9px] font-mono">Commodity Type</span>
                      <span className="font-bold text-slate-800">{selectedReefer.cargoName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase text-[9px] font-mono">Voyage Vessel</span>
                      <span className="font-bold text-slate-800">{selectedReefer.vessel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase text-[9px] font-mono">Declared Port Ingress</span>
                      <span className="font-bold text-slate-800">{selectedReefer.destinationPort}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-400 uppercase text-[9px] font-mono">Estimated Valuation</span>
                      <span className="font-bold text-emerald-600 font-mono">${selectedReefer.cargoValue.toLocaleString()}</span>
                    </div>
                  </div>

                </div>

                {/* THE AGENT OVERRIDE TRIGGER BUTTON */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  
                  {message && (
                    <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-2.5 rounded text-xs flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="leading-relaxed">{message}</span>
                    </div>
                  )}

                  <button
                    disabled={isProcessing || selectedReefer.isFastTracked}
                    onClick={handleFastTrack}
                    className={`w-full font-bold text-xs py-3 rounded-xl flex items-center justify-center space-x-2 shadow-md transition-all uppercase tracking-wider ${
                      selectedReefer.isFastTracked
                        ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-default"
                        : isProcessing 
                        ? "bg-rose-100 text-rose-400 cursor-not-allowed"
                        : "bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>AI Handoff In Progress...</span>
                      </>
                    ) : selectedReefer.isFastTracked ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>TOS+ Bypass Secured</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-4 w-4" />
                        <span>Trigger Agentic AI TOS+ Fast-Track Override</span>
                      </>
                    )}
                  </button>

                  {/* Sync progression logger details */}
                  {isProcessing && (
                    <div className="bg-rose-50/50 border border-rose-150 rounded-lg p-3 text-xs space-y-2">
                      <div className="flex items-center space-x-2 font-bold text-rose-900 uppercase text-[9px]">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-rose-600" />
                        <span>Emergency Dispatch Sync Ticker:</span>
                      </div>
                      <p className="text-[11px] text-slate-800 font-mono leading-relaxed italic">
                        {activeStep}
                      </p>
                    </div>
                  )}

                  {/* Display completed AI Mitigation Details */}
                  {selectedReefer.isFastTracked && selectedReefer.aiMitigationPlan && (
                    <div className="bg-indigo-50/50 border border-indigo-150 rounded-lg p-3.5 text-xs space-y-3.5">
                      <div className="text-[10px] font-mono font-bold text-indigo-700 uppercase tracking-wider flex items-center">
                        <Cpu className="h-3.5 w-3.5 mr-1.5" />
                        Agentic Mitigation Action Report:
                      </div>
                      
                      {(() => {
                        try {
                          const plan = JSON.parse(selectedReefer.aiMitigationPlan);
                          return (
                            <div className="space-y-3 text-[11px] text-slate-700 leading-relaxed">
                              <div>
                                <span className="font-bold text-slate-900 block font-sans">ARMG Crane Priority Directive:</span>
                                <span className="font-mono text-slate-600">{plan.arrmgDirective}</span>
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block font-sans">CARGOES Yard Slot Allocation:</span>
                                <span className="font-mono text-slate-600">{plan.yardSlotAllocation}</span>
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block font-sans">CFS/FMS Task Action:</span>
                                <span className="font-mono text-slate-600">{plan.fmsAction}</span>
                              </div>
                              <div className="pt-2 border-t border-indigo-200 flex justify-between font-mono">
                                <span className="font-bold text-slate-500 uppercase text-[9px]">Calculated Loss Prevented:</span>
                                <span className="font-black text-emerald-600">${plan.spoilagePreventedCost?.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        } catch (e) {
                          return <p className="text-slate-500">Parsing emergency report details...</p>;
                        }
                      })()}
                    </div>
                  )}

                </div>

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

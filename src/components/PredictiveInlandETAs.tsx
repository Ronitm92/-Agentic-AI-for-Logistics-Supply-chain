import { useState, useEffect } from "react";
import { 
  Clock, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  Truck, 
  TrendingUp, 
  ShieldAlert, 
  Server,
  Zap,
  MapPin,
  FileText,
  Sliders,
  Play
} from "lucide-react";

interface InlandShipment {
  id: string;
  type: "Train" | "Truck Convoy" | "Intermodal Rail";
  route: string;
  containers: string;
  carrier: string;
  delayReason: string;
  status: "Delayed" | "On Time" | "Optimal (Aligned)";
  plannedArrival: string;
  predictiveETA: string;
  gateStatus: string;
  interlockActive: boolean;
  agsReservationId: string;
  originalGateSlot: string;
  shiftedGateSlot: string;
  impactMetric: string;
  rawAgentReport?: string;
}

interface PredictiveInlandETAsProps {
  onStatsUpdate: (updatedStats: any) => void;
}

export default function PredictiveInlandETAs({ onStatsUpdate }: PredictiveInlandETAsProps) {
  const [shipments, setShipments] = useState<InlandShipment[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>("SHP-1102");
  const [isAligning, setIsAligning] = useState<boolean>(false);
  const [alignmentLogs, setAlignmentLogs] = useState<string[]>([]);
  const [activeStepMsg, setActiveStepMsg] = useState<string>("");
  const [totalPredictions, setTotalPredictions] = useState<number>(5490);
  const [accuracyRate, setAccuracyRate] = useState<string>("97.8%");

  // Form states for simulating live transit delays
  const [customType, setCustomType] = useState<"Train" | "Truck Convoy" | "Intermodal Rail">("Train");
  const [customRoute, setCustomRoute] = useState<string>("DP World London Gateway to Birmingham Land Hub");
  const [customCarrier, setCustomCarrier] = useState<string>("Freightliner UK");
  const [customContainers, setCustomContainers] = useState<string>("10x 40ft Dry Goods Cargo");
  const [customDelayReason, setCustomDelayReason] = useState<string>("Overhead electric rail line power outage near Coventry");
  const [customPlannedHrs, setCustomPlannedHrs] = useState<number>(4);

  const processSteps = [
    "Maersk PETA Model: Gathering intermodal sensor milestone telemetry...",
    "Supervised ML Engine: Factoring weather, highway sensors, and customs transit delays...",
    "ML Recalculation complete. Pushing PETA metadata to DP World CARGOES Flow...",
    "CARGOES PCS Interlock: Communicating with Port Community System...",
    "DP World Auto Gate System (AGS): Releasing obsolete gate slot...",
    "DP World AGS: Securing newly optimized truck pick-up slot in Rostering ERP...",
    "Synchronization Complete: Dispatched driver push notifications & synced MyFinance ledger."
  ];

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await fetch("/api/landside/eta-shipments");
      const data = await response.json();
      if (data.status === "ok") {
        setShipments(data.shipments);
        setTotalPredictions(data.totalPredictionsComputed);
        setAccuracyRate(data.modelAccuracyRate);
      }
    } catch (error) {
      console.error("Error fetching predictive ETA shipments:", error);
    }
  };

  const selectedShipment = shipments.find(s => s.id === selectedShipmentId);

  const handleTriggerInterlock = async () => {
    if (!selectedShipmentId) return;
    setIsAligning(true);
    setAlignmentLogs([]);

    let stepIdx = 0;
    setActiveStepMsg(processSteps[0]);
    setAlignmentLogs(prev => [...prev, processSteps[0]]);

    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < processSteps.length) {
        setActiveStepMsg(processSteps[stepIdx]);
        setAlignmentLogs(prev => [...prev, processSteps[stepIdx]]);
      }
    }, 9000 / processSteps.length); // complete over 9 seconds simulation or until api returns

    try {
      const response = await fetch("/api/landside/trigger-interlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentId: selectedShipmentId })
      });
      const result = await response.json();
      clearInterval(interval);

      if (result.status === "ok") {
        setShipments(prev => prev.map(s => s.id === selectedShipmentId ? result.shipment : s));
        onStatsUpdate(result.updatedStats);
        setAlignmentLogs(prev => [...prev, `✓ Success: Synchronized Maersk PETA with DP World AGS Reservation ${result.shipment.agsReservationId}. Shifted Slot to ${result.shipment.shiftedGateSlot}.`]);
      } else {
        setAlignmentLogs(prev => [...prev, `✗ AI Alignment Error: ${result.error || "System failure"}`]);
      }
    } catch (error: any) {
      clearInterval(interval);
      console.error(error);
      setAlignmentLogs(prev => [...prev, `✗ Interlock Timeout: ${error.message || "Network socket drop"}`]);
    } finally {
      setIsAligning(false);
    }
  };

  const handleInjectDelaySimulation = () => {
    const newId = `SHP-${Math.floor(2000 + Math.random() * 7000)}`;
    const plannedDate = new Date();
    plannedDate.setHours(plannedDate.getHours() + customPlannedHrs);

    // Initial predictive ETA is just planned + some random delay minutes for initial look
    const predictiveDate = new Date(plannedDate);
    predictiveDate.setMinutes(predictiveDate.getMinutes() + 120 + Math.floor(Math.random() * 90));

    const originalSlotStart = plannedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const originalSlotEnd = new Date(plannedDate.getTime() + 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const newShipment: InlandShipment = {
      id: newId,
      type: customType,
      route: customRoute,
      containers: customContainers,
      carrier: customCarrier,
      delayReason: customDelayReason,
      status: "Delayed",
      plannedArrival: plannedDate.toISOString(),
      predictiveETA: predictiveDate.toISOString(),
      gateStatus: "Gridlock Risk (Appointment expired / mismatch)",
      interlockActive: false,
      agsReservationId: `AGS-RES-${Math.floor(1000 + Math.random() * 8999)}`,
      originalGateSlot: `${originalSlotStart} - ${originalSlotEnd}`,
      shiftedGateSlot: "None",
      impactMetric: "Protects truck demurrage limits & aligns container ground stack",
      rawAgentReport: ""
    };

    setShipments(prev => [newShipment, ...prev]);
    setSelectedShipmentId(newId);
    setTotalPredictions(prev => prev + 1);

    // Reset simulator inputs to new variations to prompt user
    setCustomRoute("DP World Jebel Ali to Al-Maktoum Airport Logistics Hub");
    setCustomCarrier("CARGOES Runner Logistics");
    setCustomContainers("6x 45ft High-Cube Insulated Cargo");
    setCustomDelayReason("Heavy morning road congestion near Jebel Ali bypass road");
  };

  const delayedCount = shipments.filter(s => s.status === "Delayed").length;
  const synchronizedCount = shipments.filter(s => s.status === "Optimal (Aligned)" || s.status === "On Time").length;

  return (
    <div className="space-y-6">
      
      {/* EXPLANATORY HEADER BANNER */}
      <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-200">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
          <Cpu className="h-4.5 w-4.5 mr-2 text-indigo-600 animate-pulse" />
          Predictive Inland ETAs (Intermodal Synchronizer)
        </h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Utilizing supervised learning machine learning models to calculate the exact arrival times of trucks and trains at inland depots, accounting for real-time traffic, customs delays, and terminal yard congestion. 
          By bridging <strong>Maersk Predictive ETA (PETA)</strong> telemetry with the <strong>DP World CARGOES Port Community System (PCS)</strong> and <strong>Auto Gate System (AGS)</strong>, SLA-Shield automates slot rescheduling. If a rail or road leg suffers an inland switch or border failure, the system recalculates and updates truck terminal gate slots instantly—preventing gate congestion, idle penalties, and port gridlock.
        </p>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">PETA Predictions Ran</p>
            <p className="text-xl font-black text-slate-950 mt-1 font-mono">{totalPredictions.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Calculated by supervised models</p>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <Cpu className="h-5 w-5 text-slate-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Model Accuracy Rate</p>
            <p className="text-xl font-black text-indigo-600 mt-1 font-mono">{accuracyRate}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">R2 validation on historical runs</p>
          </div>
          <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Unresolved Delay Risks</p>
            <p className="text-xl font-black text-red-600 mt-1 font-mono">{delayedCount} Shipments</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Mismatched Auto Gate slots</p>
          </div>
          <div className="bg-red-50 p-2.5 rounded-lg border border-red-100">
            <ShieldAlert className="h-5 w-5 text-red-500 animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Synchronized Depots</p>
            <p className="text-xl font-black text-emerald-600 mt-1 font-mono">{synchronizedCount} Depots</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Aligned terminal gate lanes</p>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
        </div>

      </div>

      {/* CORE WORKSPACE SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* SHIPMENT LIST & TEST INJECTOR (2/5 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Shipments Queue */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="h-4 w-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Active Intermodal Transits</h3>
              </div>
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                PETA Sync Stream
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[350px]">
              {shipments.map((shp) => {
                const isSelected = selectedShipmentId === shp.id;
                const plannedDate = new Date(shp.plannedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const predictiveDate = new Date(shp.predictiveETA).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div 
                    key={shp.id}
                    onClick={() => !isAligning && setSelectedShipmentId(shp.id)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors text-left relative ${
                      isSelected ? "bg-indigo-50/30 font-medium" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] text-slate-400 font-mono flex items-center">
                        <Truck className="h-3 w-3 mr-1 text-slate-500" />
                        {shp.carrier}
                      </span>
                      <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">
                        {shp.type}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 mt-1 truncate">
                      {shp.route}
                    </h4>

                    {/* Delay info if exists */}
                    {shp.status === "Delayed" ? (
                      <p className="text-red-600 text-[10.5px] mt-1 font-mono flex items-center bg-red-50 px-2 py-0.5 rounded border border-red-100 mt-1.5">
                        <AlertTriangle className="h-3 w-3 mr-1 shrink-0" />
                        <span className="truncate">{shp.delayReason}</span>
                      </p>
                    ) : (
                      <p className="text-emerald-700 text-[10.5px] mt-1 font-mono flex items-center bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1.5">
                        <CheckCircle2 className="h-3 w-3 mr-1 shrink-0" />
                        <span>ETA locked & Gate slot synchronized</span>
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-dashed border-slate-100">
                      <div className="flex items-center space-x-1 text-[10px] font-mono text-slate-500">
                        <span>Sched: {plannedDate}</span>
                        <ArrowRight className="h-2.5 w-2.5 text-slate-400" />
                        <span className={shp.status === "Delayed" ? "text-red-500 font-bold" : "text-slate-700 font-bold"}>
                          PETA: {predictiveDate}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        shp.status === "Optimal (Aligned)" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : shp.status === "On Time"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-red-50 text-red-700 border-red-200 animate-pulse"
                      }`}>
                        {shp.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simulate New Inland Delay Injector */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center">
              <Sliders className="h-4 w-4 mr-2 text-indigo-600" />
              Simulate Live Transit Event (ML Delay Test)
            </h3>
            <p className="text-[11px] text-slate-500">
              Simulate a physical real-time delay incident during inland transit. Injecting this will test how Maersk's Predictive ETA (PETA) model intercepts the incident and calculates an optimal rescheduled slot via DP World PCS/AGS.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-mono font-bold text-slate-400 block uppercase mb-1">Transit Type</label>
                  <select 
                    value={customType} 
                    onChange={(e) => setCustomType(e.target.value as any)} 
                    className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded"
                  >
                    <option value="Train">Train</option>
                    <option value="Truck Convoy">Truck Convoy</option>
                    <option value="Intermodal Rail">Intermodal Rail</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono font-bold text-slate-400 block uppercase mb-1">Est. Travel Hours</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={12} 
                    value={customPlannedHrs} 
                    onChange={(e) => setCustomPlannedHrs(parseInt(e.target.value) || 4)} 
                    className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 block uppercase mb-1">Transit Route Corridor</label>
                <input 
                  type="text" 
                  value={customRoute} 
                  onChange={(e) => setCustomRoute(e.target.value)} 
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 block uppercase mb-1">Carrier Operator</label>
                <input 
                  type="text" 
                  value={customCarrier} 
                  onChange={(e) => setCustomCarrier(e.target.value)} 
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 block uppercase mb-1">Shipment Payload & Containers</label>
                <input 
                  type="text" 
                  value={customContainers} 
                  onChange={(e) => setCustomContainers(e.target.value)} 
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 block uppercase mb-1">Physical Incident Delay Reason</label>
                <textarea 
                  rows={2}
                  value={customDelayReason} 
                  onChange={(e) => setCustomDelayReason(e.target.value)} 
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded font-sans focus:bg-white"
                ></textarea>
              </div>

              <button
                onClick={handleInjectDelaySimulation}
                className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-lg transition-colors uppercase tracking-wider flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                <span>Inject Delay & Run ML Monitor</span>
              </button>
            </div>
          </div>

        </div>

        {/* PROCESSING & DETAILED INTERLOCK CONSOLE (3/5 width) */}
        <div className="lg:col-span-3 space-y-6">
          
          {selectedShipment ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              
              <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    PETA-PCS Synchronization Console
                  </h3>
                </div>
                <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                  ID: {selectedShipment.id}
                </span>
              </div>

              <div className="p-4 space-y-6 flex-1 flex flex-col justify-between">
                
                {/* Details Section */}
                <div className="space-y-4">
                  
                  {/* General Info block */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pb-2 border-b border-slate-200">
                      <div>
                        <span className="font-bold text-slate-500">OPERATOR: </span>{selectedShipment.carrier}
                      </div>
                      <div>
                        AGS RESERVATION: {selectedShipment.agsReservationId}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-bold font-mono text-slate-400 uppercase text-[9px] block mb-0.5">Route Corridor</span>
                        <p className="font-bold text-slate-800 flex items-center">
                          <MapPin className="h-3.5 w-3.5 text-red-500 mr-1 shrink-0" />
                          {selectedShipment.route}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold font-mono text-slate-400 uppercase text-[9px] block mb-0.5">Consigned Cargo</span>
                        <p className="font-medium text-slate-700">{selectedShipment.containers}</p>
                      </div>
                    </div>

                    {selectedShipment.status === "Delayed" && (
                      <div className="p-3 bg-red-50 border border-red-150 rounded-lg text-xs space-y-1">
                        <span className="font-bold font-mono text-red-800 uppercase text-[9px] block">Live Telemetry Alert: Delayed</span>
                        <p className="text-red-700 leading-normal font-medium">
                          "{selectedShipment.delayReason}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Interlock Integration Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    
                    {/* Maersk Product Side (PETA ML Engine) */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-200">
                        <div className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                          Maersk PETA
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono font-bold">ML Predictive ETA</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Scheduled Base Arrival:</span>
                          <span className="font-mono text-slate-600 font-bold">
                            {new Date(selectedShipment.plannedArrival).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Supervised ML Prediction:</span>
                          <span className={`font-mono font-black text-sm block ${selectedShipment.status === "Delayed" ? "text-red-600 animate-pulse" : "text-emerald-600"}`}>
                            {new Date(selectedShipment.predictiveETA).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 italic mt-1 leading-normal">
                          Supervised model analyzes active roadside delays and port customs queues to compute optimal predictive ETAs.
                        </p>
                      </div>
                    </div>

                    {/* DP World Product Side (CARGOES PCS / AGS Sync) */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-200">
                        <div className="bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                          DP World AGS
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono font-bold">CARGOES PCS Roster</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Original Gate Slot:</span>
                          <span className="font-mono text-slate-600 font-bold block">{selectedShipment.originalGateSlot}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Auto-Aligned Gate Slot:</span>
                          {selectedShipment.shiftedGateSlot === "None" ? (
                            <span className="font-mono text-red-600 font-black text-sm block flex items-center animate-pulse">
                              <ShieldAlert className="h-4 w-4 mr-1 text-red-500" />
                              Mismatched (Risk of Gridlock)
                            </span>
                          ) : (
                            <span className="font-mono text-emerald-600 font-black text-sm block">
                              {selectedShipment.shiftedGateSlot}
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-slate-500 italic mt-1 leading-normal">
                          CARGOES PCS / AGS swaps pickup slots automatically to sync with recalculated ML Predictive ETAs.
                        </p>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Interactive Action Workspace */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  
                  {selectedShipment.status === "Delayed" ? (
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs flex items-start space-x-2.5">
                        <AlertTriangle className="h-4.5 w-4.5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-amber-900 block">Gate Gridlock Risk Detected</span>
                          <p className="text-amber-700 leading-normal mt-0.5">
                            Train/truck delays will cause drivers to miss original reservations, creating wait-time penalties or gridlocking the inland depot gates. Recalculate and trigger the interlock immediately.
                          </p>
                        </div>
                      </div>

                      <button
                        disabled={isAligning}
                        onClick={handleTriggerInterlock}
                        className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all ${
                          isAligning 
                            ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-default"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                        }`}
                      >
                        {isAligning ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Aligning Maersk PETA & CARGOES AGS...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 text-amber-300 animate-pulse" />
                            <span>Run PETA ML & Auto-Align Gate Slot</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/75 border border-emerald-200 rounded-xl p-4 space-y-3 text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-emerald-200">
                        <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-widest flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" />
                          Interlock Synchronization Complete
                        </span>
                        <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          AGS Swapped
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[9px] font-mono text-slate-400 block uppercase">PETA Recalculation:</span>
                          <p className="font-bold text-slate-800 leading-normal">
                            {new Date(selectedShipment.predictiveETA).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-400 block uppercase">Rescheduled Gate Slot:</span>
                          <p className="font-black text-emerald-600 font-mono">{selectedShipment.shiftedGateSlot}</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="text-[9px] font-mono text-slate-400 block uppercase mb-1 flex items-center">
                          <FileText className="h-3 w-3 mr-1 text-slate-400" />
                          Live ML Interlock transaction log trace:
                        </span>
                        <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[10px] leading-relaxed whitespace-pre-line border border-slate-800 max-h-[140px] overflow-y-auto">
                          {selectedShipment.rawAgentReport}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Processing Step Ticker */}
                  {isAligning && (
                    <div className="bg-indigo-50/50 border border-indigo-150 rounded-lg p-3 text-xs space-y-2">
                      <div className="flex items-center space-x-2 font-bold text-indigo-900 uppercase text-[9px]">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                        <span>Active Pipeline Execution Steps:</span>
                      </div>
                      <p className="text-[11px] text-slate-800 font-mono leading-relaxed italic">
                        {activeStepMsg}
                      </p>
                    </div>
                  )}

                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              <Clock className="h-10 w-10 mx-auto text-slate-300 animate-pulse mb-3" />
              <p className="text-xs">Select an intermodal shipment from the stream feed to run predictive modeling or execute gate slot synchronizations.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

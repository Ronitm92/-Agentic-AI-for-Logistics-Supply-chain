import { useState, useEffect } from "react";
import { 
  Compass, 
  Ship, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  TrendingUp, 
  RefreshCw, 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  FileSpreadsheet, 
  Cpu, 
  Sparkles,
  Award,
  AlertTriangle,
  Play
} from "lucide-react";

interface DoorToDoorRecommendation {
  id: string;
  clientName: string;
  oceanVessel: string;
  currentRoute: string;
  crisisScenario: string;
  predictedInlandDestination: string;
  recommendedAlternativeRoute: string;
  status: "Suggested" | "Processing" | "Cleared & Re-routed";
  upsellRevenueValue: string;
  upsellValueNum: number;
  customsCleared: boolean;
  rawAgentReport?: string;
  containersCount: number;
  hsCode: string;
  customsDutySaved: string;
}

interface DoorToDoorRecommendationsProps {
  onStatsUpdate: (updatedStats: any) => void;
}

export default function DoorToDoorRecommendations({ onStatsUpdate }: DoorToDoorRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<DoorToDoorRecommendation[]>([]);
  const [selectedRecId, setSelectedRecId] = useState<string>("D2D-7701");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pipelineValue, setPipelineValue] = useState<number>(0);
  const [capturedRevenue, setCapturedRevenue] = useState<number>(0);
  const [stepTrace, setStepTrace] = useState<string[]>([]);
  const [activeStepText, setActiveStepText] = useState<string>("");

  const processSteps = [
    "Maersk Visibility Studio Agent: Detecting port crisis telemetry...",
    "Multi-Agent AI Simulation: Running alternative path models (bypassing strike via rail hub)...",
    "Maersk Orchestrator: Generating updated digital electronic manifest...",
    "CARGOES Customs Risk Engine: Screening HS Codes and assessing duty profiles...",
    "CARGOES Customs AI Classification: Checking for revenue leakages or tariff gaps...",
    "CARGOES TOS+ Integration: Pre-allocating terminal stowage & rail cars...",
    "Paperless Approval: Dispatching cryptographic clearance token & auto-diverting vessel."
  ];

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch("/api/landside/d2d-recommendations");
      const data = await response.json();
      if (data.status === "ok") {
        setRecommendations(data.recommendations);
        setPipelineValue(data.totalUpsellPipeline);
        setCapturedRevenue(data.totalCapturedUpsellRevenue);
      }
    } catch (error) {
      console.error("Error fetching D2D recommendations:", error);
    }
  };

  const selectedRec = recommendations.find(r => r.id === selectedRecId);

  const handleProcessOrchestration = async () => {
    if (!selectedRecId) return;
    setIsProcessing(true);
    setStepTrace([]);

    let stepIdx = 0;
    setActiveStepText(processSteps[0]);
    setStepTrace(prev => [...prev, processSteps[0]]);

    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < processSteps.length) {
        setActiveStepText(processSteps[stepIdx]);
        setStepTrace(prev => [...prev, processSteps[stepIdx]]);
      }
    }, 9000 / processSteps.length);

    try {
      const response = await fetch("/api/landside/process-d2d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: selectedRecId })
      });
      const result = await response.json();
      clearInterval(interval);

      if (result.status === "ok") {
        setRecommendations(prev => prev.map(r => r.id === selectedRecId ? result.recommendation : r));
        
        // Dynamic re-calculations for state
        setPipelineValue(prev => Math.max(0, prev - result.recommendation.upsellValueNum));
        setCapturedRevenue(prev => prev + result.recommendation.upsellValueNum);
        
        onStatsUpdate(result.updatedStats);
        setStepTrace(prev => [
          ...prev, 
          `✓ Diverted Successfully! Cryptographic customs clearance issued in 1.8 seconds. Stowing aligned at alternative terminal.`
        ]);
      } else {
        setStepTrace(prev => [...prev, `✗ AI Orchestration Failed: ${result.error || "System error"}`]);
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setStepTrace(prev => [...prev, `✗ Socket Timeout: ${err.message || "Network lost"}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION EXPLANATION BANNER */}
      <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-200">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
          <Sparkles className="h-4.5 w-4.5 mr-2 text-indigo-600 animate-pulse" />
          Hyper-Personalized Door-to-Door Recommendations
        </h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Up-selling valuable land-side transport options to traditional ocean-only cargo clients by predicting their final domestic inland destinations using historical manifest patterns. This cross-platform orchestration layer bridges <strong>Maersk's Risk Management & Visibility Studio</strong> with DP World's <strong>CARGOES Customs</strong> and <strong>CARGOES TOS+</strong> during port crises.
        </p>
      </div>

      {/* METRICS DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Uncaptured Pipeline</p>
            <p className="text-xl font-black text-slate-950 mt-1 font-mono">${pipelineValue.toLocaleString()} USD</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Predicted inland destination upsells</p>
          </div>
          <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
            <Compass className="h-5 w-5 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Captured Upsell Revenue</p>
            <p className="text-xl font-black text-emerald-600 mt-1 font-mono">${capturedRevenue.toLocaleString()} USD</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Diverted & land-side booked</p>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">AI Clearance Time</p>
            <p className="text-xl font-black text-slate-950 mt-1 font-mono">1.8 Seconds</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Average paperless manifest audit</p>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <Cpu className="h-5 w-5 text-slate-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Cross-Platform Integrity</p>
            <p className="text-xl font-black text-indigo-600 mt-1 font-mono">100% Secure</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Compliance audited by risk engine</p>
          </div>
          <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
          </div>
        </div>

      </div>

      {/* INTELLIGENCE DESK VISUALIZER (3 STAGE INTEGRATION DIAGRAM) */}
      <div className="bg-gradient-to-r from-slate-950 to-indigo-950 text-white rounded-xl p-5 shadow-lg border border-indigo-900">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400 flex items-center">
          <Cpu className="h-4 w-4 mr-2 text-indigo-400" />
          CROSS-PLATFORM CRISIS ORCHESTRATION PIPELINE
        </h3>
        <p className="text-[11px] text-slate-300 mt-1">
          Visualizing how Maersk's Visibility Studio agents collaborate with DP World CARGOES Customs AI classification during a bottleneck event.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5 relative">
          
          {/* STAGE 1 */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 relative">
            <span className="absolute -top-3 left-3 bg-indigo-600 text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold text-white">
              Stage 1: Maersk Predictor
            </span>
            <div className="flex items-center space-x-2 pt-1">
              <Compass className="h-4 w-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-slate-100">Visibility Studio Agent</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              A multi-agent AI system simulates alternative paths (e.g., bypassing a congested port via nearby rail/barge corridors) when strikes occur.
            </p>
          </div>

          {/* STAGE 2 */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 relative">
            <span className="absolute -top-3 left-3 bg-indigo-600 text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold text-white">
              Stage 2: CARGOES Customs
            </span>
            <div className="flex items-center space-x-2 pt-1">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-100">Intelligent Risk Engine</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              CARGOES Customs AI-driven classification wizard instantly reviews the amendment manifest, checks for compliance & tax leakage, and approves clearances.
            </p>
          </div>

          {/* STAGE 3 */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 relative">
            <span className="absolute -top-3 left-3 bg-indigo-600 text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold text-white">
              Stage 3: Integration
            </span>
            <div className="flex items-center space-x-2 pt-1">
              <CheckCircle2 className="h-4 w-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-slate-100">Paperless Vessel Diversion</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Cryptographic approval tokens are sent to CARGOES TOS+. Maersk diverts the vessel and clears the cargo through the alternative terminal seamlessly.
            </p>
          </div>

        </div>
      </div>

      {/* D2D WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* RECOMMENDATIONS SIDEBAR (2/5 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Ship className="h-4 w-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Disrupted Ocean Cargoes</h3>
              </div>
              <span className="text-[9px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 uppercase font-bold">
                Crisis Pool
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {recommendations.map((rec) => {
                const isSelected = selectedRecId === rec.id;
                return (
                  <div 
                    key={rec.id}
                    onClick={() => !isProcessing && setSelectedRecId(rec.id)}
                    className={`p-4 text-left cursor-pointer transition-all hover:bg-slate-50 relative ${
                      isSelected ? "bg-indigo-50/40" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {rec.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${
                        rec.status === "Cleared & Re-routed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                      }`}>
                        {rec.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-950 mt-1">
                      {rec.clientName}
                    </h4>
                    
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
                      {rec.oceanVessel} • {rec.containersCount} containers
                    </p>

                    <p className="text-[10.5px] text-indigo-700 font-mono font-bold mt-2 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Upsell Value: {rec.upsellRevenueValue}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* WORKSPACE OPERATIONS CONSOLE (3/5 width) */}
        <div className="lg:col-span-3">
          {selectedRec ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full justify-between">
              
              <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Orchestration Control Terminal
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  REF: {selectedRec.id}
                </span>
              </div>

              <div className="p-5 space-y-6 flex-1">
                
                {/* General Shipment & Vessel Header Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    <Ship className="h-3.5 w-3.5 text-slate-500" />
                    <span>In-Transit Ocean Vessel: {selectedRec.oceanVessel}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{selectedRec.clientName}</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase block">Disrupted Corridor:</span>
                      <p className="font-medium text-slate-700">{selectedRec.currentRoute}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase block">Predicted Inland Destination:</span>
                      <p className="font-bold text-indigo-600 flex items-center">
                        <MapPin className="h-3.5 w-3.5 text-red-500 mr-1 shrink-0" />
                        {selectedRec.predictedInlandDestination}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Crisis Impact Banner */}
                <div className="bg-red-50 border border-red-150 p-4 rounded-xl space-y-1">
                  <div className="flex items-center space-x-2 text-red-800 font-bold text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>CRISIS EVENT DETECTED</span>
                  </div>
                  <p className="text-[11px] text-red-700 leading-normal font-medium">
                    "{selectedRec.crisisScenario}"
                  </p>
                </div>

                {/* Maersk & DP World Intelligent Collaboration Splits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  {/* Maersk multi-agent AI pathing */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-200">
                      <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                        MAERSK AI
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">Visibility Studio</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 uppercase block">Alternative Crisis Bypass:</span>
                      <p className="font-bold text-slate-800 leading-normal mt-1">
                        {selectedRec.recommendedAlternativeRoute}
                      </p>
                    </div>
                  </div>

                  {/* DP World CARGOES Customs check */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center space-x-1.5 pb-2 border-b border-slate-200">
                      <span className="bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                        DP WORLD AI
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">CARGOES Customs</span>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase block">Target HS Code Classifier:</span>
                        <p className="font-bold text-slate-800 leading-none">{selectedRec.hsCode}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase block">Revenue leakage security check:</span>
                        <p className="font-bold text-emerald-600 font-mono">Duty pre-staging ok</p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Dynamic Actions Workspace */}
                <div className="pt-4 border-t border-slate-100">
                  
                  {selectedRec.status === "Suggested" ? (
                    <div className="space-y-3 text-xs">
                      <div className="bg-indigo-50 border border-indigo-150 rounded-lg p-3 text-slate-700 flex items-start space-x-2.5">
                        <Cpu className="h-4.5 w-4.5 text-indigo-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-indigo-950 block">Cross-Platform Up-Sell & Re-Routing Ready</span>
                          <p className="text-[11.5px] text-slate-600 leading-normal mt-0.5">
                            Instruct the Maersk Visibility Studio to submit the amendment. CARGOES Customs' AI Classification wizard will review and clear it paperlessly in seconds to bypass the port crisis.
                          </p>
                        </div>
                      </div>

                      <button
                        disabled={isProcessing}
                        onClick={handleProcessOrchestration}
                        className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all ${
                          isProcessing 
                            ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-default"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Orchestrating AI Path Bypass & Customs Clearance...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 text-amber-300 animate-pulse" />
                            <span>Orchestrate Path Bypass & Customs Clearance</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/75 border border-emerald-200 rounded-xl p-4 space-y-3 text-xs text-left">
                      <div className="flex justify-between items-center pb-2 border-b border-emerald-200">
                        <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-widest flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" />
                          Diversion & Compliance Clear Authorized
                        </span>
                        <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          Vessel Diverted
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[9px] font-mono text-slate-400 block uppercase">Upsell Revenue Captured:</span>
                          <p className="font-bold text-slate-800 leading-normal font-mono">
                            {selectedRec.upsellRevenueValue}
                          </p>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-400 block uppercase">Paperless Compliance Saving:</span>
                          <p className="font-black text-emerald-600 font-mono">{selectedRec.customsDutySaved}</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="text-[9px] font-mono text-slate-400 block uppercase mb-1 flex items-center">
                          <FileSpreadsheet className="h-3 w-3 mr-1 text-slate-400" />
                          Audit log transaction trail:
                        </span>
                        <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[10px] leading-relaxed whitespace-pre-line border border-slate-800 max-h-[140px] overflow-y-auto">
                          {selectedRec.rawAgentReport}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Processing step log ticker */}
                  {isProcessing && (
                    <div className="bg-indigo-50/50 border border-indigo-150 rounded-lg p-3 text-xs space-y-2 mt-4 text-left">
                      <div className="flex items-center space-x-2 font-bold text-indigo-900 uppercase text-[9px]">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                        <span>Execution log stream:</span>
                      </div>
                      <p className="text-[11px] text-slate-800 font-mono leading-relaxed italic">
                        {activeStepText}
                      </p>
                    </div>
                  )}

                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              <Compass className="h-10 w-10 mx-auto text-slate-300 animate-pulse mb-3" />
              <p className="text-xs">Select a disrupted cargo to initiate multi-agent path simulation and customs clearance.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

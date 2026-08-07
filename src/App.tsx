import { useState, useEffect, FormEvent } from "react";
import { 
  ShieldCheck, 
  Anchor, 
  AlertTriangle, 
  Layers, 
  Ship, 
  Clock, 
  TrendingUp, 
  Cpu, 
  BookOpen, 
  CheckCircle2, 
  Hourglass, 
  AlertOctagon, 
  ArrowRight, 
  ArrowRightLeft, 
  Users, 
  Settings, 
  Database, 
  DollarSign, 
  Tv2,
  RefreshCw,
  Plus,
  Thermometer,
  Mail,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import EmptyRedistribution from "./components/EmptyRedistribution";
import ColdChainVisibility from "./components/ColdChainVisibility";
import UnstructuredEmailAutomation from "./components/UnstructuredEmailAutomation";
import PredictiveInlandETAs from "./components/PredictiveInlandETAs";
import DoorToDoorRecommendations from "./components/DoorToDoorRecommendations";

// Port disruption incident type
interface Container {
  id: string;
  carrier: string;
  priority: string;
  cargo: string;
  qty: number;
  targetWMS: string;
}

interface BufferNode {
  warehouseName: string;
  stockCount: number;
  freightCostPerTeu: number;
  leadTimeHours: number;
}

interface Incident {
  id: string;
  title: string;
  portName: string;
  severity: string;
  hoursBehind: number;
  impactMetric: string;
  contractRules: {
    client: string;
    deliverySLAHours: number;
    defaultPenaltyPerDay: number;
    demurrageGraceDays: number;
    demurragePenaltyPerDay: number;
  };
  inboundContainers: Container[];
  alternativeBufferNodes: BufferNode[];
}

interface ProceduralMemory {
  incidentId: string;
  scenario: string;
  rootCause: string;
  resolutionPlaybook: string;
  financialBenefit: string;
  timestamp: string;
}

interface HardwareQueueItem {
  containerId: string;
  originPort: string;
  estimatedUnload: string;
  status: string;
  agvAssigned: string;
}

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [proceduralMemories, setProceduralMemories] = useState<ProceduralMemory[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  // Rebalancer Controls
  const [selectedBuffer, setSelectedBuffer] = useState<string>("");
  const [overtimeLabor, setOvertimeLabor] = useState<boolean>(true);
  
  // Dashboard Metrics & Live Queue
  const [stats, setStats] = useState({
    totalDandDSaved: 184500,
    revenueShareAccrued: 55350,
    slasProtectedCount: 42,
    activeContainersInRoute: 18,
    activeSubscriptionTier: "SLA-on-Demand Premium",
  });
  const [activeGroup, setActiveGroup] = useState<"ocean" | "landside">("ocean");
  const [activeTab, setActiveTab] = useState<"rebalance" | "empty-redistribution" | "cold-chain" | "email-automation" | "predictive-eta" | "d2d-upsell">("rebalance");
  const [hardwareQueue, setHardwareQueue] = useState<HardwareQueueItem[]>([]);

  // System states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  
  // Custom container priority manual dispatcher
  const [manualContainerId, setManualContainerId] = useState<string>("");
  const [manualStatus, setManualStatus] = useState<string>("Customs Priority Cleared");
  const [manualMessage, setManualMessage] = useState<string>("");

  // Calculate unmitigated financial loss for a delay
  const calculateProjectedLoss = (inc: Incident) => {
    const daysBehind = inc.hoursBehind / 24;
    const slaDeadlineDays = inc.contractRules.deliverySLAHours / 24;
    const daysOverSLA = Math.max(0, daysBehind - slaDeadlineDays);
    const slaPenalty = Math.ceil(daysOverSLA) * inc.contractRules.defaultPenaltyPerDay;
    
    const daysOverDemurrage = Math.max(0, daysBehind - inc.contractRules.demurrageGraceDays);
    const demurragePenalty = Math.ceil(daysOverDemurrage) * inc.contractRules.demurragePenaltyPerDay;
    
    return slaPenalty + demurragePenalty;
  };

  // Loading ticker steps to entertain the operator during Gemini audit
  const loadingSequence = [
    "Correlating customs gate-out congestion anomalies...",
    "Querying alternative inventory buffer nodes via Maersk WMS API...",
    "Assessing contract penalty breach delta thresholds...",
    "Invoking LLM-as-a-Judge Glass-Box Trajectory Evaluation...",
    "Simulating logistics cost-variance outcomes...",
    "Drafting smart-crane priority dispatcher queue profiles..."
  ];

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch operational metrics and hardware queue
      const resStats = await fetch("/api/dashboard/stats");
      const dataStats = await resStats.json();
      if (dataStats.status === "ok") {
        setStats(dataStats.stats);
        setHardwareQueue(dataStats.hardwareQueue);
      }

      // Fetch active incidents and memories
      const resIncidents = await fetch("/api/incidents");
      const dataIncidents = await resIncidents.json();
      if (dataIncidents.status === "ok") {
        setIncidents(dataIncidents.incidents);
        setProceduralMemories(dataIncidents.proceduralMemories);
        if (dataIncidents.incidents.length > 0) {
          // Default to first scenario
          const firstIncident = dataIncidents.incidents[0];
          setSelectedIncident(firstIncident);
          if (firstIncident.alternativeBufferNodes?.length > 0) {
            setSelectedBuffer(firstIncident.alternativeBufferNodes[0].warehouseName);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching logistics portal data:", error);
    }
  };

  // Switch context incident
  const handleIncidentChange = (incident: Incident) => {
    setSelectedIncident(incident);
    setEvaluationResult(null);
    if (incident.alternativeBufferNodes && incident.alternativeBufferNodes.length > 0) {
      setSelectedBuffer(incident.alternativeBufferNodes[0].warehouseName);
    } else {
      setSelectedBuffer("");
    }
  };

  // Trigger Glass-Box Rebalancing Algorithm
  const runEvaluation = async () => {
    if (!selectedIncident) return;
    
    setIsLoading(true);
    setEvaluationResult(null);
    
    // Cycle through descriptive steps
    let stepIndex = 0;
    const interval = setInterval(() => {
      setLoadingStep(loadingSequence[stepIndex % loadingSequence.length]);
      stepIndex++;
    }, 1100);

    try {
      const response = await fetch("/api/rebalance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: selectedIncident.id,
          selectedBufferWarehouse: selectedBuffer,
          overtimeLaborConfirmed: overtimeLabor
        })
      });

      const result = await response.json();
      clearInterval(interval);

      if (result.status === "ok") {
        setEvaluationResult(result.audit);
        setStats(result.updatedStats);
        setProceduralMemories(result.memories);
        
        // Auto synchronize simulated hardware queue dynamically from judgment
        if (result.audit?.mcpHardwarePriorityInstructions) {
          const mcp = result.audit.mcpHardwarePriorityInstructions;
          // Prepend priority container to live crane queue to show integration
          
          setHardwareQueue(prev => {
            const exists = prev.some(item => item.containerId === mcp.agvPriorityContainerId);
            if (exists) {
              return prev.map(item => {
                if (item.containerId === mcp.agvPriorityContainerId) {
                  return { ...item, status: "AI Dispatched Locked", estimatedUnload: "Priority Un-Stuffing Mode" };
                }
                return item;
              });
            } else {
              return [
                {
                  containerId: mcp.agvPriorityContainerId,
                  originPort: selectedIncident.portName,
                  estimatedUnload: "Immediate (AI Priority Slot 1)",
                  status: "AI Dispatched Locked",
                  agvAssigned: "AGV-04-Auto"
                },
                ...prev
              ];
            }
          });
        }
      } else {
        alert("SLA-Shield evaluation failed: " + (result.message || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
      clearInterval(interval);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle custom hardware overwrite
  const submitCustomGate = async (e: FormEvent) => {
    e.preventDefault();
    if (!manualContainerId) return;

    try {
      const res = await fetch("/api/hardware/priority", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          containerId: manualContainerId,
          targetStatus: manualStatus,
          agvId: "AGV-01-Manual"
        })
      });
      const data = await res.json();
      if (data.status === "ok") {
        setHardwareQueue(data.hardwareQueue);
        setStats(data.stats);
        setManualMessage(`Successfully injected high-priority stack command for ${manualContainerId}.`);
        setManualContainerId("");
        setTimeout(() => setManualMessage(""), 4000);
      }
    } catch (error) {
      console.error("Queue override error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased text-sm">
      {/* Upper Navigation Header with Ocean Use Cases & Landside Operations Tabs next to each other */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col space-y-4">
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              
              {/* Suite 1: Ocean Use Cases */}
              <button
                onClick={() => {
                  setActiveGroup("ocean");
                  setActiveTab("rebalance");
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center space-x-3 cursor-pointer ${
                  activeGroup === "ocean"
                    ? "bg-blue-50 border-blue-200 shadow-sm text-blue-900"
                    : "bg-white border-transparent hover:bg-slate-50 text-slate-500"
                }`}
              >
                <div className={`p-2 rounded-lg flex items-center justify-center ${
                  activeGroup === "ocean" ? "bg-blue-600 text-white shadow-md animate-pulse" : "bg-slate-100 text-slate-600"
                }`}>
                  <span className="text-xl leading-none">🌊</span>
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-80 block">Active Suite</span>
                    {activeGroup === "ocean" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                  </div>
                  <h1 className="text-sm font-extrabold tracking-tight uppercase">
                    Ocean Use Cases
                  </h1>
                  <span className="text-[10px] text-slate-500 block">Vessel & Container Network</span>
                </div>
              </button>

              {/* Suite 2: Non-Ocean & Landside Operations */}
              <button
                onClick={() => {
                  setActiveGroup("landside");
                  setActiveTab("email-automation");
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center space-x-3 cursor-pointer ${
                  activeGroup === "landside"
                    ? "bg-indigo-50 border-indigo-200 shadow-sm text-indigo-900"
                    : "bg-white border-transparent hover:bg-slate-50 text-slate-500"
                }`}
              >
                <div className={`p-2 rounded-lg flex items-center justify-center ${
                  activeGroup === "landside" ? "bg-indigo-600 text-white shadow-md animate-pulse" : "bg-slate-100 text-slate-600"
                }`}>
                  <span className="text-xl leading-none">🚛</span>
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest opacity-80 block">Active Suite</span>
                    {activeGroup === "landside" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                  </div>
                  <h1 className="text-sm font-extrabold tracking-tight uppercase">
                    Non-Ocean & Landside Operations
                  </h1>
                  <span className="text-[10px] text-slate-500 block">Inland, Logistics, & Customer Experience</span>
                </div>
              </button>

            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Live UTC Indicator */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <div className="text-xs font-mono">
                  <span className="text-slate-400">SYSTEM CLOCK UTC: </span>
                  <span className="text-slate-705 font-bold">2026-05-20 19:15</span>
                </div>
              </div>

              {/* Premium contract Tier Banner */}
              <div className="bg-amber-50 border border-amber-200 text-amber-805 rounded-lg px-3 py-1.5 flex items-center space-x-2 font-semibold shadow-sm">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                <span className="text-xs font-semibold uppercase tracking-wider">{stats.activeSubscriptionTier}</span>
              </div>
            </div>
          </div>

          {/* Sub-Tabs selection based on active Group */}
          {activeGroup === "ocean" ? (
            <div className="flex flex-wrap p-1 bg-slate-100 rounded-lg border border-slate-200 self-start gap-1">
              <button
                onClick={() => setActiveTab("rebalance")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center space-x-2 ${
                  activeTab === "rebalance"
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200/50 font-extrabold"
                    : "text-slate-500 hover:text-slate-805 cursor-pointer"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>SLA Rebalancing Command Desk</span>
              </button>

              <button
                onClick={() => setActiveTab("empty-redistribution")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center space-x-2 ${
                  activeTab === "empty-redistribution"
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200/50 font-extrabold"
                    : "text-slate-500 hover:text-slate-805 cursor-pointer"
                }`}
              >
                <Ship className="h-3.5 w-3.5" />
                <span>Smart Empty Container Redistribution</span>
              </button>

              <button
                onClick={() => setActiveTab("cold-chain")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center space-x-2 ${
                  activeTab === "cold-chain"
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200/50 font-extrabold"
                    : "text-slate-500 hover:text-slate-805 cursor-pointer"
                }`}
              >
                <Thermometer className="h-3.5 w-3.5" />
                <span>IoT-Driven Cold Chain Visibility</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap p-1 bg-slate-100 rounded-lg border border-slate-200 self-start gap-1">
              <button
                onClick={() => setActiveTab("email-automation")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center space-x-2 ${
                  activeTab === "email-automation"
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50 font-extrabold"
                    : "text-slate-500 hover:text-slate-805 cursor-pointer"
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Unstructured Email Automation (Inbound Desk)</span>
              </button>

              <button
                onClick={() => setActiveTab("predictive-eta")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center space-x-2 ${
                  activeTab === "predictive-eta"
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50 font-extrabold"
                    : "text-slate-500 hover:text-slate-805 cursor-pointer"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Predictive Inland ETAs (Intermodal)</span>
              </button>

              <button
                onClick={() => setActiveTab("d2d-upsell")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all flex items-center space-x-2 ${
                  activeTab === "d2d-upsell"
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50 font-extrabold"
                    : "text-slate-500 hover:text-slate-805 cursor-pointer"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>Hyper-Personalized Door-to-Door Recommendations</span>
              </button>
            </div>
          )}

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {activeTab === "empty-redistribution" ? (
          <EmptyRedistribution 
            onStatsUpdate={(updatedStats) => {
              setStats(updatedStats);
            }} 
          />
        ) : activeTab === "cold-chain" ? (
          <ColdChainVisibility 
            onStatsUpdate={(updatedStats) => {
              setStats(updatedStats);
            }}
          />
        ) : activeTab === "email-automation" ? (
          <UnstructuredEmailAutomation 
            onStatsUpdate={(updatedStats) => {
              setStats(updatedStats);
            }}
          />
        ) : activeTab === "predictive-eta" ? (
          <PredictiveInlandETAs 
            onStatsUpdate={(updatedStats) => {
              setStats(updatedStats);
            }}
          />
        ) : activeTab === "d2d-upsell" ? (
          <DoorToDoorRecommendations 
            onStatsUpdate={(updatedStats) => {
              setStats(updatedStats);
            }}
          />
        ) : (
          <>
            {/* SECTION 1: LOGISTICS METRICS OVERVIEW & PERFORMANCE EXPLANATION */}
        <section className="space-y-3" id="metrics-overview">
          <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <TrendingUp className="h-4.5 w-4.5 mr-2 text-blue-600 animate-pulse" />
              Logistics Operational Performance Benchmarks (Section 1)
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              This metrics bar displays real-time operational KPI indicators, integrated directly with <strong>Maersk Ocean Fleet Systems</strong> and feeding predictive arrival telemetry straight into <strong>DP World CARGOES TOS+ (ZODIAC - Marine Operations module)</strong>: 
              <strong> Total Accrued Savings</strong> tracks protected demurrage/customs penalty costs; 
              <strong> 30% Profit Share Earned</strong> showcases company revenue accrued directly from container protection payouts; 
              <strong> Guaranteed SLA Contracts</strong> highlights the count of client fulfillment commitments running with safe confidence thresholds; and 
              <strong> Monitored Containers</strong> tracks active sea-going TEU volumes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="stats-dashboard">
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1 flex items-center">
                  Total Accrued Savings
                  <span className="ml-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">D&D Guarded</span>
                </div>
                <p className="text-2xl font-bold font-mono text-emerald-600">${stats.totalDandDSaved.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Verified demurrage penalty loss prevented</p>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-405 font-semibold uppercase tracking-wider mb-1 flex items-center">
                  30% Profit Share Earned
                  <span className="ml-1.5 bg-blue-50 text-blue-700 border border-blue-200/50 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">Performance</span>
                </div>
                <p className="text-2xl font-bold font-mono text-blue-600">${stats.revenueShareAccrued.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Direct performance logistics revenue</p>
              </div>
              <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Guaranteed SLA Contracts</p>
                <p className="text-2xl font-bold font-mono text-slate-900">{stats.slasProtectedCount} Active</p>
                <p className="text-xs text-slate-500 mt-1">Fulfillment confidence threshold &gt; 98.4%</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <ShieldCheck className="h-5 w-5 text-slate-655" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Active Containers monitored</p>
                <p className="text-2xl font-bold font-mono text-sky-600">{stats.activeContainersInRoute} TEUs</p>
                <p className="text-xs text-slate-550 mt-1">Maersk Ocean Fleet Systems & DP World CARGOES TOS+ (ZODIAC) sync</p>
              </div>
              <div className="bg-sky-50 p-2.5 rounded-lg border border-sky-100">
                <Ship className="h-5 w-5 text-sky-655" />
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 2: PORT CONGESTION DESK & AUTONOMOUS REBALANCING (GROUPED TOGETHER) */}
        <section className="space-y-4 font-sans" id="mitigation-desk">
          <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <Cpu className="h-4.5 w-4.5 mr-2 text-blue-600 animate-pulse" />
              Active Port Congestion Threats & Autonomous Rebalancing Desk (Section 2)
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              This core grouped operations desk couples marine delays tracked by <strong>Maersk Ocean Fleet Systems</strong> directly with AI inventory substitution tools to safeguard supply chains, feeding predictive arrival data straight into <strong>DP World CARGOES TOS+ (ZODIAC - Marine Operations module)</strong>. 
              <strong> Left: Active Port Congestion Threats</strong> monitors live customs delays, vessel backlogs, and projected delay penalties. 
              <strong> Right: Autonomous Rebalancer Command Center</strong> provides a command dashboard where operators can select substitute reserve nodes, manage shift overtime policies, evaluate trajectory models and run strategic simulations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT PANEL: PORT DELAY DELINEATION & WORKLOAD CONTROL (5 COLS) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* INCIDENTS PANEL */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in text-left">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Anchor className="h-4.5 w-4.5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Active Port Congestion Threats</h3>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200/50 px-2 py-0.5 rounded uppercase">
                    Impact Sensed
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-505 leading-relaxed mb-1">
                    The artificial agent monitors live multi-carrier container manifests. Select an ongoing disruption to model the WMS cross-dock balance.
                  </p>
                  
                  {incidents.map((inc) => {
                    const isActive = selectedIncident?.id === inc.id;
                    const severityClass = 
                      inc.severity === "Critical" ? "bg-red-50 border-red-205 text-red-700 font-bold" :
                      inc.severity === "High" ? "bg-amber-50 border-amber-205 text-amber-700 font-bold" :
                      "bg-slate-50 border-slate-200 text-slate-650";

                    return (
                      <div 
                        key={inc.id}
                        onClick={() => handleIncidentChange(inc)}
                        className={`p-4 rounded-lg border transition cursor-pointer text-left relative overflow-hidden ${
                          isActive 
                          ? "border-blue-600 bg-blue-50/20 shadow-md" 
                          : "border-slate-200 hover:border-slate-350 bg-white"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>
                        )}
                        
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${severityClass}`}>
                            {inc.severity} Severity
                          </span>
                          <div className="text-right">
                            <span className="text-xs font-semibold text-slate-550 font-mono flex items-center justify-end">
                              <Clock className="h-3.5 w-3.5 mr-1 text-slate-400" />
                              +{inc.hoursBehind}h Gate delay
                            </span>
                            <span className="text-[11px] font-bold text-rose-650 font-mono block mt-1 leading-none">
                              Loss: ${calculateProjectedLoss(inc).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <h4 className="font-bold text-slate-900 mb-1 leading-snug">
                          {inc.title}
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-2 mt-4 text-xs pt-3 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400 block uppercase text-[9px] tracking-wider mb-0.5">Primary WMS Hub</span>
                            <span className="text-slate-705 font-bold">Maersk Inland Hub MX-1</span>
                          </div>
                          <div>
                            <span className="text-slate-405 block uppercase text-[9px] tracking-wider mb-0.5">Disruption Project</span>
                            <span className="text-amber-800 font-bold font-mono truncate block">
                              {inc.impactMetric}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT PANEL: COGNITIVE REBALANCER CONTROLS & GLASS BOX JUDGE REPORT (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
            
            {/* OPTIMIZER INPUT CARD */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              
              <div className="bg-gradient-to-r from-slate-50 to-white p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-5 w-5 text-blue-600 animate-pulse" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Autonomous Rebalancer Command Center</h3>
                    <p className="text-[11px] text-slate-500">Specify alternative stock parameters and invoke trajectory solver</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                
                {selectedIncident && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Alternative stock nodes selection */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-slate-705 uppercase tracking-widest block font-bold">
                        Select Substitution Buffer Node (Maersk WMS)
                      </label>
                      <select 
                        value={selectedBuffer}
                        onChange={(e) => setSelectedBuffer(e.target.value)}
                        className="w-full bg-white border border-slate-250 rounded-lg p-2.5 text-xs text-slate-800 font-medium outline-none focus:border-blue-600 transition font-mono"
                      >
                        {selectedIncident.alternativeBufferNodes.map((node) => (
                          <option key={node.warehouseName} value={node.warehouseName}>
                            {node.warehouseName} — Lead Time: {node.leadTimeHours}h | Stock: {node.stockCount.toLocaleString()} TEU | Route Cost: ${node.freightCostPerTeu.toLocaleString()}/TEU
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-blue-700 leading-snug">
                        Matches JIT delivery target requirements with safe localized reserve stocks.
                      </p>

                      {/* Alternative buffer cards showing comparison details */}
                      <div className="mt-3.5 space-y-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold leading-none">
                          Alternative Node Matrix (Time, Stock & Cost):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {selectedIncident.alternativeBufferNodes.map((node) => {
                            const isSelected = selectedBuffer === node.warehouseName;
                            return (
                              <div 
                                key={node.warehouseName}
                                onClick={() => setSelectedBuffer(node.warehouseName)}
                                className={`p-3 rounded-lg border transition cursor-pointer text-left ${
                                  isSelected 
                                    ? "bg-blue-50/55 border-blue-500 shadow-sm" 
                                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-center justify-between font-bold mb-1.5">
                                  <span className="text-xs text-slate-850 font-bold truncate block max-w-[150px]" title={node.warehouseName}>
                                    {node.warehouseName}
                                  </span>
                                  {isSelected && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
                                  )}
                                </div>
                                <div className="grid grid-cols-3 gap-1 text-[10.5px] font-mono text-slate-650">
                                  <div className="bg-white p-1 rounded border border-slate-150 shadow-sm text-center">
                                    <span className="text-slate-400 text-[8px] uppercase tracking-wider block">Time</span>
                                    <span className="font-bold text-slate-700">{node.leadTimeHours}h</span>
                                  </div>
                                  <div className="bg-white p-1 rounded border border-slate-150 shadow-sm text-center">
                                    <span className="text-slate-400 text-[8px] uppercase tracking-wider block">Stock</span>
                                    <span className="font-bold text-emerald-600">{node.stockCount.toLocaleString()}</span>
                                  </div>
                                  <div className="bg-white p-1 rounded border border-slate-150 shadow-sm text-center">
                                    <span className="text-slate-400 text-[8px] uppercase tracking-wider block">Cost</span>
                                    <span className="font-bold text-slate-750">${node.freightCostPerTeu}/TEU</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Labor Scheduling Policy */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-slate-755 uppercase tracking-widest block font-bold">
                        Shift Schedule Labor Allocation
                      </label>
                      <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-lg border border-slate-200 min-h-[46px] shadow-inner">
                        <input 
                          type="checkbox" 
                          id="overtimeLabor"
                          checked={overtimeLabor}
                          onChange={(e) => setOvertimeLabor(e.target.checked)}
                          className="h-4.5 w-4.5 border-slate-350 rounded text-blue-650 outline-none focus:ring-0 active:ring-0 cursor-pointer"
                        />
                        <label htmlFor="overtimeLabor" className="text-xs text-slate-700 cursor-pointer font-bold select-none cursor-pointer">
                          Compress shifts / Active temporary overtime WMS slots (+10% throughput)
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-505 leading-none">
                        Compensates for compressed gate-out arrival windows at fulfillment.
                      </p>
                    </div>
                  </div>
                )}

                {/* CALL TO ACTION BUTTON */}
                <div className="pt-2 space-y-3">
                  <button
                    disabled={isLoading}
                    onClick={runEvaluation}
                    className={`w-full py-4 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition flex items-center justify-center space-x-2 shadow cursor-pointer ${
                      isLoading 
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                        : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transition-all"
                    }`}
                    title="Run direct cognitive logistics simulations to verify savings and transit models"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-1 text-slate-300 pointer-events-none" />
                        <span>Finding alternative route options: {loadingStep || "Analyzing..."}</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4.5 w-4.5 mr-1" />
                        <span>Refresh to check additional Ports available</span>
                      </>
                    )}
                  </button>

                  {/* Operational Details explaining what this button does */}
                  <div className="bg-blue-50/40 border border-blue-200 rounded-lg p-3.5 text-xs text-slate-700 space-y-2 text-left">
                    <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center">
                      <Cpu className="h-3.5 w-3.5 mr-1.5 text-blue-600 animate-pulse" />
                      WMS SLA Trajectory Simulator Core Actions:
                    </div>
                    <p className="text-slate-600 leading-normal font-sans">
                      This trigger executes a server-side optimization model powered by predictive arrival data from <strong>Maersk Ocean Fleet Systems</strong> to feed straight into <strong>DP World CARGOES TOS+ (ZODIAC - Marine Operations module)</strong> to protect delivery time and prevent SLA breach costs:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 font-sans">
                      <li>
                        <strong>Delay Penalty Model:</strong> Quantifies accrued gate delay hours and compares them to contract SLA thresholds (${stats.totalDandDSaved.toLocaleString()} already protected).
                      </li>
                      <li>
                        <strong>Buffer Cost Analysis:</strong> Assesses transportation costs (${selectedIncident ? selectedIncident.alternativeBufferNodes[0]?.freightCostPerTeu : "0"}/TEU) and lead time offsets for alternative depot substitutions.
                      </li>
                      <li>
                        <strong>Live Hardware Integration & LLM Audit:</strong> Recommends AGV slots, and feeds predictive arrival data straight into <strong>DP World CARGOES TOS+ (ZODIAC)</strong> terminal orchestrator.
                      </li>
                    </ul>
                  </div>
                </div>

              </div>
            </div>

          </div>

          </div> {/* Grid wrapper close */}
        </section>        {/* SECTION 3: DP WORLD CARGOES LIVE FEED & SLA CONTRACT PARAMETERS */}
        {selectedIncident && (
          <section className="space-y-3 font-sans" id="live-manifest-feed">
            <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                <Layers className="h-4.5 w-4.5 mr-2 text-blue-600 animate-pulse" />
                DP World CARGOES TOS+ (ZODIAC - Marine Operations module) Live Feed & Contract Liabilities (Section 3)
              </h2>
              <p className="text-xs text-slate-655 mt-1 leading-relaxed">
                This section presents the real-time manifest and contractual liabilities integrated directly with <strong>Maersk Ocean Fleet Systems</strong> and fed straight into <strong>DP World CARGOES TOS+ (ZODIAC - Marine Operations module)</strong> for the <strong>{selectedIncident.portName}</strong> marine terminal:
                <strong> Strict SLA Parameters & Liabilities</strong> lists the corporate client, fulfillment deadline, daily SLA breach penalties, and demurrage detention (D&D) rates. 
                <strong> Unmitigated Delay Loss Indicator</strong> calculates accumulated delay costs relative to the delay duration, while 
                <strong> Stuck TEU Containers Manifest</strong> catalogs individual active container bills of lading waiting for gate-out clearance.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in text-left">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="h-4.5 w-4.5 text-blue-600" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">DP World CARGOES TOS+ (ZODIAC) Live Feed — {selectedIncident.portName}</h3>
                    <p className="text-[11px] text-slate-505">Terminal manifest and container status flags synced with Maersk Ocean Fleet Systems</p>
                  </div>
                </div>
                <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded uppercase font-bold font-mono">
                  TOS Live Sync
                </span>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Contract Constraints */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-755 mb-2.5 flex items-center">
                      <AlertOctagon className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                      Strict SLA Parameters & Liabilities
                    </h5>
                    <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-mono mb-3.5">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Corporate Client:</span>
                        <span className="text-slate-800 font-bold">{selectedIncident.contractRules.client}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Fulfillment Deadline:</span>
                        <span className="text-amber-705 font-bold">{selectedIncident.contractRules.deliverySLAHours} Hours JIT</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">SLA Breach Penalty:</span>
                        <span className="text-red-700 font-extrabold">${selectedIncident.contractRules.defaultPenaltyPerDay.toLocaleString()}/day</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">D&D demurrage rate:</span>
                        <span className="text-red-500 font-bold">${selectedIncident.contractRules.demurragePenaltyPerDay.toLocaleString()}/day</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Delay Financial Loss Indicator */}
                  <div className="bg-rose-50 border border-rose-100 rounded-lg p-3.5 flex items-center justify-between shadow-inner">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-mono block font-bold">Unmitigated Delay Loss:</span>
                      <span className="text-base font-black font-mono text-rose-600">
                        ${calculateProjectedLoss(selectedIncident).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 text-[10px] uppercase font-mono block">Accrued At:</span>
                      <span className="text-xs font-bold font-mono text-rose-700">+{selectedIncident.hoursBehind}h Gate Delay</span>
                    </div>
                  </div>
                </div>

                {/* Containers Stuck */}
                <div>
                  <h5 className="text-xs font-bold text-slate-705 uppercase tracking-widest mb-2.5 flex items-center">
                    <Ship className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                    Stuck TEU Containers Manifest ({selectedIncident.inboundContainers.length} Active Cargo Units)
                  </h5>
                  
                  <div className="space-y-2 max-h-[195px] overflow-y-auto pr-1">
                    {selectedIncident.inboundContainers.map((container) => (
                      <div key={container.id} className="p-3 bg-white rounded-lg border border-slate-150 flex items-center justify-between hover:border-slate-350 transition shadow-inner">
                        <div className="space-y-0.5 text-left">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-blue-605 font-extrabold text-sm">{container.id}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded uppercase font-mono">{container.carrier}</span>
                          </div>
                          <p className="text-xs text-slate-755 font-semibold">{container.cargo} <span className="text-slate-400 font-mono text-[10px]">({container.qty.toLocaleString()} units)</span></p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-2.5 py-0.8 rounded font-mono border uppercase tracking-wider ${
                            container.priority === "Critical" ? "bg-red-50 text-red-700 border-red-200" :
                            container.priority === "High" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            {container.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* LIVE TRAJECTORY EVALUATION OUTCOME (FULL-WIDTH INSIGHTS BLOCK) */}
        <AnimatePresence mode="wait">
          {(isLoading || evaluationResult) && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
              id="evaluation-outcome-grid"
            >
              <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-200">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                  <ShieldCheck className="h-4.5 w-4.5 mr-2 text-emerald-605 animate-pulse" />
                  SLA-Shield Trajectory Verdict & Action Directives (Interactive Trajectory Outcome)
                </h2>
                <p className="text-xs text-slate-655 mt-1 leading-relaxed">
                  Displays the real-time outcome of our <strong>Glass-Box LLM audit trail</strong> once triggered. It outlines vital decision metrics including <strong>Audit Outcome Scores</strong>, a comparative <strong>Trajectory Cost Ledger</strong> illustrating financial delta projections, and active <strong>Automated Crane/AGV directives</strong> generated directly from <strong>Maersk Ocean Fleet Systems</strong> predictive arrival telemetry and fed straight into <strong>DP World CARGOES TOS+ (ZODIAC - Marine Operations module)</strong> terminal dispatcher.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden text-left">
                {isLoading ? (
                <div className="p-8 text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center font-bold">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
                    <Cpu className="h-6 w-6 text-blue-600 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base">Glass-Box Trajectory Evaluator Active</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                      Correlating real-time customs delays at {selectedIncident?.portName} against JIT contract parameters using Gemini 3.5...
                    </p>
                  </div>
                  <div className="inline-flex items-center space-x-2 bg-blue-50 py-2 px-4 rounded-lg font-mono text-xs text-blue-800 border border-blue-100">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    <span>STATUS: {loadingStep}</span>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {/* Title Bar indicating Judge Status */}
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="bg-blue-600 p-1.5 rounded text-white shadow-sm">
                        <Cpu className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">Glass-Box Trajectory Evaluation Result</span>
                        <h4 className="font-bold text-slate-900 text-sm leading-none mt-0.5">SLA-Shield Decision Trajectory Output</h4>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Decision:</span>
                      <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase font-mono tracking-wider border ${
                        evaluationResult.judgeDecision === "APPROVED" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-250 animate-pulse" 
                          : "bg-amber-50 text-amber-700 border-amber-250"
                      }`}>
                        {evaluationResult.judgeDecision}
                      </span>
                    </div>
                  </div>

                  {/* Body Content of Outcome - Layout out in a Beautiful Bento Grid */}
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left stats & financial indicators (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                      
                      {/* Audit Score Dashboard */}
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-405 uppercase tracking-wider mb-2.5 font-mono">Audit Outcome Scores</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-inner">
                            <span className="text-slate-400 text-[9px] uppercase tracking-wider block mb-0.5 font-semibold">Feasibility Rate</span>
                            <span className="text-lg font-black font-mono text-blue-600">{evaluationResult.auditScores?.feasibility}%</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-inner">
                            <span className="text-slate-400 text-[9px] uppercase tracking-wider block mb-0.5 font-semibold">SLA Compliance</span>
                            <span className="text-lg font-black font-mono text-emerald-600">{evaluationResult.auditScores?.slaCompliance}%</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-inner">
                            <span className="text-slate-400 text-[9px] uppercase tracking-wider block mb-0.5 font-semibold">Benefit Ratio</span>
                            <span className="text-lg font-black font-mono text-amber-600">{evaluationResult.auditScores?.savingEfficiencyRatio}x</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-inner">
                            <span className="text-slate-400 text-[9px] uppercase tracking-wider block mb-0.5 font-semibold">Residual Risk</span>
                            <span className="text-lg font-black font-mono text-rose-600">{evaluationResult.auditScores?.residualRiskScore}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Financial Comparison Ledger */}
                      <div className="space-y-3">
                        <h5 className="text-[11px] font-bold text-slate-405 uppercase tracking-wider font-mono">Trajectory Cost Ledger</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono">
                            <span className="text-slate-500 text-[9px] uppercase block mb-0.5">Unmitigated Penalty</span>
                            <span className="text-base font-extrabold text-red-700">
                              ${evaluationResult.costAnalysis?.projectedPenaltyWithoutShield?.toLocaleString() || "0"}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono">
                            <span className="text-slate-500 text-[9px] uppercase block mb-0.5">Mitigation Cost</span>
                            <span className="text-base font-extrabold text-amber-700">
                              ${evaluationResult.costAnalysis?.mitigationCost?.toLocaleString() || "0"}
                            </span>
                          </div>
                          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 font-mono">
                            <span className="text-emerald-700 text-[9px] uppercase block font-semibold mb-0.5">Loss Avoided</span>
                            <span className="text-base font-black text-emerald-650 font-bold">
                              ${evaluationResult.costAnalysis?.netFinancialLossAvoided?.toLocaleString() || "0"}
                            </span>
                          </div>
                        </div>

                        {/* Performance split notice */}
                        <div className="p-3 bg-blue-50 border border-blue-150 rounded-lg text-xs text-blue-800 font-medium">
                          <span className="font-mono text-[9px] uppercase block font-bold text-blue-600 tracking-wider mb-0.5">Profit Share:</span>
                          We accrued <span className="font-bold underline text-slate-900">${evaluationResult.costAnalysis?.performanceFeeEarned?.toLocaleString() || "0"}</span> (30% share) for protecting the SLA contract.
                        </div>
                      </div>

                    </div>

                    {/* Right logs & directives (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      {/* Decision Trajectory Steps */}
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-405 uppercase tracking-wider mb-2.5 font-mono">Decision Trajectory Audit Trail</h5>
                        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-2.5 max-h-[170px] overflow-y-auto shadow-inner">
                          {evaluationResult.decisionTrajectorySteps?.map((step: string, idx: number) => (
                            <div key={idx} className="flex items-start text-xs space-x-2.5">
                              <span className="bg-white text-slate-500 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200 shrink-0 shadow-sm">
                                STEP {idx + 1}
                              </span>
                              <p className="text-slate-700 leading-snug font-medium">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Combined Directives & Playbooks */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* MCP WMS Directives */}
                        {evaluationResult.mcpHardwarePriorityInstructions && (
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between shadow-sm">
                            <div>
                              <span className="text-[9px] font-mono text-slate-400 uppercase block tracking-wider font-semibold mb-2">Automated MCP Directives</span>
                              <div className="space-y-2 text-[11px] font-mono text-slate-700">
                                <div>
                                  <span className="text-slate-400 text-[9px] block uppercase">Crane Command:</span>
                                  <span className="font-semibold text-blue-750 leading-tight block">{evaluationResult.mcpHardwarePriorityInstructions.smartCraneCommand}</span>
                                </div>
                                <div className="pt-1">
                                  <span className="text-slate-400 text-[9px] block uppercase">Active AGV Lane:</span>
                                  <span className="font-semibold text-slate-800">{evaluationResult.mcpHardwarePriorityInstructions.shuttleRoutingLane}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* SOP Memory log */}
                        {evaluationResult.operationalPlaybookRecommendation && (
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between shadow-sm">
                            <div>
                              <span className="text-[9px] font-mono text-slate-400 uppercase block tracking-wider font-semibold mb-2 font-mono">SOP Playbook Entry</span>
                              <p className="text-xs text-slate-600 italic font-medium leading-relaxed">
                                "{evaluationResult.operationalPlaybookRecommendation}"
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                </div>
              )}
              </div> {/* Close white card container */}
            </motion.section>
          )}
        </AnimatePresence>

        {/* SECTION 4: PHYSICAL WAREHOUSE EQUIPMENT QUEUE & HISTORIC PROCEDURAL MEMORY */}
        <section className="space-y-3" id="hardware-and-memories">
          <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
              <Layers className="h-4.5 w-4.5 mr-2 text-indigo-655 animate-pulse" />
              WMS Operating Queues & Historic Procedural Memories (Section 4)
            </h2>
            <p className="text-xs text-slate-655 mt-1 leading-relaxed">
              This system operations monitor establishes direct integration with terminal execution hardware, linking <strong>Maersk Ocean Fleet Systems</strong> predictive arrival telemetry directly with live handling queues inside <strong>DP World CARGOES TOS+ (ZODIAC - Marine Operations module)</strong>: 
              <strong> Left: WMS/TMS Hardware Operating Queues</strong> provides direct control loops for Smart-Cranes and container AGVs. It includes an <strong>Operator Priority Overwrite</strong> form to manually prioritize gate tasks, crane slots, and assign specific container handling styles. 
              <strong> Right: SLA-Shield Procedural Memories</strong> displays long-term SOP records detailing how historic bottlenecks were identified, which alternative routes/substitutions were made, and the financial benefit outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* MCP HARDWARE HARD SYSTEMS QUEUE OVERRIDE (6 COLS) */}
            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-left">
            
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">WMS/TMS Hardware Operating Queues</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Direct API connection to Smart-Cranes and AGVs</p>
                </div>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded font-mono uppercase font-bold">
                MCP Layer Active
              </span>
            </div>

            <div className="p-4 space-y-4">
              
              <div className="space-y-2.5">
                {hardwareQueue.map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shadow-inner">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black font-mono text-blue-705">{item.containerId}</span>
                        <span className="text-[10px] text-slate-405">({item.originPort})</span>
                      </div>
                      <div className="text-xs text-slate-700">
                        <span className="text-slate-400 text-[10px] uppercase">Smart Crane Unload Slot:</span>{" "}
                        <span className="font-mono text-blue-600 font-semibold">{item.estimatedUnload}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      <div className="text-xs">
                        <span className="text-slate-400 text-[10px] block uppercase">AGV Assigned</span>
                        <span className="text-slate-800 font-mono font-bold">{item.agvAssigned}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase font-mono tracking-wide border ${
                        item.status.includes("AI") || item.status.includes("Priority")
                          ? "bg-blue-50 text-blue-700 border-blue-250 animate-pulse animate-pulse" 
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Crane Manual Dispatcher Override Forms */}
              <div className="pt-2 border-t border-slate-150 p-3 bg-slate-50 rounded-lg">
                <h5 className="text-xs font-bold text-slate-805 uppercase tracking-widest mb-3.5 flex items-center">
                  <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                  Operator Priority Overwrite
                </h5>

                <form onSubmit={submitCustomGate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-405 uppercase tracking-widest block font-bold">Container ID</span>
                    <input 
                      type="text"
                      placeholder="e.g. MSK-882039"
                      value={manualContainerId}
                      onChange={(e) => setManualContainerId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-650 shadow-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-405 uppercase tracking-widest block font-bold">Customs Status</span>
                    <select
                      value={manualStatus}
                      onChange={(e) => setManualStatus(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-1.5 py-1.5 text-xs text-slate-800 outline-none shadow-sm"
                    >
                      <option value="Customs Priority Cleared">Customs Priority Cleared</option>
                      <option value="AGV Fast Route Stacked">AGV Fast Route Stacked</option>
                      <option value="SLA Critical VIP Gate-Out">SLA Critical VIP Gate</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button 
                      type="submit"
                      disabled={!manualContainerId}
                      className="w-full py-1.5 bg-slate-900 hover:bg-black text-white rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      Inject Command
                    </button>
                  </div>
                </form>

                {manualMessage && (
                  <p className="text-xs text-emerald-600 font-mono mt-3 text-center font-bold">{manualMessage}</p>
                )}
              </div>

            </div>
          </div>

          {/* HISTORICAL WORKFLOW MEMORIES (6 COLS) */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4.5 w-4.5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">SLA-Shield Procedural Memories</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Extracted successful resolution tactics from historic disruptions</p>
                </div>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded font-mono uppercase font-bold">
                Long-Term SOP
              </span>
            </div>

            <div className="p-4 space-y-3.5">
              <p className="text-xs text-slate-500 leading-relaxed">
                The agent keeps log records of past congestion bottlenecks, updating its system playbook to formulate optimized actions automatically.
              </p>

              <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1">
                {proceduralMemories.map((mem) => (
                  <div key={mem.incidentId} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 shadow-inner">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-blue-700 font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded uppercase">
                        {mem.incidentId}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{mem.timestamp}</span>
                    </div>

                    <h5 className="font-bold text-slate-800 text-xs mb-1 leading-tight">{mem.scenario}</h5>
                    <div className="text-xs space-y-1 mt-2.5">
                      <p className="text-slate-500">
                        <strong className="text-slate-400 uppercase text-[9px] block">Trigger Disruption:</strong>
                        {mem.rootCause}
                      </p>
                      <p className="text-slate-705 font-bold bg-white p-2 text-[11px] italic mt-1.5 leading-snug border border-slate-100 shadow-sm">
                        "{mem.resolutionPlaybook}"
                      </p>
                      <p className="text-emerald-700 font-bold font-mono text-[11px] mt-2 text-right">
                        ✓ {mem.financialBenefit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          </div> {/* Grid wrapper close */}
        </section>
          </>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white text-slate-500 py-8 text-center text-xs mt-12 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-mono text-blue-600 uppercase tracking-widest text-[10px] font-bold">
            SLA-Shield Enterprise Port Control System v3.12
          </p>
          <p>© 2026 SLA-Shield &amp; B2B Port Logistics Corp. Powered by Level 2/3 Strategic Problem-Solver Agents.</p>
          <div className="flex justify-center space-x-6 pt-2 text-slate-405 font-mono">
            <span>DP World CARGOES Integration: APPROVED</span>
            <span>-</span>
            <span>Maersk Contract Logistics WMS: CONNECTED</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

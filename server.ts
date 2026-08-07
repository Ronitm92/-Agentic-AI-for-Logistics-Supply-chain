import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Standard port is 3000
const PORT = 3000;
const app = express();

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// -------------------------------------------------------------
// Logistics Scenarios & State Data Store
// -------------------------------------------------------------
let operationalStats = {
  totalDandDSaved: 184500, // in dollars
  revenueShareAccrued: 55350, // 30% metric fee
  slasProtectedCount: 42,
  activeContainersInRoute: 18,
  activeSubscriptionTier: "SLA-on-Demand Premium",
};

// Historical log database of procedural memories
let proceduralMemories = [
  {
    incidentId: "pr-mem-01",
    scenario: "Inbound Congestion - LA Port Strike 2025",
    rootCause: "Longshoremen cargo terminal gate lockout",
    resolutionPlaybook: "Diverted key Microcontroller shipments to Maersk Hub 3; auto-prioritized chassis slot 14 via smart-shuttle crane.",
    financialBenefit: "$43,000 saved, zero downstream assembly downtime.",
    timestamp: "2025-11-12",
  },
  {
    incidentId: "pr-mem-02",
    scenario: "Rotterdam Substation Crane Blackout",
    rootCause: "Primary power terminal grid failure",
    resolutionPlaybook: "SLA-Shield matched priority 1 Medical Tubes and pulled safe buffer inventory from Leipzig Node, saving critical deliveries.",
    financialBenefit: "$120,000 penalites avoided.",
    timestamp: "2026-03-01",
  }
];

// Current scenario dataset
const logisticsIncidents = [
  {
    id: "shanghai-typhoon",
    title: "Shanghai Sino-Logistics Terminal (CNSHG) - Typhoon Chanthu Congestion",
    portName: "Sino-Logistics Terminal, Shanghai Port",
    severity: "Critical",
    hoursBehind: 96,
    impactMetric: "Warehouse stockout projected in 48h (D&D liability: $14,000/day)",
    contractRules: {
      client: "Global Semiconductor Corp",
      deliverySLAHours: 48,
      defaultPenaltyPerDay: 15000,
      demurrageGraceDays: 3,
      demurragePenaltyPerDay: 3500,
    },
    inboundContainers: [
      { id: "MSK-774921", carrier: "Maersk", priority: "Critical", cargo: "Microconductors (ASIC Chips)", qty: 25000, targetWMS: "Maersk Inland Hub MX-1" },
      { id: "SNO-338291", carrier: "COSCO", priority: "High", cargo: "High-Capacity Battery Cells", qty: 4200, targetWMS: "Maersk Inland Hub MX-1" },
      { id: "DPW-819202", carrier: "MSC", priority: "Regular", cargo: "Lithium Polymer Packaging Caps", qty: 15000, targetWMS: "Maersk Inland Hub MX-2" }
    ],
    alternativeBufferNodes: [
      { warehouseName: "Alternative Hub EU-Central (Schenker)", stockCount: 18000, freightCostPerTeu: 1800, leadTimeHours: 18 },
      { warehouseName: "West Coast Buffer Node B", stockCount: 6500, freightCostPerTeu: 3400, leadTimeHours: 12 }
    ]
  },
  {
    id: "la-long-beach-strike",
    title: "LA / Long Beach Port (USLAX) - Custom Clearance Labor Shortage",
    portName: "Fenix Marine Services Terminal, LA Port",
    severity: "High",
    hoursBehind: 72,
    impactMetric: "Downstream automotive assembly line deadlock within 36h",
    contractRules: {
      client: "Alpha Motors Manufacturing",
      deliverySLAHours: 36,
      defaultPenaltyPerDay: 25000,
      demurrageGraceDays: 2,
      demurragePenaltyPerDay: 5000,
    },
    inboundContainers: [
      { id: "MSK-558291", carrier: "Maersk", priority: "Critical", cargo: "Stamping Steel Components", qty: 180, targetWMS: "Maersk Inland Hub MX-1" },
      { id: "MSC-019382", carrier: "MSC", priority: "High", cargo: "Chassis Control Boards", qty: 5000, targetWMS: "Maersk Inland Hub MX-1" }
    ],
    alternativeBufferNodes: [
      { warehouseName: "Houston Logistic Node C", stockCount: 8000, freightCostPerTeu: 2200, leadTimeHours: 24 },
      { warehouseName: "Ensenada Cross-Dock Hub", stockCount: 3000, freightCostPerTeu: 4500, leadTimeHours: 16 }
    ]
  },
  {
    id: "rotterdam-harbor-power",
    title: "Rotterdam Sector 4 (NLRTM) - Smart Crane Operating Outage",
    portName: "ECT Delta Terminal, Rotterdam",
    severity: "Medium",
    hoursBehind: 28,
    impactMetric: "Reefer cooling deadline threat on premium cosmetics",
    contractRules: {
      client: "Euro-Lux Cosmetics Group",
      deliverySLAHours: 24,
      defaultPenaltyPerDay: 8000,
      demurrageGraceDays: 4,
      demurragePenaltyPerDay: 2000,
    },
    inboundContainers: [
      { id: "SNO-904112", carrier: "Hapag-Lloyd", priority: "High", cargo: "Active Cosmetic Base Serum", qty: 12000, targetWMS: "Maersk Inland Hub MX-2" }
    ],
    alternativeBufferNodes: [
      { warehouseName: "Antwerp Buffer Node Alpha", stockCount: 15000, freightCostPerTeu: 950, leadTimeHours: 8 }
    ]
  }
];

// Active Hardware Crane Queue simulating MCP control commands
let simulatedHardwareQueue = [
  { containerId: "MSK-774921", originPort: "Shanghai Port", estimatedUnload: "Immediate (AI Priority Slot 1)", status: "Customs Priority Cleared", agvAssigned: "AGV-04-Auto" },
  { containerId: "SNO-338291", originPort: "Shanghai Port", estimatedUnload: "Immediate (AI Priority Slot 2)", status: "Customs Priority Cleared", agvAssigned: "AGV-08-Auto" },
  { containerId: "DPW-819202", originPort: "Shanghai Port", estimatedUnload: "Standard Queue (+28 hours)", status: "Terminal In-Gate Queue", agvAssigned: "Unassigned" }
];

// -------------------------------------------------------------
// REST API Core Definitions
// -------------------------------------------------------------

// 1. Live status statistics
app.get("/api/dashboard/stats", (req, res) => {
  res.json({
    status: "ok",
    stats: operationalStats,
    hardwareQueue: simulatedHardwareQueue
  });
});

// 2. Incident list
app.get("/api/incidents", (req, res) => {
  res.json({
    status: "ok",
    incidents: logisticsIncidents,
    proceduralMemories: proceduralMemories
  });
});

// 3. Hardware Priority Update
app.post("/api/hardware/priority", (req, res) => {
  const { containerId, targetStatus, agvId } = req.body;
  
  const targetIndex = simulatedHardwareQueue.findIndex(c => c.containerId === containerId);
  if (targetIndex !== -1) {
    simulatedHardwareQueue[targetIndex].status = targetStatus || "AI Dispatched Priority";
    simulatedHardwareQueue[targetIndex].estimatedUnload = "Custom Priority Slot Assigned";
    if (agvId) {
      simulatedHardwareQueue[targetIndex].agvAssigned = agvId;
    }
  } else {
    // Add to hardware queue representing custom command
    simulatedHardwareQueue.unshift({
      containerId,
      originPort: "Terminal Override Gate",
      estimatedUnload: "Priority Override Active",
      status: targetStatus || "Customs Priority Cleared",
      agvAssigned: agvId || "AGV-Manual"
    });
  }

  // Record mock operational gains
  operationalStats.totalDandDSaved += 4500;
  operationalStats.revenueShareAccrued += 1350;

  res.json({
    status: "ok",
    message: `MCP priority queue successfully overridden for Container ${containerId}. Crane lock instructed.`,
    hardwareQueue: simulatedHardwareQueue,
    stats: operationalStats
  });
});

// 4. Glass-Box Trajectory Evaluation & Inventory Rebalance Solver
app.post("/api/rebalance", async (req, res) => {
  const { incidentId, selectedBufferWarehouse, overtimeLaborConfirmed } = req.body;
  
  const incident = logisticsIncidents.find(i => i.id === incidentId);
  if (!incident) {
    return res.status(404).json({ error: "Disruption incident profile not found" });
  }

  const client = getGeminiClient();
  const isMocked = !client;

  // Let's model a robust prompt parameters to send to the Judge
  const parentIncidentTitle = incident.title;
  const criticalCargos = incident.inboundContainers.map(c => `${c.id} carrying ${c.cargo} (${c.priority})`).join(", ");
  const penaltySpecs = JSON.stringify(incident.contractRules);
  const bufferSpecs = JSON.stringify(incident.alternativeBufferNodes);
  const selectedBuffer = selectedBufferWarehouse || (incident.alternativeBufferNodes[0]?.warehouseName || "Primary Buffer Vault");

  const prompt = `You are the 'SLA-Shield' LLM-as-a-Judge Trajectory Evaluator for a B2B Ports Logistics company.
Assess and audit an automated decision to rebalancer inventory / reroute cargo due to the following port delay.

PORT DISRUPTION CONTEXT:
Scenario: ${parentIncidentTitle}
Severity: ${incident.severity}
Current Port Delay: ${incident.hoursBehind} hours
Critical Cargo Under Liability: ${criticalCargos}
Contract Penalty Rules (SLA constraints): ${penaltySpecs}
Target Buffer Options and Stock Details: ${bufferSpecs}
Operator Selected Rebalancing Node: ${selectedBuffer}
Overtime Labor Scheduled: ${overtimeLaborConfirmed ? "Yes (Shift compression enabled)" : "No (Standard operator shifts)"}

Execute a detailed multi-step Glass-Box Trajectory Evaluation. Calculate the precise financial trade-offs of this action compared to waiting out container demurrage at the terminal. Your output must be a valid JSON object matching the following TypeScript schema:

{
  "judgeDecision": "APPROVED" | "DENIED" | "FLAGGED FOR EXCEPTION",
  "auditScores": {
    "feasibility": number (0 to 100),
    "slaCompliance": number (0 to 100),
    "savingEfficiencyRatio": number (cost-benefit ratio e.g., 2.45),
    "residualRiskScore": number (0 to 100)
  },
  "costAnalysis": {
    "projectedPenaltyWithoutShield": number (D&D and SLA penalty cost in dollars if nothing is done),
    "mitigationCost": number (cost to pull buffer stock, transport fee, and shift overtime labor),
    "netFinancialLossAvoided": number (without-shield penalty minus mitigation cost),
    "performanceFeeEarned": number (30% performance fee share earned on the saved amount)
  },
  "decisionTrajectorySteps": string[] (Array detailing step-by-step audit, e.g. "Step 1: Analyzed gate delays at Sino-Logistics Terminal.", "Step 2: Calculated alternative transport fees for selected buffer node.", "Step 3: Audited overtime warehouse shift rate against contract line delay penalties.", ...),
  "mcpHardwarePriorityInstructions": {
    "smartCraneCommand": string,
    "shuttleRoutingLane": string,
    "agvPriorityContainerId": string
  },
  "operationalPlaybookRecommendation": string (Suggested SOP playbook for future memories)
}

Be analytical and precise with calculations. Return ONLY the raw JSON block without markdown formatting or code blocks. Ensure there are no comments in the JSON.`;

  try {
    if (!isMocked && client) {
      // Call the Google GenAI SDK
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
          systemInstruction: "You are an expert AI logistics judge. You evaluate supply-chain routing, demurrage mitigation, WMS buffer transfers, and SLA penalties. Your analysis is transparent, glass-box transparent, and highly robust."
        }
      });

      const responseText = response.text || "{}";
      const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedAudit = JSON.parse(cleanedJson);

      // Accumulate the operational savings
      const savedAmount = parsedAudit.costAnalysis?.netFinancialLossAvoided || 45000;
      operationalStats.totalDandDSaved += savedAmount;
      operationalStats.revenueShareAccrued += (savedAmount * 0.3);
      operationalStats.slasProtectedCount += 1;

      // Unshift a new memory to database
      proceduralMemories.unshift({
        incidentId: `pr-mem-${Date.now().toString().slice(-4)}`,
        scenario: incident.title,
        rootCause: `Port Delays: ${incident.hoursBehind}h`,
        resolutionPlaybook: parsedAudit.operationalPlaybookRecommendation || "Redirected parts via optimized cross-node WMS buffer lanes.",
        financialBenefit: `$${savedAmount.toLocaleString()} SLA Penalty saved.`,
        timestamp: new Date().toISOString().substring(0, 10),
      });

      return res.json({
        status: "ok",
        evaluationMode: "Gemini-3.5-Flash Judge",
        audit: parsedAudit,
        updatedStats: operationalStats,
        memories: proceduralMemories
      });
    } else {
      // High fidelity fallback simulation
      const baseFeeWithoutShield = (incident.hoursBehind / 24) * incident.contractRules.defaultPenaltyPerDay + 
                                   (Math.max(0, (incident.hoursBehind / 24) - incident.contractRules.demurrageGraceDays)) * incident.contractRules.demurragePenaltyPerDay;
      const rebalancingCost = 3500 + (overtimeLaborConfirmed ? 1200 : 0);
      const savedLoss = Math.round(baseFeeWithoutShield - rebalancingCost);
      const performanceFee = Math.round(savedLoss * 0.3);

      const mockAudit = {
        judgeDecision: "APPROVED",
        auditScores: {
          feasibility: 94,
          slaCompliance: 98,
          savingEfficiencyRatio: parseFloat((baseFeeWithoutShield / rebalancingCost).toFixed(2)) || 5.1,
          residualRiskScore: 12
        },
        costAnalysis: {
          projectedPenaltyWithoutShield: Math.round(baseFeeWithoutShield),
          mitigationCost: rebalancingCost,
          netFinancialLossAvoided: savedLoss,
          performanceFeeEarned: performanceFee
        },
        decisionTrajectorySteps: [
          `Audited port gate timeline of ${incident.hoursBehind}h at ${incident.portName}.`,
          `Computed high-priority containment risk for cargo: ${incident.inboundContainers[0]?.cargo}.`,
          `Elected alternate logistics buffer sourcing via ${selectedBuffer}.`,
          `Estimated cross-docking labor allocation with local warehouse shift rules.`,
          `Audited cost tradeoff: Sourcing buffer stock ($${rebalancingCost.toLocaleString()}) eliminates major B2B SLA penalty of $${Math.round(baseFeeWithoutShield).toLocaleString()}.`
        ],
        mcpHardwarePriorityInstructions: {
          smartCraneCommand: `Priority Slot Lock instructed to Terminal Crane ECT-B for container: ${incident.inboundContainers[0]?.id || "MSK-774921"}`,
          shuttleRoutingLane: "High-Priority Cross Docking Lane Alpha",
          agvPriorityContainerId: incident.inboundContainers[0]?.id || "MSK-774921"
        },
        operationalPlaybookRecommendation: `Redirect ${incident.inboundContainers[0]?.cargo} via alternative node ${selectedBuffer} with immediate shift compression on delivery arrival window.`
      };

      // Accumulate the operational savings
      operationalStats.totalDandDSaved += savedLoss;
      operationalStats.revenueShareAccrued += performanceFee;
      operationalStats.slasProtectedCount += 1;

      // Add to memories
      proceduralMemories.unshift({
        incidentId: `pr-mem-${Date.now().toString().slice(-4)}`,
        scenario: incident.title,
        rootCause: `Port Delays: ${incident.hoursBehind}h (Simulated Solver)`,
        resolutionPlaybook: mockAudit.operationalPlaybookRecommendation,
        financialBenefit: `$${savedLoss.toLocaleString()} SLA Penalty saved.`,
        timestamp: new Date().toISOString().substring(0, 10),
      });

      return res.json({
        status: "ok",
        evaluationMode: "Cognitive Shield Deterministic Evaluator (No API Key)",
        audit: mockAudit,
        updatedStats: operationalStats,
        memories: proceduralMemories
      });
    }
  } catch (err: any) {
    console.error("Gemini Solver Error:", err);
    res.status(500).json({ error: "Failed to compile the SLA audit evaluation", message: err.message });
  }
});


// -------------------------------------------------------------
// Smart Empty Container Redistribution State & API
// -------------------------------------------------------------

let emptyHubs = [
  { code: "USLAX", name: "Fenix Marine Services Terminal, LA Port", balance: 4500, status: "Surplus", occupancy: 92, trend: "+12% MoM Surplus" },
  { code: "CNSHG", name: "Sino-Logistics Terminal, Shanghai Port", balance: -3100, status: "Deficit", occupancy: 44, trend: "-22% MoM Deficit" },
  { code: "NLRTM", name: "ECT Delta Terminal, Rotterdam", balance: 1200, status: "Surplus", occupancy: 85, trend: "Stable" },
  { code: "SGSIN", name: "PSA Pasir Panjang Terminal, Singapore", balance: -1500, status: "Deficit", occupancy: 50, trend: "-8% MoM Deficit" },
  { code: "AEJEA", name: "Jebel Ali Terminal 3, Dubai", balance: 800, status: "Surplus", occupancy: 78, trend: "+4% MoM Stable" }
];

let evacuationVoyages = [
  {
    id: "VOY-MSK-EV-01",
    vessel: "Maersk McKinney Moller",
    origin: "USLAX",
    destination: "CNSHG",
    qty: 1500,
    costAvoided: 210000,
    co2Saved: 320,
    status: "Ready to Sync",
    smartStowSynced: false,
    housekeepingEfficiency: 0,
    smartCraneDirectives: [] as string[]
  },
  {
    id: "VOY-MSK-EV-02",
    vessel: "Geronimo Maersk",
    origin: "NLRTM",
    destination: "CNSHG",
    qty: 800,
    costAvoided: 112000,
    co2Saved: 180,
    status: "Ready to Sync",
    smartStowSynced: false,
    housekeepingEfficiency: 0,
    smartCraneDirectives: [] as string[]
  },
  {
    id: "VOY-MSK-EV-03",
    vessel: "Albert Maersk",
    origin: "AEJEA",
    destination: "SGSIN",
    qty: 600,
    costAvoided: 84000,
    co2Saved: 135,
    status: "Synced & Pre-Staging",
    smartStowSynced: true,
    housekeepingEfficiency: 94,
    smartCraneDirectives: [
      "CARGOES Smart Housekeeping: Auto-Staging activated for Row 18, Block D.",
      "ZMS directive: Clear gate slot G5 for empty drayage shuttle entry.",
      "Smart Stow: Pre-stage 300 boxes at seaward crane block ECT-4."
    ]
  }
];

let cargoesYardPreStagingQueue = [
  { containerId: "MSK-MT-1002", size: "40ft Dry", currentSlot: "YARD-B4-R1-S2", targetStagingSlot: "STAGING-GATE-G5", status: "Pre-Staging Locked", doubleHandlingAvoided: "Yes (spatial ML optimization)" },
  { containerId: "MSK-MT-4089", size: "20ft Dry", currentSlot: "YARD-C2-R5-S1", targetStagingSlot: "STAGING-CRANE-C1", status: "Pre-Staging Locked", doubleHandlingAvoided: "Yes (ZMS spatial plan)" },
  { containerId: "MSK-MT-7744", size: "40ft Dry", currentSlot: "YARD-A1-R2-S4", targetStagingSlot: "STAGING-GATE-G5", status: "In Route to Gate", doubleHandlingAvoided: "Yes (Smart Stow slot)" }
];

// 1. Get empty container redistribution details
app.get("/api/empty-redistribution/data", (req, res) => {
  res.json({
    status: "ok",
    hubs: emptyHubs,
    voyages: evacuationVoyages,
    preStagingQueue: cargoesYardPreStagingQueue
  });
});

// 2. Push empty container evacuation list via EDI/API
app.post("/api/empty-redistribution/push", async (req, res) => {
  const { voyageId } = req.body;
  const voyage = evacuationVoyages.find(v => v.id === voyageId);
  if (!voyage) {
    return res.status(404).json({ error: "Evacuation voyage profile not found" });
  }

  const client = getGeminiClient();
  const isMocked = !client;

  const originHub = emptyHubs.find(h => h.code === voyage.origin);
  const destHub = emptyHubs.find(h => h.code === voyage.destination);

  const prompt = `You are a Senior Logistics Integration Orchestrator. 
Sync the following empty container evacuation voyage from Maersk Ocean Fleet Systems to DP World's CARGOES TOS+ (ZODIAC) and CARGOES Smart Housekeeping modules:

VOYAGE CONTEXT:
Vessel: ${voyage.vessel}
Voyage ID: ${voyage.id}
Origin: ${originHub?.name} (${voyage.origin}) [Current Surplus: ${originHub?.balance} TEUs]
Destination: ${destHub?.name} (${voyage.destination}) [Current Deficit: ${destHub?.balance} TEUs]
Evacuation Quantity Requested: ${voyage.qty} empty container units
Cost Avoided by Eliminating Ghost Voyage: $${voyage.costAvoided}
CO2 Saved: ${voyage.co2Saved} Metric Tons

MAERSK AI INPUT: ML forecast models container deficit at destination. Pushes container list to DP World TOS+ via EDI/API.
DP WORLD CARGOES SMART HOUSEKEEPING INPUT: Arranges empty containers dynamically inside the yard using spatial ML to prevent double-handling.

Please generate:
1. An optimization stowage sync evaluation.
2. A list of 3-4 specific Smart Crane & Yard Stow directives to match this vessel's arrival.
3. 3 container pre-staging records that have been optimized to avoid double-handling.

Return a valid JSON object matching this schema:
{
  "housekeepingEfficiency": number (e.g. 96),
  "smartCraneDirectives": string[],
  "preStagedContainers": [
    {
      "containerId": string,
      "size": string,
      "currentSlot": string,
      "targetStagingSlot": string,
      "status": string,
      "doubleHandlingAvoided": string
    }
  ]
}

Only return raw JSON without markdown syntax. No comments in the JSON.`;

  try {
    if (!isMocked && client) {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
          systemInstruction: "You are an expert AI logistics stowing engine. You output spatial stowing plans and crane directives that integrate Maersk's ML forecast deficits with DP World's CARGOES Smart Housekeeping algorithms."
        }
      });

      const responseText = response.text || "{}";
      const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);

      // Update voyage state in memory
      voyage.status = "Synced & Pre-Staging";
      voyage.smartStowSynced = true;
      voyage.housekeepingEfficiency = parsed.housekeepingEfficiency || 95;
      voyage.smartCraneDirectives = parsed.smartCraneDirectives || [];

      // Append generated pre-staged containers to active queue
      if (parsed.preStagedContainers && parsed.preStagedContainers.length > 0) {
        cargoesYardPreStagingQueue = [
          ...parsed.preStagedContainers,
          ...cargoesYardPreStagingQueue
        ];
      }

      // Add to overall stats as operational gains
      operationalStats.totalDandDSaved += voyage.costAvoided;
      operationalStats.revenueShareAccrued += (voyage.costAvoided * 0.3);

      res.json({
        status: "ok",
        evaluationMode: "Gemini-3.5-Flash SmartStow Solver",
        voyage,
        preStagingQueue: cargoesYardPreStagingQueue,
        updatedStats: operationalStats
      });
    } else {
      // Deterministic simulation fallback
      const mockDirectives = [
        `CARGOES Smart Housekeeping: Spatial optimization locked for ${voyage.qty} TEU boxes.`,
        `Smart Stow: Activated pre-staging work queue for vessel '${voyage.vessel}'.`,
        `ZMS priority allocation: Yard Crane Block A-Gate optimized to eliminate double-handling.`,
        `TOS API callback complete: Container evacuation manifest ingested to ZODIAC dispatcher.`
      ];

      const mockPreStaged = [
        { containerId: `MSK-MT-${Math.floor(1000 + Math.random() * 9000)}`, size: "40ft Dry", currentSlot: "YARD-D1-R3-S5", targetStagingSlot: "STAGING-GATE-G5", status: "Pre-Staging Locked", doubleHandlingAvoided: "Yes (Yard spatial optimization)" },
        { containerId: `MSK-MT-${Math.floor(1000 + Math.random() * 9000)}`, size: "20ft Dry", currentSlot: "YARD-B2-R6-S2", targetStagingSlot: "STAGING-CRANE-C2", status: "Pre-Staging Locked", doubleHandlingAvoided: "Yes (Smart Stow dynamic queue)" }
      ];

      voyage.status = "Synced & Pre-Staging";
      voyage.smartStowSynced = true;
      voyage.housekeepingEfficiency = 96;
      voyage.smartCraneDirectives = mockDirectives;

      cargoesYardPreStagingQueue = [
        ...mockPreStaged,
        ...cargoesYardPreStagingQueue
      ];

      operationalStats.totalDandDSaved += voyage.costAvoided;
      operationalStats.revenueShareAccrued += (voyage.costAvoided * 0.3);

      res.json({
        status: "ok",
        evaluationMode: "SmartStow Simulation Solver (No API Key)",
        voyage,
        preStagingQueue: cargoesYardPreStagingQueue,
        updatedStats: operationalStats
      });
    }
  } catch (error: any) {
    console.error("SmartStow Solver Error:", error);
    res.status(500).json({ error: "Failed to push empty container evacuation sync", message: error.message });
  }
});


// -------------------------------------------------------------
// IoT-Driven Cold Chain Visibility State & API
// -------------------------------------------------------------

let reeferContainers = [
  {
    id: "MSK-RF-4091",
    cargoName: "Chilled Bio-Pharmaceutical Vaccines",
    vessel: "Maersk Mc-Kinney Moller",
    destinationPort: "Jebel Ali Terminal 3 (Dubai)",
    tempTarget: 4.0,
    tempCurrent: 9.8,
    humidity: 45,
    co2: 1.2,
    status: "Imminent Failure",
    anomalyDesc: "Primary compressor cycle block failure. Temperature rising +1.8°C/hr. Spoilage risk imminent within 4 hours.",
    cargoValue: 3200000,
    fastTrackStatus: "Pending Crane Priority",
    selectedFmsSlot: "BANK-R3-SLOT-08 (Maintenance Block)",
    isFastTracked: false,
    aiMitigationPlan: ""
  },
  {
    id: "MSK-RF-7721",
    cargoName: "Organic Hass Avocados",
    vessel: "Geronimo Maersk",
    destinationPort: "ECT Delta Terminal, Rotterdam",
    tempTarget: 6.0,
    tempCurrent: 6.2,
    humidity: 85,
    co2: 4.5,
    status: "Optimal",
    anomalyDesc: "No anomalies. Standard Captain Peter™ monitoring active. Connected with Qlik Analytics live feed.",
    cargoValue: 450000,
    fastTrackStatus: "Standard Yard Schedule",
    selectedFmsSlot: "BANK-R1-SLOT-12",
    isFastTracked: false,
    aiMitigationPlan: ""
  },
  {
    id: "MSK-RF-1109",
    cargoName: "Premium Fresh Blueberries",
    vessel: "Albert Maersk",
    destinationPort: "PSA Pasir Panjang, Singapore",
    tempTarget: 1.5,
    tempCurrent: 3.4,
    humidity: 90,
    co2: 3.1,
    status: "Warning",
    anomalyDesc: "Evaporator coil frosting detected. Slight upward temperature drift.",
    cargoValue: 680000,
    fastTrackStatus: "Standard Yard Schedule",
    selectedFmsSlot: "BANK-R2-SLOT-22",
    isFastTracked: false,
    aiMitigationPlan: ""
  },
  {
    id: "MSK-RF-9052",
    cargoName: "Premium Fresh Atlantic Salmon",
    vessel: "Maersk Mc-Kinney Moller",
    destinationPort: "Jebel Ali Terminal 3 (Dubai)",
    tempTarget: -2.0,
    tempCurrent: -1.9,
    humidity: 60,
    co2: 0.5,
    status: "Optimal",
    anomalyDesc: "No anomalies. Live telemetry healthy. Qlik processing matches standard parameters.",
    cargoValue: 850000,
    fastTrackStatus: "Standard Yard Schedule",
    selectedFmsSlot: "BANK-R3-SLOT-11",
    isFastTracked: false,
    aiMitigationPlan: ""
  }
];

// Get Cold Chain Data
app.get("/api/cold-chain/reefers", (req, res) => {
  res.json({
    status: "ok",
    totalMonitoredContainers: 2154800, // Part of the 2M+ containers Qlik processes
    ingestedRowsCount: "1.4 Billion/Day",
    reefers: reeferContainers
  });
});

// Trigger Agentic AI Fast-Track off the vessel directly to DP World CARGOES TOS+ Smart Yard Crane Scheduler
app.post("/api/cold-chain/trigger-fasttrack", async (req, res) => {
  const { reeferId } = req.body;
  const reefer = reeferContainers.find(r => r.id === reeferId);
  if (!reefer) {
    return res.status(404).json({ error: "Refrigerated container not found in active fleet list" });
  }

  const client = getGeminiClient();
  const isMocked = !client;

  const prompt = `You are an Agentic AI Logistics Dispatcher integrating Maersk Captain Peter™ Reefer telemetry with DP World CARGOES TOS+ (CFS Module) & FMS (Fleet Management System).

CONTEXT:
Container ID: ${reefer.id}
Cargo: ${reefer.cargoName}
Value: $${reefer.cargoValue}
Vessel: ${reefer.vessel}
Destination: ${reefer.destinationPort}
Telemetry: Target Temp ${reefer.tempTarget}°C, Current Temp ${reefer.tempCurrent}°C, Humidity ${reefer.humidity}%, CO2 ${reefer.co2}%
Anomalous State Detected by Captain Peter™: ${reefer.anomalyDesc}

You must formulate an EMERGENCY fast-track plan executing directly in DP World’s Smart Yard Crane Scheduler & FMS plug-in banks.
Your plan should include:
1. "arrmgDirective": Instruction for Automated Rail Mounted Gantry (ARMG) crane to prioritize this vessel bay immediately upon dock.
2. "yardSlotAllocation": Emergency maintenance yard slot slotting.
3. "fmsAction": Fleet Management System prompt to alert technician and ready backup coolant manifold.
4. "spoilagePreventedCost": Estimated cargo value saved minus emergency handling fees.
5. "mitigationReport": A detailed executive summary explaining the predictive trigger.

Return a valid JSON object matching this schema exactly:
{
  "arrmgDirective": "string",
  "yardSlotAllocation": "string",
  "fmsAction": "string",
  "spoilagePreventedCost": number,
  "mitigationReport": "string"
}

Do not return any markdown wraps. Only return raw JSON.`;

  try {
    if (!isMocked && client) {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.15,
          systemInstruction: "You are the Agentic AI Cold-Chain Orchestrator. You fast-track endangered reefers directly off vessels using real-time Captain Peter™ telemetry and DP World CARGOES yard priorities."
        }
      });

      const responseText = response.text || "{}";
      const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);

      // Update in-memory state
      reefer.isFastTracked = true;
      reefer.status = "Optimal (Mitigation Active)";
      reefer.tempCurrent = reefer.tempTarget; // Temp stabilized by emergency cooling block
      reefer.fastTrackStatus = "Fast-Track Cleared & Docked";
      reefer.aiMitigationPlan = JSON.stringify(parsed);

      // Update global operational stats if applicable
      operationalStats.totalDandDSaved += reefer.cargoValue;
      operationalStats.revenueShareAccrued += (reefer.cargoValue * 0.05); // 5% SLA-Shield performance fee

      res.json({
        status: "ok",
        evaluationMode: "Agentic AI Cold-Chain Scheduler (Gemini API)",
        reefer,
        mitigationDetails: parsed,
        updatedStats: operationalStats
      });
    } else {
      // Offline fallback
      const mockPlan = {
        arrmgDirective: `ARMG crane prioritized for vessel bay 14. Emergency lift schedule activated for container ${reefer.id}. Expected discharge: 8 minutes.`,
        yardSlotAllocation: `Fast-track route locked directly to ${reefer.selectedFmsSlot}. Ground power bank live with high-performance cooling unit.`,
        fmsAction: `CFS tech alert: Emergency maintenance order dispatched to Bay Area 3. Backup coolant manifold standby.`,
        spoilagePreventedCost: reefer.cargoValue - 15000,
        mitigationReport: `Captain Peter™ identified a compressor cycle failure 2 hours prior to arrival. SLA-Shield Agentic AI bypassed standard CFS queues, updating the Smart Yard Crane Scheduler in CARGOES TOS+ to fast-track this reefer, preventing complete spoilage of ${reefer.cargoName}.`
      };

      // Update in-memory state
      reefer.isFastTracked = true;
      reefer.status = "Optimal (Mitigation Active)";
      reefer.tempCurrent = reefer.tempTarget;
      reefer.fastTrackStatus = "Fast-Track Cleared & Docked";
      reefer.aiMitigationPlan = JSON.stringify(mockPlan);

      operationalStats.totalDandDSaved += reefer.cargoValue;
      operationalStats.revenueShareAccrued += (reefer.cargoValue * 0.05);

      res.json({
        status: "ok",
        evaluationMode: "Agentic AI Cold-Chain Scheduler (Simulation Fallback)",
        reefer,
        mitigationDetails: mockPlan,
        updatedStats: operationalStats
      });
    }
  } catch (error: any) {
    console.error("Cold Chain Fast-Track Error:", error);
    res.status(500).json({ error: "Failed to trigger cold chain fast-track priority", message: error.message });
  }
});


// -------------------------------------------------------------
// Unstructured Email Automation (Inbound Desk) State & API
// -------------------------------------------------------------

let inboundEmails = [
  {
    id: "EML-8021",
    sender: "logistics.manager@bayer-pharma.com",
    receivedAt: "2026-07-06T08:15:22Z",
    subject: "URGENT: Inland re-routing request for reefer MSK-RF-4091 to Dubai South Industrial",
    body: "Hi Inbound Desk,\n\nDue to sudden warehouse refrigeration maintenance at our main Jebel Ali terminal site, we need to divert refrigerated container MSK-RF-4091 (the Bio-Pharma vaccines) immediately to our auxiliary site at Dubai South Industrial Park. \n\nCan you please check inland corridor truck capacity with temperature-controlled capability for this afternoon? MyFinance needs to reflect the routing updates immediately so our customs broker can proceed. Thank you!\n\nBest regards,\nSarah Jenkins\nBayer Global Logistics",
    status: "Pending",
    extractedCargo: "Bio-Pharmaceutical Vaccines (Reefer MSK-RF-4091)",
    requestedChange: "Divert Jebel Ali delivery to Dubai South Industrial Park",
    corridorChecked: "DP World Jebel Ali to Dubai South corridor",
    bookedSpace: "None (Awaiting processing)",
    invoiceAdjustment: "$0.00",
    rawAgentReport: ""
  },
  {
    id: "EML-4412",
    sender: "import@euro-produce-importers.cz",
    receivedAt: "2026-07-06T10:30:10Z",
    subject: "Booking amendment: Hass Avocados #MSK-RF-7721 - truck to rail",
    body: "Hello Team,\n\nWe would like to amend the pre-carriage transport for our container MSK-RF-7721 from ECT Rotterdam. Instead of the planned trucking leg which is facing delays at the German border, we want to shift this container to the daily direct block train corridor (DP World CARGOES Flow network) to Prague Terminal. \n\nPlease confirm rail slot availability for tonight and dispatch the invoice update to MyFinance.\n\nBest,\nMarkus Kovac\nEuroProduce CZ",
    status: "Pending",
    extractedCargo: "Organic Hass Avocados (MSK-RF-7721)",
    requestedChange: "Change inland leg from Trucking to DP World CARGOES Flow Block Train to Prague Terminal",
    corridorChecked: "Rotterdam to Prague Rail Corridor",
    bookedSpace: "None (Awaiting processing)",
    invoiceAdjustment: "$0.00",
    rawAgentReport: ""
  },
  {
    id: "EML-9954",
    sender: "supplychain@auto-parts-intl.com",
    receivedAt: "2026-07-06T11:45:00Z",
    subject: "Status update request + additional trailer request for dry container MSK-DR-5540",
    body: "Dear Support,\n\nWe have a dry container MSK-DR-5540 arriving at Jebel Ali Terminal 3. We require an additional flatbed landside trailer to transport the oversized engine blocks from the container freight station to our assembly plant in Sharjah tomorrow at 08:00 AM. \n\nPlease confirm capacity with CARGOES Runner and let us know the extra handling fees to be billed to our MyFinance ledger.\n\nThanks,\nAhmed Al-Mansoori\nAuto Parts International",
    status: "Pending",
    extractedCargo: "Oversized Engine Blocks (MSK-DR-5540)",
    requestedChange: "Add emergency flatbed trailer for landside leg to Sharjah at 08:00 AM tomorrow",
    corridorChecked: "Jebel Ali Terminal 3 to Sharjah Flatbed Landside Link",
    bookedSpace: "None (Awaiting processing)",
    invoiceAdjustment: "$0.00",
    rawAgentReport: ""
  }
];

// Get inbound emails
app.get("/api/landside/emails", (req, res) => {
  res.json({
    status: "ok",
    emails: inboundEmails,
    totalIngestedEmails: 12480,
    autoProcessedPercentage: "94.2%"
  });
});

// Process email using Gemini AI or simulated agent
app.post("/api/landside/process-email", async (req, res) => {
  const { emailId } = req.body;
  const email = inboundEmails.find(e => e.id === emailId);
  if (!email) {
    return res.status(404).json({ error: "Inbound email not found" });
  }

  const client = getGeminiClient();
  const isMocked = !client;

  const prompt = `You are an Agentic AI Logistics Dispatcher operating inside the Maersk Logistics Hub & DP World CARGOES Runner ERP.
Your task is to parse, analyze, and process the following unstructured inbound email request.

EMAIL DETAILS:
From: ${email.sender}
Subject: ${email.subject}
Body:
${email.body}

You must process this email by cross-referencing landside capacities and performing automatic bookings:
1. Parse "extractedCargo" - What cargo is it and any container IDs mentioned?
2. Parse "requestedChange" - What is the client asking for?
3. Check "corridorChecked" - Define the specific inland corridor involved (e.g. Rotterdam to Prague rail, Jebel Ali to Dubai South truck corridor).
4. Simulate booking space in DP World CARGOES Runner ERP:
   - Formulate "bookedSpace" (e.g. "Reefer Gen-set Truck Slot #105 booked via CARGOES Runner", "Block Train slot on Wagon 12B booked").
5. Formulate "invoiceAdjustment" - Calculate realistic fee/adjustment (e.g. "+$380 USD fuel and diversion surcharge", "+$650 USD intermodal rail booking surcharge").
6. Write a "rawAgentReport" detailing:
   - "Extraction & Parsing: Successfully extracted cargo and intent..."
   - "Capacity Check: Querying CARGOES Flow database... Inland capacity is AVAILABLE (9 green slots)."
   - "Automated ERP Booking: Triggered API call to CARGOES Runner. Reserved slot."
   - "MyFinance Ledger Update: Invoiced adjustment pushed to MyFinance client portal."
   - "Customer Auto-Notification: Standard automated client reply generated and queued."

Return a valid JSON object matching this schema exactly:
{
  "extractedCargo": "string",
  "requestedChange": "string",
  "corridorChecked": "string",
  "bookedSpace": "string",
  "invoiceAdjustment": "string",
  "rawAgentReport": "string"
}

Do not return any markdown wraps. Only return raw JSON.`;

  try {
    if (!isMocked && client) {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
          systemInstruction: "You are the Agentic AI Landside Logistics Coordinator. You process unstructured emails, query inland capacity via CARGOES Flow, book space via CARGOES Runner, and adjust invoices in MyFinance."
        }
      });

      const responseText = response.text || "{}";
      const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);

      // Update email in memory
      email.status = "Processed";
      email.extractedCargo = parsed.extractedCargo;
      email.requestedChange = parsed.requestedChange;
      email.corridorChecked = parsed.corridorChecked;
      email.bookedSpace = parsed.bookedSpace;
      email.invoiceAdjustment = parsed.invoiceAdjustment;
      email.rawAgentReport = parsed.rawAgentReport;

      // Extract numeric value from invoice adjustment string if possible to add to total savings/revenue
      const numericAdj = parseFloat(parsed.invoiceAdjustment.replace(/[^0-9.]/g, "")) || 450;
      operationalStats.revenueShareAccrued += (numericAdj * 0.10); // 10% automation efficiency reward

      res.json({
        status: "ok",
        evaluationMode: "Agentic LLM Inbound Processing Desk (Gemini API)",
        email,
        updatedStats: operationalStats
      });
    } else {
      // Offline fallback
      let mockResult = {
        extractedCargo: email.extractedCargo,
        requestedChange: email.requestedChange,
        corridorChecked: email.corridorChecked,
        bookedSpace: "",
        invoiceAdjustment: "",
        rawAgentReport: ""
      };

      if (email.id === "EML-8021") {
        mockResult.bookedSpace = "Emergency Tempered Reefer Trailer Truck #T-904 booked via CARGOES Runner";
        mockResult.invoiceAdjustment = "+$450.00 USD (Diversion & Reefer Ground Surcharge)";
        mockResult.rawAgentReport = "● PARSING: Extracted Bio-Pharm vaccines (MSK-RF-4091) requesting diversion to Dubai South.\n● CORRIDOR QUERY: Jebel Ali Terminal 3 to Dubai South truck link has active capacity.\n● ERP TRANSACTION: Secured emergency insulated trailer space.\n● MYFINANCE SYNC: Surcharge +$450.00 USD posted to Bayer's active account.\n● NOTIFICATION: Auto-response dispatched to Sarah Jenkins.";
      } else if (email.id === "EML-4412") {
        mockResult.bookedSpace = "Block Train Slot W-04 booked on Daily Rotterdam-Prague Cargo Express";
        mockResult.invoiceAdjustment = "+$720.00 USD (Rail Conversion & Express Surcharge)";
        mockResult.rawAgentReport = "● PARSING: Extracted Organic Hass Avocados (MSK-RF-7721) requesting Truck-to-Rail shift.\n● CORRIDOR QUERY: DP World CARGOES Flow Rotterdam-Prague rail corridor has 4 empty wagons.\n● ERP TRANSACTION: Block train wagon slot reserved and locked.\n● MYFINANCE SYNC: Ledger adjusted by +$720.00 USD for intermodal line-haul conversion.\n● NOTIFICATION: Booking amendment receipt sent to Markus Kovac.";
      } else {
        mockResult.bookedSpace = "Oversized Flatbed Landside Trailer #FL-221 booked via CARGOES Runner";
        mockResult.invoiceAdjustment = "+$350.00 USD (Flatbed & Oversized Cargo Surcharge)";
        mockResult.rawAgentReport = "● PARSING: Extracted oversized Engine Blocks (MSK-DR-5540) requesting landside flatbed trailer to Sharjah.\n● CORRIDOR QUERY: Dubai Jebel Ali to Sharjah heavy transport corridor checked; 3 flatbed trailers available tomorrow morning.\n● ERP TRANSACTION: Trailer allocated and scheduled for 08:00 AM tomorrow.\n● MYFINANCE SYNC: Surcharge +$350.00 USD applied to Auto Parts International portal account.\n● NOTIFICATION: Dispatch confirmation sent to Ahmed Al-Mansoori.";
      }

      email.status = "Processed";
      email.extractedCargo = mockResult.extractedCargo;
      email.requestedChange = mockResult.requestedChange;
      email.corridorChecked = mockResult.corridorChecked;
      email.bookedSpace = mockResult.bookedSpace;
      email.invoiceAdjustment = mockResult.invoiceAdjustment;
      email.rawAgentReport = mockResult.rawAgentReport;

      operationalStats.revenueShareAccrued += 75; // Flat rate fallback

      res.json({
        status: "ok",
        evaluationMode: "Agentic LLM Inbound Processing Desk (Simulation Fallback)",
        email,
        updatedStats: operationalStats
      });
    }
  } catch (error: any) {
    console.error("Email processing error:", error);
    res.status(500).json({ error: "Failed to auto-process email", message: error.message });
  }
});


// -------------------------------------------------------------
// Predictive Inland ETAs State & API
// -------------------------------------------------------------

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

let inlandShipments: InlandShipment[] = [
  {
    id: "SHP-1102",
    type: "Train",
    route: "DP World Jebel Ali Terminal 3 to Riyadh Dry Port Depot",
    containers: "18x 40ft High-Cube & Reefer Containers",
    carrier: "Saudi Railways Company (SAR)",
    delayReason: "Rail-switch mechanical failure near Al-Hofuf junction",
    status: "Delayed",
    plannedArrival: "2026-07-07T14:30:00Z",
    predictiveETA: "2026-07-07T19:45:00Z",
    gateStatus: "Gridlock Risk (Pickup slot mismatch)",
    interlockActive: false,
    agsReservationId: "AGS-RES-9912",
    originalGateSlot: "15:00 - 16:00",
    shiftedGateSlot: "None",
    impactMetric: "Prevents 45-truck backup gridlock at inland depot gates",
    rawAgentReport: ""
  },
  {
    id: "SHP-3081",
    type: "Truck Convoy",
    route: "Rotterdam ECT Delta Terminal to Prague Intermodal Depot",
    containers: "8x 40ft Super-Dry Industrial Containers",
    carrier: "CARGOES Runner Trucking network",
    delayReason: "Severe customs border checking bottleneck & high traffic at German crossing",
    status: "Delayed",
    plannedArrival: "2026-07-07T11:00:00Z",
    predictiveETA: "2026-07-07T14:15:00Z",
    gateStatus: "Gridlock Risk (Gate appointment expired)",
    interlockActive: false,
    agsReservationId: "AGS-RES-5034",
    originalGateSlot: "11:30 - 12:30",
    shiftedGateSlot: "None",
    impactMetric: "Avoids wait-time penalties ($250 per hour per truck)",
    rawAgentReport: ""
  },
  {
    id: "SHP-9024",
    type: "Intermodal Rail",
    route: "DP World Antwerp Gateway to Duisburg Logport III Terminal",
    containers: "12x 45ft High-Performance Reefers",
    carrier: "Lineas Intermodal",
    delayReason: "None",
    status: "On Time",
    plannedArrival: "2026-07-07T18:00:00Z",
    predictiveETA: "2026-07-07T18:05:00Z",
    gateStatus: "Synced",
    interlockActive: true,
    agsReservationId: "AGS-RES-1122",
    originalGateSlot: "18:30 - 19:30",
    shiftedGateSlot: "18:30 - 19:30 (Auto-Aligned)",
    impactMetric: "Synchronized slot reservation",
    rawAgentReport: "● INTERLOCK STATUS: Active\n● SYNCHRONIZATION: PETA Model feeds live telemetry perfectly to Duisburg AGS."
  }
];

// Get predictive inland shipments
app.get("/api/landside/eta-shipments", (req, res) => {
  res.json({
    status: "ok",
    shipments: inlandShipments,
    totalPredictionsComputed: 5490,
    modelAccuracyRate: "97.8%"
  });
});

// Trigger PETA-PCS Interlock
app.post("/api/landside/trigger-interlock", async (req, res) => {
  const { shipmentId } = req.body;
  const shipment = inlandShipments.find(s => s.id === shipmentId);
  if (!shipment) {
    return res.status(404).json({ error: "Inland shipment not found" });
  }

  const client = getGeminiClient();
  const isMocked = !client;

  const prompt = `You are an AI Intermodal Logistics System combining Maersk Predictive ETA (PETA) and DP World CARGOES PCS (Port Community System) / AGS (Auto Gate System).
Your task is to calculate a recalculated Predictive ETA and align truck gate slot appointments to prevent gate gridlock.

SHIPMENT DETAILS:
ID: ${shipment.id}
Type: ${shipment.type}
Route: ${shipment.route}
Carrier: ${shipment.carrier}
Containers: ${shipment.containers}
Delay Reason: ${shipment.delayReason}
Planned Arrival: ${shipment.plannedArrival}
Current Original Gate Slot: ${shipment.originalGateSlot}
AGS Reservation ID: ${shipment.agsReservationId}

The train/truck is experiencing the delay mentioned above. You must:
1. Re-calculate "predictiveETA" using supervised learning simulation (typically adding appropriate delay hours relative to planned arrival).
2. Determine a new "shiftedGateSlot" (e.g. shift it forward to match the new ETA + 30-60 mins buffer).
3. Create a detailed "rawAgentReport" showing:
   - "Supervised Learning Evaluation: Analyzed current delay factors..."
   - "CARGOES Flow Push: Pushed updated PETA milestone to CARGOES Flow tracking index."
   - "CARGOES PCS / AGS Re-allocation: Cancelled original gate reservation slot ${shipment.originalGateSlot} and secured new slot ${shipment.shiftedGateSlot} automatically."
   - "Rostering Impact: Notified truck pool drivers with updated roster appointments to avoid gate gridlock."
   - "SLA Metrics: Avoided demurrage fees & port bottleneck penalty."

Return a valid JSON object matching this schema exactly:
{
  "predictiveETA": "string (ISO or human date/time)",
  "shiftedGateSlot": "string (formatted range, e.g., '19:45 - 20:45')",
  "rawAgentReport": "string"
}

Do not return any markdown wraps. Only return raw JSON.`;

  try {
    if (!isMocked && client) {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
          systemInstruction: "You are the Maersk PETA (Predictive ETA) API Integration Controller feeding into DP World CARGOES PCS and AGS Auto Gate systems."
        }
      });

      const responseText = response.text || "{}";
      const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);

      // Update in-memory shipment
      shipment.predictiveETA = parsed.predictiveETA;
      shipment.shiftedGateSlot = parsed.shiftedGateSlot;
      shipment.status = "Optimal (Aligned)";
      shipment.gateStatus = "Aligned & Swapped";
      shipment.interlockActive = true;
      shipment.rawAgentReport = parsed.rawAgentReport;

      // Update global metrics
      operationalStats.slasProtectedCount += 1;
      operationalStats.revenueShareAccrued += 350; // $350 automation value reward

      res.json({
        status: "ok",
        evaluationMode: "Maersk PETA & DP World AGS Interlock (Gemini API)",
        shipment,
        updatedStats: operationalStats
      });
    } else {
      // High fidelity offline fallback
      let mockPredictiveETA = "";
      let mockShiftedGateSlot = "";
      let mockReport = "";

      if (shipment.id === "SHP-1102") {
        mockPredictiveETA = "2026-07-07T19:45:00Z";
        mockShiftedGateSlot = "20:00 - 21:00 (Auto-Swapped)";
        mockReport = "● SUPERVISED MODEL RUN: Predicted arrival delayed by +5.25 hrs due to Hofuf junction switch lockout.\n● CARGOES FLOW UPDATE: Dispatched milestone update. Sync'd tracking stream to Cargo Owners.\n● AUTO-GATE SYSTEM (AGS) SWAP: Revoked original 15:00-16:00 appointment slot. Secured slot 20:00-21:00 via CARGOES Rostering.\n● LOGISTICS BUFFER SAVINGS: Avoided 45 long-haul trucks arriving early and idling at Dry Port gates.\n● FINANCIAL SYNC: Slashed potential wait-time demurrage. $11,250 gridlock fee mitigated.";
      } else {
        mockPredictiveETA = "2026-07-07T14:15:00Z";
        mockShiftedGateSlot = "14:30 - 15:30 (Auto-Swapped)";
        mockReport = "● SUPERVISED MODEL RUN: Predicted delay of +3.25 hrs due to customs queue near German border crossing.\n● CARGOES FLOW UPDATE: Broadcasted intermodal delay status to central dispatcher.\n● AUTO-GATE SYSTEM (AGS) SWAP: Released original gate pickup slot. Locked new slot at 14:30-15:30.\n● LOGISTICS BUFFER SAVINGS: Restructured driver shifts in CARGOES Rostering; drivers dispatched only at new slot.\n● FINANCIAL SYNC: Avoided wait-time driver idling penalties. $2,000 idle fees saved.";
      }

      shipment.predictiveETA = mockPredictiveETA;
      shipment.shiftedGateSlot = mockShiftedGateSlot;
      shipment.status = "Optimal (Aligned)";
      shipment.gateStatus = "Aligned & Swapped";
      shipment.interlockActive = true;
      shipment.rawAgentReport = mockReport;

      operationalStats.slasProtectedCount += 1;
      operationalStats.revenueShareAccrued += 350;

      res.json({
        status: "ok",
        evaluationMode: "Maersk PETA & DP World AGS Interlock (Simulation Fallback)",
        shipment,
        updatedStats: operationalStats
      });
    }
  } catch (error: any) {
    console.error("Predictive ETA Interlock error:", error);
    res.status(500).json({ error: "Failed to align Predictive ETA slot", message: error.message });
  }
});


// -------------------------------------------------------------
// Hyper-Personalized Door-to-Door Recommendations State & API
// -------------------------------------------------------------

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

let d2dRecommendations: DoorToDoorRecommendation[] = [
  {
    id: "D2D-7701",
    clientName: "Samsung Electronics Gulf",
    oceanVessel: "Maersk McKinney Moller",
    currentRoute: "Port of Shanghai (CNSHG) to DP World Jebel Ali Terminal 1",
    crisisScenario: "Sudden Port Gateworkers Strike at Jebel Ali Terminal 1 (Gridlock expected for 8 days)",
    predictedInlandDestination: "Riyadh Industrial City Zone 4 Depot (Central KSA)",
    recommendedAlternativeRoute: "Divert to DP World Jeddah Port + Saudi Railways (SAR) Intermodal Corridor to Riyadh Dry Port",
    status: "Suggested",
    upsellRevenueValue: "$12,400 USD (Ocean-to-Rail Interlocking)",
    upsellValueNum: 12400,
    customsCleared: false,
    containersCount: 24,
    hsCode: "8528.72 (LCD/OLED Display Panels)",
    customsDutySaved: "$3,200 (Paperless compliance optimization)",
    rawAgentReport: ""
  },
  {
    id: "D2D-3305",
    clientName: "Vale Mining Deutschland GmbH",
    oceanVessel: "Maersk Mc-Kinney Moller",
    currentRoute: "Port of Tubarao (BRTUA) to Rotterdam ECT Delta Terminal",
    crisisScenario: "German Rail Corridor mechanical failure near Hannover (Transit deadlock for 6 days)",
    predictedInlandDestination: "Duisburg Logport Steelworks Depot",
    recommendedAlternativeRoute: "Transfer to DP World Rhine-Herne Canal Inland Barge feeder directly to Duisburg Logport III",
    status: "Suggested",
    upsellRevenueValue: "$8,950 USD (Ocean-to-Barge Shift)",
    upsellValueNum: 8950,
    customsCleared: false,
    containersCount: 45,
    hsCode: "2601.11 (Iron Ore Sintered Concentrates)",
    customsDutySaved: "$1,850 (Automated green corridor clearing)",
    rawAgentReport: ""
  },
  {
    id: "D2D-5512",
    clientName: "Nestlé Nutrition Europe",
    oceanVessel: "Maersk Mc-Kinney Moller",
    currentRoute: "Singapore Gateway (SGSIN) to DP World London Gateway",
    crisisScenario: "Severe North Sea Force-10 Gale Winds restricting crane crane operations for 48 hours",
    predictedInlandDestination: "Birmingham Central Cold Chain Complex",
    recommendedAlternativeRoute: "Divert to DP World Southampton + CARGOES Runner Express Temperature-Controlled Road Convoy",
    status: "Cleared & Re-routed",
    upsellRevenueValue: "$6,500 USD (Reefer Hot-Swap)",
    upsellValueNum: 6500,
    customsCleared: true,
    containersCount: 12,
    hsCode: "1901.10 (Infant Nutritional Formulas)",
    customsDutySaved: "$950 (Pre-approved temperature screening exemption)",
    rawAgentReport: `● MAERSK VISIBILITY AGENT: Detected heavy North Sea storm. Calculated Southampton bypass in 120ms.
● CARGOES CUSTOMS AI: Automatically processed electronic manifest amendment from London Gateway to Southampton.
● CLASSIFICATION INSPECTOR: Zero classification leakages found. HS code 1901.10 pre-approved.
● PAPERLESS CLEARANCE: Clearance token issued in 2.4s. Truck fleet dispatched.`
  }
];

// Get D2D recommendations
app.get("/api/landside/d2d-recommendations", (req, res) => {
  res.json({
    status: "ok",
    recommendations: d2dRecommendations,
    totalUpsellPipeline: d2dRecommendations.reduce((acc, rec) => acc + (rec.status === "Cleared & Re-routed" ? 0 : rec.upsellValueNum), 0),
    totalCapturedUpsellRevenue: d2dRecommendations.reduce((acc, rec) => acc + (rec.status === "Cleared & Re-routed" ? rec.upsellValueNum : 0), 0)
  });
});

// Process D2D Recommendation & Orchestrate Cross-Platform Clearance
app.post("/api/landside/process-d2d", async (req, res) => {
  const { recommendationId } = req.body;
  const rec = d2dRecommendations.find(r => r.id === recommendationId);
  if (!rec) {
    return res.status(404).json({ error: "Recommendation not found" });
  }

  const client = getGeminiClient();
  const isMocked = !client;

  const prompt = `You are a cross-platform orchestration layer bridging Maersk Risk Management / Visibility Studio and DP World CARGOES Customs & CARGOES TOS+.
Your task is to orchestrate a hyper-personalized door-to-door upsell diversion.

CONTEXT:
Client: ${rec.clientName}
Vessel: ${rec.oceanVessel}
Inland Destination: ${rec.predictedInlandDestination}
Current Route: ${rec.currentRoute}
Crisis Incident: ${rec.crisisScenario}
Recommended Alternative Path: ${rec.recommendedAlternativeRoute}
HS Code / Commodity: ${rec.hsCode}
Cargo Containers: ${rec.containersCount} units

The Maersk Visibility Studio agent has flagged this crisis and recommended the Alternative Path to bypass the bottleneck. It has autonomously submitted electronic manifest updates to DP World CARGOES Customs.

Please execute the DP World CARGOES Customs AI-driven classification wizard & compliance engine to:
1. Review the manifest amendment (check for compliance & ensure no revenue leakages).
2. Approve the customs clearance paperlessly in seconds.
3. Secure the alternative terminal stowage.
4. Provide a detailed, highly technical log trace detailing:
   - "Maersk Visibility Studio: Crisis-Diverted manifest submission..."
   - "CARGOES Customs Intelligent Risk Engine: Audit run for HS Code ${rec.hsCode}..."
   - "Classification Wizard Check: Assessment of tax & duty structures..."
   - "Compliance Screening: No blacklists or regulatory locks detected..."
   - "CARGOES TOS+ Booking: Seamless booking & yard space reservation at the alternative DP World terminal..."
   - "Paperless Clearance Token: Manifest amendment authorized in 1.8 seconds."

Return a valid JSON object matching this schema exactly:
{
  "alternativePathAuthorized": true,
  "customsCleared": true,
  "rawAgentReport": "string (with line breaks)",
  "dutyValueSaved": "string"
}

Do not return any markdown wraps or tags. Only return raw, clean JSON.`;

  try {
    if (!isMocked && client) {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
          systemInstruction: "You are the Cross-Platform AI Logistics Orchestrator for Maersk and DP World CARGOES Customs."
        }
      });

      const responseText = response.text || "{}";
      const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);

      rec.status = "Cleared & Re-routed";
      rec.customsCleared = parsed.customsCleared || true;
      rec.rawAgentReport = parsed.rawAgentReport;
      if (parsed.dutyValueSaved) {
        rec.customsDutySaved = parsed.dutyValueSaved;
      }

      // Update global metrics
      operationalStats.slasProtectedCount += 1;
      operationalStats.revenueShareAccrued += rec.upsellValueNum;
      operationalStats.totalDandDSaved += (rec.upsellValueNum * 2.5); // Save substantial demurrage costs

      res.json({
        status: "ok",
        evaluationMode: "Cross-Platform Orchestration (Gemini API)",
        recommendation: rec,
        updatedStats: operationalStats
      });
    } else {
      // Offline fallback
      let mockReport = "";
      if (rec.id === "D2D-7701") {
        mockReport = `● MAERSK VISIBILITY STUDIO: Identified alternative intermodal path bypassing Jebel Ali gate strike.
● MANIFEST AMENDMENT DISPATCHED: Autonomous electronic manifest correction transmitted via CARGOES Customs API.
● CARGOES CUSTOMS RISK AUDIT: Screened HS Code 8528.72 (OLED Display Panels). Confirmed value declaration matches Riyadh Dry Port regulatory index.
● COMPLIANCE WIZARD: No revenue leakages or regulatory holdbacks. Checked for duty exemptions. Approved!
● CARGOES TOS+ BOOKING: Confirmed yard container stacking reservation at DP World Jeddah Port Terminal 2. Saudi Railways (SAR) empty flatbed cars dispatched.
● PORT-SIDE DISPATCH: Clear-to-gate manifest token issued paperlessly in 1.6 seconds. Saved $14,000 in terminal demurrage fees!`;
      } else {
        mockReport = `● MAERSK VISIBILITY STUDIO: Identified alternative inland barge corridor bypassing German rail bottleneck.
● MANIFEST AMENDMENT DISPATCHED: Autonomous electronic manifest correction transmitted via CARGOES Customs API.
● CARGOES CUSTOMS RISK AUDIT: Screened HS Code 2601.11 (Iron Ore Sintered Concentrates). Confirmed green corridor cargo category.
● COMPLIANCE WIZARD: Verified environmental compliance certificates. Pre-cleared cargo for paperless water-leg transport.
● CARGOES TOS+ BOOKING: Pre-allocated yard crane slots at Duisburg Logport III. Registered inland barge towage booking.
● PORT-SIDE DISPATCH: Clear-to-gate manifest token issued paperlessly in 1.9 seconds. Saved $9,800 in delay demurrage!`;
      }

      rec.status = "Cleared & Re-routed";
      rec.customsCleared = true;
      rec.rawAgentReport = mockReport;

      // Update global metrics
      operationalStats.slasProtectedCount += 1;
      operationalStats.revenueShareAccrued += rec.upsellValueNum;
      operationalStats.totalDandDSaved += (rec.upsellValueNum * 2.5);

      res.json({
        status: "ok",
        evaluationMode: "Cross-Platform Orchestration (Simulation Fallback)",
        recommendation: rec,
        updatedStats: operationalStats
      });
    }
  } catch (error: any) {
    console.error("D2D Orchestration error:", error);
    res.status(500).json({ error: "Failed to orchestrate Door-to-Door diversion", message: error.message });
  }
});


// -------------------------------------------------------------
// Vite and Static File Server Setup
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html globally
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SLA-Shield API] Server running on http://localhost:${PORT}`);
  });
}

startServer();

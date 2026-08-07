import { useState, useEffect } from "react";
import { 
  Mail, 
  Send, 
  Database, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight, 
  Clock, 
  Truck, 
  TrendingUp, 
  Terminal,
  DollarSign
} from "lucide-react";

interface InboundEmail {
  id: string;
  sender: string;
  receivedAt: string;
  subject: string;
  body: string;
  status: string;
  extractedCargo: string;
  requestedChange: string;
  corridorChecked: string;
  bookedSpace: string;
  invoiceAdjustment: string;
  rawAgentReport: string;
}

interface UnstructuredEmailAutomationProps {
  onStatsUpdate: (updatedStats: any) => void;
}

export default function UnstructuredEmailAutomation({ onStatsUpdate }: UnstructuredEmailAutomationProps) {
  const [emails, setEmails] = useState<InboundEmail[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string>("EML-8021");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [customSender, setCustomSender] = useState<string>("operations@global-trading.com");
  const [customSubject, setCustomSubject] = useState<string>("Booking diversion for dry MSK-DR-5540");
  const [customBody, setCustomBody] = useState<string>("Dear Maersk Helpdesk,\n\nOur client needs to redirect dry container MSK-DR-5540 from Jebel Ali Port to their depot in Abu Dhabi instead of Sharjah tomorrow morning. Please book trailer capacity and update active billing ledger.\n\nThanks!\nOperations Team");
  const [totalEmails, setTotalEmails] = useState<number>(12480);
  const [autoRate, setAutoRate] = useState<string>("94.2%");

  const processSteps = [
    "Receiving unstructured email stream from Inbound Desk...",
    "Invoking LLM parser model (Gemini-3.5-Flash) for Named Entity Extraction...",
    "Extracted Container ID & Cargo parameters...",
    "Querying DP World CARGOES Flow capacity for landside transport corridors...",
    "Authenticating secure API handoff to DP World CARGOES Runner...",
    "CARGOES Runner: Auto-booked inland transport segment successfully.",
    "MyFinance API: Posting financial adjustments to active shipper ledger...",
    "Drafting automatic confirmation reply with live telemetry track URL."
  ];

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const response = await fetch("/api/landside/emails");
      const data = await response.json();
      if (data.status === "ok") {
        setEmails(data.emails);
        setTotalEmails(data.totalIngestedEmails);
        setAutoRate(data.autoProcessedPercentage);
      }
    } catch (error) {
      console.error("Error fetching landside emails:", error);
    }
  };

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  const handleProcessEmail = async () => {
    if (!selectedEmailId) return;
    setIsProcessing(true);
    setLogs([]);
    
    let stepIdx = 0;
    setActiveStep(processSteps[0]);
    setLogs(prev => [...prev, processSteps[0]]);

    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < processSteps.length) {
        setActiveStep(processSteps[stepIdx]);
        setLogs(prev => [...prev, processSteps[stepIdx]]);
      }
    }, 1000);

    try {
      const response = await fetch("/api/landside/process-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId: selectedEmailId })
      });
      const result = await response.json();
      clearInterval(interval);

      if (result.status === "ok") {
        setEmails(prev => prev.map(e => e.id === selectedEmailId ? result.email : e));
        onStatsUpdate(result.updatedStats);
        
        const finalLog = `✓ Sequence Complete: Successfully booked space and updated MyFinance by ${result.email.invoiceAdjustment}.`;
        setLogs(prev => [...prev, finalLog]);
      } else {
        setLogs(prev => [...prev, `✗ AI Engine Error: ${result.error || "Execution failed"}`]);
      }
    } catch (error: any) {
      clearInterval(interval);
      console.error(error);
      setLogs(prev => [...prev, `✗ Connection Slipped: ${error.message || "TOS+ network timeout"}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInboundSimulation = () => {
    // Generate a temporary ID
    const newId = `EML-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEmail: InboundEmail = {
      id: newId,
      sender: customSender,
      receivedAt: new Date().toISOString(),
      subject: customSubject,
      body: customBody,
      status: "Pending",
      extractedCargo: "Extracted on-demand...",
      requestedChange: "Parsed on-demand...",
      corridorChecked: "Querying...",
      bookedSpace: "None (Awaiting processing)",
      invoiceAdjustment: "$0.00",
      rawAgentReport: ""
    };

    setEmails(prev => [newEmail, ...prev]);
    setSelectedEmailId(newId);
    
    // Clear custom form fields after adding
    setCustomSender("ops@retail-corp.com");
    setCustomSubject("Urgent delivery amendment for MSK-DR-1090");
    setCustomBody("Team,\n\nPlease route container MSK-DR-1090 to Jebel Ali South instead of Terminal 2 immediately.\n\nRegard,\nBill");
  };

  const pendingCount = emails.filter(e => e.status === "Pending").length;
  const processedCount = emails.filter(e => e.status === "Processed").length;

  return (
    <div className="space-y-6">
      
      {/* EXPLANATORY HEADER BANNER */}
      <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-200">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
          <Mail className="h-4.5 w-4.5 mr-2 text-blue-600" />
          Unstructured Email Automation (Inbound Desk)
        </h2>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Logistics is notorious for thousands of daily unstructured emails containing quote requests, booking amendments, and status updates. 
          SLA-Shield uses Natural Language Processing (NLP) and Large Language Models (LLMs) to classify, extract details, and autonomously route tasks.
          This module integrates <strong>Maersk WMS/MyFinance portals</strong> with <strong>DP World CARGOES Runner ERP</strong> to resolve intermodal landside request queues automatically.
        </p>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Total Emails Ingested</p>
            <p className="text-xl font-black text-slate-950 mt-1 font-mono">{totalEmails.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Through active inbound queues</p>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <Mail className="h-5 w-5 text-slate-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Autonomous Clear Rate</p>
            <p className="text-xl font-black text-blue-600 mt-1 font-mono">{autoRate}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Processed without human touch</p>
          </div>
          <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Awaiting AI Processing</p>
            <p className="text-xl font-black text-amber-600 mt-1 font-mono">{pendingCount} Emails</p>
            <p className="text-[10px] text-slate-500 mt-0.5">High priority inbox queue items</p>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
            <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Bypassed Transactions</p>
            <p className="text-xl font-black text-emerald-600 mt-1 font-mono">{processedCount} Secured</p>
            <p className="text-[10px] text-slate-500 mt-0.5">ERP & MyFinance ledger updates</p>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
        </div>

      </div>

      {/* CORE SPLIT INTERACTION WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* INBOX & TEST SIMULATOR PANE (2/5 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Inbound Inbox Feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4.5 w-4.5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Inbound Customer Desk Feed</h3>
              </div>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                Live Mailbox Sync
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[350px]">
              {emails.map((mail) => {
                const isSelected = selectedEmailId === mail.id;
                const dateText = new Date(mail.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div 
                    key={mail.id}
                    onClick={() => !isProcessing && setSelectedEmailId(mail.id)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors text-left relative ${
                      isSelected ? "bg-blue-50/30 font-medium" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-[10px] text-slate-400 font-mono">{mail.sender}</p>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center shrink-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {dateText}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 mt-1 truncate">
                      {mail.subject}
                    </h4>

                    <p className="text-slate-500 text-[11px] mt-1 line-clamp-2">
                      {mail.body}
                    </p>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-dashed border-slate-100">
                      <span className="text-[9px] font-mono text-slate-400">ID: {mail.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        mail.status === "Processed" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                      }`}>
                        {mail.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simulate New Inbound Email Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center">
              <Send className="h-4 w-4 mr-2 text-indigo-600" />
              Simulate Inbound Customer Email
            </h3>
            <p className="text-[11px] text-slate-500">
              Paste or type a custom unstructured message from a shipping coordinator. SLA-Shield's LLM agent will extract the cargo ID, query DP World's local transport availability, and book it automatically.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1">Sender Email</label>
                <input 
                  type="text" 
                  value={customSender} 
                  onChange={(e) => setCustomSender(e.target.value)} 
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1">Subject</label>
                <input 
                  type="text" 
                  value={customSubject} 
                  onChange={(e) => setCustomSubject(e.target.value)} 
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase mb-1">Email Body (Unstructured text)</label>
                <textarea 
                  rows={4}
                  value={customBody} 
                  onChange={(e) => setCustomBody(e.target.value)} 
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded font-sans focus:bg-white focus:ring-1 focus:ring-indigo-500"
                ></textarea>
              </div>

              <button
                onClick={handleInboundSimulation}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors uppercase tracking-wider flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
              >
                <Mail className="h-4 w-4" />
                <span>Inject to Live Inbound Stream</span>
              </button>
            </div>
          </div>

        </div>

        {/* PROCESSING & INTERLOCK DISPATCH PANEL (3/5 width) */}
        <div className="lg:col-span-3 space-y-6">
          
          {selectedEmail ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              
              <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Agentic Dispatch Console: {selectedEmail.id}
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                  L3 Auto-Desk
                </span>
              </div>

              <div className="p-4 space-y-6 flex-1 flex flex-col justify-between">
                
                {/* Email Display */}
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pb-2 border-b border-slate-200">
                      <div>
                        <span className="font-bold text-slate-500">FROM: </span>{selectedEmail.sender}
                      </div>
                      <div>
                        {new Date(selectedEmail.receivedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs">
                      <span className="font-bold font-mono text-slate-500 uppercase block text-[9px] mb-1">Subject Header</span>
                      <p className="font-bold text-slate-800">{selectedEmail.subject}</p>
                    </div>
                    <div className="text-xs pt-2">
                      <span className="font-bold font-mono text-slate-500 uppercase block text-[9px] mb-1">Raw Content Body</span>
                      <p className="text-slate-600 italic leading-relaxed whitespace-pre-wrap font-sans bg-white p-3 rounded border border-slate-100 max-h-[140px] overflow-y-auto">
                        "{selectedEmail.body}"
                      </p>
                    </div>
                  </div>

                  {/* Operational Interlock Strategy details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                      <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">
                        Maersk Product Side (GenAI Agent)
                      </span>
                      <div className="space-y-1.5">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Extracted Target Cargo:</span>
                          <span className="font-bold text-slate-800">{selectedEmail.extractedCargo}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Identified Intent Change:</span>
                          <span className="font-bold text-slate-800">{selectedEmail.requestedChange}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                      <span className="text-[9px] font-mono font-bold text-blue-500 block uppercase tracking-wider">
                        DP World Product Side (CARGOES Interlock)
                      </span>
                      <div className="space-y-1.5">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Capacity Corridor Checked:</span>
                          <span className="font-bold text-slate-800">{selectedEmail.corridorChecked}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">CARGOES Runner Booked Slot:</span>
                          <span className="font-bold text-blue-600 font-mono">{selectedEmail.bookedSpace}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Automation trigger action area */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  
                  {selectedEmail.status === "Pending" ? (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-500">
                        This email requires autonomous classification, capacity checking on the landside network, and auto-booking. Trigger the Agentic AI to resolve without human workflow delays.
                      </p>
                      
                      <button
                        disabled={isProcessing}
                        onClick={handleProcessEmail}
                        className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all ${
                          isProcessing 
                            ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-default"
                            : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Interlining with CARGOES Runner...</span>
                          </>
                        ) : (
                          <>
                            <Cpu className="h-4 w-4" />
                            <span>Process Inbound Email via Agentic LLM</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/75 border border-emerald-200 rounded-xl p-4 space-y-3 text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-emerald-200">
                        <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-widest flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600 animate-pulse" />
                          Auto-Processing Execution Success
                        </span>
                        <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          MyFinance Posted
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[9px] font-mono text-slate-400 block uppercase">CARGOES Runner Booking:</span>
                          <p className="font-bold text-slate-800 leading-normal">{selectedEmail.bookedSpace}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-400 block uppercase">MyFinance Billing Adjustment:</span>
                          <p className="font-black text-emerald-600 font-mono text-sm">{selectedEmail.invoiceAdjustment}</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="text-[9px] font-mono text-slate-400 block uppercase mb-1">Live Agent trace log output:</span>
                        <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[10px] leading-relaxed whitespace-pre-line border border-slate-800">
                          {selectedEmail.rawAgentReport}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step ticker display during extraction */}
                  {isProcessing && (
                    <div className="bg-blue-50/50 border border-blue-150 rounded-lg p-3 text-xs space-y-2">
                      <div className="flex items-center space-x-2 font-bold text-blue-900 uppercase text-[9px]">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                        <span>Real-Time Processing Steps:</span>
                      </div>
                      <p className="text-[11px] text-slate-800 font-mono leading-relaxed italic">
                        {activeStep}
                      </p>
                    </div>
                  )}

                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              <Mail className="h-10 w-10 mx-auto text-slate-300 animate-pulse mb-3" />
              <p className="text-xs">Select an email from the inbound customer feed to perform autonomous intermodal routing audits.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

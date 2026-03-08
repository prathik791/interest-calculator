import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import API from "../utils/api";
import { calculateInterest, formatCurrency } from "../utils/calculations";
import toast from "react-hot-toast";

if (!document.getElementById("add-tx-styles")) {
  const s = document.createElement("style");
  s.id = "add-tx-styles";
  s.textContent = `
    @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
    .atx-input:focus { border-color:#a78bfa!important; box-shadow:0 0 0 3px rgba(167,139,250,.18)!important; outline:none; }
    .atx-btn:hover   { opacity:.88; transform:translateY(-1px); }
    .atx-btn:active  { transform:translateY(0); }
    .atx-type:hover  { opacity:.85; }
    .atx-back:hover  { color:#c4b5fd!important; }
  `;
  document.head.appendChild(s);
}

const inp = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "10px", padding: "12px 14px",
  color: "#e8e8f0", fontSize: "15px",
  width: "100%", boxSizing: "border-box",
  fontFamily: "inherit", transition: "border-color .2s, box-shadow .2s",
};
const sel = { ...inp, background: "rgba(20,17,50,0.9)", cursor: "pointer" };

export default function AddTransactionPage() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const isEdit   = Boolean(id);

  const [form, setForm] = useState({
    personName:   "",
    contact:      "",
    amount:       "",
    interestRate: "",
    interestType: "simple",
    type:         "given",
    date:         new Date().toISOString().split("T")[0],
    dueDate:      "",
    paymentMode:  "cash",
    notes:        "",
  });

  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => { if (isEdit) loadTransaction(); }, [isEdit]);

  const loadTransaction = async () => {
    try {
      const res = await API.get("/transactions/list");
      const tx  = (res.data.data || []).find((t) => t._id === id);
      if (!tx) { toast.error("Transaction not found"); return; }
      setForm({
        personName:   tx.personName   || "",
        contact:      tx.contact      || "",
        amount:       tx.amount?.toString()       || "",
        interestRate: tx.interestRate?.toString() || "",
        interestType: tx.interestType || "simple",
        type:         tx.type         || "given",
        date:    tx.date    ? new Date(tx.date).toISOString().split("T")[0]    : "",
        dueDate: tx.dueDate ? new Date(tx.dueDate).toISOString().split("T")[0] : "",
        paymentMode: tx.paymentMode || "cash",
        notes:       tx.notes       || "",
      });
    } catch { toast.error("Failed to load transaction"); }
  };

  const set  = (k, v) => { setApiError(""); setForm(f => ({ ...f, [k]: v })); };
  const onChange = (e) => set(e.target.name, e.target.value);

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const r = new FileReader();
    r.onloadend = () => setPreview(r.result);
    r.readAsDataURL(f);
  };

  // ✅ Safe interest preview — only calculate when values are valid numbers
  const getCalc = () => {
    const p = parseFloat(form.amount);
    const r = parseFloat(form.interestRate);
    if (!form.amount || !form.interestRate || isNaN(p) || isNaN(r) || p <= 0 || r < 0 || !form.date) return null;
    try {
      return calculateInterest(p, r, form.date, form.dueDate || new Date(), form.interestType);
    } catch {
      return null;
    }
  };
  const calc = getCalc();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!form.personName.trim())            { toast.error("Person name is required"); return; }
    if (!form.amount || +form.amount <= 0)  { toast.error("Enter a valid amount");    return; }
    if (form.interestRate === "")           { toast.error("Enter interest rate");     return; }
    if (!form.date)                         { toast.error("Select a date");           return; }

    try {
      setLoading(true);
      let res;

      if (file) {
        // With file → FormData (no manual Content-Type, browser sets boundary)
        const fd = new FormData();
        fd.append("personName",   form.personName.trim());
        fd.append("contact",      form.contact.trim());
        fd.append("amount",       form.amount);
        fd.append("interestRate", form.interestRate);
        fd.append("interestType", form.interestType);
        fd.append("type",         form.type);
        fd.append("date",         form.date);
        fd.append("paymentMode",  form.paymentMode);
        fd.append("notes",        form.notes);
        if (form.dueDate) fd.append("dueDate", form.dueDate);
        fd.append("screenshot",   file);
        res = isEdit
          ? await API.put(`/transactions/update/${id}`, fd)
          : await API.post("/transactions/add", fd);
      } else {
        // No file → plain JSON (cleanest, most reliable)
        const payload = {
          personName:   form.personName.trim(),
          contact:      form.contact.trim(),
          amount:       parseFloat(form.amount),
          interestRate: parseFloat(form.interestRate),
          interestType: form.interestType,
          type:         form.type,
          date:         form.date,
          paymentMode:  form.paymentMode,
          notes:        form.notes,
        };
        if (form.dueDate) payload.dueDate = form.dueDate;
        res = isEdit
          ? await API.put(`/transactions/update/${id}`, payload)
          : await API.post("/transactions/add", payload);
      }

      if (res.data.success) {
        toast.success(isEdit ? "Transaction updated!" : "Transaction added!");
        navigate("/transactions");
      } else {
        throw new Error(res.data.message || "Unexpected error");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save transaction";
      setApiError(msg);
      toast.error(msg);
      console.error("❌ Save error:", err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  // ── small helpers ──────────────────────────────────────────
  const Label = ({ t }) => (
    <p style={{ fontSize:11, fontWeight:700, color:"#a78bfa",
      letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 6px 0" }}>{t}</p>
  );
  const Divider = () => (
    <div style={{ height:1, background:"rgba(255,255,255,.07)",
      margin:"4px 0", gridColumn:"span 2" }} />
  );
  const SectionTitle = ({ t }) => (
    <p style={{ fontSize:11, fontWeight:700, color:"#64748b",
      letterSpacing:"0.12em", textTransform:"uppercase",
      margin:"4px 0 0 0", gridColumn:"span 2" }}>{t}</p>
  );

  return (
    <div style={{ minHeight:"100vh",
      background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
      padding:"40px 20px",
      fontFamily:"'DM Sans','Segoe UI',sans-serif", color:"#e8e8f0" }}>
      <div style={{ maxWidth:680, margin:"0 auto" }}>

        {/* ── back link ── */}
        <Link to="/transactions" className="atx-back"
          style={{ display:"inline-flex", alignItems:"center", gap:6,
            color:"#a78bfa", textDecoration:"none", fontSize:14,
            fontWeight:500, marginBottom:28, transition:"color .2s" }}>
          ← Back to Transactions
        </Link>

        {/* ── heading ── */}
        <h2 style={{ fontSize:32, fontWeight:700, letterSpacing:"-0.03em",
          background:"linear-gradient(90deg,#c4b5fd,#818cf8)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          margin:"0 0 6px 0" }}>
          {isEdit ? "Edit Transaction" : "Add Transaction"}
        </h2>
        <p style={{ fontSize:14, color:"#94a3b8", margin:"0 0 32px 0" }}>
          {isEdit ? "Update transaction details below"
                  : "Record a new lending or borrowing entry"}
        </p>

        {/* ── card ── */}
        <div style={{ background:"rgba(255,255,255,0.04)",
          border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:20, padding:32, backdropFilter:"blur(12px)",
          animation:"fadeUp .3s ease" }}>

          <form onSubmit={handleSubmit}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

              {/* error banner */}
              {apiError && (
                <div style={{ gridColumn:"span 2",
                  background:"rgba(255,71,87,.12)", border:"1px solid rgba(255,71,87,.3)",
                  borderRadius:10, padding:"12px 16px",
                  color:"#ff4757", fontSize:13, fontWeight:500 }}>
                  ⚠ {apiError}
                </div>
              )}

              {/* ── type toggle ── */}
              <div style={{ gridColumn:"span 2" }}>
                <Label t="Transaction Type" />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[
                    { val:"given", label:"↑ Given", desc:"Money lent out",  color:"#10d9a0" },
                    { val:"taken", label:"↓ Taken", desc:"Money borrowed",  color:"#ff4757" },
                  ].map(({ val, label, desc, color }) => (
                    <button key={val} type="button" className="atx-type"
                      onClick={() => set("type", val)}
                      style={{ padding:"14px 12px", borderRadius:12, cursor:"pointer",
                        textAlign:"left", fontFamily:"inherit", transition:"all .15s",
                        border:`2px solid ${form.type===val ? color : "rgba(255,255,255,.1)"}`,
                        background: form.type===val ? `${color}18` : "rgba(255,255,255,.03)" }}>
                      <div style={{ fontSize:14, fontWeight:700,
                        color: form.type===val ? color : "#8888aa" }}>{label}</div>
                      <div style={{ fontSize:11, color:"#8888aa", marginTop:3 }}>{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Divider />
              <SectionTitle t="Person Details" />

              {/* person name */}
              <div style={{ gridColumn:"span 1" }}>
                <Label t="Person Name *" />
                <input className="atx-input" style={inp}
                  type="text" name="personName"
                  placeholder="e.g. Rahul Sharma"
                  value={form.personName} onChange={onChange} />
              </div>

              {/* contact */}
              <div style={{ gridColumn:"span 1" }}>
                <Label t="Contact" />
                <input className="atx-input" style={inp}
                  type="text" name="contact"
                  placeholder="Phone or email"
                  value={form.contact} onChange={onChange} />
              </div>

              <Divider />
              <SectionTitle t="Transaction Details" />

              {/* amount */}
              <div style={{ gridColumn:"span 1" }}>
                <Label t="Amount (₹) *" />
                <input className="atx-input" style={inp}
                  type="number" name="amount"
                  placeholder="0.00" min="0" step="0.01"
                  value={form.amount}
                  onChange={(e) => {
                    if (e.target.value === "" || parseFloat(e.target.value) >= 0)
                      set("amount", e.target.value);
                  }} />
              </div>

              {/* interest rate */}
              <div style={{ gridColumn:"span 1" }}>
                <Label t="Interest Rate (% p.a.) *" />
                <input className="atx-input" style={inp}
                  type="number" name="interestRate"
                  placeholder="e.g. 12" min="0" max="100" step="0.1"
                  value={form.interestRate}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || (parseFloat(v) >= 0 && parseFloat(v) <= 100))
                      set("interestRate", v);
                  }} />
              </div>

              {/* interest type */}
              <div style={{ gridColumn:"span 1" }}>
                <Label t="Interest Type" />
                <select className="atx-input" style={sel}
                  name="interestType" value={form.interestType} onChange={onChange}>
                  <option value="simple">Simple Interest</option>
                  <option value="compound">Compound Interest</option>
                </select>
              </div>

              {/* payment mode */}
              <div style={{ gridColumn:"span 1" }}>
                <Label t="Payment Mode" />
                <select className="atx-input" style={sel}
                  name="paymentMode" value={form.paymentMode} onChange={onChange}>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* transaction date */}
              <div style={{ gridColumn:"span 1" }}>
                <Label t="Transaction Date *" />
                <input className="atx-input"
                  style={{ ...inp, colorScheme:"dark" }}
                  type="date" name="date"
                  value={form.date} onChange={onChange} />
              </div>

              {/* due date */}
              <div style={{ gridColumn:"span 1" }}>
                <Label t="Due Date (optional)" />
                <input className="atx-input"
                  style={{ ...inp, colorScheme:"dark" }}
                  type="date" name="dueDate" min={form.date}
                  value={form.dueDate} onChange={onChange} />
              </div>

              <Divider />
              <SectionTitle t="Additional Info" />

              {/* notes */}
              <div style={{ gridColumn:"span 2" }}>
                <Label t="Notes" />
                <textarea className="atx-input"
                  style={{ ...inp, resize:"vertical", minHeight:80 }}
                  name="notes" placeholder="Any remarks or notes..."
                  value={form.notes} onChange={onChange} />
              </div>

              {/* file */}
              <div style={{ gridColumn:"span 2" }}>
                <Label t="Attachment (Screenshot / Receipt)" />
                <label style={{ display:"flex", alignItems:"center", gap:10,
                  background:"rgba(255,255,255,.04)",
                  border:"1.5px dashed rgba(167,139,250,.4)",
                  borderRadius:10, padding:"14px 16px",
                  cursor:"pointer", fontSize:14 }}>
                  <span>📎</span>
                  <span style={{ color: file ? "#c4b5fd" : "#94a3b8" }}>
                    {file ? file.name : "Choose file (optional)..."}
                  </span>
                  <input type="file" accept="image/*,application/pdf"
                    onChange={onFile} style={{ display:"none" }} />
                </label>
                {preview && (
                  <img src={preview} alt="preview"
                    style={{ width:100, height:100, objectFit:"cover",
                      borderRadius:10, marginTop:8,
                      border:"1px solid rgba(255,255,255,.1)" }} />
                )}
              </div>

              {/* ── interest preview ── */}
              {calc && (
                <div style={{ gridColumn:"span 2",
                  background:"linear-gradient(135deg,rgba(129,140,248,.12),rgba(196,181,253,.08))",
                  border:"1px solid rgba(129,140,248,.25)",
                  borderRadius:14, padding:"18px 20px" }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"#818cf8",
                    letterSpacing:"0.1em", textTransform:"uppercase",
                    marginBottom:12, marginTop:0 }}>
                    📊 Interest Preview
                  </p>
                  {[
                    ["Principal",
                      `₹${parseFloat(form.amount).toLocaleString("en-IN",
                        { minimumFractionDigits:2, maximumFractionDigits:2 })}`],
                    ["Simple Interest",   formatCurrency(calc.simple)],
                    ["Compound Interest", formatCurrency(calc.compound)],
                    ["Duration",          `${calc.days} days · ${Math.floor(calc.months)} months`],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display:"flex",
                      justifyContent:"space-between",
                      fontSize:14, color:"#cbd5e1", marginBottom:8 }}>
                      <span>{label}</span>
                      <span style={{ fontWeight:600,
                        fontFamily:"DM Mono,monospace" }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", justifyContent:"space-between",
                    fontSize:16, fontWeight:700, color:"#c4b5fd",
                    borderTop:"1px solid rgba(255,255,255,.1)",
                    paddingTop:10, marginTop:4 }}>
                    <span>Total Payable ({form.interestType === "simple" ? "SI" : "CI"})</span>
                    <span style={{ fontFamily:"DM Mono,monospace" }}>
                      {formatCurrency(
                        form.interestType === "simple"
                          ? calc.totalWithSimple
                          : calc.totalWithCompound
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* ── submit ── */}
              <button type="submit" className="atx-btn"
                disabled={loading}
                style={{ gridColumn:"span 2", width:"100%", padding:"15px",
                  background:"linear-gradient(135deg,#818cf8,#a78bfa)",
                  border:"none", borderRadius:12, color:"#fff",
                  fontSize:16, fontWeight:700,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1, fontFamily:"inherit",
                  transition:"opacity .2s, transform .1s", marginTop:4 }}>
                {loading
                  ? "⏳ Saving…"
                  : isEdit ? "✓ Update Transaction" : "⊕ Add Transaction"}
              </button>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
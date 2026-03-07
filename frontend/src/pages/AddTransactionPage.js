import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import API from "../utils/api";
import { calculateInterest, formatCurrency } from "../utils/calculations";
import toast from "react-hot-toast";

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    padding: "40px 20px",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    color: "#e8e8f0",
  },
  container: {
    maxWidth: "680px",
    margin: "0 auto",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "#a78bfa",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 500,
    marginBottom: "28px",
    letterSpacing: "0.02em",
    transition: "color 0.2s",
  },
  header: {
    marginBottom: "36px",
  },
  title: {
    fontSize: "32px",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    background: "linear-gradient(90deg, #c4b5fd, #818cf8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "0 0 6px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: 0,
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "32px",
    backdropFilter: "blur(12px)",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#a78bfa",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  input: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "#e8e8f0",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    width: "100%",
    boxSizing: "border-box",
  },
  select: {
    background: "rgba(30,27,60,0.9)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "#e8e8f0",
    fontSize: "15px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    cursor: "pointer",
  },
  textarea: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "#e8e8f0",
    fontSize: "15px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: "80px",
    fontFamily: "inherit",
  },
  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.07)",
    margin: "8px 0",
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#64748b",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: "4px",
    marginTop: "8px",
  },
  fileLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(255,255,255,0.04)",
    border: "1.5px dashed rgba(167,139,250,0.4)",
    borderRadius: "10px",
    padding: "14px 16px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#94a3b8",
    transition: "border-color 0.2s",
  },
  preview: {
    width: "100px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  calcBox: {
    background: "linear-gradient(135deg, rgba(129,140,248,0.12), rgba(196,181,253,0.08))",
    border: "1px solid rgba(129,140,248,0.25)",
    borderRadius: "14px",
    padding: "18px 20px",
  },
  calcTitle: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#818cf8",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "12px",
  },
  calcRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#cbd5e1",
    marginBottom: "8px",
  },
  calcTotal: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "16px",
    fontWeight: 700,
    color: "#c4b5fd",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    paddingTop: "10px",
    marginTop: "4px",
  },
  submitBtn: {
    width: "100%",
    padding: "15px",
    background: "linear-gradient(135deg, #818cf8, #a78bfa)",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 700,
    letterSpacing: "0.02em",
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.1s",
    marginTop: "8px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
};

export default function AddTransactionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    personName: "",
    contact: "",
    amount: "",
    interestRate: "",
    interestType: "simple",
    type: "given",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    paymentMode: "cash",
    notes: "",
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) fetchTransaction();
  }, [isEdit]);

  const fetchTransaction = async () => {
    try {
      // FIX: use correct list endpoint
      const res = await API.get("/transactions");
      const tx = res.data.data.find((t) => t._id === id);
      if (!tx) return;
      setForm({
        personName: tx.personName || "",
        contact: tx.contact || "",
        amount: tx.amount?.toString() || "",
        interestRate: tx.interestRate?.toString() || "",
        interestType: tx.interestType || "simple",
        type: tx.type || "given",
        date: tx.date ? new Date(tx.date).toISOString().split("T")[0] : "",
        dueDate: tx.dueDate ? new Date(tx.dueDate).toISOString().split("T")[0] : "",
        paymentMode: tx.paymentMode || "cash",
        notes: tx.notes || "",
      });
    } catch {
      toast.error("Failed to load transaction");
    }
  };

  const calc =
    form.amount && form.interestRate && form.date
      ? calculateInterest(
          Number(form.amount),
          Number(form.interestRate),
          form.date,
          form.dueDate || new Date(),
          form.interestType
        )
      : null;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.personName || !form.amount || !form.interestRate) {
      toast.error("Please fill required fields");
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      Object.keys(form).forEach((key) => formData.append(key, form[key] || ""));
      if (file) formData.append("screenshot", file);

      if (isEdit) {
        // FIX: correct edit endpoint
        await API.put(`/transactions/${id}`, formData);
        toast.success("Transaction updated");
      } else {
        // FIX: correct add endpoint — was "/transactions/add" → now "/transactions"
        await API.post("/transactions", formData);
        toast.success("Transaction added");
      }
      navigate("/transactions");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, children }) => (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Link to="/transactions" style={styles.backLink}>
          ← Back to Transactions
        </Link>

        <div style={styles.header}>
          <h2 style={styles.title}>
            {isEdit ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <p style={styles.subtitle}>
            {isEdit ? "Update existing transaction details" : "Record a new lending or borrowing entry"}
          </p>
        </div>

        <div style={styles.card}>
          <form onSubmit={handleSubmit} style={styles.form}>

            {/* Person Info */}
            <p style={styles.sectionLabel}>Person Details</p>
            <div style={styles.grid2}>
              <Field label="Person Name *">
                <input
                  style={styles.input}
                  type="text"
                  name="personName"
                  placeholder="e.g. Rahul Sharma"
                  value={form.personName}
                  onChange={handleChange}
                  required
                />
              </Field>
              <Field label="Contact">
                <input
                  style={styles.input}
                  type="text"
                  name="contact"
                  placeholder="Phone or email"
                  value={form.contact}
                  onChange={handleChange}
                />
              </Field>
            </div>

            <div style={styles.divider} />

            {/* Transaction Info */}
            <p style={styles.sectionLabel}>Transaction Details</p>
            <div style={styles.grid2}>
              <Field label="Type">
                <select style={styles.select} name="type" value={form.type} onChange={handleChange}>
                  <option value="given">Given (Lent out)</option>
                  <option value="taken">Taken (Borrowed)</option>
                </select>
              </Field>
              <Field label="Payment Mode">
                <select style={styles.select} name="paymentMode" value={form.paymentMode} onChange={handleChange}>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </Field>
            </div>

            <div style={styles.grid2}>
              <Field label="Amount (₹) *">
                <input
                  style={styles.input}
                  type="number"
                  name="amount"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </Field>
              <Field label="Interest Rate (% p.a.) *">
                <input
                  style={styles.input}
                  type="number"
                  name="interestRate"
                  placeholder="e.g. 12"
                  value={form.interestRate}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.1"
                />
              </Field>
            </div>

            <Field label="Interest Type">
              <select style={styles.select} name="interestType" value={form.interestType} onChange={handleChange}>
                <option value="simple">Simple Interest</option>
                <option value="compound">Compound Interest</option>
              </select>
            </Field>

            <div style={styles.grid2}>
              <Field label="Transaction Date">
                <input
                  style={styles.input}
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                />
              </Field>
              <Field label="Due Date">
                <input
                  style={styles.input}
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                />
              </Field>
            </div>

            <div style={styles.divider} />

            {/* Notes & File */}
            <p style={styles.sectionLabel}>Additional Info</p>
            <Field label="Notes">
              <textarea
                style={styles.textarea}
                name="notes"
                placeholder="Any remarks or notes..."
                value={form.notes}
                onChange={handleChange}
              />
            </Field>

            <Field label="Attachment (Screenshot / Receipt)">
              <label style={styles.fileLabel}>
                <span>📎</span>
                <span>{file ? file.name : "Choose file..."}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </label>
              {preview && (
                <img src={preview} alt="preview" style={styles.preview} />
              )}
            </Field>

            {/* Interest Preview */}
            {calc && (
              <>
                <div style={styles.divider} />
                <div style={styles.calcBox}>
                  <p style={styles.calcTitle}>Interest Preview</p>
                  <div style={styles.calcRow}>
                    <span>Simple Interest</span>
                    <span>{formatCurrency(calc.simple)}</span>
                  </div>
                  <div style={styles.calcRow}>
                    <span>Compound Interest</span>
                    <span>{formatCurrency(calc.compound)}</span>
                  </div>
                  <div style={styles.calcTotal}>
                    <span>Total Payable</span>
                    <span>{formatCurrency(calc.totalWithSimple)}</span>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
            >
              {loading ? "Saving..." : isEdit ? "Update Transaction" : "Add Transaction"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

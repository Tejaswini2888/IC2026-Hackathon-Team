
import "./style.css";
import { useState } from "react";
import PatientLogin from "./pages/PatientLogin";
import MedicationDashboard from "./components/MedicationDashboard";
import "./style.css";

const API = "http://localhost:5000/api";

export default function App() {
  const [tab, setTab] = useState("patient");
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({
    patientId: "",
    doctorName: "",
    hospital: "",
    medicine: "",
    description: "",
    dose: "",
    times: "09:00",
    refillDate: "",
    imageName: ""
  });
  const [message, setMessage] = useState("");

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function savePrescription(e) {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API}/prescriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          times: form.times.split(",").map(t => t.trim()).filter(Boolean)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setMessage("Prescription saved successfully.");
      setForm({
        ...form,
        medicine: "",
        description: "",
        dose: "",
        imageName: ""
      });
    } catch (error) {
      setMessage(error.message || "Could not save prescription.");
    }
  }

  return (
    <div className="app">
      <header>
        <h1>🌿 Sanjeevani</h1>
        <p>Your medication reminder companion</p>
      </header>

      <nav aria-label="Main navigation">
        <button onClick={() => setTab("patient")}>
          Patient Login
        </button>
        <button onClick={() => setTab("doctor")}>
          Doctor's Prescription
        </button>
      </nav>

      {tab === "patient" && (
        patient ? (
          <>
            <section className="panel">
              <h2>Hello, {patient.name}</h2>
              <p>Phone: {patient.phone}</p>
              <button onClick={() => setPatient(null)}>
                Logout
              </button>
            </section>
            <MedicationDashboard patient={patient} />
          </>
        ) : (
          <PatientLogin onLogin={setPatient} />
        )
      )}

      {tab === "doctor" && (
        <section className="panel">
          <h2>Doctor's Prescription Entry</h2>
          <p>
            Demo only: enter the patient's profile ID and the
            prescription details provided by their clinician.
          </p>

          <form onSubmit={savePrescription}>
            <label>
              Patient profile ID
              <input name="patientId" value={form.patientId}
                onChange={update} required />
            </label>

            <label>
              Doctor's name
              <input name="doctorName" value={form.doctorName}
                onChange={update} required />
            </label>

            <label>
              Hospital / clinic
              <input name="hospital" value={form.hospital}
                onChange={update} required />
            </label>

            <label>
              Medicine name
              <input name="medicine" value={form.medicine}
                onChange={update} required />
            </label>

            <label>
              Medicine description
              <textarea name="description"
                value={form.description} onChange={update} />
            </label>

            <label>
              Prescribed dose (as written by doctor)
              <input name="dose" value={form.dose}
                onChange={update} required />
            </label>

            <label>
              Reminder times (24-hour format, comma-separated)
              <input name="times" placeholder="09:00, 21:00"
                value={form.times} onChange={update} required />
            </label>

            <label>
              Refill date
              <input type="date" name="refillDate"
                value={form.refillDate} onChange={update} />
            </label>

            <label>
              Prescription image filename (optional demo field)
              <input name="imageName" value={form.imageName}
                onChange={update} />
            </label>

            <button type="submit">Save Prescription</button>
          </form>

          <p role="status" aria-live="polite">{message}</p>
        </section>
      )}

      <footer>
        <p>Follow your clinician's prescription.</p>
      </footer>
    </div>
  );
}
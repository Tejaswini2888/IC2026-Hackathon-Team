import { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

export default function MedicationDashboard({ patient }) {
  const [medicines, setMedicines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [careName, setCareName] = useState("");
  const [careEmail, setCareEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [language, setLanguage] = useState("en-IN");
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      const [medRes, logRes, careRes] = await Promise.all([
        fetch(`${API}/medications/${patient.id}`),
        fetch(`${API}/adherence/${patient.id}`),
        fetch(`${API}/caregivers/${patient.id}`)
      ]);

      if (!medRes.ok || !logRes.ok || !careRes.ok) {
        throw new Error("Could not load patient data.");
      }

      setMedicines(await medRes.json());
      setLogs(await logRes.json());
      setCaregivers(await careRes.json()); 
    } catch {
      setMessage("Unable to load data. Check the backend server.");
    }
  }

  useEffect(() => {
    loadData();
  }, [patient.id]);

  // Browser notifications work only when permission is granted.
  // This demo checks reminders while the page is open.
  useEffect(() => {
    if (!("Notification" in window)) return;

    let lastAlert = "";

    async function checkReminders() {
      const now = new Date();
      const currentTime = [
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0")
      ].join(":");

      const today = now.toDateString();

      for (const medicine of medicines) {
        if (!medicine.times?.includes(currentTime)) continue;

        const key = `${today}-${medicine.id}-${currentTime}`;
        if (key === lastAlert) continue;

        if (Notification.permission === "granted") {
          new Notification("Sanjeevani medicine reminder", {
            body: `Check your prescription for ${medicine.medicine}.`
          });
          lastAlert = key;
        }
      }
    }

    const timer = setInterval(checkReminders, 15000);
    checkReminders();

    return () => clearInterval(timer);
  }, [medicines]);

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setMessage("Notifications are not supported in this browser.");
      return;
    }

    const permission = await Notification.requestPermission();
    setMessage(
      permission === "granted"
        ? "Notifications enabled while the dashboard is running."
        : "Notification permission was not granted."
    );
  }

  async function markDose(medicine, status) {
    try {
      const response = await fetch(`${API}/adherence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          medicationId: medicine.id,
          status
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      await loadData();
      setMessage(`Dose marked as ${status}.`);
    } catch (error) {
      setMessage(error.message || "Could not save adherence.");
    }
  }

  async function addCaregiver(e) {
    e.preventDefault();

    try {
      const response = await fetch(`${API}/caregivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          name: careName,
          email: careEmail
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setCareName("");
      setCareEmail("");
      await loadData();
      setMessage("Caregiver added in the demo.");
    } catch (error) {
      setMessage(error.message || "Could not add caregiver.");
    }
  }

  async function removeCaregiver(id) {
    try {
      const response = await fetch(`${API}/caregivers/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Could not revoke access.");
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function askBot(e) {
    e.preventDefault();

    try {
      const response = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setAnswer(data.answer);
    } catch {
      setAnswer("The chatbot is unavailable. Please try again.");
    }
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) {
      setMessage("Voice output is not supported by this browser.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
  }

  function listen() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.onresult = event => {
      setQuestion(event.results[0][0].transcript);
    };
    recognition.onerror = () => {
      setMessage("Could not recognize speech. Please try typing.");
    };
    recognition.start();
  }

  function refillDue(date) {
    if (!date) return false;

    const daysLeft =
      (new Date(`${date}T00:00:00`) -
        new Date(new Date().toDateString())) /
      (1000 * 60 * 60 * 24);

    return daysLeft >= 0 && daysLeft <= 3;
  }

  return (
    <main className="panel">
      <h2>Medication Dashboard</h2>
      <p>Patient: {patient.name}</p>

      <button onClick={enableNotifications}>
        Enable Medicine Alerts
      </button>
      <p role="status" aria-live="polite">{message}</p>

      <h3>My Prescriptions</h3>

      {medicines.length === 0 && (
        <p>No prescriptions have been added yet.</p>
      )}

      {medicines.map(medicine => (
        <article className="medicine-card" key={medicine.id}>
          <h3>{medicine.medicine}</h3>
          <p>{medicine.description}</p>
          <p><strong>Prescribed dose:</strong> {medicine.dose}</p>
          <p><strong>Doctor:</strong> {medicine.doctorName}</p>
          <p><strong>Hospital:</strong> {medicine.hospital}</p>
          <p>
            <strong>Reminder times:</strong>{" "}
            {medicine.times?.join(", ")}
          </p>

          {refillDue(medicine.refillDate) && (
            <p className="alert">
              Refill reminder: your recorded refill date is
              approaching or today.
            </p>
          )}

          <button onClick={() => markDose(medicine, "taken")}>
            Mark Dose Taken
          </button>
          <button className="secondary"
            onClick={() => markDose(medicine, "missed")}>
            Mark Dose Missed
          </button>
        </article>
      ))}

      <h3>Medication Adherence Log</h3>
      {logs.length === 0 ? (
        <p>No doses have been recorded yet.</p>
      ) : (
        <ul>
          {logs.slice().reverse().map(log => (
            <li key={log.id}>
              {log.status} — {new Date(log.date).toLocaleString()}
            </li>
          ))}
        </ul>
      )}

      <h3>Caregiver Permissions</h3>
      <form onSubmit={addCaregiver}>
        <label>
          Caregiver name
          <input value={careName}
            onChange={e => setCareName(e.target.value)} required />
        </label>
        <label>
          Caregiver email
          <input type="email" value={careEmail}
            onChange={e => setCareEmail(e.target.value)} required />
        </label>
        <button type="submit">Add Caregiver</button>
      </form>

      {caregivers.map(caregiver => (
        <p key={caregiver.id}>
          {caregiver.name} ({caregiver.email}) — Access enabled
          <button onClick={() => removeCaregiver(caregiver.id)}>
            Revoke
          </button>
        </p>
      ))}

      <h3>Medicine Information Assistant</h3>
      <label>
        Voice language
        <select value={language}
          onChange={e => setLanguage(e.target.value)}>
          <option value="en-IN">English</option>
          <option value="te-IN">Telugu</option>
          <option value="hi-IN">Hindi</option>
          <option value="ta-IN">Tamil</option>
        </select>
      </label>

      <form onSubmit={askBot}>
        <label>
          Ask a general medicine question
          <textarea value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask about medicine information..."
            required />
        </label>
        <button type="submit">Ask Assistant</button>
        <button type="button" className="secondary"
          onClick={listen}>
          Speak Question
        </button>
      </form>

      {answer && (
        <article className="medicine-card">
          <p>{answer}</p>
          <button onClick={() => speak(answer)}>
            Read Answer Aloud
          </button>
        </article>
      )}
    </main>
  );
}

import { useState } from "react";

const API = "http://localhost:5000/api";

export default function PatientLogin({ onLogin }) {
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "",
    email: "",
    pin: ""
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API}/patients/${register ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      if (register) {
        setRegister(false);
        setForm({ ...form, pin: "" });
        setMessage("Registration successful. Please log in.");
      } else {
        onLogin(data.patient);
      }
    } catch (error) {
      setMessage(
        error.message || "Cannot connect to the server."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="panel">
      <h2>{register ? "Create Patient Profile" : "Patient Login"}</h2>
      <p>Welcome to Sanjeevani medication assistance.</p>

      <form onSubmit={submit}>
        {register && (
          <>
            <label>
              Full name
              <input name="name" value={form.name}
                onChange={update} required />
            </label>

            <label>
              Age
              <input name="age" type="number" min="1"
                value={form.age} onChange={update} />
            </label>

            <label>
              Gender
              <select name="gender" value={form.gender}
                onChange={update}>
                <option value="">Prefer not to say</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Email for account recovery
              <input name="email" type="email"
                value={form.email} onChange={update} />
            </label>
          </>
        )}

        <label>
          Phone number
          <input name="phone" type="tel"
            autoComplete="tel"
            value={form.phone} onChange={update} required />
        </label>

        <label>
          {register ? "Create PIN" : "Your PIN"}
          <input name="pin" type="password"
            inputMode="numeric" minLength="4"
            maxLength="12" autoComplete="off"
            value={form.pin} onChange={update} required />
        </label>

        <button type="submit" disabled={busy}>
          {busy ? "Please wait..." :
            register ? "Create Profile" : "Login"}
        </button>
      </form>

      <p role="status" aria-live="polite">{message}</p>

      <button type="button" className="secondary"
        onClick={() => {
          setRegister(!register);
          setMessage("");
        }}>
        {register ? "Already registered? Login" :
          "New patient? Create profile"}
      </button>
    </main>
  );
}
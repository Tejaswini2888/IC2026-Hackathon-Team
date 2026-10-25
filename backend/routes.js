
const express = require("express");
const router = express.Router();

const {
  patients,
  medications,
  adherenceLogs,
  caregivers
} = require("./db");

const { randomUUID } = require("crypto");

// Demo only: use proper authentication and hashed PINs
// before storing real patient information.
router.post("/patients/register", (req, res) => {
  const { name, phone, age, gender, email, pin } = req.body;

  if (!name || !phone || !pin) {
    return res.status(400).json({
      message: "Name, phone and PIN are required"
    });
  }

  if (patients.some(p => p.phone === phone)) {
    return res.status(409).json({
      message: "Phone number already registered"
    });
  }

  const patient = {
    id: randomUUID(),
    name,
    phone,
    age,
    gender,
    email,
    pin: String(pin)
  };

  patients.push(patient);

  res.status(201).json({
    message: "Registration successful",
    patient: {
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      age: patient.age,
      gender: patient.gender,
      email: patient.email
    }
  });
});

router.post("/patients/login", (req, res) => {
  const { phone, pin } = req.body;

  const patient = patients.find(
    p => p.phone === phone && p.pin === String(pin)
  );

  if (!patient) {
    return res.status(401).json({
      message: "Invalid phone number or PIN"
    });
  }

  const { pin: ignored, ...safePatient } = patient;

  res.json({ patient: safePatient });
});

// Get a patient's medication list
router.get("/medications/:patientId", (req, res) => {
  const list = medications.filter(
    m => m.patientId === req.params.patientId
  );

  res.json(list);
});

// Doctor or authorized nurse adds a prescription
router.post("/prescriptions", (req, res) => {
  const {
    patientId,
    doctorName,
    hospital,
    medicine,
    description,
    dose,
    times,
    refillDate,
    imageName
  } = req.body;

  if (!patients.some(p => p.id === patientId)) {
    return res.status(404).json({
      message: "Patient not found"
    });
  }

  if (!medicine || !dose) {
    return res.status(400).json({
      message: "Medicine name and dose are required"
    });
  }

  const record = {
    id: randomUUID(),
    patientId,
    doctorName: doctorName || "",
    hospital: hospital || "",
    medicine,
    description: description || "",
    dose,
    times: Array.isArray(times) ? times : [],
    refillDate: refillDate || "",
    imageName: imageName || "",
    createdAt: new Date().toISOString()
  };

  medications.push(record);

  res.status(201).json({
    message: "Prescription added",
    medication: record
  });
});

// Mark a dose as taken or missed
router.post("/adherence", (req, res) => {
  const { patientId, medicationId, status } = req.body;

  if (!patients.some(p => p.id === patientId)) {
    return res.status(404).json({
      message: "Patient not found"
    });
  }

  if (!medications.some(
    m => m.id === medicationId && m.patientId === patientId
  )) {
    return res.status(404).json({
      message: "Medication not found"
    });
  }

  if (!["taken", "missed"].includes(status)) {
    return res.status(400).json({
      message: "Status must be taken or missed"
    });
  }

  const log = {
    id: randomUUID(),
    patientId,
    medicationId,
    status,
    date: new Date().toISOString()
  };

  adherenceLogs.push(log);

  res.status(201).json(log);
});

router.get("/adherence/:patientId", (req, res) => {
  res.json(
    adherenceLogs.filter(
      log => log.patientId === req.params.patientId
    )
  );
});

// Patient grants caregiver access
router.post("/caregivers", (req, res) => {
  const { patientId, name, email } = req.body;

  if (!patients.some(p => p.id === patientId)) {
    return res.status(404).json({
      message: "Patient not found"
    });
  }

  if (!name || !email) {
    return res.status(400).json({
      message: "Caregiver name and email are required"
    });
  }

  const caregiver = {
    id: randomUUID(),
    patientId,
    name,
    email,
    active: true
  };

  caregivers.push(caregiver);

  res.status(201).json(caregiver);
});

router.get("/caregivers/:patientId", (req, res) => {
  res.json(
    caregivers.filter(
      c => c.patientId === req.params.patientId && c.active
    )
  );
});

// Revoke caregiver permission
router.delete("/caregivers/:id", (req, res) => {
  const caregiver = caregivers.find(
    c => c.id === req.params.id
  );

  if (!caregiver) {
    return res.status(404).json({
      message: "Caregiver not found"
    });
  }

  caregiver.active = false;
  res.json({ message: "Caregiver access revoked" });
});

// Basic educational chatbot, not a medical decision system
router.post("/chat", (req, res) => {
  const question = String(req.body.question || "").toLowerCase();

  let answer =
    "I can explain general medicine information. " +
    "Please check the prescription and ask your doctor or pharmacist " +
    "before changing a dose or medicine.";

  if (question.includes("use") || question.includes("used for")) {
    answer =
      "Medicine uses depend on the exact medicine and the patient's " +
      "condition. Share the medicine name and verify its use with a " +
      "doctor or pharmacist.";
  } else if (
    question.includes("time") ||
    question.includes("when")
  ) {
    answer =
      "Follow the times written on your prescription. " +
      "Do not change the schedule without consulting your doctor.";
  } else if (question.includes("missed")) {
    answer =
      "If you missed a dose, follow the medicine's official instructions " +
      "or contact your pharmacist. Do not automatically double the next dose.";
  }

  res.json({ answer });
});

module.exports = router;
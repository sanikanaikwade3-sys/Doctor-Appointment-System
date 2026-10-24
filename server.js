
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files directly from the project root
app.use(express.static(__dirname));

const doctors = [
  { id: "1", name: "Dr. Ananya Sharma", specialty: "Cardiology" },
  { id: "2", name: "Dr. Rahul Mehta", specialty: "Dermatology" },
  { id: "3", name: "Dr. Priya Deshmukh", specialty: "Neurology" },
  { id: "4", name: "Dr. Arjun Patel", specialty: "Orthopedics" }
];

// Serve index.html from the main project folder
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Search doctors by name or specialty
app.get("/api/doctors", (req, res) => {
  const search = String(req.query.search || "").trim().toLowerCase();

  const results = doctors.filter((doctor) =>
    doctor.name.toLowerCase().includes(search) ||
    doctor.specialty.toLowerCase().includes(search)
  );

  res.status(200).json({
    success: true,
    doctors: results
  });
});

// Validate appointment requests
app.post("/book-appointment", (req, res) => {
  const {
    patientName,
    email,
    phone,
    doctorId,
    appointmentDate,
    reason
  } = req.body;

  const errors = [];

  const name = String(patientName || "").trim();
  const patientEmail = String(email || "").trim();
  const mobile = String(phone || "").trim();
  const date = String(appointmentDate || "").trim();
  const visitReason = String(reason || "").trim();

  const selectedDoctor = doctors.find(
    (doctor) => doctor.id === String(doctorId || "")
  );

  if (!/^[A-Za-z ]{2,80}$/.test(name)) {
    errors.push("Name must contain 2–80 letters and spaces only.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail)) {
    errors.push("Enter a valid email address.");
  }

  if (!/^[0-9]{10}$/.test(mobile)) {
    errors.push("Mobile number must contain exactly 10 digits.");
  }

  if (!selectedDoctor) {
    errors.push("Please select a valid doctor.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push("Please select a valid appointment date.");
  } else {
    const [year, month, day] = date.split("-").map(Number);
    const selectedDate = new Date(Date.UTC(year, month - 1, day));

    const validDate =
      selectedDate.getUTCFullYear() === year &&
      selectedDate.getUTCMonth() === month - 1 &&
      selectedDate.getUTCDate() === day;

    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("-");

    if (!validDate) {
      errors.push("Please enter a valid calendar date.");
    } else if (date < today) {
      errors.push("Appointment date cannot be in the past.");
    }
  }

  if (visitReason.length < 5 || visitReason.length > 500) {
    errors.push("Reason must contain 5–500 characters.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Please correct the following errors.",
      errors
    });
  }

  return res.status(201).json({
    success: true,
    message: "Appointment request submitted successfully.",
    appointment: {
      patientName: name,
      doctor: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      appointmentDate: date
    }
  });
});

app.listen(PORT, () => {
  console.log(`MedQueue running on port ${PORT}`);
});

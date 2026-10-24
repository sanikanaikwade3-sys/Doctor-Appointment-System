
const doctorList = document.getElementById("doctorList");
const searchForm = document.getElementById("searchForm");
const doctorSearch = document.getElementById("doctorSearch");
const locationSearch = document.getElementById("locationSearch");
const searchMessage = document.getElementById("searchMessage");

const bookingModal = document.getElementById("bookingModal");
const appointmentForm = document.getElementById("appointmentForm");
const doctorSelect = document.getElementById("doctorId");
const appointmentDate = document.getElementById("appointmentDate");
const phoneInput = document.getElementById("phone");
const formMessage = document.getElementById("formMessage");
const submitButton = document.getElementById("submitButton");

let availableDoctors = [];

const today = new Date();
const localToday = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0")
].join("-");

appointmentDate.min = localToday;

function showFormMessage(message, type) {
  formMessage.className = `form-message ${type}`;
  formMessage.replaceChildren();

  if (Array.isArray(message)) {
    const list = document.createElement("ul");

    message.forEach((error) => {
      const item = document.createElement("li");
      item.textContent = error;
      list.appendChild(item);
    });

    formMessage.appendChild(list);
  } else {
    formMessage.textContent = message;
  }

  formMessage.hidden = false;
}

function openBooking(doctorId = "") {
  bookingModal.hidden = false;
  document.body.classList.add("modal-open");
  formMessage.hidden = true;

  if (doctorId) {
    doctorSelect.value = doctorId;
  }

  document.getElementById("patientName").focus();
}

function closeBooking() {
  bookingModal.hidden = true;
  document.body.classList.remove("modal-open");
}

async function loadDoctors(search = "", location = "") {
  doctorList.replaceChildren();

  const loading = document.createElement("p");
  loading.className = "loading";
  loading.textContent = "Finding doctors...";
  doctorList.appendChild(loading);

  try {
    const params = new URLSearchParams({ search, location });
    const response = await fetch(`/api/doctors?${params}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error("Unable to load doctors.");
    }

    availableDoctors = data.doctors;
    doctorList.replaceChildren();
    doctorSelect.replaceChildren();

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select a doctor";
    doctorSelect.appendChild(defaultOption);

    availableDoctors.forEach((doctor, index) => {
      const option = document.createElement("option");
      option.value = doctor.id;
      option.textContent = `${doctor.name} — ${doctor.specialty}`;
      doctorSelect.appendChild(option);

      const card = document.createElement("article");
      card.className = "doctor-card";

      const avatar = document.createElement("div");
      avatar.className = "doctor-avatar";
      avatar.textContent = doctor.name
        .split(" ")
        .filter((word) => word.startsWith("Dr.") === false)
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

      const info = document.createElement("div");
      info.className = "doctor-info";

      const name = document.createElement("h3");
      name.textContent = doctor.name;

      const specialty = document.createElement("p");
      specialty.textContent = doctor.specialty;

      const rating = document.createElement("div");
      rating.className = "rating";
      rating.textContent = `★ ${(4.8 - index * 0.1).toFixed(1)} · Demo rating`;

      info.append(name, specialty, rating);

      const availability = document.createElement("div");
      availability.className = "availability";

      const label = document.createElement("span");
      label.textContent = "Appointment";

      const time = document.createElement("strong");
      time.textContent = "Request online";

      availability.append(label, time);

      const bookButton = document.createElement("button");
      bookButton.className = "book-doctor";
      bookButton.type = "button";
      bookButton.textContent = "›";
      bookButton.setAttribute("aria-label", `Request ${doctor.name}`);
      bookButton.addEventListener("click", () => openBooking(doctor.id));

      card.append(avatar, info, availability, bookButton);
      doctorList.appendChild(card);
    });

    searchMessage.textContent = availableDoctors.length
      ? `${availableDoctors.length} doctor(s) found.`
      : "No doctors found. Try another name or specialty.";

  } catch (error) {
    doctorList.replaceChildren();
    searchMessage.textContent = "Could not load doctors. Please try again.";
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  loadDoctors(
    doctorSearch.value.trim(),
    locationSearch.value.trim()
  );
});

document.getElementById("viewAll").addEventListener("click", (event) => {
  event.preventDefault();
  doctorSearch.value = "";
  locationSearch.value = "";
  loadDoctors();
});

document.querySelectorAll("[data-search]").forEach((button) => {
  button.addEventListener("click", () => {
    doctorSearch.value = button.dataset.search;
    loadDoctors(doctorSearch.value, locationSearch.value.trim());

    document.getElementById("doctors").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });
});

document.getElementById("exploreButton").addEventListener("click", () => {
  document.getElementById("doctors").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  doctorSearch.focus();
});

document.getElementById("portalButton").addEventListener("click", () => {
  openBooking();
});

document.getElementById("insuranceButton").addEventListener("click", () => {
  alert("Insurance information demo: please contact your insurance provider to verify coverage.");
});

document.getElementById("closeModal").addEventListener("click", closeBooking);
document.getElementById("modalBackdrop").addEventListener("click", closeBooking);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !bookingModal.hidden) {
    closeBooking();
  }
});

document.getElementById("menuButton").addEventListener("click", () => {
  document.querySelector(".navbar nav").classList.toggle("open");
});

document.querySelectorAll(".navbar nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelector(".navbar nav").classList.remove("open");
  });
});

phoneInput.addEventListener("input", () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
});

appointmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.hidden = true;

  const formData = new FormData(appointmentForm);
  const details = Object.fromEntries(formData.entries());

  if (!/^[0-9]{10}$/.test(details.phone)) {
    showFormMessage("Mobile number must contain exactly 10 digits.", "error");
    phoneInput.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting request...";

  try {
    const response = await fetch("/book-appointment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(details)
    });

    const data = await response.json();

    if (!response.ok) {
      showFormMessage(data.errors || [data.message || "Please check your details."], "error");
      return;
    }

    showFormMessage(
      `${data.message} Doctor: ${data.appointment.doctor}. Date: ${data.appointment.appointmentDate}. This is a request, not a confirmed appointment.`,
      "success"
    );

    appointmentForm.reset();
    appointmentDate.min = localToday;

  } catch (error) {
    showFormMessage("Unable to contact the server. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Submit appointment request <span>→</span>';
  }
});

loadDoctors();

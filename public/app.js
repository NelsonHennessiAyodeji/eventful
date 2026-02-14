const API_BASE = "http://localhost:5000/api"; // empty because same origin, or you can set to http://localhost:5000/api if needed. We'll use relative path.

let token = localStorage.getItem("token");
let user = null;

// DOM elements
const navRegister = document.getElementById("nav-register");
const navLogin = document.getElementById("nav-login");
const navLogout = document.getElementById("nav-logout");
const userRoleSpan = document.getElementById("user-role");
const registerSection = document.getElementById("register-section");
const loginSection = document.getElementById("login-section");
const homeSection = document.getElementById("home-section");
const creatorDashboard = document.getElementById("creator-dashboard");
const attendeeDashboard = document.getElementById("attendee-dashboard");

// Event listeners for navigation
navRegister.addEventListener("click", (e) => {
  e.preventDefault();
  showSection("register");
});

navLogin.addEventListener("click", (e) => {
  e.preventDefault();
  showSection("login");
});

navLogout.addEventListener("click", (e) => {
  e.preventDefault();
  logout();
});

// Initially load home and check token
window.addEventListener("load", () => {
  if (token) {
    fetchUser();
  } else {
    showSection("home");
  }
  loadEvents();
});

function showSection(section) {
  registerSection.style.display = "none";
  loginSection.style.display = "none";
  homeSection.style.display = "none";
  creatorDashboard.style.display = "none";
  attendeeDashboard.style.display = "none";

  if (section === "register") registerSection.style.display = "block";
  else if (section === "login") loginSection.style.display = "block";
  else if (section === "home") homeSection.style.display = "block";
  else if (section === "creator") creatorDashboard.style.display = "block";
  else if (section === "attendee") attendeeDashboard.style.display = "block";
}

async function fetchUser() {
  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      user = data.data;
      userRoleSpan.textContent = `Logged in as: ${user.name} (${user.role})`;
      navRegister.style.display = "none";
      navLogin.style.display = "none";
      navLogout.style.display = "inline";
      if (user.role === "creator") {
        showSection("creator");
        loadMyEvents();
      } else {
        showSection("attendee");
        loadMyTickets();
      }
    } else {
      logout();
    }
  } catch (err) {
    console.error(err);
    logout();
  }
}

function logout() {
  localStorage.removeItem("token");
  token = null;
  user = null;
  userRoleSpan.textContent = "";
  navRegister.style.display = "inline";
  navLogin.style.display = "inline";
  navLogout.style.display = "none";
  showSection("home");
  loadEvents();
}

// Register form
document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const role = document.getElementById("reg-role").value;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (data.success) {
        token = data.data.token;
        localStorage.setItem("token", token);
        document.getElementById("register-message").textContent =
          "Registration successful!";
        fetchUser();
      } else {
        document.getElementById("register-message").textContent =
          data.message || "Registration failed";
      }
    } catch (err) {
      document.getElementById("register-message").textContent =
        "Error: " + err.message;
    }
  });

// Login form
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      token = data.data.token;
      localStorage.setItem("token", token);
      document.getElementById("login-message").textContent =
        "Login successful!";
      fetchUser();
    } else {
      document.getElementById("login-message").textContent =
        data.message || "Login failed";
    }
  } catch (err) {
    document.getElementById("login-message").textContent =
      "Error: " + err.message;
  }
});

// Load all events
async function loadEvents() {
  const eventsList = document.getElementById("events-list");
  eventsList.innerHTML = "Loading...";
  try {
    const res = await fetch("/api/events");
    const data = await res.json();
    if (data.success) {
      eventsList.innerHTML = "";
      data.data.forEach((event) => {
        const card = document.createElement("div");
        card.className = "event-card";
        card.innerHTML = `
                    <h3>${event.title}</h3>
                    <p>${event.description}</p>
                    <p><strong>Date:</strong> ${new Date(
                      event.date
                    ).toLocaleString()}</p>
                    <p><strong>Location:</strong> ${event.location}</p>
                    <p><strong>Price:</strong> $${event.price}</p>
                    <p><strong>Tickets available:</strong> ${
                      event.availableTickets
                    } / ${event.totalTickets}</p>
                    ${
                      user &&
                      user.role === "attendee" &&
                      event.availableTickets > 0
                        ? `<button class="buy-btn" data-event-id="${event._id}">Buy Ticket</button>`
                        : ""
                    }
                `;
        eventsList.appendChild(card);
      });
      // Add buy buttons event listeners
      document.querySelectorAll(".buy-btn").forEach((btn) => {
        btn.addEventListener("click", buyTicket);
      });
    } else {
      eventsList.innerHTML = "Failed to load events.";
    }
  } catch (err) {
    eventsList.innerHTML = "Error loading events.";
  }
}

// Buy ticket (attendee)
async function buyTicket(e) {
  const eventId = e.target.dataset.eventId;
  try {
    const res = await fetch("/api/payments/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ eventId }),
    });
    const data = await res.json();
    if (data.success) {
      // Redirect to Paystack
      window.location.href = data.data.authorization_url;
    } else {
      alert("Failed to initialize payment: " + data.message);
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
}

// Create event (creator)
document.getElementById("event-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("event-title").value;
  const description = document.getElementById("event-description").value;
  const date = new Date(
    document.getElementById("event-date").value
  ).toISOString();
  const location = document.getElementById("event-location").value;
  const price = parseFloat(document.getElementById("event-price").value);
  const totalTickets = parseInt(
    document.getElementById("event-totalTickets").value
  );
  const reminderDaysBefore = document
    .getElementById("event-reminderDays")
    .value.split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));

  try {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description,
        date,
        location,
        price,
        totalTickets,
        reminderDaysBefore,
      }),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById("event-message").textContent = "Event created!";
      loadMyEvents();
    } else {
      document.getElementById("event-message").textContent =
        data.message || "Creation failed";
    }
  } catch (err) {
    document.getElementById("event-message").textContent =
      "Error: " + err.message;
  }
});

// Load my events (creator)
async function loadMyEvents() {
  const myEventsList = document.getElementById("my-events-list");
  myEventsList.innerHTML = "Loading...";
  try {
    const res = await fetch("/api/events/my-events", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      myEventsList.innerHTML = "";
      data.data.forEach((event) => {
        const card = document.createElement("div");
        card.className = "event-card";
        card.innerHTML = `
                    <h3>${event.title}</h3>
                    <p>${event.description}</p>
                    <p><strong>Date:</strong> ${new Date(
                      event.date
                    ).toLocaleString()}</p>
                    <p><strong>Tickets sold:</strong> ${
                      event.totalTickets - event.availableTickets
                    } / ${event.totalTickets}</p>
                    <button class="view-attendees" data-event-id="${
                      event._id
                    }">View Attendees</button>
                `;
        myEventsList.appendChild(card);
      });
      // Add view attendees listeners
      document.querySelectorAll(".view-attendees").forEach((btn) => {
        btn.addEventListener("click", viewAttendees);
      });
    } else {
      myEventsList.innerHTML = "Failed to load your events.";
    }
  } catch (err) {
    myEventsList.innerHTML = "Error loading events.";
  }
}

// View attendees for an event
async function viewAttendees(e) {
  const eventId = e.target.dataset.eventId;
  try {
    const res = await fetch(`/api/events/${eventId}/attendees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      let html = "<h4>Attendees:</h4><ul>";
      data.data.forEach((ticket) => {
        html += `<li>${ticket.attendee.name} (${ticket.attendee.email}) - Scanned: ${ticket.scanned}</li>`;
      });
      html += "</ul>";
      alert(html); // simple display
    } else {
      alert("Failed to load attendees");
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
}

// Load my tickets (attendee)
async function loadMyTickets() {
  const myTicketsList = document.getElementById("my-tickets-list");
  myTicketsList.innerHTML = "Loading...";
  try {
    const res = await fetch("/api/tickets/my-tickets", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      myTicketsList.innerHTML = "";
      data.data.forEach((ticket) => {
        const event = ticket.event;
        const card = document.createElement("div");
        card.className = "ticket-card";
        card.innerHTML = `
                    <h3>${event.title}</h3>
                    <p><strong>Date:</strong> ${new Date(
                      event.date
                    ).toLocaleString()}</p>
                    <p><strong>Location:</strong> ${event.location}</p>
                    <div class="qr-code"><img src="${
                      ticket.qrCode
                    }" alt="QR Code" style="max-width:150px;"></div>
                    <p><strong>Scanned:</strong> ${
                      ticket.scanned ? "Yes" : "No"
                    }</p>
                `;
        myTicketsList.appendChild(card);
      });
    } else {
      myTicketsList.innerHTML = "Failed to load tickets.";
    }
  } catch (err) {
    myTicketsList.innerHTML = "Error loading tickets.";
  }
}

// Overall analytics (creator)
document
  .getElementById("load-overall-analytics")
  .addEventListener("click", async () => {
    try {
      const res = await fetch("/api/analytics/overall", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById("analytics-result").textContent =
          JSON.stringify(data.data, null, 2);
      } else {
        document.getElementById("analytics-result").textContent =
          "Failed to load analytics";
      }
    } catch (err) {
      document.getElementById("analytics-result").textContent =
        "Error: " + err.message;
    }
  });

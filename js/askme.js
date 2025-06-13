/************************************************
   *  LOAD HOTEL DATA FROM JSON
   ************************************************/
  let hotelsData = []; // Initialize as empty, will be populated by fetch

  async function loadPortfolioData() {
    try {
      const response = await fetch('portfolio-data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      hotelsData = await response.json();
      // Initial render and any other setup that depends on hotelsData
      renderHotels(hotelsData);
    } catch (error) {
      console.error("Could not load portfolio data:", error);
      // Optionally, display an error message to the user on the page
      document.getElementById('hotelGrid').innerHTML = '<p class="text-danger">Error loading hotel data. Please try again later.</p>';
    }
  }

  // Call the function to load data when the script runs
  loadPortfolioData();

  // Helper to get CSS variable values
  function getCssVariable(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }

  // Global Chart.js defaults (set once)
  try {
    Chart.defaults.font.family = getCssVariable('--font-family-sans-serif') || 'Roboto';
    Chart.defaults.color = getCssVariable('--text-color-light') || '#555';
  } catch (e) {
    console.warn("Failed to set Chart.js defaults from CSS variables:", e);
  }


  /************************************************
   *  DYNAMICALLY RENDER HOTEL CARDS
   ************************************************/
  const hotelGrid = document.getElementById("hotelGrid");

  function renderHotels(hotelsArray) {
    hotelGrid.innerHTML = "";
    hotelsArray.forEach((hotel) => {
      const card = document.createElement("div");
      card.classList.add("hotel-card", "card-global"); // Added card-global
      card.innerHTML = `
        <div class="hotel-image">
          <img src="${hotel.image}" alt="${hotel.name}" />
        </div>
        <div class="hotel-info card-body"> {/* Assuming hotel-info can act as card-body for padding */}
          <h4 class="card-title">${hotel.name}</h4> {/* Added card-title for consistent heading style */}
          <p><strong>Lokasyon:</strong> ${formatLocation(hotel.location)}</p>
          <p><strong>Kategori:</strong> ${hotel.category}</p>
          <button class="hotel-details-btn btn-global btn-global-accent" onclick="openHotelModal(${hotel.id})">
            Detayları Gör
          </button>
        </div>
      `;
      hotelGrid.appendChild(card);
    });
  }

  function formatLocation(loc) {
    switch (loc) {
      case "istanbul":
        return "İstanbul, Türkiye";
      case "antalya":
        return "Antalya, Türkiye";
      case "cyprus":
        return "Lefkoşa, Kıbrıs";
      case "dubai":
        return "Dubai, BAE";
      case "isparta":
        return "Isparta, Türkiye";
      case "marmaris":
        return "Marmaris, Türkiye";
      default:
        return loc;
    }
  }

  // Initial render of all hotels is now called inside loadPortfolioData()

  /************************************************
   *  FILTER FUNCTIONALITY
   ************************************************/
  function applyFilters() {
    const locFilter = document.getElementById("filterLocation").value;
    const starFilter = document.getElementById("filterStar").value;
    const typeFilter = document.getElementById("filterType").value;

    let filtered = hotelsData;

    // Location filter
    if (locFilter !== "all") {
      filtered = filtered.filter((h) => h.location === locFilter);
    }
    // Star filter
    if (starFilter !== "all") {
      filtered = filtered.filter((h) => h.star === starFilter);
    }
    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((h) => h.type === typeFilter);
    }

    // Debugging: Log the filtered results
    console.log("Filtered Hotels:", filtered);

    renderHotels(filtered);
  }

  /************************************************
   *  OPEN HOTEL MODAL AND RENDER CHARTS
   ************************************************/
  let roomNightsChart, adrChart; // Chart instances

  function openHotelModal(hotelId) {
    const hotel = hotelsData.find((h) => h.id === hotelId);
    if (!hotel) return;

    // Set modal elements
    document.getElementById("hotelModalLabel").innerText = hotel.name;
    document.getElementById("hotelModalImage").src = hotel.image;
    document.getElementById("hotelModalName").innerText = hotel.name;
    document.getElementById("hotelModalLocation").innerText = formatLocation(
      hotel.location
    );
    document.getElementById("hotelModalDescription").innerText =
      hotel.description;
    document.getElementById("hotelModalCategory").innerText = hotel.category;

    // Show modal
    const myModal = new bootstrap.Modal(document.getElementById("hotelModal"));
    myModal.show();

    // Destroy existing charts if they exist
    if (roomNightsChart) roomNightsChart.destroy();
    if (adrChart) adrChart.destroy();

    // Create new charts
    createRoomNightsChart(
      hotel.monthlyRoomNights2023,
      hotel.monthlyRoomNights2024
    );
    createADRChart(hotel.monthlyADR2023, hotel.monthlyADR2024);
  }

  /************************************************
   *  CREATE BAR CHART FOR ROOM NIGHTS
   ************************************************/
  function createRoomNightsChart(data2023, data2024) {
    const ctx = document.getElementById("roomNightsChart").getContext("2d");
    roomNightsChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
        datasets: [
          {
            label: "2023 Room Nights",
            data: data2023,
            backgroundColor: `rgba(${getCssVariable('--primary-color-rgb') || '0,53,128'}, 0.6)`,
            borderColor: getCssVariable('--primary-color') || 'rgba(0,53,128,1)',
            borderWidth: 1,
          },
          {
            label: "2024 Room Nights",
            data: data2024,
            backgroundColor: `rgba(${getCssVariable('--accent-color-rgb') || '247,194,0'}, 0.6)`,
            borderColor: getCssVariable('--accent-color') || 'rgba(247,194,0,1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { // Added x-axis for grid color
            grid: {
              color: `rgba(${getCssVariable('--border-color-rgb') || '224,224,224'}, 0.3)`
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Room Nights",
            },
            grid: { // Added y-axis for grid color
              color: `rgba(${getCssVariable('--border-color-rgb') || '224,224,224'}, 0.3)`
            }
          },
        },
      },
    });
  }

  /************************************************
   *  CREATE LINE CHART FOR ADR (EUR)
   ************************************************/
  function createADRChart(data2023, data2024) {
    const ctx = document.getElementById("adrChart").getContext("2d");
    adrChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
        datasets: [
          {
            label: "2023 ADR (€)",
            data: data2023,
            fill: false,
            borderColor: getCssVariable('--primary-color') || 'rgba(0,53,128,1)',
            backgroundColor: `rgba(${getCssVariable('--primary-color-rgb') || '0,53,128'}, 0.2)`,
            tension: 0.1,
          },
          {
            label: "2024 ADR (€)",
            data: data2024,
            fill: false,
            borderColor: getCssVariable('--accent-color') || 'rgba(247,194,0,1)',
            backgroundColor: `rgba(${getCssVariable('--accent-color-rgb') || '247,194,0'}, 0.2)`,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { // Added x-axis for grid color
            grid: {
              color: `rgba(${getCssVariable('--border-color-rgb') || '224,224,224'}, 0.3)`
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: "Average Daily Rate (EUR)",
            },
            grid: { // Added y-axis for grid color
              color: `rgba(${getCssVariable('--border-color-rgb') || '224,224,224'}, 0.3)`
            }
          },
        },
      },
    });
  }

  // Carousel initialization script
  document.addEventListener('DOMContentLoaded', function() {
    new bootstrap.Carousel(document.getElementById('portfolioCarousel'), {
      interval: 3000,
      touch: true,
      pause: 'hover'
    });
  });

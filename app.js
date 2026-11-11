
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const weatherSection = document.getElementById("weatherSection");
const statusMessage = document.getElementById("statusMessage");
const locationBtn = document.getElementById("locationBtn");

const WEATHER_ENDPOINT = "/.netlify/functions/weather";

async function getWeather(city) {
    if (!city || !city.trim()) return;

    statusMessage.textContent = "Loading weather...";
    weatherSection.innerHTML = `
        <div class="empty-weather">
            <div class="weather-icon">⏳</div>
            <h2>Loading weather</h2>
            <p>Please wait while we get the latest information.</p>
        </div>
    `;

    try {
        const response = await fetch(
            `${WEATHER_ENDPOINT}?q=${encodeURIComponent(city.trim())}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error?.message ||
                data.message ||
                "Weather information could not be found."
            );
        }

        displayWeather(data.data || data);
        statusMessage.textContent = "";

    } catch (error) {
        statusMessage.textContent = error.message;

        weatherSection.innerHTML = `
            <div class="empty-weather">
                <div class="weather-icon">🌧️</div>
                <h2>Weather unavailable</h2>
                <p>${escapeHTML(error.message)}</p>
                <p>Please try another city later.</p>
            </div>
        `;
    }
}

function displayWeather(data) {
    const location = data.location;
    const current = data.current;
    const forecastDays = data.forecast?.forecastday || [];

    if (!location || !current) {
        throw new Error("Weather data format is incomplete.");
    }

    const condition = current.condition?.text || "Unknown";
    const icon = current.condition?.icon || "";
    const iconURL = icon
        ? (icon.startsWith("//") ? `https:${icon}` : icon)
        : "";

    const hourly = forecastDays[0]?.hour || [];

    const currentHour = new Date().getHours();

    const upcomingHours = hourly
        .filter(hour => new Date(hour.time.replace(" ", "T")).getTime() >= Date.now())
        .slice(0, 6);

    const hourlyHTML = upcomingHours.map(hour => `
        <div class="forecast-item">
            <span>${formatHour(hour.time)}</span>
            <span>${Math.round(hour.temp_c)}°</span>
            <small>${escapeHTML(hour.condition?.text || "")}</small>
        </div>
    `).join("");

    const forecastHTML = forecastDays.map(day => `
        <div class="forecast-item">
            <strong>${formatDate(day.date)}</strong>
            <span>${Math.round(day.day?.maxtemp_c ?? 0)}° / ${Math.round(day.day?.mintemp_c ?? 0)}°</span>
            <small>${escapeHTML(day.day?.condition?.text || "")}</small>
        </div>
    `).join("");

    weatherSection.innerHTML = `
        <div class="weather-result">
            <div class="weather-top">
                <div>
                    <span class="eyebrow">CURRENT WEATHER</span>
                    <h2>${escapeHTML(location.name)}, ${escapeHTML(location.country)}</h2>
                    <p>${escapeHTML(location.localtime || "")}</p>
                </div>
                <div class="main-temperature">
                    ${iconURL ? `<img src="${escapeHTML(iconURL)}" alt="${escapeHTML(condition)}">` : ""}
                    <strong>${Math.round(current.temp_c)}°C</strong>
                    <p>${escapeHTML(condition)}</p>
                </div>
            </div>

            <div class="weather-details">
                <div class="detail-card">
                    <span>Feels Like</span>
                    <strong>${Math.round(current.feelslike_c)}°C</strong>
                </div>
                <div class="detail-card">
                    <span>Humidity</span>
                    <strong>${current.humidity}%</strong>
                </div>
                <div class="detail-card">
                    <span>Wind</span>
                    <strong>${current.wind_kph} km/h</strong>
                </div>
                <div class="detail-card">
                    <span>UV Index</span>
                    <strong>${current.uv}</strong>
                </div>
            </div>

            <h3>Hourly Forecast</h3>
            <div class="forecast-list">
                ${hourlyHTML || "<p>Hourly forecast unavailable.</p>"}
            </div>

            <h3>3-Day Forecast</h3>
            <div class="forecast-list">
                ${forecastHTML || "<p>Forecast unavailable.</p>"}
            </div>

            <div class="sun-info">
                <span>Sunrise: ${escapeHTML(forecastDays[0]?.astro?.sunrise || "—")}</span>
                <span>Sunset: ${escapeHTML(forecastDays[0]?.astro?.sunset || "—")}</span>
            </div>

            <p class="weather-source">
                Weather data provided by
                <a href="https://www.weatherapi.com/" target="_blank" rel="noopener">
                    WeatherAPI.com
                </a>
            </p>
        </div>
    `;

    statusMessage.textContent = "";
}

function formatHour(time) {
    return new Date(time.replace(" ", "T"))
        .toLocaleTimeString([], { hour: "numeric" });
}

function formatDate(date) {
    return new Date(`${date}T12:00:00`)
        .toLocaleDateString([], { weekday: "short" });
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

searchForm.addEventListener("submit", event => {
    event.preventDefault();
    getWeather(cityInput.value);
});

document.querySelectorAll(".city-btn").forEach(button => {
    button.addEventListener("click", () => {
        const city = button.dataset.city;
        cityInput.value = city;
        getWeather(city);
    });
});

locationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        statusMessage.textContent = "Your browser does not support location detection.";
        return;
    }

    statusMessage.textContent = "Finding your location...";

    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            getWeather(`${latitude},${longitude}`);
        },
        () => {
            statusMessage.textContent =
                "Location permission was denied. Please search for your city.";
        }
    );
});

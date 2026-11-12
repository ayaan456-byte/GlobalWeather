
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const weatherSection = document.getElementById("weatherSection");
const statusMessage = document.getElementById("statusMessage");
const locationBtn = document.getElementById("locationBtn");

const WEATHER_ENDPOINT = "/.netlify/functions/weather";

let latestWeather = null;
let temperatureUnit = "C";

async function getWeather(city) {
    if (!city || !city.trim()) return;

    statusMessage.textContent = "Getting the latest weather...";

    weatherSection.innerHTML = `
        <div class="empty-weather">
            <div class="weather-icon">⏳</div>
            <h2>Loading weather</h2>
            <p>Getting the latest conditions for ${escapeHTML(city)}...</p>
        </div>
    `;

    try {
        const response = await fetch(
            `${WEATHER_ENDPOINT}?q=${encodeURIComponent(city.trim())}`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error?.message ||
                result.message ||
                "Weather information could not be found."
            );
        }

        const data = result.data || result;

        if (!data.location || !data.current) {
            throw new Error("Weather data is incomplete.");
        }

        latestWeather = data;
        temperatureUnit = "C";

        displayWeather();

        statusMessage.textContent = "";

        weatherSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        latestWeather = null;

        statusMessage.textContent = error.message;

        weatherSection.innerHTML = `
            <div class="empty-weather">
                <div class="weather-icon">🌧️</div>
                <h2>Weather unavailable</h2>
                <p>${escapeHTML(error.message)}</p>
                <p>Please check the location and try again.</p>
            </div>
        `;
    }
}

function displayWeather() {
    if (!latestWeather) return;

    const location = latestWeather.location;
    const current = latestWeather.current;
    const forecastDays = latestWeather.forecast?.forecastday || [];

    const condition = current.condition?.text || "Unknown";
    const icon = current.condition?.icon || "";
    const iconURL = icon
        ? (icon.startsWith("//") ? `https:${icon}` : icon)
        : "";

    const isCelsius = temperatureUnit === "C";

    const temperature = isCelsius
        ? current.temp_c
        : current.temp_f;

    const feelsLike = isCelsius
        ? current.feelslike_c
        : current.feelslike_f;

    const unit = isCelsius ? "°C" : "°F";

    const hourly = forecastDays.flatMap(day => day.hour || []);

    const localTime = location.localtime || "";
    const localHour = localTime.slice(0, 13);

    const upcomingHours = hourly
        .filter(hour => hour.time >= `${localHour}:00`)
        .slice(0, 6);

    const hourlyHTML = upcomingHours.map(hour => {
        const temp = isCelsius ? hour.temp_c : hour.temp_f;
        const hourIcon = getIconURL(hour.condition?.icon);

        return `
            <div class="forecast-item">
                <span>${formatHour(hour.time)}</span>
                ${hourIcon ? `<img src="${escapeHTML(hourIcon)}" alt="" width="38" height="38">` : ""}
                <strong>${Math.round(temp)}${unit}</strong>
                <small>${escapeHTML(hour.condition?.text || "—")}</small>
                <small>Rain: ${hour.chance_of_rain ?? 0}%</small>
            </div>
        `;
    }).join("");

    const forecastHTML = forecastDays.map(day => {
        const max = isCelsius
            ? day.day?.maxtemp_c
            : day.day?.maxtemp_f;

        const min = isCelsius
            ? day.day?.mintemp_c
            : day.day?.mintemp_f;

        const dayIcon = getIconURL(day.day?.condition?.icon);

        return `
            <div class="forecast-item">
                <strong>${formatDate(day.date)}</strong>
                ${dayIcon ? `<img src="${escapeHTML(dayIcon)}" alt="" width="42" height="42">` : ""}
                <span>${Math.round(max ?? 0)}${unit} / ${Math.round(min ?? 0)}${unit}</span>
                <small>${escapeHTML(day.day?.condition?.text || "—")}</small>
                <small>Rain: ${day.day?.daily_chance_of_rain ?? 0}%</small>
            </div>
        `;
    }).join("");

    const currentRain = current.precip_mm ?? 0;
    const pressure = current.pressure_mb ?? "—";
    const visibility = current.vis_km ?? "—";
    const windDirection = current.wind_dir || "—";
    const windSpeed = current.wind_kph ?? "—";

    const todayAstro = forecastDays[0]?.astro || {};

    weatherSection.innerHTML = `
        <div class="weather-result">

            <div class="weather-top">
                <div>
                    <span class="section-kicker">CURRENT WEATHER</span>
                    <h2>${escapeHTML(location.name)}, ${escapeHTML(location.country)}</h2>
                    <p>Local time: ${escapeHTML(localTime)}</p>
                    <p>Last updated: ${escapeHTML(current.last_updated || "—")}</p>
                </div>

                <div class="main-temperature">
                    ${iconURL ? `<img src="${escapeHTML(iconURL)}" alt="${escapeHTML(condition)}">` : ""}
                    <strong>${Math.round(temperature)}${unit}</strong>
                    <p>${escapeHTML(condition)}</p>

                    <button
                        type="button"
                        id="unitToggle"
                        class="unit-toggle"
                        aria-label="Switch temperature unit"
                    >
                        ${isCelsius ? "Switch to °F" : "Switch to °C"}
                    </button>
                </div>
            </div>

            <div class="weather-details">

                <div class="detail-card">
                    <span>Feels Like</span>
                    <strong>${Math.round(feelsLike)}${unit}</strong>
                </div>

                <div class="detail-card">
                    <span>Humidity</span>
                    <strong>${current.humidity}%</strong>
                </div>

                <div class="detail-card">
                    <span>Wind Speed</span>
                    <strong>${windSpeed} km/h</strong>
                </div>

                <div class="detail-card">
                    <span>UV Index</span>
                    <strong>${current.uv ?? "—"}</strong>
                </div>

                <div class="detail-card">
                    <span>Wind Direction</span>
                    <strong>${escapeHTML(windDirection)}</strong>
                </div>

                <div class="detail-card">
                    <span>Visibility</span>
                    <strong>${visibility} km</strong>
                </div>

                <div class="detail-card">
                    <span>Pressure</span>
                    <strong>${pressure} mb</strong>
                </div>

                <div class="detail-card">
                    <span>Precipitation</span>
                    <strong>${currentRain} mm</strong>
                </div>

            </div>

            <h3>Hourly Forecast</h3>

            <div class="forecast-list">
                ${hourlyHTML || "<p>Hourly forecast unavailable.</p>"}
            </div>

            <h3>Daily Forecast</h3>

            <div class="forecast-list">
                ${forecastHTML || "<p>Forecast unavailable.</p>"}
            </div>

            <h3>Sunrise & Sunset</h3>

            <div class="sun-info">
                <span>☀️ Sunrise: ${escapeHTML(todayAstro.sunrise || "—")}</span>
                <span>🌇 Sunset: ${escapeHTML(todayAstro.sunset || "—")}</span>
                <span>🌙 Moon Phase: ${escapeHTML(todayAstro.moon_phase || "—")}</span>
            </div>

            <p class="weather-source">
                Weather data provided by
                <a href="https://www.weatherapi.com/" target="_blank" rel="noopener">
                    WeatherAPI.com
                </a>
            </p>

        </div>
    `;

    document.getElementById("unitToggle").addEventListener("click", () => {
        temperatureUnit = temperatureUnit === "C" ? "F" : "C";
        displayWeather();
    });
}

function getIconURL(icon) {
    if (!icon) return "";

    return icon.startsWith("//")
        ? `https:${icon}`
        : icon;
}

function formatHour(time) {
    const parts = time.split(" ");
    return parts[1] || time;
}

function formatDate(date) {
    return new Date(`${date}T12:00:00`)
        .toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric"
        });
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

document.querySelectorAll(".city-card").forEach(button => {
    button.addEventListener("click", () => {
        const city = button.dataset.city;

        cityInput.value = city;
        getWeather(city);
    });
});

locationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        statusMessage.textContent =
            "Your browser does not support location detection.";
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
        },
        {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000
        }
    );
});

document.getElementById("currentYear").textContent =
    new Date().getFullYear();

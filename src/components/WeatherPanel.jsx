import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLanguage } from "../contexts/LanguageContext";
import sunIcon from "../assets/imgs/sun.png";
import stormIcon from "../assets/imgs/storm.png";
import weatherIcon from "../assets/imgs/weather.png";
import windIcon from "../assets/imgs/wind.png";
import "./WeatherPanel.css";

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const WeatherPanel = () => {
  const { t } = useLanguage();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [coords, setCoords] = useState({ lat: 10.8231, lon: 106.6297 });

  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m&daily=sunrise,sunset,uv_index_max&timezone=auto`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch weather data");
        }

        const data = await response.json();
        setWeather(data);
        setLoading(false);
      } catch (err) {
        console.error("Weather fetch error:", err);
        setError("Failed to load weather data");
        setLoading(false);
      }
    };

    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCoords({ lat: latitude, lon: longitude });
            setLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
            fetchWeather(latitude, longitude);
          },
          (err) => {
            console.warn(
              "Geolocation denied or failed, using default location (HCMC)",
              err
            );
            // Default to Ho Chi Minh City
            setLocationName("Ho Chi Minh City");
            fetchWeather(10.8231, 106.6297);
          }
        );
      } else {
        // Default to Ho Chi Minh City
        setLocationName("Ho Chi Minh City");
        fetchWeather(10.8231, 106.6297);
      }
    };

    getLocation();
  }, []);

  const getWeatherDescription = (code) => {
    if (code === 0) return { text: t("clearSky"), icon: sunIcon };
    if (code >= 1 && code <= 3) return { text: t("cloudy"), icon: weatherIcon };
    if (code >= 45 && code <= 48) return { text: t("fog"), icon: weatherIcon };
    if (code >= 51 && code <= 57)
      return { text: t("drizzle"), icon: weatherIcon };
    if (code >= 61 && code <= 67) return { text: t("rain"), icon: weatherIcon };
    if (code >= 71 && code <= 77) return { text: t("snow"), icon: weatherIcon };
    if (code >= 80 && code <= 82) return { text: t("rain"), icon: weatherIcon };
    if (code >= 85 && code <= 86) return { text: t("snow"), icon: weatherIcon };
    if (code >= 95 && code <= 99)
      return { text: t("thunderstorm"), icon: stormIcon };
    return { text: t("clearSky"), icon: sunIcon };
  };

  const formatTime = (isoString) => {
    if (!isoString) return "--:--";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="weather-panel glass-card">
        <div className="loading-weather">
          <div className="spinner"></div>
          <p>{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-panel glass-card">
        <div className="error-weather">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const current = weather.current;
  const daily = weather.daily;
  const weatherInfo = getWeatherDescription(current.weather_code);

  return (
    <div className="weather-panel glass-card">
      <div className="weather-header">
        <h3>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17.5 19c0-3.037-2.463-5.5-5.5-5.5S6.5 15.963 6.5 19" />
            <circle cx="12" cy="10" r="3" />
            <path d="M12 2v2" />
            <path d="M12 16v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M4.93 19.07l1.41-1.41" />
            <path d="M17.66 6.34l1.41-1.41" />
          </svg>
          {t("weatherTitle")}
        </h3>
        <div className="weather-location">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {locationName}
        </div>
      </div>

      <div className="weather-content">
        <div className="current-weather">
          <div className="weather-icon-large">
            <img
              src={weatherInfo.icon}
              alt={weatherInfo.text}
              className="weather-img-3d"
            />
          </div>
          <div className="temperature-large">
            {Math.round(current.temperature_2m)}°C
          </div>
          <div className="weather-desc">{weatherInfo.text}</div>
          <div className="detail-label" style={{ marginTop: "10px" }}>
            {t("feelsLike")} {Math.round(current.apparent_temperature)}°C
          </div>
        </div>

        <div className="weather-details">
          <div className="weather-detail-item">
            <div className="detail-label">{t("humidity")}</div>
            <div className="detail-value">{current.relative_humidity_2m}%</div>
          </div>

          <div className="weather-detail-item">
            <div className="detail-label">{t("windSpeed")}</div>
            <div className="detail-value">{current.wind_speed_10m} km/h</div>
          </div>

          <div className="weather-detail-item">
            <div className="detail-label">{t("pressure")}</div>
            <div className="detail-value">{current.surface_pressure} hPa</div>
          </div>

          <div className="weather-detail-item">
            <div className="detail-label">{t("uvIndex")}</div>
            <div className="detail-value">{daily.uv_index_max[0]}</div>
          </div>

          <div className="weather-detail-item">
            <div className="detail-label">{t("sunrise")}</div>
            <div className="detail-value">{formatTime(daily.sunrise[0])}</div>
          </div>

          <div className="weather-detail-item">
            <div className="detail-label">{t("sunset")}</div>
            <div className="detail-value">{formatTime(daily.sunset[0])}</div>
          </div>
        </div>

        <div className="weather-map-container">
          <MapContainer
            center={[coords.lat, coords.lon]}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%", borderRadius: "12px" }}
            key={`${coords.lat}-${coords.lon}`} // Force re-render when coords change
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[coords.lat, coords.lon]}>
              <Popup>
                {t("weatherTitle")} <br /> {locationName}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default WeatherPanel;

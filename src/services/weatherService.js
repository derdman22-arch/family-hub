const BASE = 'https://api.open-meteo.com/v1/forecast';

// Representative coords for St. Pete 33701/33713
const LAT = 27.7676;
const LON = -82.6403;

const WMO_LABELS = {
  0: 'Clear Sky',
  1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Freezing Fog',
  51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
  61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
  71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
  80: 'Rain Showers', 81: 'Showers', 82: 'Heavy Showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Severe Thunderstorm',
};

const WMO_EMOJI = {
  0: '☀️',
  1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️',
  80: '🌧️', 81: '🌧️', 82: '⛈️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

export function describeWeather(code) {
  return WMO_LABELS[code] ?? 'Unknown';
}

export function weatherEmoji(code) {
  return WMO_EMOJI[code] ?? '🌡️';
}

export async function fetchWeather() {
  const params = new URLSearchParams({
    latitude: LAT,
    longitude: LON,
    current_weather: 'true',
    daily: 'temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: 'America/New_York',
    forecast_days: '5',
  });
  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error('Weather fetch failed');
  return res.json();
}

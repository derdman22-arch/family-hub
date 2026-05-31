import { useWeather } from '../hooks/useWeather';
import { describeWeather, weatherEmoji } from '../services/weatherService';
import { useActivities } from '../hooks/useActivities';
import { placeTypeLabel, photoUrl } from '../services/placesService';

const ZIPS = ['33701', '33713'];

const WIDGETS = [
  {
    id: 'restaurants',
    icon: '🍽️',
    title: 'Restaurants',
    description: 'Best dining spots in 33701 & 33713',
    status: 'coming-soon',
    color: 'from-orange-900/40 to-orange-800/20 border-orange-700/40',
  },
  {
    id: 'events',
    icon: '🎶',
    title: 'Events',
    description: 'Concerts, festivals & local happenings',
    status: 'coming-soon',
    color: 'from-violet-900/40 to-violet-800/20 border-violet-700/40',
  },
];

function dayLabel(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

function WeatherWidget() {
  const { data, loading, error } = useWeather();

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-sky-900/40 to-sky-800/20 border border-sky-700/40 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-sky-800/40 rounded w-1/3 mb-4" />
        <div className="h-12 bg-sky-800/40 rounded w-1/4 mb-2" />
        <div className="h-4 bg-sky-800/40 rounded w-1/2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-sky-900/40 to-sky-800/20 border border-sky-700/40 rounded-2xl p-6 flex items-center gap-3 text-gray-400">
        <span className="text-2xl">⚠️</span>
        <span className="text-sm">Weather unavailable</span>
      </div>
    );
  }

  const { current_weather, daily } = data;
  const { temperature, windspeed, weathercode } = current_weather;

  return (
    <div className="bg-gradient-to-br from-sky-900/40 to-sky-800/20 border border-sky-700/40 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-2xl">{weatherEmoji(weathercode)}</span>
            <h3 className="text-white font-bold text-lg">Weather</h3>
          </div>
          <p className="text-gray-400 text-sm">St. Petersburg, FL</p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-bold text-white leading-none">{Math.round(temperature)}°</p>
          <p className="text-sky-300 text-sm mt-1">{describeWeather(weathercode)}</p>
        </div>
      </div>

      <div className="flex gap-4 text-sm text-gray-400">
        <span>Wind {Math.round(windspeed)} mph</span>
        <span className="text-gray-600">·</span>
        <span>H: {Math.round(daily.temperature_2m_max[0])}° · L: {Math.round(daily.temperature_2m_min[0])}°</span>
      </div>

      <div className="border-t border-white/5 pt-4 grid grid-cols-5 gap-1">
        {daily.time.slice(0, 5).map((date, i) => (
          <div key={date} className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500">{i === 0 ? 'Today' : dayLabel(date)}</span>
            <span className="text-xl">{weatherEmoji(daily.weathercode[i])}</span>
            <span className="text-xs text-white font-medium">{Math.round(daily.temperature_2m_max[i])}°</span>
            <span className="text-xs text-gray-600">{Math.round(daily.temperature_2m_min[i])}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaceRow({ place }) {
  const photo = place.photos?.[0];
  return (
    <div className="flex items-center gap-3 bg-black/20 rounded-xl p-3">
      {photo ? (
        <img
          src={photoUrl(photo.name)}
          alt={place.displayName?.text}
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-emerald-900/40 flex items-center justify-center flex-shrink-0 text-2xl">
          🏖️
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{place.displayName?.text}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {place.rating && (
            <>
              <span className="text-yellow-400 text-xs">★ {place.rating.toFixed(1)}</span>
              <span className="text-gray-600 text-xs">({place.userRatingCount?.toLocaleString()})</span>
            </>
          )}
        </div>
        <span className="text-xs text-emerald-400/70 mt-0.5 inline-block">
          {placeTypeLabel(place.types)}
        </span>
      </div>
    </div>
  );
}

function ActivitiesWidget() {
  const { places, loading, error } = useActivities();

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-700/40 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-emerald-800/40 rounded w-1/3 mb-4" />
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-emerald-800/30 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-700/40 rounded-2xl p-6 flex items-center gap-3 text-gray-400">
        <span className="text-2xl">⚠️</span>
        <span className="text-sm">Activities unavailable: {error?.message}</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-700/40 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏖️</span>
        <div>
          <h3 className="text-white font-bold text-lg">Things To Do</h3>
          <p className="text-gray-400 text-sm">Top-rated near 33701 & 33713</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {places.map((place, i) => <PlaceRow key={i} place={place} />)}
      </div>
    </div>
  );
}

function ComingSoonBadge() {
  return (
    <span className="text-xs font-semibold uppercase tracking-widest text-gray-500 bg-gray-800 border border-gray-700 rounded-full px-3 py-1">
      Coming Soon
    </span>
  );
}

function Widget({ icon, title, description, color }) {
  return (
    <div className={`bg-gradient-to-br ${color} border rounded-2xl p-6 flex flex-col gap-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">{title}</h3>
            <p className="text-gray-400 text-sm mt-0.5">{description}</p>
          </div>
        </div>
        <ComingSoonBadge />
      </div>
      <div className="border-t border-white/5 pt-4">
        <div className="flex gap-2">
          {ZIPS.map((zip) => (
            <span
              key={zip}
              className="text-xs font-mono text-gray-500 bg-gray-800/60 border border-gray-700/50 rounded-lg px-2.5 py-1"
            >
              {zip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StPetePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Banner */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img
          src="/images/Banner.jpeg"
          alt="St. Petersburg, FL"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 max-w-7xl mx-auto">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sky-400 text-sm font-semibold uppercase tracking-widest mb-1">
                Your Local Guide
              </p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                St. Petersburg, FL
              </h1>
            </div>
            <div className="hidden sm:flex gap-2 mb-1">
              {ZIPS.map((zip) => (
                <span
                  key={zip}
                  className="text-sm font-mono text-sky-300 bg-sky-900/40 border border-sky-700/50 rounded-xl px-3 py-1.5"
                >
                  {zip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Intro */}
        <p className="text-gray-400 mb-8 max-w-2xl">
          Your family's guide to St. Pete — live weather, top activities, restaurants, and local
          events for zip codes{' '}
          <span className="text-white font-medium">33701</span> and{' '}
          <span className="text-white font-medium">33713</span>. API integrations coming soon.
        </p>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WeatherWidget />
          <ActivitiesWidget />
          {WIDGETS.map((w) => (
            <Widget key={w.id} {...w} />
          ))}
        </div>
      </div>
    </div>
  );
}

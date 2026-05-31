const BASE = 'https://places.googleapis.com/v1/places:searchNearby';
const KEY = process.env.REACT_APP_GOOGLE_PLACES_KEY;

const FIELD_MASK = [
  'places.displayName',
  'places.rating',
  'places.userRatingCount',
  'places.types',
  'places.shortFormattedAddress',
  'places.photos',
].join(',');

const TYPE_LABELS = {
  tourist_attraction: 'Attraction',
  museum: 'Museum',
  park: 'Park',
  beach: 'Beach',
  aquarium: 'Aquarium',
  art_gallery: 'Gallery',
  amusement_park: 'Amusement Park',
  zoo: 'Zoo',
  bowling_alley: 'Bowling',
  night_club: 'Nightlife',
};

export function placeTypeLabel(types = []) {
  for (const t of types) {
    if (TYPE_LABELS[t]) return TYPE_LABELS[t];
  }
  return 'Attraction';
}

export function photoUrl(name) {
  return `https://places.googleapis.com/v1/${name}/media?maxWidthPx=400&key=${KEY}`;
}

export async function fetchActivities() {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: [
        'tourist_attraction',
        'museum',
        'park',
        'beach',
        'aquarium',
        'art_gallery',
        'amusement_park',
      ],
      maxResultCount: 10,
      rankPreference: 'POPULARITY',
      locationRestriction: {
        circle: {
          center: { latitude: 27.7708, longitude: -82.652 },
          radius: 5000,
        },
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? 'Places fetch failed');
  return data.places ?? [];
}

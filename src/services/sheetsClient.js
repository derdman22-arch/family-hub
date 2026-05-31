const SPREADSHEET_ID = process.env.REACT_APP_SPREADSHEET_ID;
const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export async function readRange(range, accessToken) {
  const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) {
    const err = new Error('Google auth expired — please sign in again.');
    err.code = 'AUTH_EXPIRED';
    throw err;
  }
  if (!res.ok) {
    throw new Error(`Sheets API error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return data.values || [];
}

export async function writeRange(range, values, accessToken) {
  const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!res.ok) {
    throw new Error(`Sheets write error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

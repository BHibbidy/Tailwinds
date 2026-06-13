export default async function handler(request, response) {
  // Add CORS headers for local/cross-origin safety if needed
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  const { date, flightNumber, origin } = request.query;

  if (!date || !flightNumber || !origin) {
    return response.status(400).json({ error: 'Missing date, flightNumber, or origin parameters.' });
  }

  const apiKey = process.env.RAPIDAPI_KEY || process.env.VITE_RAPIDAPI_KEY;
  if (!apiKey) {
    return response.status(500).json({ error: 'RapidAPI key is not configured.' });
  }

  // Clean flight number: remove all spaces (e.g. "DL 4090" -> "DL4090")
  const cleanFlightNum = flightNumber.replace(/\s+/g, '');

  try {
    const apiResponse = await fetch(
      `https://aerodatabox.p.rapidapi.com/flights/number/${cleanFlightNum}/${date}`,
      {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'aerodatabox.p.rapidapi.com',
          'Accept': 'application/json'
        }
      }
    );

    if (apiResponse.status === 404) {
      return response.status(404).json({ error: 'Flight not found.' });
    }

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      return response.status(apiResponse.status).json({ error: `RapidAPI error: ${errText}` });
    }

    const data = await apiResponse.json();

    // AeroDataBox returns an array of flights
    if (!Array.isArray(data) || data.length === 0) {
      return response.status(404).json({ error: 'No flight records returned.' });
    }

    // Filter by origin airport (IATA or ICAO)
    const upperOrigin = origin.toUpperCase();
    const matchedFlight = data.find(f => {
      const depAirport = f.departure?.airport;
      return depAirport && (
        (depAirport.iata && depAirport.iata.toUpperCase() === upperOrigin) ||
        (depAirport.icao && depAirport.icao.toUpperCase() === upperOrigin)
      );
    });

    if (!matchedFlight) {
      return response.status(404).json({
        error: `Flight ${cleanFlightNum} was found, but none departed from ${upperOrigin}.`
      });
    }

    // Map fields cleanly for our flight form
    const flightInfo = {
      airline: matchedFlight.airline?.name || '',
      flightNumber: cleanFlightNum,
      origin: matchedFlight.departure?.airport?.iata || matchedFlight.departure?.airport?.icao || upperOrigin,
      destination: matchedFlight.arrival?.airport?.iata || matchedFlight.arrival?.airport?.icao || '',
      tailNumber: matchedFlight.aircraft?.reg || '',
      type: matchedFlight.aircraft?.model || '',
      // We can also extract scheduled times or remarks if we want
    };

    return response.status(200).json(flightInfo);
  } catch (error) {
    console.error('Error fetching flight details:', error);
    return response.status(500).json({ error: 'Server error retrieving flight details.' });
  }
}

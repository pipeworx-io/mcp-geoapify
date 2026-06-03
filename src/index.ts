interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Geoapify MCP — wraps the Geoapify Location Platform (geoapify.com)
 *
 * Tools:
 * - geocode: forward geocoding — turn an address or place name into coordinates
 * - reverse_geocode: reverse geocoding — turn lat/lon coordinates into an address
 * - places: search for places / points of interest (POI) near a location by category
 * - routing: routing / directions — distance and travel time between two points
 *
 * Dual-key model: pass _apiKey (optional) to use your own Geoapify API key for
 * higher limits; omit it to fall back to the shared Pipeworx key. The key is
 * passed as the `apiKey` query parameter. All endpoints are GET and return
 * GeoJSON FeatureCollections; we map features[].properties to flat objects.
 */


const BASE_URL = 'https://api.geoapify.com';

const tools: McpToolExport['tools'] = [
  {
    name: 'geocode',
    description:
      'Forward geocoding: convert an address, place name, or freeform location text into geographic coordinates (latitude/longitude). Returns matched candidates with formatted address, lat, lon, country, city, and postcode. Example: geocode({ text: "1600 Amphitheatre Parkway, Mountain View, CA" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        text: {
          type: 'string',
          description: 'Address, place name, or freeform location text to geocode, e.g. "Eiffel Tower, Paris"',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default 5)',
        },
        _apiKey: {
          type: 'string',
          description: 'Optional — your own Geoapify API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'reverse_geocode',
    description:
      'Reverse geocoding: convert latitude/longitude coordinates into the nearest street address. Returns formatted address, country, city, street, house number, and postcode. Example: reverse_geocode({ lat: 48.8584, lon: 2.2945 })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        lat: {
          type: 'number',
          description: 'Latitude in decimal degrees, e.g. 48.8584',
        },
        lon: {
          type: 'number',
          description: 'Longitude in decimal degrees, e.g. 2.2945',
        },
        _apiKey: {
          type: 'string',
          description: 'Optional — your own Geoapify API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: ['lat', 'lon'],
    },
  },
  {
    name: 'places',
    description:
      'Search for places and points of interest (POI) near a location, filtered by Geoapify category. Returns name, formatted address, categories, lat, lon, and distance from the center point. Example: places({ categories: "catering.restaurant", lat: 48.8584, lon: 2.2945, radius: 1000 })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        categories: {
          type: 'string',
          description:
            "Geoapify place category (or comma-separated list), e.g. 'catering.restaurant', 'commercial.supermarket', 'accommodation.hotel'",
        },
        lat: {
          type: 'number',
          description: 'Latitude of the search center in decimal degrees',
        },
        lon: {
          type: 'number',
          description: 'Longitude of the search center in decimal degrees',
        },
        radius: {
          type: 'number',
          description: 'Search radius in meters (default 1000, max 50000)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default 20, max 100)',
        },
        _apiKey: {
          type: 'string',
          description: 'Optional — your own Geoapify API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: ['categories', 'lat', 'lon'],
    },
  },
  {
    name: 'routing',
    description:
      'Routing / directions: compute the distance and travel time between two points for a given travel mode (drive, walk, bicycle, transit). Returns distance in meters and time in seconds. Example: routing({ from_lat: 48.8584, from_lon: 2.2945, to_lat: 48.8606, to_lon: 2.3376, mode: "drive" })',
    inputSchema: {
      type: 'object' as const,
      properties: {
        from_lat: {
          type: 'number',
          description: 'Latitude of the origin point',
        },
        from_lon: {
          type: 'number',
          description: 'Longitude of the origin point',
        },
        to_lat: {
          type: 'number',
          description: 'Latitude of the destination point',
        },
        to_lon: {
          type: 'number',
          description: 'Longitude of the destination point',
        },
        mode: {
          type: 'string',
          description: "Travel mode: 'drive', 'walk', 'bicycle', or 'transit' (default 'drive')",
        },
        _apiKey: {
          type: 'string',
          description: 'Optional — your own Geoapify API key for higher limits; omit to use the shared Pipeworx key.',
        },
      },
      required: ['from_lat', 'from_lon', 'to_lat', 'to_lon'],
    },
  },
];

interface GeoFeature {
  properties: Record<string, unknown>;
}

interface GeoCollection {
  features?: GeoFeature[];
}

async function geoapifyGet(url: string): Promise<GeoCollection> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    return Promise.reject({ status: res.status, body: text });
  }
  return (await res.json()) as GeoCollection;
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = args._apiKey as string | undefined;
  delete args._apiKey;

  if (!apiKey) {
    return { error: 'api_key_required', message: 'No Geoapify key available.' };
  }

  try {
    switch (name) {
      case 'geocode':
        return await geocode(args, apiKey);
      case 'reverse_geocode':
        return await reverseGeocode(args, apiKey);
      case 'places':
        return await places(args, apiKey);
      case 'routing':
        return await routing(args, apiKey);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err) {
      const e = err as { status: number; body: string };
      return { error: e.status, message: e.body };
    }
    throw err;
  }
}

async function geocode(args: Record<string, unknown>, apiKey: string) {
  const text = args.text as string;
  const limit = (args.limit as number | undefined) ?? 5;
  const url = `${BASE_URL}/v1/geocode/search?apiKey=${encodeURIComponent(apiKey)}&text=${encodeURIComponent(
    text,
  )}&limit=${limit}`;
  const data = await geoapifyGet(url);
  return (data.features ?? []).map((f) => {
    const p = f.properties;
    return {
      formatted: p.formatted,
      lat: p.lat,
      lon: p.lon,
      country: p.country,
      city: p.city,
      postcode: p.postcode,
      category: p.result_type,
    };
  });
}

async function reverseGeocode(args: Record<string, unknown>, apiKey: string) {
  const lat = args.lat as number;
  const lon = args.lon as number;
  const url = `${BASE_URL}/v1/geocode/reverse?apiKey=${encodeURIComponent(apiKey)}&lat=${lat}&lon=${lon}`;
  const data = await geoapifyGet(url);
  const p = data.features?.[0]?.properties;
  if (!p) return null;
  return {
    formatted: p.formatted,
    country: p.country,
    city: p.city,
    street: p.street,
    housenumber: p.housenumber,
    postcode: p.postcode,
    lat: p.lat,
    lon: p.lon,
  };
}

async function places(args: Record<string, unknown>, apiKey: string) {
  const categories = args.categories as string;
  const lat = args.lat as number;
  const lon = args.lon as number;
  const radius = Math.min(50000, (args.radius as number | undefined) ?? 1000);
  const limit = Math.min(100, (args.limit as number | undefined) ?? 20);
  // Geoapify circle filter is `circle:lon,lat,radius` — longitude comes first.
  const filter = `circle:${lon},${lat},${radius}`;
  const url = `${BASE_URL}/v2/places?apiKey=${encodeURIComponent(apiKey)}&categories=${encodeURIComponent(
    categories,
  )}&filter=${encodeURIComponent(filter)}&limit=${limit}`;
  const data = await geoapifyGet(url);
  return (data.features ?? []).map((f) => {
    const p = f.properties;
    return {
      name: p.name,
      formatted: p.formatted,
      categories: p.categories,
      lat: p.lat,
      lon: p.lon,
      distance: p.distance,
    };
  });
}

async function routing(args: Record<string, unknown>, apiKey: string) {
  const fromLat = args.from_lat as number;
  const fromLon = args.from_lon as number;
  const toLat = args.to_lat as number;
  const toLon = args.to_lon as number;
  const mode = (args.mode as string | undefined) ?? 'drive';
  // Waypoints are `from_lat,from_lon|to_lat,to_lon` — the | must be URL-encoded as %7C.
  const waypoints = `${fromLat},${fromLon}%7C${toLat},${toLon}`;
  const url = `${BASE_URL}/v1/routing?apiKey=${encodeURIComponent(
    apiKey,
  )}&waypoints=${waypoints}&mode=${encodeURIComponent(mode)}`;
  const data = await geoapifyGet(url);
  const p = data.features?.[0]?.properties;
  return {
    distance_m: p?.distance,
    time_s: p?.time,
    mode,
  };
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;

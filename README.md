# mcp-geoapify

Geoapify MCP — wraps the Geoapify Location Platform (geoapify.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `geocode` | Forward geocoding: convert an address, place name, or freeform location text into geographic coordinates (latitude/longitude). Returns matched candidates with formatted address, lat, lon, country, city, and postcode. Example: geocode({ text: "1600 Amphitheatre Parkway, Mountain View, CA" }) |
| `reverse_geocode` | Reverse geocoding: convert latitude/longitude coordinates into the nearest street address. Returns formatted address, country, city, street, house number, and postcode. Example: reverse_geocode({ lat: 48.8584, lon: 2.2945 }) |
| `places` | Search for places and points of interest (POI) near a location, filtered by Geoapify category. Returns name, formatted address, categories, lat, lon, and distance from the center point. Example: places({ categories: "catering.restaurant", lat: 48.8584, lon: 2.2945, radius: 1000 }) |
| `routing` | Routing / directions: compute the distance and travel time between two points for a given travel mode (drive, walk, bicycle, transit). Returns distance in meters and time in seconds. Example: routing({ from_lat: 48.8584, from_lon: 2.2945, to_lat: 48.8606, to_lon: 2.3376, mode: "drive" }) |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "geoapify": {
      "url": "https://gateway.pipeworx.io/geoapify/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Geoapify data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

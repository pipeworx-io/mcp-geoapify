# mcp-geoapify

Geoapify MCP — wraps the Geoapify Location Platform (geoapify.com)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/geoapify/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Geoapify data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

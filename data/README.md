# JalSetu AI — Data Module

## Demo Field Registry (`fields.geojson`)

**Notice:**
> **Fictional synthetic/replayed prototype data for demonstration purposes; not real field measurements.**  
> The coordinates, boundaries, and properties in this dataset do not represent actual farms, private land ownership, or real agricultural operations. They are designed strictly as an engineering testbed and interactive map demonstration for the JalSetu AI Pimpri-Chinchwad pilot scenario.

### Field Registry Overview

- **Cluster:** Pimpri-Chinchwad peri-urban vegetable cluster, Pune
- **Field Count:** 10 demonstration fields (`PC-001` through `PC-010`)
- **Primary Crop Context:** Tomato and peri-urban vegetables (tomato, chili, brinjal, onion, capsicum)
- **Geometry Format:** GeoJSON RFC 7946 `Polygon`
- **Coordinate Reference System:** WGS 84 (EPSG:4326)

### Properties Contract

| Field Name | Type | Description | Example |
|---|---|---|---|
| `id` | `string` | Unique field identifier | `"PC-001"` |
| `name` | `string` | Human-readable field label | `"Field 01"` |
| `crop` | `string` | Crop planted | `"tomato"` |
| `stage` | `string` | Current crop growth stage | `"flowering"` |
| `area_acres` | `number` | Field area in acres | `1.5` |
| `geometry` | `Polygon` | Closed GeoJSON polygon `[lon, lat]` coordinates | `{"type": "Polygon", "coordinates": [...]}` |

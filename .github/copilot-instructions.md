# SEKO FIELD - AI Coding Agent Instructions

## Project Overview
**SEKO FIELD** is a single-file WebGIS application for geospatial field data collection and analysis. It's an offline-first mapping tool combining point/feature management, multiple data format support, and real-time environmental widgets.

### Core Use Case
- Field surveyors mark points via map clicks or UTM coordinates
- Upload/view georeferenced data: GPX tracks, Shapefiles (vectors), GeoTIFFs (rasters)
- Measure distances/areas, export projects, toggle language/theme

## Architecture & Data Flow

### Single-File Design (`index.html`)
- **No build step, no server needed** – pure Leaflet.js + browser APIs
- ~3300 lines: embedded CSS, HTML structure, vanilla JS logic
- LocalStorage persistence: points, projects, language/theme settings

### Key Structural Layers (read top-to-bottom in HTML)
1. **CSS (lines 11–1373)**: Dark/light theme system, sidebar overlay, dock controls, widgets
2. **HTML Structure (lines 1375–1370)**: 
   - Sidebar (left): project controls, basemap picker, UTM input, layer management
   - Map container (center): Leaflet map with navigator control
   - Dock (top-right): tool buttons (measure, GPS, theme, language)
   - Widgets (top-right): live clock, weather, coordinates, compass
3. **JavaScript (lines 1388–3301)**: 
   - I18N object → language strings (Indonesian/English)
   - Leaflet map initialization + basemaps
   - Point management (`points[]` array, `addPoint()`, `renderPointList()`)
   - Overlay layer handling (`overlayLayers[]`, shapefile/GPX/GeoTIFF loading)
   - Modal dialogs + event handlers

### Data Models

**Points Array** – user-created markers
```javascript
{
  id: number,
  name: string,
  lat: number, lng: number,
  note: string,
  marker: L.Marker (draggable)
}
```

**Overlay Layers** – imported files (GPX/SHP/GeoTIFF)
```javascript
{
  id: number,
  name: string,
  type: 'GPX' | 'Shapefile' | 'GeoTIFF',
  layer: L.Layer (FeatureGroup, TileLayer, etc.),
  color: hex, weight: number (SHP only),
  geojson: GeoJSON | null
}
```

**Project JSON** (LocalStorage)
```javascript
{
  points: [...],
  projectName: string,
  timestamp: number
}
```

## Critical Code Patterns

### Adding Points (Map Interaction → Modal → Persist)
1. **Map click** triggers `openPointModal(latlng)` (line ~1900)
   ```javascript
   map.on('click', (e) => {
     if (measureMode !== 'none') {
       handleMeasureClick(e.latlng);
       return;
     }
     openPointModal(e.latlng);
   });
   ```
2. Modal appears; user enters name + optional note
3. Confirm → `addPoint()` creates L.Marker, pushes to `points[]`, calls `renderPointList()`
   ```javascript
   function addPoint(name, latlng, source = 'manual', note = '') {
     const id = pointCounter++;
     const marker = L.marker(latlng, { draggable: true }).addTo(map);
     // marker is draggable and updates point coords on dragend
     const point = { id, name, lat: latlng.lat, lng: latlng.lng, note, marker };
     points.push(point);
     renderPointList();
   }
   ```
4. Auto-save: no explicit call, but `btnSaveProject` serializes `points` to LocalStorage:
   ```javascript
   btnSaveProject.addEventListener('click', () => {
     const project = {
       points: points.map(p => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng, note: p.note })),
       projectName: prompt(...),
       timestamp: Date.now()
     };
     localStorage.setItem('webgis_project', JSON.stringify(project));
   });
   ```

### UTM Conversion → Point Creation
- Input: zone (50), hemisphere (S), easting/northing, name, note (lines ~1750)
- Uses `proj4.js` CDN library: `utmToLatLng(zone, easting, northing, hemisphere)`
  ```javascript
  function utmToLatLng(zone, easting, northing, hemisphere) {
    const hemi = hemisphere === 'S' ? '+south' : '';
    const utmProjStr = `+proj=utm +zone=${zone} ${hemi} +datum=WGS84 +units=m +no_defs`;
    const result = proj4(utmProjStr, 'EPSG:4326', [easting, northing]);
    return { lat: result[1], lng: result[0] };
  }
  ```
- Returns `{lat, lng}` → passes to `addPoint()`
- **Validation**: Check zone 1–60, easting 160k–840k, northing varies by hemisphere

### Layer Management (File Upload → Render → List)
1. **GPX/Shapefile/GeoTIFF handlers** (lines ~2600–2800) read file via FileReader API
   ```javascript
   btnLoadGpx.addEventListener('click', () => {
     const file = gpxFileEl.files[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = (e) => {
       const text = e.target.result;
       // Parse GPX XML → convert to GeoJSON → create L.GeoJSON layer
       const geojson = gpxToGeoJSON(text); // custom function
       const layer = L.geoJSON(geojson).addTo(map);
       addOverlayLayer(file.name, 'GPX', layer, layer.getBounds(), { geojson });
     };
     reader.readAsText(file);
   });
   ```
2. Parse with external libs:
   - **GPX**: built-in XML parsing → `<trkpt>` / `<wpt>` elements
   - **Shapefile**: `shpjs` library (from CDN), converts .zip → GeoJSON:
     ```javascript
     shp(file).then(geojson => {
       const layer = L.geoJSON(geojson, {
         style: { color: '#22c55e', weight: 2 }
       }).addTo(map);
       addOverlayLayer(file.name.replace('.zip', ''), 'Shapefile', layer, layer.getBounds(), { geojson });
     });
     ```
   - **GeoTIFF**: `georaster` + `georaster-layer-for-leaflet` libraries:
     ```javascript
     fetch(file).then(res => res.arrayBuffer()).then(buffer => {
       parseGeoraster(buffer).then(georaster => {
         const layer = new GeoRasterLayer({ georaster }).addTo(map);
         addOverlayLayer(file.name, 'GeoTIFF', layer, layer.getBounds());
       });
     });
     ```
3. Create `L.GeoJSON` or `L.TileLayer`; wrap in `addOverlayLayer(name, type, layer, bounds)`
4. Render UI in `renderLayerList()` with zoom/style/delete/export buttons
   - **Shapefile styling**: Color picker + stroke weight slider per layer
   - **Export**: Downloads GeoJSON as `.geojson` file via Blob + URL.createObjectURL

### Attribute Table & Feature Selection
- Click any feature (polygon/line/point) on map → triggers `showFeatureAttributes(feature)` (line ~2300)
  ```javascript
  geojsonLayer.on('click', (e) => {
    const feature = e.layer.feature;
    showFeatureAttributes(feature);
  });
  ```
- Displays GeoJSON properties in HTML table with dynamic rendering:
  ```javascript
  function showFeatureAttributes(feature) {
    const props = feature.properties || {};
    const tbody = document.createElement('tbody');
    Object.keys(props).forEach(k => {
      const tr = document.createElement('tr');
      tr.dataset.fieldName = k;
      tr.innerHTML = `<td>${k}</td><td>${props[k]}</td>`;
      tbody.appendChild(tr);
    });
  }
  ```
- Auto-calculates area for polygons using `turf.area()`:
  ```javascript
  if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
    const areaM2 = turf.area(feature);
    const areaHa = areaM2 / 10000.0; // convert m² to hectares
  }
  ```
- Click table row to set that field as label for entire layer (updates `labelFieldOverride` variable)

### Measurement Tools (Distance/Area)
- Toggle mode: `btnMeasureDistance` / `btnMeasureArea` set `measureMode` flag (line ~2900)
  ```javascript
  btnMeasureDistance.addEventListener('click', () => {
    measureMode = measureMode === 'distance' ? 'none' : 'distance';
    btnMeasureDistance.classList.toggle('btn-toggle-active');
  });
  ```
- Each map click adds to `measureLatLngs[]`; draws polyline/polygon
  ```javascript
  function handleMeasureClick(latlng) {
    measureLatLngs.push(latlng);
    if (measureMode === 'distance') {
      const distance = turf.length(
        turf.lineString(measureLatLngs.map(ll => [ll.lng, ll.lat]))
      );
      updateMeasureDisplay(`Distance: ${distance.toFixed(2)} km`);
    }
    if (measureMode === 'area') {
      const polygon = turf.polygon([measureLatLngs.map(ll => [ll.lng, ll.lat])]);
      const area = turf.area(polygon) / 10000; // hectares
      updateMeasureDisplay(`Area: ${area.toFixed(4)} ha`);
    }
  }
  ```
- Real-time calculation via Turf.js; `measureInfoEl` updates live
- `btnClearMeasure` resets state:
  ```javascript
  btnClearMeasure.addEventListener('click', () => {
    measureMode = 'none';
    measureLatLngs = [];
    map.removeLayer(measureLayer);
  });
  ```

### Theme & Language Switching
- **Language**: `langState` (stored in LocalStorage) + `t(key, ...args)` helper
  ```javascript
  let langState = localStorage.getItem('webgis_lang') || 'id';
  
  function t(key, ...args) {
    const group = I18N[langState].text;
    const val = group[key];
    if (typeof val === 'function') return val(...args);
    return val || key;
  }
  ```
  - I18N object has `.text` (content strings) and `.ui` (UI element labels)
  - Supports parameterized strings: `deletePointConfirm: name => \`Hapus titik "${name}"?\``
- **Theme**: `document.body.classList.toggle('light-theme')`
  ```javascript
  btnTheme.addEventListener('click', () => {
    themeState = themeState === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('light-theme');
    localStorage.setItem('webgis_theme', themeState);
  });
  ```
  - CSS uses `:not(.light-theme)` for dark defaults (most rules)
  - Light theme overrides at bottom of stylesheet (body.light-theme selectors)
  - Both persist to LocalStorage on change

## Developer Workflows

### Running Locally
- **No build/install needed**
- Open `index.html` in any modern browser
- For offline tiles, create `tiles/{z}/{x}/{y}.png` folder beside `index.html`
  - Leaflet URL template: `tiles/{z}/{x}/{y}.png` (where z=zoom, x=col, y=row in Web Mercator)
  - Test with a few tiles first to verify tile structure
- Shapefile upload requires valid `.zip` containing `.shp` + `.dbf` + `.shx` + (optionally) `.prj`

### Adding Features

#### New Dock Control Button
1. Add HTML in `#map-top-bar` (around line 1500):
   ```html
   <button class="dock-btn" id="btnMyFeature" title="My Feature">🎯</button>
   ```
2. Add JavaScript handler after variable declarations:
   ```javascript
   const btnMyFeature = document.getElementById('btnMyFeature');
   btnMyFeature.addEventListener('click', () => {
     console.log('Feature triggered');
     btnMyFeature.classList.toggle('btn-toggle-active');
   });
   ```
3. Style `.dock-btn.btn-toggle-active` in CSS if needed (lines 1200–1350)

#### New Sidebar Section
1. Duplicate a `.sidebar-section` div in HTML (around line 1180):
   ```html
   <div class="sidebar-section">
     <h3 class="section-title" id="myNewSectionTitle">My New Feature</h3>
     <div class="section-desc" id="myNewSectionDesc">Description here</div>
     <input type="text" id="myInput" placeholder="Enter something" />
     <button class="btn btn-sm" id="btnMyAction">Do Something</button>
   </div>
   ```
2. Add to I18N object (lines 1390–1583):
   ```javascript
   const I18N = {
     id: {
       ui: {
         myNewSectionTitle: 'Fitur Saya',
         myNewSectionDesc: 'Deskripsi saya...'
       }
     },
     en: { /* ... */ }
   };
   ```
3. Call `applyLanguageToUI()` to bind labels, or add manual:
   ```javascript
   document.getElementById('myNewSectionTitle').textContent = t('myNewSectionTitle');
   ```

#### New Point Action Button
1. In `renderPointList()` (around line 1840), add button to template:
   ```javascript
   <button class="btn btn-sm btn-outline" data-action="my-action" data-id="${p.id}">Custom</button>
   ```
2. In `pointListEl` click handler (around line 1870), add case:
   ```javascript
   if (action === 'my-action') {
     const point = points.find(p => p.id === id);
     console.log('Custom action on point:', point);
     // do something with point
   }
   ```

#### New Language String
- Add key to both `I18N.id.text` and `I18N.en.text` (lines 1390–1583)
- Reference in code via `t('myKey')` or `t('myKeyWithParam', arg1, arg2)`
- Example parameterized:
  ```javascript
  I18N.id.text.deletePointConfirm = name => `Hapus titik "${name}"?`
  // Usage:
  confirm(t('deletePointConfirm', point.name))
  ```

### Debugging
- **Inspect state**: DevTools Console → `points`, `overlayLayers`, `map`, `langState`, `themeState`
- **LocalStorage**: 
  ```javascript
  localStorage.getItem('webgis_lang')     // 'id' or 'en'
  localStorage.getItem('webgis_theme')    // 'dark' or 'light'
  localStorage.getItem('webgis_project')  // JSON string
  ```
- **Layer inspection**: `map.eachLayer(layer => console.log(layer))`
- **Marker popup**:  `marker.openPopup()` to view/debug popup content
- **GeoJSON validity**: Use `turf.isValid(feature)` to check feature geometry

## External Dependencies (CDN)
| Library | Purpose |
|---------|---------|
| `leaflet@1.9.4` | Base mapping engine |
| `proj4js` + `proj4leaflet` | UTM ↔ WGS84 coordinate conversion |
| `@turf/turf@6.5.0` | Spatial analysis (area, distance) |
| `shpjs@4.0.3` | Shapefile parser |
| `georaster` + `georaster-layer-for-leaflet` | GeoTIFF raster viewer |
| FontAwesome | Icons (local CSS) |

## Shapefile Styling System

### Color & Weight Control Per Layer
The UI allows live style updates for Shapefile layers via color picker + stroke weight slider (lines ~2070–2130).

**Data Structure**:
```javascript
overlayLayers[i] = {
  id: number,
  name: string,
  type: 'Shapefile',
  layer: L.GeoJSON,
  color: '#22c55e',      // hex color
  weight: 2,             // stroke width 1–6
  geojson: {...}
}
```

**Applying Styles**:
```javascript
// When user changes color or weight in UI:
layerInfo.layer.setStyle({
  color: layerInfo.color,
  weight: layerInfo.weight,
  fillColor: layerInfo.color,
  fillOpacity: 0.3
});
```

**HTML Template** (in `renderLayerList()`, lines ~2050):
```html
<div class="layer-style-row">
  <span>Warna:</span>
  <input type="color" value="${l.color}" 
         data-layer-style="color" data-id="${l.id}" />
  <span>Garis:</span>
  <input type="range" min="1" max="6" value="${l.weight}" 
         data-layer-style="weight" data-id="${l.id}" />
</div>
```

**Event Handler** (line ~2170):
```javascript
const input = e.target.closest('input[data-layer-style]');
if (input) {
  const id = parseInt(input.dataset.id, 10);
  const styleType = input.dataset.layerStyle;
  const layerInfo = overlayLayers.find(l => l.id === id);
  
  if (styleType === 'color') layerInfo.color = input.value;
  if (styleType === 'weight') layerInfo.weight = parseInt(input.value, 10);
  
  layerInfo.layer.setStyle({
    color: layerInfo.color,
    weight: layerInfo.weight,
    fillColor: layerInfo.color
  });
}
```

**To Add More Style Options** (e.g., fill opacity):
1. Add new field to `overlayLayers[i]`: `fillOpacity: 0.3`
2. Extend the `layer-style-row` HTML with new input
3. Update `setStyle()` call to include new property
4. Persist to localStorage if needed (currently only persists via CSV export)

## Widget System

### Live Environmental Data Display
Widgets (lines ~1500–1600 HTML; ~3100–3200 JS) display real-time info in top-right corner:
- **Clock**: current time & date
- **Weather**: temperature & condition (requires API)
- **Sun**: sunrise/sunset times (requires calculation)
- **Location**: live GPS coordinates (if enabled)
- **Elevation**: altitude from DEM (if available)
- **Compass**: device heading (requires DeviceOrientationEvent API)
- **Speed**: movement speed from GPS

### Widget Structure
```html
<div class="widget-gadget">
  <div class="widget-header">
    <span class="widget-title">Widget Title</span>
  </div>
  <div class="widget-content">
    <div id="widgetContent">Live content here</div>
  </div>
</div>
```

**CSS Classes**:
- `.widget-stack`: container for all gadgets (position: fixed, top-right)
- `.widget-gadget`: individual card (padding, background)
- `.widget-title`: section header
- `.widget-content`: inner data display

### Updating Widget Content
Most widgets update via JavaScript:
```javascript
function updateClockWidget() {
  const now = new Date();
  const time = now.toLocaleTimeString('id-ID');
  document.getElementById('widgetTime').textContent = `🕒 ${time}`;
}
setInterval(updateClockWidget, 1000);
```

**To Add New Widget**:
1. Add HTML to `.widget-stack` (around line 1510)
2. Add update function + interval/event listener
3. Style in CSS (`.widget-gadget` applies to all; customize with specific IDs)
4. Bind to I18N for multilingual titles

## Offline Tiles Configuration

### Folder Structure
Place beside `index.html`:
```
/tiles
  /0
    /0
      /0.png
  /1
    /0
      /0.png
      /1.png
    /1
      /0.png
      /1.png
  /2
    /0
      /0.png
      ...
```

### URL Template
Basemap selector allows custom URL:
```javascript
const offlineTileUrl = 'tiles/{z}/{x}/{y}.png';
// z = zoom level, x = column (longitude), y = row (latitude in Web Mercator)
```

### Using Offline Tiles
1. In sidebar, select "Offline Tiles (XYZ)" from basemap dropdown
2. Verify URL template matches your folder structure
3. Tiles load from local filesystem (no network needed)
4. **Performance**: Large tile sets slow initial load; consider pre-caching or bundling as zip

### Converting Raster to Tiles
Use GDAL/gdal2tiles to generate tiles from GeoTIFF:
```bash
gdal2tiles.py -z 0-15 -n "My Tiles" input.tif tiles_output/
```

## Measurement Tool Architecture

### State Management
```javascript
let measureMode = 'none';      // 'distance', 'area', or 'none'
let measureLatLngs = [];        // array of clicked coordinates
let measureLayer = null;        // L.Polyline or L.Polygon on map
```

### Click Handling
```javascript
map.on('click', (e) => {
  if (measureMode !== 'none') {
    handleMeasureClick(e.latlng);  // intercept normal click
    return;
  }
  openPointModal(e.latlng);        // else normal point creation
});
```

### Distance Calculation
Uses Turf.js `length()` function:
```javascript
const line = turf.lineString(
  measureLatLngs.map(ll => [ll.lng, ll.lat])
);
const distance = turf.length(line);  // returns km
```

### Area Calculation
Uses Turf.js `area()` function:
```javascript
const polygon = turf.polygon([
  measureLatLngs.map(ll => [ll.lng, ll.lat])
]);
const areaM2 = turf.area(polygon);
const areaHa = areaM2 / 10000;
```

### Clearing Measurements
- Button click → `btnClearMeasure`
- Resets `measureMode = 'none'`, clears array, removes layer from map
- Allows return to normal point creation mode

## Common Pitfalls & Workarounds

### Shapefile Upload Issues
- **Error**: "Cannot read property 'xxx' of undefined"
  - **Cause**: Uploaded `.zip` missing `.dbf` or `.shx`
  - **Fix**: Ensure all 4 files (`.shp`, `.dbf`, `.shx`, `.prj`) in zip
  - **Check**: Inspect file list before upload; verify shpjs can parse

- **Error**: "shp is not defined"
  - **Cause**: `shpjs` CDN library not loaded or failed to load
  - **Fix**: Check network tab in DevTools; ensure CDN is reachable
  - **Workaround**: Download shpjs and load locally instead of CDN

- **Features render but are invisible**
  - **Cause**: Color picker not initialized or layer already has incompatible style
  - **Fix**: Verify `renderLayerList()` creates color input; reset color via picker
  - **Debug**: Inspect element → check computed `fill` and `stroke` styles

### Measure Tool Stuck
- **Symptom**: Measure button stays active, can't return to point mode
- **Fix**: Click `btnClearMeasure` to reset `measureMode = 'none'`
- **Root cause**: Modal not closed cleanly or event listener not removed

- **Measurements show NaN or Infinity**
  - **Cause**: Invalid GeoJSON produced from clicks (e.g., only 1 point clicked)
  - **Fix**: Ensure at least 2 clicks for distance, 3 for area
  - **Debug**: `console.log(measureLatLngs)` to verify array contents

### Offline Tiles Not Loading
- **Cause**: `tiles/{z}/{x}/{y}.png` path wrong or folder not accessible
- **Tip**: Check browser DevTools Network tab; verify folder structure matches template URL
- **Debug**: Open DevTools → Network → filter by PNG; check 404 errors

- **Tiles load but are gray**
  - **Cause**: Tile files are corrupt or in wrong format (must be PNG/JPEG)
  - **Fix**: Validate tiles with GDAL: `gdalinfo tiles/10/500/500.png`
  - **Workaround**: Regenerate tiles using gdal2tiles with correct parameters

- **Performance degradation with many tiles**
  - **Cause**: Browser caching tiles in memory; large file sizes
  - **Fix**: Pre-tile only zoom levels 0–12 instead of 0–20
  - **Tip**: Use tile compression (lossless PNG or JPEG at 80% quality)

### Modal Not Appearing
- **Cause**: `pointModalBackdrop` has `hidden` class or modal focus lost
- **Check**: Ensure `closePointModal()` not called prematurely; check z-index (should be 10000)
- **Debug**: `document.getElementById('pointModalBackdrop').classList.remove('hidden')`

- **Modal appears but input not focused**
  - **Cause**: `setTimeout(() => focus(), 10)` timing issue on slow devices
  - **Fix**: Increase delay or trigger focus on modal open event instead
  - **Test**: Check on mobile or slow browsers

### Marker Drag & Coordinate Update Issues
- **Markers not draggable**
  - **Cause**: Marker created without `{ draggable: true }` option
  - **Fix**: Verify `L.marker(latlng, { draggable: true })` in `addPoint()`
  - **Check**: Inspect marker options: `marker.options.draggable === true`

- **Dragged marker doesn't update point coordinates**
  - **Cause**: `dragend` event handler not properly updating `point.lat`/`point.lng`
  - **Fix**: Ensure handler updates both object AND re-renders list
  - **Test**: Drag marker → check popup → verify coords changed

### GeoJSON Parsing Errors
- **Invalid GeoJSON structures**
  - **Cause**: Malformed coordinates or missing `type` field
  - **Fix**: Validate with `turf.isValid(feature)` before adding to map
  - **Tool**: Use online validators like geojsonlint.com

- **Attribute table shows `[object Object]` instead of values**
  - **Cause**: Property value is nested object, not string/number
  - **Fix**: Use `JSON.stringify(value)` or extract nested property in handler
  - **Example**: `const val = props[k]?.toString() || props[k]`

### LocalStorage Quota Exceeded
- **Error**: "QuotaExceededError" when saving project
  - **Cause**: LocalStorage limit (~5–10 MB) exceeded; too many points/layers saved
  - **Fix**: Export points to CSV and clear old projects from localStorage
  - **Code**: `localStorage.removeItem('webgis_project')`

- **Saved project won't load**
  - **Cause**: localStorage data corrupted or browser cleared storage
  - **Fix**: Check `localStorage.getItem('webgis_project')` is valid JSON
  - **Debug**: `JSON.parse(localStorage.getItem('webgis_project'))` to test

### Language/Theme Not Persisting
- **Language reverts to Indonesian after refresh**
  - **Cause**: `langState` not saved to localStorage, or `t()` function fails
  - **Fix**: Verify `localStorage.setItem('webgis_lang', langState)` called on language change
  - **Check**: Look for language toggle button click handler

- **Light theme colors wrong**
  - **Cause**: CSS class `light-theme` not applied to `body`
  - **Fix**: Ensure `document.body.classList.toggle('light-theme')` executes
  - **Debug**: `document.body.classList` to check class list

### GPX Parser Issues
- **No waypoints appear from GPX file**
  - **Cause**: GPX file has no `<wpt>` tags, only `<trk>`
  - **Fix**: Use track points instead or convert GPX to include waypoints
  - **Check**: Open GPX in text editor to inspect structure

- **Track displays but segments not connected**
  - **Cause**: Track has multiple segments (`<trkseg>`) not handled
  - **Fix**: Ensure GPX parser loops through all segments
  - **Example**: `gpx.getElementsByTagName('trkseg')` to get all

## Useful DOM IDs for Quick Edits
```html
#map              → Leaflet container
#sidebar          → Left panel
#point-list       → Points UL
#layer-list       → Layers UL
#attr-container   → Attribute table div
#map-top-bar      → Dock button container
#pointModalBackdrop → Modal overlay
```

## Performance Considerations
- **Large Shapefiles**: Rendering >1000 features may lag; consider splitting layers
- **GeoTIFF**: Only supports single-band or RGB; large files slow to parse on first load
- **LocalStorage**: Max ~5–10 MB per domain; exporting large point sets to CSV recommended for backup

---

**Last Updated**: December 7, 2025 | **Language**: Indonesian (Primary) + English (Secondary)

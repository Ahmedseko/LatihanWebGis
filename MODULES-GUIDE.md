# SEKO FIELD - Feature Implementation Modules

This document provides reusable modules for implementing individual features into either the original or enhanced version.

## Module 1: Drawing Tools Module

Self-contained drawing tools implementation.

### Installation
```html
<script src="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js"></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css" />
```

### Core Module
```javascript
const DrawingModule = {
  enabled: false,
  drawnItems: new L.FeatureGroup(),
  editControl: null,

  init() {
    try {
      window.map.addLayer(this.drawnItems);

      const options = {
        position: 'topleft',
        draw: {
          polygon: true,
          polyline: true,
          rectangle: true,
          circle: true,
          marker: true,
          circlemarker: true
        },
        edit: {
          featureGroup: this.drawnItems,
          remove: true
        }
      };

      this.editControl = new L.Control.Draw(options);
      window.map.addControl(this.editControl);

      // Bind events
      window.map.on('draw:created', (e) => this.onDrawCreated(e));
      window.map.on('draw:edited', (e) => this.onDrawEdited(e));
      window.map.on('draw:deleted', (e) => this.onDrawDeleted(e));

      console.log('DrawingModule initialized');
    } catch (error) {
      console.error('DrawingModule init failed:', error);
    }
  },

  onDrawCreated(e) {
    try {
      const layer = e.layer;
      const geojson = layer.toGeoJSON();

      // Store feature
      AppAPI.state.features.push({
        id: Date.now(),
        name: `Feature ${AppAPI.state.features.length + 1}`,
        geometry: geojson.geometry,
        properties: {}
      });

      this.drawnItems.addLayer(layer);
      AppAPI.notify('Feature created', 'success');
      this.updateStats();
    } catch (error) {
      AppAPI.handleError('Draw creation failed', error);
    }
  },

  onDrawEdited(e) {
    try {
      const layers = e.layers;
      layers.eachLayer((layer) => {
        const geojson = layer.toGeoJSON();
        console.log('Feature edited:', geojson);
      });
      AppAPI.notify('Features updated', 'success');
      this.updateStats();
    } catch (error) {
      AppAPI.handleError('Draw edit failed', error);
    }
  },

  onDrawDeleted(e) {
    try {
      const layers = e.layers;
      layers.eachLayer((layer) => {
        AppAPI.state.features = AppAPI.state.features.filter(
          f => f.id !== layer.featureId
        );
      });
      AppAPI.notify('Feature deleted', 'success');
      this.updateStats();
    } catch (error) {
      AppAPI.handleError('Draw delete failed', error);
    }
  },

  updateStats() {
    document.getElementById('featureCount').textContent = 
      AppAPI.state.features.length;
  },

  clear() {
    try {
      this.drawnItems.clearLayers();
      AppAPI.state.features = [];
      this.updateStats();
      AppAPI.notify('All features cleared', 'info');
    } catch (error) {
      AppAPI.handleError('Clear failed', error);
    }
  }
};
```

### Usage
```javascript
// Initialize
DrawingModule.init();

// Add button listeners
document.getElementById('btnDrawPoint')?.addEventListener('click', () => {
  DrawingModule.enabled = !DrawingModule.enabled;
  AppAPI.notify('Point mode toggled', 'info');
});
```

---

## Module 2: Spatial Analysis Module

Buffer, intersect, union operations using Turf.js.

### Core Module
```javascript
const SpatialAnalysisModule = {
  selectedFeatures: [],

  init() {
    try {
      // Window click to select
      window.map.on('click', (e) => {
        const layer = e.layer;
        if (layer && layer.feature) {
          this.selectFeature(layer.feature);
        }
      });

      // Button listeners
      document.getElementById('btnBuffer')?.addEventListener('click', () => {
        this.createBuffer();
      });

      document.getElementById('btnIntersect')?.addEventListener('click', () => {
        this.intersectFeatures();
      });

      console.log('SpatialAnalysisModule initialized');
    } catch (error) {
      console.error('SpatialAnalysisModule init failed:', error);
    }
  },

  selectFeature(feature) {
    try {
      if (!this.selectedFeatures.includes(feature)) {
        this.selectedFeatures.push(feature);
        AppAPI.notify(`Selected: ${feature.properties.name}`, 'success');
      }
    } catch (error) {
      AppAPI.handleError('Feature selection failed', error);
    }
  },

  createBuffer() {
    try {
      if (this.selectedFeatures.length === 0) {
        AppAPI.notify('Select a feature first', 'warning');
        return;
      }

      const distance = parseFloat(
        document.getElementById('bufferDistance').value || 100
      );

      const selected = this.selectedFeatures[0];
      const buffered = turf.buffer(selected, distance, {units: 'meters'});

      const layer = L.geoJSON(buffered, {
        style: {
          color: '#3b82f6',
          weight: 2,
          fillOpacity: 0.2,
          dashArray: '5, 5'
        }
      }).addTo(window.map);

      // Add to features
      AppAPI.state.features.push({
        id: Date.now(),
        name: `Buffer ${distance}m`,
        geometry: buffered.geometry,
        properties: {type: 'buffer', distance}
      });

      AppAPI.notify(`Buffer created: ${distance}m`, 'success');
    } catch (error) {
      AppAPI.handleError('Buffer creation failed', error);
    }
  },

  intersectFeatures() {
    try {
      if (this.selectedFeatures.length < 2) {
        AppAPI.notify('Select at least 2 features', 'warning');
        return;
      }

      const f1 = this.selectedFeatures[0];
      const f2 = this.selectedFeatures[1];
      const intersection = turf.intersect(f1, f2);

      if (!intersection) {
        AppAPI.notify('Features do not intersect', 'warning');
        return;
      }

      L.geoJSON(intersection, {
        style: {color: '#10b981', weight: 2, fillOpacity: 0.3}
      }).addTo(window.map);

      AppAPI.notify('Intersection computed', 'success');
    } catch (error) {
      AppAPI.handleError('Intersection failed', error);
    }
  }
};
```

---

## Module 3: Export Module

Multi-format export functionality.

### Core Module
```javascript
const ExportModule = {
  init() {
    try {
      document.getElementById('btnExportGeoJSON')?.addEventListener('click', () => {
        this.exportGeoJSON();
      });

      document.getElementById('btnExportKML')?.addEventListener('click', () => {
        this.exportKML();
      });

      document.getElementById('btnExportCSV')?.addEventListener('click', () => {
        this.exportCSV();
      });

      document.getElementById('btnExportGPX')?.addEventListener('click', () => {
        this.exportGPX();
      });

      console.log('ExportModule initialized');
    } catch (error) {
      console.error('ExportModule init failed:', error);
    }
  },

  exportGeoJSON() {
    try {
      const geojson = {
        type: 'FeatureCollection',
        features: AppAPI.state.features
      };

      const data = JSON.stringify(geojson, null, 2);
      this.downloadFile(data, `${AppAPI.state.projectName}.geojson`, 'application/json');
      AppAPI.notify('GeoJSON exported', 'success');
    } catch (error) {
      AppAPI.handleError('GeoJSON export failed', error);
    }
  },

  exportKML() {
    try {
      let kml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      kml += '<kml xmlns="http://www.opengis.net/kml/2.2">\n';
      kml += '<Document>\n';

      AppAPI.state.features.forEach((feature, idx) => {
        kml += '<Placemark>\n';
        kml += `<name>${feature.name || `Feature ${idx + 1}`}</name>\n`;
        kml += `<description>${JSON.stringify(feature.properties)}</description>\n`;
        
        // Add geometry
        const geom = feature.geometry;
        if (geom.type === 'Point') {
          const [lng, lat] = geom.coordinates;
          kml += `<Point><coordinates>${lng},${lat}</coordinates></Point>\n`;
        } else if (geom.type === 'LineString') {
          kml += '<LineString><coordinates>\n';
          geom.coordinates.forEach(([lng, lat]) => {
            kml += `${lng},${lat} `;
          });
          kml += '</coordinates></LineString>\n';
        } else if (geom.type === 'Polygon') {
          kml += '<Polygon><outerBoundaryIs><LinearRing><coordinates>\n';
          geom.coordinates[0].forEach(([lng, lat]) => {
            kml += `${lng},${lat} `;
          });
          kml += '</coordinates></LinearRing></outerBoundaryIs></Polygon>\n';
        }

        kml += '</Placemark>\n';
      });

      kml += '</Document></kml>';

      this.downloadFile(kml, `${AppAPI.state.projectName}.kml`, 'application/vnd.google-earth.kml+xml');
      AppAPI.notify('KML exported', 'success');
    } catch (error) {
      AppAPI.handleError('KML export failed', error);
    }
  },

  exportCSV() {
    try {
      let csv = 'ID,Name,Type,Latitude,Longitude,Properties\n';

      AppAPI.state.features.forEach(feature => {
        const props = JSON.stringify(feature.properties).replace(/"/g, '""');
        let lat = '', lng = '';

        if (feature.geometry.type === 'Point') {
          [lng, lat] = feature.geometry.coordinates;
        } else if (feature.geometry.coordinates && feature.geometry.coordinates[0]) {
          [lng, lat] = feature.geometry.coordinates[0];
        }

        csv += `"${feature.id}","${feature.name}","${feature.geometry.type}","${lat}","${lng}","${props}"\n`;
      });

      this.downloadFile(csv, `${AppAPI.state.projectName}.csv`, 'text/csv');
      AppAPI.notify('CSV exported', 'success');
    } catch (error) {
      AppAPI.handleError('CSV export failed', error);
    }
  },

  exportGPX() {
    try {
      let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n';
      gpx += '<gpx version="1.1">\n';
      gpx += '<metadata><name>' + AppAPI.state.projectName + '</name></metadata>\n';

      // Export points as waypoints
      AppAPI.state.features.forEach(feature => {
        if (feature.geometry.type === 'Point') {
          const [lng, lat] = feature.geometry.coordinates;
          gpx += `<wpt lat="${lat}" lon="${lng}">\n`;
          gpx += `<name>${feature.name}</name>\n`;
          gpx += `<desc>${JSON.stringify(feature.properties)}</desc>\n`;
          gpx += '</wpt>\n';
        }
      });

      // Export lines as tracks
      AppAPI.state.features.forEach(feature => {
        if (feature.geometry.type === 'LineString') {
          gpx += '<trk>\n';
          gpx += `<name>${feature.name}</name>\n`;
          gpx += '<trkseg>\n';
          feature.geometry.coordinates.forEach(([lng, lat]) => {
            gpx += `<trkpt lat="${lat}" lon="${lng}" />\n`;
          });
          gpx += '</trkseg>\n';
          gpx += '</trk>\n';
        }
      });

      gpx += '</gpx>';

      this.downloadFile(gpx, `${AppAPI.state.projectName}.gpx`, 'application/gpx+xml');
      AppAPI.notify('GPX exported', 'success');
    } catch (error) {
      AppAPI.handleError('GPX export failed', error);
    }
  },

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], {type: mimeType});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};
```

---

## Module 4: GPS Tracking Module

Real-time location tracking and display.

### Core Module
```javascript
const GPSModule = {
  watchId: null,
  gpsMarker: null,
  gpsAccuracy: null,
  trackPoints: [],

  init() {
    try {
      if (!navigator.geolocation) {
        AppAPI.notify('Geolocation not available', 'warning');
        return;
      }

      document.getElementById('btnLocation')?.addEventListener('click', () => {
        this.toggleTracking();
      });

      console.log('GPSModule initialized');
    } catch (error) {
      console.error('GPSModule init failed:', error);
    }
  },

  toggleTracking() {
    try {
      if (this.watchId !== null) {
        this.stopTracking();
      } else {
        this.startTracking();
      }
    } catch (error) {
      AppAPI.handleError('Tracking toggle failed', error);
    }
  },

  startTracking() {
    try {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.onPositionUpdate(position),
        (error) => this.onPositionError(error),
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000
        }
      );

      AppAPI.notify('GPS tracking started', 'success');
      document.getElementById('editMode').textContent = 'GPS Active';
    } catch (error) {
      AppAPI.handleError('Tracking start failed', error);
    }
  },

  stopTracking() {
    try {
      if (this.watchId !== null) {
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }

      AppAPI.notify('GPS tracking stopped', 'info');
      document.getElementById('editMode').textContent = 'View';
    } catch (error) {
      AppAPI.handleError('Tracking stop failed', error);
    }
  },

  onPositionUpdate(position) {
    try {
      const {latitude, longitude, accuracy, heading, speed, altitude} = position.coords;
      const coords = {lat: latitude, lng: longitude};

      // Update marker
      if (!this.gpsMarker) {
        this.gpsMarker = L.circleMarker(coords, {
          radius: 8,
          color: '#22c55e',
          weight: 2,
          fillOpacity: 0.7
        }).addTo(window.map);

        this.gpsAccuracy = L.circle(coords, {
          radius: accuracy,
          color: '#22c55e',
          weight: 1,
          fillOpacity: 0.1
        }).addTo(window.map);
      } else {
        this.gpsMarker.setLatLng(coords);
        this.gpsAccuracy.setLatLng(coords).setRadius(accuracy);
      }

      // Update widgets
      document.getElementById('widgetCoords').textContent = 
        `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

      // Auto-center map
      window.map.setView(coords, window.map.getZoom());

      // Store track point
      this.trackPoints.push({
        lat: latitude,
        lng: longitude,
        accuracy,
        timestamp: new Date()
      });

      // Show speed if available
      if (speed) {
        const speedKmh = (speed * 3.6).toFixed(1);
        AppAPI.notify(`Speed: ${speedKmh} km/h`, 'info');
      }

    } catch (error) {
      console.warn('Position update failed:', error);
    }
  },

  onPositionError(error) {
    try {
      const messages = {
        1: 'Permission denied',
        2: 'Position unavailable',
        3: 'Request timeout'
      };
      AppAPI.notify(`GPS Error: ${messages[error.code]}`, 'danger');
    } catch (e) {
      console.warn('Position error handler failed:', e);
    }
  },

  saveTrack() {
    try {
      if (this.trackPoints.length < 2) {
        AppAPI.notify('Track too short', 'warning');
        return;
      }

      const lineString = {
        type: 'LineString',
        coordinates: this.trackPoints.map(p => [p.lng, p.lat])
      };

      AppAPI.state.features.push({
        id: Date.now(),
        name: `GPS Track ${new Date().toLocaleTimeString()}`,
        geometry: lineString,
        properties: {type: 'gps_track', pointCount: this.trackPoints.length}
      });

      L.geoJSON(lineString, {
        style: {color: '#3b82f6', weight: 3}
      }).addTo(window.map);

      AppAPI.notify('Track saved', 'success');
      this.trackPoints = [];
    } catch (error) {
      AppAPI.handleError('Track save failed', error);
    }
  }
};
```

---

## Module 5: Layer Management Module

Advanced layer visibility, grouping, and styling.

### Core Module
```javascript
const LayerManagementModule = {
  layers: new Map(),

  init() {
    try {
      this.renderLayerList();

      document.querySelectorAll('[data-layer-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const layerId = e.target.dataset.layerId;
          const action = e.target.dataset.layerAction;
          this.executeAction(layerId, action);
        });
      });

      console.log('LayerManagementModule initialized');
    } catch (error) {
      console.error('LayerManagementModule init failed:', error);
    }
  },

  renderLayerList() {
    try {
      const layerList = document.getElementById('layerList');
      if (!layerList) return;

      layerList.innerHTML = AppAPI.state.features.map(feature => `
        <div style="padding: 8px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.02); border-radius: 4px; margin-bottom: 4px;">
          <input type="checkbox" 
                 checked 
                 data-layer-id="${feature.id}"
                 data-layer-action="toggle"
                 class="layer-visibility" />
          <span style="flex: 1; font-size: 11px; cursor: pointer;" 
                data-layer-id="${feature.id}"
                data-layer-action="select">
            ${feature.name}
          </span>
          <button class="btn btn-sm" 
                  data-layer-id="${feature.id}"
                  data-layer-action="zoom"
                  title="Zoom to layer">🔍</button>
          <button class="btn btn-sm" 
                  data-layer-id="${feature.id}"
                  data-layer-action="style"
                  title="Style">🎨</button>
          <button class="btn btn-sm btn-danger" 
                  data-layer-id="${feature.id}"
                  data-layer-action="delete"
                  title="Delete">🗑️</button>
        </div>
      `).join('');

      // Re-attach listeners
      layerList.querySelectorAll('[data-layer-action]').forEach(el => {
        el.addEventListener('click', (e) => {
          const layerId = e.target.dataset.layerId;
          const action = e.target.dataset.layerAction;
          this.executeAction(layerId, action);
        });
      });
    } catch (error) {
      AppAPI.handleError('Layer list render failed', error);
    }
  },

  executeAction(layerId, action) {
    try {
      const feature = AppAPI.state.features.find(f => f.id == layerId);
      if (!feature) return;

      switch(action) {
        case 'toggle':
          this.toggleLayerVisibility(layerId);
          break;
        case 'zoom':
          this.zoomToLayer(feature);
          break;
        case 'select':
          this.selectLayer(layerId);
          break;
        case 'style':
          this.openStyleDialog(feature);
          break;
        case 'delete':
          this.deleteLayer(layerId);
          break;
      }
    } catch (error) {
      AppAPI.handleError('Layer action failed', error);
    }
  },

  toggleLayerVisibility(layerId) {
    const layer = this.layers.get(layerId);
    if (layer) {
      if (window.map.hasLayer(layer)) {
        window.map.removeLayer(layer);
      } else {
        window.map.addLayer(layer);
      }
    }
  },

  zoomToLayer(feature) {
    try {
      const geojson = L.geoJSON(feature);
      const bounds = geojson.getBounds();
      window.map.fitBounds(bounds, {padding: [50, 50]});
      AppAPI.notify(`Zoomed to ${feature.name}`, 'success');
    } catch (error) {
      AppAPI.handleError('Zoom failed', error);
    }
  },

  selectLayer(layerId) {
    document.querySelectorAll('[data-layer-id]').forEach(el => {
      el.classList.remove('active');
    });
    document.querySelector(`[data-layer-id="${layerId}"]`)?.classList.add('active');
  },

  openStyleDialog(feature) {
    AppAPI.notify('Style editor coming soon', 'info');
  },

  deleteLayer(layerId) {
    if (confirm('Delete this layer?')) {
      try {
        const layer = this.layers.get(layerId);
        if (layer) window.map.removeLayer(layer);
        
        AppAPI.state.features = AppAPI.state.features.filter(f => f.id != layerId);
        this.renderLayerList();
        AppAPI.notify('Layer deleted', 'success');
      } catch (error) {
        AppAPI.handleError('Layer deletion failed', error);
      }
    }
  }
};
```

---

## Integration Instructions

### Step 1: Add to Enhanced Version
```javascript
// In AppAPI.init()
DrawingModule.init();
SpatialAnalysisModule.init();
ExportModule.init();
GPSModule.init();
LayerManagementModule.init();
```

### Step 2: Add to Original Version
```html
<!-- Add to the <head> section -->
<script>
// Copy module code here
const DrawingModule = { ... };
const SpatialAnalysisModule = { ... };
// ... etc
</script>

<!-- Initialize in body -->
<script>
document.addEventListener('DOMContentLoaded', () => {
  DrawingModule.init();
  SpatialAnalysisModule.init();
  ExportModule.init();
  GPSModule.init();
  LayerManagementModule.init();
});
</script>
```

### Step 3: Test Each Module
```javascript
// In console
console.log(DrawingModule);
DrawingModule.init();
// ... test functionality
```

---

## Module Dependency Graph

```
AppAPI (Core)
├── DrawingModule
├── SpatialAnalysisModule
│   └── turf.js
├── ExportModule
├── GPSModule
│   └── navigator.geolocation
└── LayerManagementModule
    └── AppAPI.state.features
```

## Error Handling Best Practices

All modules implement try-catch with AppAPI.handleError():

```javascript
try {
  // Module operation
} catch (error) {
  AppAPI.handleError('Operation failed', error);
}
```

This ensures:
1. Errors are logged to console
2. User-friendly messages displayed
3. App continues running (graceful degradation)

---

**Last Updated**: December 7, 2025

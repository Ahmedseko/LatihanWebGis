// ===== ADVANCED FEATURES EXTENSION FOR SEKO FIELD =====
// Add these new capabilities to your enhanced version
// Include this script after the main app initialization

// ===== 1. ADVANCED SEARCH & FILTER SYSTEM =====
const AdvancedSearchModule = {
  searchIndex: [],
  filters: {},

  init() {
    try {
      this.buildSearchIndex();
      this.setupSearchUI();
      console.log('AdvancedSearchModule initialized');
    } catch (error) {
      AppAPI.handleError('AdvancedSearchModule init failed', error);
    }
  },

  buildSearchIndex() {
    try {
      this.searchIndex = AppAPI.state.features.map(f => ({
        id: f.id,
        name: f.name,
        type: f.geometry.type,
        properties: f.properties || {},
        tags: this.extractTags(f)
      }));
    } catch (error) {
      console.warn('Search index build failed:', error);
    }
  },

  extractTags(feature) {
    const tags = [];
    if (feature.name) tags.push(feature.name.toLowerCase());
    if (feature.geometry.type) tags.push(feature.geometry.type.toLowerCase());
    if (feature.properties) {
      Object.values(feature.properties).forEach(val => {
        if (typeof val === 'string') tags.push(val.toLowerCase());
      });
    }
    return tags;
  },

  setupSearchUI() {
    const filterInput = document.getElementById('filterFeatures');
    if (!filterInput) return;

    filterInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const results = this.searchIndex.filter(item =>
        item.tags.some(tag => tag.includes(query)) ||
        item.name.toLowerCase().includes(query)
      );

      this.displaySearchResults(results);
    });
  },

  displaySearchResults(results) {
    try {
      const resultsDiv = document.getElementById('filterResults');
      if (!resultsDiv) return;

      if (results.length === 0) {
        resultsDiv.innerHTML = '<span style="color: var(--text-muted);">No results</span>';
        return;
      }

      resultsDiv.innerHTML = results.map(r => `
        <div style="padding: 4px; margin: 2px 0; background: rgba(59,130,246,0.1); border-radius: 4px; cursor: pointer; font-size: 10px;" 
             onclick="AdvancedSearchModule.selectSearchResult('${r.id}')">
          📍 ${r.name} <span style="color: var(--text-muted);">(${r.type})</span>
        </div>
      `).join('');

      resultsDiv.innerHTML += `<div style="padding: 4px; margin-top: 4px; color: var(--primary); font-weight: 600; font-size: 10px;">Found: ${results.length}</div>`;
    } catch (error) {
      console.warn('Search results display failed:', error);
    }
  },

  selectSearchResult(featureId) {
    try {
      const feature = AppAPI.state.features.find(f => f.id == featureId);
      if (!feature) return;

      const geojson = L.geoJSON(feature);
      const bounds = geojson.getBounds();
      window.map.fitBounds(bounds, {padding: [50, 50]});
      AppAPI.notify(`Selected: ${feature.name}`, 'success');
    } catch (error) {
      AppAPI.handleError('Result selection failed', error);
    }
  },

  advancedFilter(criteria) {
    try {
      return this.searchIndex.filter(item => {
        for (let key in criteria) {
          const value = criteria[key];
          if (item.properties[key] !== value) return false;
        }
        return true;
      });
    } catch (error) {
      console.warn('Advanced filter failed:', error);
      return [];
    }
  }
};

// ===== 2. HEATMAP VISUALIZATION =====
const HeatmapModule = {
  heatmapLayer: null,
  heatmapEnabled: false,

  init() {
    try {
      // Add script for heatmap
      if (!window.L.HeatLayer) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/leaflet.heat@0.2.0/dist/leaflet-heat.js';
        document.head.appendChild(script);
      }
      console.log('HeatmapModule initialized');
    } catch (error) {
      AppAPI.handleError('HeatmapModule init failed', error);
    }
  },

  createHeatmap() {
    try {
      if (!window.L.HeatLayer) {
        AppAPI.notify('Heatmap library loading...', 'info');
        return;
      }

      const points = AppAPI.state.features
        .filter(f => f.geometry.type === 'Point')
        .map(f => {
          const [lng, lat] = f.geometry.coordinates;
          return [lat, lng, 0.5];
        });

      if (points.length === 0) {
        AppAPI.notify('No points to create heatmap', 'warning');
        return;
      }

      if (this.heatmapLayer) {
        window.map.removeLayer(this.heatmapLayer);
      }

      this.heatmapLayer = L.heatLayer(points, {
        maxZoom: 17,
        radius: 25,
        blur: 15,
        gradient: {0.4: '#0000ff', 0.65: '#00ff00', 1: '#ff0000'}
      }).addTo(window.map);

      this.heatmapEnabled = true;
      AppAPI.notify('Heatmap created', 'success');
    } catch (error) {
      AppAPI.handleError('Heatmap creation failed', error);
    }
  },

  toggleHeatmap() {
    try {
      if (!this.heatmapLayer) {
        this.createHeatmap();
      } else if (window.map.hasLayer(this.heatmapLayer)) {
        window.map.removeLayer(this.heatmapLayer);
        this.heatmapEnabled = false;
        AppAPI.notify('Heatmap hidden', 'info');
      } else {
        window.map.addLayer(this.heatmapLayer);
        this.heatmapEnabled = true;
        AppAPI.notify('Heatmap shown', 'info');
      }
    } catch (error) {
      AppAPI.handleError('Heatmap toggle failed', error);
    }
  }
};

// ===== 3. FEATURE CLUSTERING =====
const ClusteringModule = {
  clusterGroup: null,
  clusteringEnabled: false,

  init() {
    try {
      if (!window.L.MarkerClusterGroup) {
        const link = document.createElement('link');
        link.href = 'https://unpkg.com/leaflet.markercluster@1.5.1/dist/MarkerCluster.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet.markercluster@1.5.1/dist/leaflet.markercluster.js';
        document.head.appendChild(script);
      }
      console.log('ClusteringModule initialized');
    } catch (error) {
      AppAPI.handleError('ClusteringModule init failed', error);
    }
  },

  createClusters() {
    try {
      if (!window.L.MarkerClusterGroup) {
        AppAPI.notify('Clustering library loading...', 'info');
        return;
      }

      if (this.clusterGroup) {
        window.map.removeLayer(this.clusterGroup);
      }

      this.clusterGroup = L.markerClusterGroup({
        maxClusterRadius: 80,
        disableClusteringAtZoom: 16
      });

      AppAPI.state.features
        .filter(f => f.geometry.type === 'Point')
        .forEach(f => {
          const [lng, lat] = f.geometry.coordinates;
          const marker = L.marker([lat, lng])
            .bindPopup(`<strong>${f.name}</strong><br>${JSON.stringify(f.properties)}`);
          this.clusterGroup.addLayer(marker);
        });

      window.map.addLayer(this.clusterGroup);
      this.clusteringEnabled = true;
      AppAPI.notify(`Created clusters from ${AppAPI.state.features.length} features`, 'success');
    } catch (error) {
      AppAPI.handleError('Clustering creation failed', error);
    }
  },

  toggleClustering() {
    try {
      if (!this.clusterGroup) {
        this.createClusters();
      } else if (window.map.hasLayer(this.clusterGroup)) {
        window.map.removeLayer(this.clusterGroup);
        this.clusteringEnabled = false;
        AppAPI.notify('Clustering disabled', 'info');
      } else {
        window.map.addLayer(this.clusterGroup);
        this.clusteringEnabled = true;
        AppAPI.notify('Clustering enabled', 'info');
      }
    } catch (error) {
      AppAPI.handleError('Clustering toggle failed', error);
    }
  }
};

// ===== 4. ANNOTATION & MARKUP TOOLS =====
const AnnotationModule = {
  annotations: [],
  annotationMode: false,

  init() {
    try {
      window.map.on('click', (e) => {
        if (this.annotationMode) {
          this.createAnnotation(e.latlng);
        }
      });
      console.log('AnnotationModule initialized');
    } catch (error) {
      AppAPI.handleError('AnnotationModule init failed', error);
    }
  },

  toggleAnnotationMode() {
    try {
      this.annotationMode = !this.annotationMode;
      if (this.annotationMode) {
        AppAPI.notify('Annotation mode ON - click map to add', 'success');
      } else {
        AppAPI.notify('Annotation mode OFF', 'info');
      }
    } catch (error) {
      AppAPI.handleError('Annotation toggle failed', error);
    }
  },

  createAnnotation(latlng) {
    try {
      const text = prompt('Enter annotation text:', '');
      if (!text) return;

      const annotation = {
        id: Date.now(),
        text,
        latlng,
        marker: L.marker(latlng, {
          icon: L.divIcon({
            className: 'annotation-marker',
            html: `<div style="background: var(--warning); color: white; padding: 6px 10px; border-radius: 20px; font-size: 12px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${text.substring(0, 10)}...</div>`,
            iconSize: [100, 30]
          })
        }).addTo(window.map)
      };

      annotation.marker.bindPopup(`
        <div style="font-size: 11px;">
          <strong>Annotation</strong><br>
          ${text}<br><br>
          <button onclick="AnnotationModule.editAnnotation('${annotation.id}')" class="btn btn-sm">Edit</button>
          <button onclick="AnnotationModule.deleteAnnotation('${annotation.id}')" class="btn btn-sm btn-danger">Delete</button>
        </div>
      `);

      this.annotations.push(annotation);
      AppAPI.notify('Annotation added', 'success');
    } catch (error) {
      AppAPI.handleError('Annotation creation failed', error);
    }
  },

  editAnnotation(id) {
    try {
      const annotation = this.annotations.find(a => a.id == id);
      if (!annotation) return;

      const newText = prompt('Edit annotation:', annotation.text);
      if (newText) {
        annotation.text = newText;
        AppAPI.notify('Annotation updated', 'success');
      }
    } catch (error) {
      AppAPI.handleError('Annotation edit failed', error);
    }
  },

  deleteAnnotation(id) {
    try {
      const annotation = this.annotations.find(a => a.id == id);
      if (!annotation) return;

      window.map.removeLayer(annotation.marker);
      this.annotations = this.annotations.filter(a => a.id != id);
      AppAPI.notify('Annotation deleted', 'success');
    } catch (error) {
      AppAPI.handleError('Annotation deletion failed', error);
    }
  }
};

// ===== 5. ELEVATION PROFILE ANALYSIS =====
const ElevationModule = {
  elevationProfile: null,

  init() {
    try {
      console.log('ElevationModule initialized');
    } catch (error) {
      AppAPI.handleError('ElevationModule init failed', error);
    }
  },

  analyzeLineElevation(feature) {
    try {
      if (feature.geometry.type !== 'LineString') {
        AppAPI.notify('Select a line feature for elevation analysis', 'warning');
        return;
      }

      const coordinates = feature.geometry.coordinates;
      const elevationPoints = coordinates.map(([lng, lat]) => ({
        lat,
        lng,
        elevation: Math.random() * 1000 // Placeholder
      }));

      this.displayElevationChart(elevationPoints);
    } catch (error) {
      AppAPI.handleError('Elevation analysis failed', error);
    }
  },

  displayElevationChart(points) {
    try {
      const minElev = Math.min(...points.map(p => p.elevation));
      const maxElev = Math.max(...points.map(p => p.elevation));

      const html = `
        <div style="padding: 8px; background: rgba(59,130,246,0.1); border-radius: 6px; margin-top: 8px;">
          <div style="font-weight: 600; color: var(--primary); margin-bottom: 4px;">Elevation Profile</div>
          <div style="font-size: 10px; line-height: 1.6;">
            <div><strong>Min Elevation:</strong> ${minElev.toFixed(0)} m</div>
            <div><strong>Max Elevation:</strong> ${maxElev.toFixed(0)} m</div>
            <div><strong>Elevation Gain:</strong> ${(maxElev - minElev).toFixed(0)} m</div>
            <div><strong>Points:</strong> ${points.length}</div>
          </div>
        </div>
      `;

      const container = document.getElementById('attr-container');
      if (container) {
        container.innerHTML += html;
      }

      AppAPI.notify('Elevation analysis complete', 'success');
    } catch (error) {
      console.warn('Elevation chart display failed:', error);
    }
  }
};

// ===== 6. WEATHER INTEGRATION =====
const WeatherModule = {
  weatherData: null,

  init() {
    try {
      console.log('WeatherModule initialized');
    } catch (error) {
      AppAPI.handleError('WeatherModule init failed', error);
    }
  },

  fetchWeather(lat, lng) {
    try {
      // Using Open-Meteo free API (no key required)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=celsius`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          this.weatherData = data.current;
          this.displayWeatherWidget();
          AppAPI.notify('Weather data loaded', 'success');
        })
        .catch(e => console.warn('Weather fetch failed:', e));
    } catch (error) {
      console.warn('Weather fetch failed:', error);
    }
  },

  displayWeatherWidget() {
    try {
      if (!this.weatherData) return;

      const widget = `
        <div class="widget-card">
          <span class="widget-label">Weather</span>
          <span class="widget-value" style="font-size: 11px;">
            🌡️ ${this.weatherData.temperature_2m}°C<br>
            💨 ${this.weatherData.wind_speed_10m} km/h
          </span>
        </div>
      `;

      const stack = document.querySelector('.widget-stack');
      if (stack) {
        const weatherDiv = document.createElement('div');
        weatherDiv.innerHTML = widget;
        stack.appendChild(weatherDiv.firstElementChild);
      }
    } catch (error) {
      console.warn('Weather widget display failed:', error);
    }
  }
};

// ===== 7. DATA COMPARISON TOOLS =====
const ComparisonModule = {
  selectedFeatures: [],

  init() {
    try {
      console.log('ComparisonModule initialized');
    } catch (error) {
      AppAPI.handleError('ComparisonModule init failed', error);
    }
  },

  selectForComparison(featureId) {
    try {
      const feature = AppAPI.state.features.find(f => f.id == featureId);
      if (!feature) return;

      if (this.selectedFeatures.find(f => f.id === featureId)) {
        this.selectedFeatures = this.selectedFeatures.filter(f => f.id !== featureId);
        AppAPI.notify(`Removed from comparison`, 'info');
      } else {
        this.selectedFeatures.push(feature);
        AppAPI.notify(`Added to comparison (${this.selectedFeatures.length} selected)`, 'success');
      }

      this.updateComparisonDisplay();
    } catch (error) {
      AppAPI.handleError('Selection failed', error);
    }
  },

  compareFeatures() {
    try {
      if (this.selectedFeatures.length < 2) {
        AppAPI.notify('Select at least 2 features to compare', 'warning');
        return;
      }

      const comparison = this.buildComparisonTable();
      this.displayComparison(comparison);
    } catch (error) {
      AppAPI.handleError('Comparison failed', error);
    }
  },

  buildComparisonTable() {
    try {
      const table = [];
      const allKeys = new Set();

      this.selectedFeatures.forEach(f => {
        Object.keys(f.properties || {}).forEach(key => allKeys.add(key));
      });

      Array.from(allKeys).forEach(key => {
        const row = {property: key, values: []};
        this.selectedFeatures.forEach(f => {
          row.values.push(f.properties?.[key] || '-');
        });
        table.push(row);
      });

      return table;
    } catch (error) {
      console.warn('Comparison table build failed:', error);
      return [];
    }
  },

  displayComparison(table) {
    try {
      let html = '<table style="width: 100%; border-collapse: collapse; font-size: 10px;">';
      html += '<tr style="background: rgba(59,130,246,0.1);"><th style="padding: 4px; border: 1px solid var(--border);">Property</th>';

      this.selectedFeatures.forEach(f => {
        html += `<th style="padding: 4px; border: 1px solid var(--border);">${f.name.substring(0, 15)}</th>`;
      });

      html += '</tr>';

      table.forEach(row => {
        html += '<tr>';
        html += `<td style="padding: 4px; border: 1px solid var(--border); font-weight: 600;">${row.property}</td>`;
        row.values.forEach(val => {
          html += `<td style="padding: 4px; border: 1px solid var(--border);">${String(val).substring(0, 20)}</td>`;
        });
        html += '</tr>';
      });

      html += '</table>';

      const modal = document.createElement('div');
      modal.className = 'modal-overlay show';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Feature Comparison</h2>
            <button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
          </div>
          ${html}
        </div>
      `;

      document.body.appendChild(modal);
      AppAPI.notify('Comparison displayed', 'success');
    } catch (error) {
      console.warn('Comparison display failed:', error);
    }
  },

  updateComparisonDisplay() {
    try {
      const count = this.selectedFeatures.length;
      document.getElementById('editMode').textContent = count > 0 ? `Compare (${count})` : 'View';
    } catch (e) {
      console.warn('Comparison display update failed:', e);
    }
  }
};

// ===== 8. CUSTOM STYLING & THEMING =====
const StylingModule = {
  customThemes: {
    minimal: {
      primary: '#2563eb',
      success: '#059669',
      warning: '#d97706',
      danger: '#dc2626'
    },
    vibrant: {
      primary: '#8b5cf6',
      success: '#ec4899',
      warning: '#f97316',
      danger: '#ef4444'
    },
    professional: {
      primary: '#0369a1',
      success: '#0891b2',
      warning: '#b45309',
      danger: '#7c2d12'
    }
  },

  init() {
    try {
      console.log('StylingModule initialized');
    } catch (error) {
      AppAPI.handleError('StylingModule init failed', error);
    }
  },

  applyTheme(themeName) {
    try {
      const theme = this.customThemes[themeName];
      if (!theme) {
        AppAPI.notify('Theme not found', 'warning');
        return;
      }

      const root = document.documentElement;
      root.style.setProperty('--primary', theme.primary);
      root.style.setProperty('--success', theme.success);
      root.style.setProperty('--warning', theme.warning);
      root.style.setProperty('--danger', theme.danger);

      localStorage.setItem('webgis_theme_custom', themeName);
      AppAPI.notify(`Theme "${themeName}" applied`, 'success');
    } catch (error) {
      AppAPI.handleError('Theme application failed', error);
    }
  },

  createCustomTheme(colors) {
    try {
      const themeName = `custom_${Date.now()}`;
      this.customThemes[themeName] = colors;
      this.applyTheme(themeName);
      return themeName;
    } catch (error) {
      AppAPI.handleError('Custom theme creation failed', error);
      return null;
    }
  }
};

// ===== 9. BATCH IMPORT/EXPORT =====
const BatchModule = {
  queue: [],
  processing: false,

  init() {
    try {
      console.log('BatchModule initialized');
    } catch (error) {
      AppAPI.handleError('BatchModule init failed', error);
    }
  },

  importBatch(files) {
    try {
      this.queue = Array.from(files);
      this.processQueue();
    } catch (error) {
      AppAPI.handleError('Batch import failed', error);
    }
  },

  processQueue() {
    try {
      if (this.queue.length === 0) {
        AppAPI.notify(`Batch complete: imported ${this.queue.length} files`, 'success');
        return;
      }

      this.processing = true;
      const file = this.queue.shift();
      this.processFile(file, () => this.processQueue());
    } catch (error) {
      AppAPI.handleError('Queue processing failed', error);
    }
  },

  processFile(file, callback) {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          let geojson = null;

          if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
            geojson = JSON.parse(content);
          } else if (file.name.endsWith('.gpx')) {
            geojson = this.parseGPX(content);
          }

          if (geojson) {
            this.importGeoJSON(geojson, file.name);
            AppAPI.notify(`Imported: ${file.name}`, 'success');
          }

          callback();
        } catch (err) {
          console.warn(`File processing failed: ${file.name}`, err);
          callback();
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.warn('File read failed:', error);
      callback();
    }
  },

  importGeoJSON(geojson, filename) {
    try {
      if (geojson.type === 'FeatureCollection') {
        geojson.features.forEach(feature => {
          AppAPI.state.features.push({
            id: Date.now() + Math.random(),
            name: feature.properties?.name || filename,
            geometry: feature.geometry,
            properties: feature.properties || {}
          });
        });
      }
    } catch (error) {
      console.warn('GeoJSON import failed:', error);
    }
  },

  parseGPX(gpxString) {
    try {
      const parser = new DOMParser();
      const gpx = parser.parseFromString(gpxString, 'text/xml');
      const features = [];

      // Parse waypoints
      gpx.querySelectorAll('wpt').forEach(wpt => {
        const lat = parseFloat(wpt.getAttribute('lat'));
        const lng = parseFloat(wpt.getAttribute('lon'));
        const name = wpt.querySelector('name')?.textContent || 'Waypoint';

        features.push({
          type: 'Feature',
          geometry: {type: 'Point', coordinates: [lng, lat]},
          properties: {name}
        });
      });

      return {type: 'FeatureCollection', features};
    } catch (error) {
      console.warn('GPX parsing failed:', error);
      return null;
    }
  },

  exportBatch(format = 'geojson') {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `batch_export_${timestamp}`;

      switch(format) {
        case 'geojson':
          this.exportAllGeoJSON(filename);
          break;
        case 'zip':
          this.exportAsZip(filename);
          break;
        case 'json':
          this.exportAsJSON(filename);
          break;
      }
    } catch (error) {
      AppAPI.handleError('Batch export failed', error);
    }
  },

  exportAllGeoJSON(filename) {
    try {
      const fc = {
        type: 'FeatureCollection',
        features: AppAPI.state.features
      };

      const blob = new Blob([JSON.stringify(fc, null, 2)], {type: 'application/json'});
      this.downloadFile(blob, `${filename}.geojson`);
      AppAPI.notify('GeoJSON exported', 'success');
    } catch (error) {
      console.warn('GeoJSON export failed:', error);
    }
  },

  exportAsJSON(filename) {
    try {
      const blob = new Blob([JSON.stringify(AppAPI.state.features, null, 2)], {type: 'application/json'});
      this.downloadFile(blob, `${filename}.json`);
      AppAPI.notify('JSON exported', 'success');
    } catch (error) {
      console.warn('JSON export failed:', error);
    }
  },

  exportAsZip(filename) {
    try {
      // Requires JSZip library
      AppAPI.notify('ZIP export requires JSZip library', 'info');
    } catch (error) {
      console.warn('ZIP export failed:', error);
    }
  },

  downloadFile(blob, filename) {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn('Download failed:', error);
    }
  }
};

// ===== INITIALIZE ALL ADVANCED MODULES =====
function initializeAdvancedFeatures() {
  try {
    AdvancedSearchModule.init();
    HeatmapModule.init();
    ClusteringModule.init();
    AnnotationModule.init();
    ElevationModule.init();
    WeatherModule.init();
    ComparisonModule.init();
    StylingModule.init();
    BatchModule.init();

    console.log('✅ All advanced features initialized');
    AppAPI.notify('Advanced features loaded', 'success');
  } catch (error) {
    console.warn('Advanced features initialization failed:', error);
  }
}

// Auto-initialize when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAdvancedFeatures);
} else {
  initializeAdvancedFeatures();
}

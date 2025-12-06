# SEKO FIELD 3.0 - Cheat Sheet

**Quick reference for all 23 features**

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F11` | Toggle fullscreen |
| `Ctrl+S` | Save project |
| `Ctrl+E` | Export features |
| `Ctrl+Z` | Undo |
| `Ctrl+L` | Toggle layers panel |
| `Shift+M` | Measurement mode |
| `Shift+A` | Annotation mode |
| `Escape` | Close dialogs |

---

## 🎨 UI Navigation

### Left Sidebar
```
Projects
├─ Save Project
├─ Load Project
└─ Project List

Map Layers
├─ Base Maps
├─ Layer List
└─ Add Layer

Features
├─ Point List
├─ Add Point (click map)
└─ Edit/Delete (click feature)

Tools
├─ Search Features
├─ Measure Distance/Area
└─ Export Data
```

### Right Dock (Top)
```
🌐 Language Toggle (ID ↔ EN)
🌙 Theme Toggle (Dark ↔ Light)
📊 Tools Tab
📈 Analysis Tab
⚙️ Settings Tab
```

### Analysis Tab
```
🔥 Heatmap        - Toggle density visualization
📍 Clustering     - Group features by location
📝 Annotation     - Add map notes
⚖️ Comparison     - Compare feature properties
🌤️ Weather       - Get current weather
```

### Settings Tab
```
✨ Minimal Theme       - Clean, subtle colors
✨ Vibrant Theme       - Bold, energetic colors
✨ Professional Theme  - Corporate colors
📤 Batch Import       - Upload multiple files
📥 Export All         - Download all features
```

---

## 🗺️ Map Controls

| Control | Function |
|---------|----------|
| Scroll | Zoom in/out |
| Drag | Pan map |
| Double-click | Zoom to point |
| Right-click | Context menu (if enabled) |
| `+` / `-` | Zoom buttons |
| Compass | Rotate map (if enabled) |

---

## 📍 Working with Points

### Create Point
```
1. Click on map
2. Enter point name
3. Add optional note
4. Confirm
5. Point appears with marker
```

### Edit Point
```
1. Click point in list
2. Edit name/note
3. Confirm changes
4. Drag marker to move
```

### Delete Point
```
1. Click point in list
2. Click delete button
3. Confirm deletion
4. Point removed
```

### Import Points (Batch)
```
1. Settings → Batch Import
2. Select .geojson/.json/.gpx
3. Points imported automatically
4. Appear in list
```

---

## 📊 Visualization Modes

### Heatmap (🔥)
```
Click: Analysis → 🔥
Shows: Data density (colors = concentration)
Colors: Blue (low) → Green (medium) → Red (high)
Toggle: Click again to hide
Data: Requires 10+ point features
```

### Clustering (📍)
```
Click: Analysis → 📍
Shows: Grouped features at different zoom levels
Count: Numbers show features per cluster
Zoom: In to expand clusters, out to group
Performance: Better with 100+ features
```

### Custom Themes
```
Click: Settings → Theme Button
Options:
  - Minimal (blue, green, subtle)
  - Vibrant (purple, pink, bold)
  - Professional (teal, navy, corporate)
Applies to: Entire UI + map colors
Persists: Saved to browser storage
```

---

## 🔍 Data Analysis

### Search Features (Tools Tab)
```
Type keyword in "Search features"
Results appear in real-time
Click result to zoom to feature
Search includes: Names, properties, types
```

### Measure Distance (Tools Tab)
```
1. Click "Measure Distance"
2. Click map points (2+)
3. Distance shown in km
4. Click "Clear" to reset
```

### Measure Area (Tools Tab)
```
1. Click "Measure Area"
2. Click map points (3+)
3. Area shown in hectares/m²
4. Click "Clear" to reset
```

### Compare Features (Analysis → ⚖️)
```
1. Click ⚖️ button
2. Select features from list
3. Table shows properties side-by-side
4. Works with 2+ features
5. Useful for: Survey comparison, quality check
```

### Elevation Analysis
```
1. Select a line feature
2. Right-click → "Analyze Elevation"
3. Shows: Min, Max, Total Gain, Profile
4. Requires: Line with elevation data
```

---

## 🌐 Annotation Tools (📝)

### Add Annotation
```
1. Click Analysis → 📝
2. Click on map
3. Enter text in prompt
4. Annotation marker appears
```

### Edit Annotation
```
1. Click annotation marker
2. In popup, click "Edit"
3. Modify text
4. Confirm
```

### Delete Annotation
```
1. Click annotation marker
2. In popup, click "Delete"
3. Marker removed
```

---

## ☁️ Weather (🌤️)

### Get Weather
```
1. Analysis → 🌤️ button
2. Shows: Temp (°C), Wind (km/h)
3. Location: Map center coordinates
4. Updates: Real-time from Open-Meteo API
5. No API key needed
```

---

## 💾 Import/Export

### Batch Import (Settings)
```
1. Click 📤 "Batch Import"
2. Select files: .geojson, .json, .gpx
3. Can select multiple files
4. All imported sequentially
5. Features appear in list
```

### Batch Export (Settings)
```
1. Click 📥 "Export All"
2. Downloads: features.geojson
3. Format: GeoJSON (standard geospatial)
4. Use in: QGIS, ArcGIS, Google Earth
5. Re-import: Drop into Batch Import
```

### Project Save (Sidebar)
```
1. Click "Save Project"
2. Enter project name
3. Saved to browser storage
4. Includes: Points, settings, theme
5. Load: Click "Load Project"
```

---

## 📈 Advanced Features Quick Reference

| Feature | How to Use | Best For |
|---------|-----------|----------|
| Search | Tools tab, type keyword | Finding specific features |
| Heatmap | Analysis → 🔥 | Seeing data density/patterns |
| Clustering | Analysis → 📍 | Organizing many features |
| Annotations | Analysis → 📝 | Adding field notes |
| Elevation | Right-click line → Analyze | Route planning, slope analysis |
| Weather | Analysis → 🌤️ | Field conditions check |
| Comparison | Analysis → ⚖️ | Quality assurance, data checking |
| Themes | Settings → Theme buttons | Presentation, personal preference |
| Batch Import | Settings → 📤 | Loading multiple datasets |
| Batch Export | Settings → 📥 | Sharing, archiving, analysis |

---

## 🎯 Common Workflows

### Workflow 1: Field Survey
```
1. Create points (click map)
2. Add annotations with 📝
3. Take photos (attach to feature)
4. Export at end of day (Settings → 📥)
5. Share with team
```

### Workflow 2: Data Analysis
```
1. Batch Import data (Settings → 📤)
2. Search for category (Tools → Search)
3. Create Heatmap (Analysis → 🔥)
4. Enable Clustering (Analysis → 📍)
5. Compare subset (Analysis → ⚖️)
6. Export findings (Settings → 📥)
```

### Workflow 3: Presentation
```
1. Load data (Batch Import)
2. Apply theme (Settings → Professional)
3. Enable Heatmap/Clustering for visuals
4. Add annotations for callouts
5. Screenshot or export
```

### Workflow 4: Mobile Survey
```
1. Download offline map
2. Load previous data (Load Project)
3. Add new points (click map)
4. Annotate observations (📝)
5. Sync when internet available (Export/Import)
```

---

## 🔧 Configuration

### Browser Storage
```
LocalStorage location: 5MB limit
Contains: Projects, settings, annotations
Check: F12 → Application → LocalStorage
Clear: Right-click → Clear (starts fresh)
```

### Theme Persistence
```
Current theme saved automatically
Persists across browser sessions
Reset: Clear localStorage if corrupted
Location: Browser settings (private)
```

### Map Settings
```
Can modify basemap in left sidebar
Zoom level saved with project
Pan position: Not automatically saved
Layers: Saved in project

Basemap Options:
  - OpenStreetMap
  - Satellite (Bing)
  - Dark mode
  - Offline tiles (if available)
```

---

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Heatmap not showing | Need 10+ points, check Leaflet.heat loaded |
| Clustering not grouping | Zoom out more, check MarkerCluster loaded |
| Weather not loading | Check internet, Open-Meteo might be down |
| Batch import stuck | Refresh page, check file format (GeoJSON/JSON/GPX) |
| Theme not changing | Clear localStorage, try another theme |
| Points not saving | Check localStorage enabled, not full |
| Export file won't open | Verify GeoJSON format, try opening in QGIS |
| Annotation mode stuck | Refresh page, disable other tools |

---

## 📊 Supported File Formats

### Import
```
✅ GeoJSON (.geojson, .json)
✅ JSON (.json with features array)
✅ GPX (.gpx waypoints/tracks)
❌ Shapefile (convert to GeoJSON first)
❌ CSV (convert to GeoJSON first)
```

### Export
```
✅ GeoJSON (.geojson)
✅ JSON (.json)
❌ Shapefile (download GeoJSON, convert externally)
❌ KML (download GeoJSON, convert externally)
```

---

## 🔗 External Tools Integration

### QGIS Integration
```
1. Export from SEKO (Settings → 📥)
2. QGIS → Layer → Add GeoJSON
3. Edit in QGIS
4. Save as GeoJSON
5. Re-import to SEKO (Settings → 📤)
```

### ArcGIS Integration
```
1. Export GeoJSON
2. ArcGIS → Add Data → Upload
3. Edit online
4. Download back to GeoJSON
5. Re-import to SEKO
```

### Google Earth
```
1. Export GeoJSON
2. Convert to KML (online converter)
3. Open in Google Earth Pro
4. View in 3D
```

---

## 💡 Pro Tips

### Speed Up Performance
```
✅ Use clustering for 500+ points
✅ Hide unnecessary layers
✅ Use dark theme (lower CPU)
✅ Close browser tabs
✅ Clear old projects (localStorage)
```

### Better Analysis
```
✅ Add meaningful point names
✅ Use annotations for context
✅ Compare similar features
✅ Export regularly (backup)
✅ Use search to filter results
```

### Presentations
```
✅ Use Professional theme
✅ Add heatmap for visual impact
✅ Enable clustering to show patterns
✅ Use annotations for callouts
✅ Export to high-res screenshot
```

### Data Management
```
✅ Name points descriptively
✅ Add detailed notes
✅ Regular exports (backup)
✅ Version control (git/GitHub)
✅ Use batch import for large datasets
```

---

## 📱 Mobile Tips

### On Tablet/Phone
```
✅ Use landscape mode (better view)
✅ Tap instead of click
✅ Use large zoom levels
✅ Keep datasets < 1000 features
✅ Close other apps (save RAM)
```

### Touch Gestures
```
One finger: Pan map
Two fingers: Pinch to zoom
Long tap: Open context menu
Double tap: Zoom to point
```

---

## 🎓 Learning Resources

### Start Here
```
1. QUICK-REFERENCE.md (5 min) ← YOU ARE HERE
2. GETTING-STARTED.md (10 min)
3. ENHANCEMENT-GUIDE.md (20 min)
4. ADVANCED-FEATURES.md (45 min)
5. TESTING-GUIDE.md (varies)
```

### Code Learning
```
1. MODULES-GUIDE.md (reusable code)
2. advanced-features.js (implementation)
3. index-enhanced.html (full app)
```

---

## 🔐 Security & Privacy

### Your Data
```
✅ Stored locally (browser storage)
✅ Not sent to external servers
✅ Weather data: Anonymous API
✅ No tracking or analytics
✅ Open-source and auditable
```

### Backup Strategy
```
1. Regular exports (Settings → 📥)
2. Save to cloud (Dropbox/Drive)
3. Use git for version control
4. Keep local backups
```

---

## 🆘 Need Help?

### Check These First
```
1. Browser console (F12 → Console)
2. Look for red error messages
3. Check network tab for failed requests
4. Verify script loads (Network → JS files)
5. Try different browser
6. Clear cache (Ctrl+Shift+Delete)
```

### Provide These When Asking for Help
```
- Browser & version
- Error message (screenshot)
- What you tried before
- Steps to reproduce
- File being used (if applicable)
```

---

## 📞 Support

- **Documentation**: See files in this folder
- **Errors**: Check browser console (F12)
- **Ideas**: Create GitHub issue
- **Bugs**: Document steps to reproduce

---

## ✅ Checklist - Before You Start

- [ ] Read this sheet (5 min)
- [ ] Open index-enhanced.html
- [ ] Check console for ✅ initialization
- [ ] Create test point (click map)
- [ ] Test one feature from each tab
- [ ] Try batch import with sample file
- [ ] Verify export works
- [ ] Celebrate! 🎉

---

## 🎯 Your First 10 Minutes

```
Minute 1: Open app, read console
Minutes 2-3: Create 5 test points
Minutes 4-5: Test heatmap & clustering
Minutes 6-7: Add annotations
Minutes 8-9: Try batch import/export
Minute 10: Save project & celebrate!
```

---

**Version**: 3.0 Cheat Sheet  
**Date**: December 7, 2025  
**Print this for quick reference!** 📋

**Next: Open `GETTING-STARTED.md` for detailed walkthrough** →


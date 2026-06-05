// =====================================================
// app.js — Main application logic
// =====================================================

import { fetchEntries, insertEntry, isConfigured } from './db.js';

// ---- Category icon SVGs ----
const CATEGORY_ICONS = {
  shop: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
  startup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  education: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
  skills: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`,
  community: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`
};

const FALLBACK_IMG = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600";

// ---- Application state ----
let directoryData = [];
let currentFilter = 'all';
let activeBoroughs = new Set();
let boroughFeatures = [];
let boundaryLayer = null;
let isBoundaryVisible = true;
let markerLayer = null;
let markerRefs = {};
let map = null;

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  initMap();
  loadCouncilBoundaries();
  initFilters();
  initBoroughDropdown();
  initForm();
  showSetupBannerIfNeeded();
  await loadData();
});

function showSetupBannerIfNeeded() {
  if (!isConfigured()) {
    document.getElementById('setup-banner').style.display = 'block';
  }
}

// ---- Data loading ----
async function loadData() {
  showLoading(true);
  try {
    directoryData = await fetchEntries();
  } catch (err) {
    console.error('Failed to load entries:', err);
    directoryData = [];
  }
  showLoading(false);
  renderGallery();
  renderMap();
}

function showLoading(show) {
  const el = document.getElementById('gallery-loading');
  if (el) el.style.display = show ? 'block' : 'none';
}

// ---- Map ----
function initMap() {
  map = L.map('map', { scrollWheelZoom: true, zoomControl: false }).setView([51.505, -0.12], 11);
  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);

  document.getElementById('toggle-boundaries-btn').addEventListener('click', toggleBoundaries);
}

// Returns Leaflet style object for a borough polygon based on active state
function getBoroughStyle(boroughName) {
  const isActive = activeBoroughs.has(boroughName);
  return {
    color: '#000000',
    weight: 1.5,
    dashArray: '3, 5',
    fillColor: isActive ? '#16a34a' : '#000000',
    fillOpacity: isActive ? 0.08 : 0.01
  };
}

// Re-style all borough polygons to reflect current activeBoroughs set
function updateBoroughStyles() {
  if (!boundaryLayer) return;
  boundaryLayer.eachLayer(layer => {
    const name = layer.feature && layer.feature.properties && layer.feature.properties.name;
    if (name) layer.setStyle(getBoroughStyle(name));
  });
}

function toggleBoundaries() {
  isBoundaryVisible = !isBoundaryVisible;
  const btnText = document.getElementById('boundary-toggle-text');
  const btnIcon = document.getElementById('boundary-toggle-icon');

  if (isBoundaryVisible) {
    if (boundaryLayer) boundaryLayer.addTo(map);
    btnText.textContent = 'Hide Boroughs';
    btnIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
  } else {
    if (boundaryLayer) map.removeLayer(boundaryLayer);
    btnText.textContent = 'Show Boroughs';
    btnIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;
  }
}

async function loadCouncilBoundaries() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/london.geojson');
    const data = await res.json();
    boroughFeatures = data.features;

    boundaryLayer = L.geoJSON(data, {
      style: (feature) => getBoroughStyle(feature.properties.name),
      onEachFeature: (feature, layer) => {
        // Hover tooltip only — no click popup
        layer.bindTooltip(feature.properties.name, {
          className: 'borough-tooltip',
          direction: 'center',
          sticky: true,
          permanent: false
        });
        // Suppress click so it doesn't open a popup box
        layer.on('click', (e) => { L.DomEvent.stopPropagation(e); });
      }
    });

    if (isBoundaryVisible) boundaryLayer.addTo(map);

    assignBoroughsToData();
    populateBoroughFilter();
    renderGallery();
    renderMap();
  } catch (e) {
    console.error('Failed to load London borough boundaries:', e);
  }
}

function assignBoroughsToData() {
  directoryData.forEach(entry => {
    if (!entry.borough) {
      const pt = turf.point([entry.lng, entry.lat]);
      let found = "Outside London";
      for (const feature of boroughFeatures) {
        if (turf.booleanPointInPolygon(pt, feature)) {
          found = feature.properties.name;
          break;
        }
      }
      entry.borough = found;
    }
    activeBoroughs.add(entry.borough);
  });
}

function renderMap() {
  if (!markerLayer) return;
  markerLayer.clearLayers();
  markerRefs = {};

  const filtered = getFilteredData();
  filtered.forEach(entry => {
    const iconSvgRaw = CATEGORY_ICONS[entry.category] || CATEGORY_ICONS['shop'];
    const archIcon = L.divIcon({
      className: 'custom-arch-icon',
      html: `
        <div style="background:#000;color:#fff;width:32px;height:32px;display:flex;align-items:center;justify-content:center;box-shadow:3px 3px 0 rgba(0,0,0,.2);border:1px solid #fff">
          <div style="width:16px;height:16px">${iconSvgRaw}</div>
        </div>
        <div style="width:2px;height:8px;background:#000;margin:0 auto"></div>
      `,
      iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -42]
    });

    const marker = L.marker([entry.lat, entry.lng], { icon: archIcon }).addTo(markerLayer);
    marker.bindPopup(`
      <div style="text-align:center;min-width:140px;padding:4px 0">
        <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#78716c;display:block;margin-bottom:4px">${entry.category}</span>
        <h4 style="font-weight:700;font-size:14px;margin-bottom:4px;line-height:1.2">${entry.name}</h4>
        <p style="font-size:12px;color:#78716c;margin-bottom:12px">${entry.location}</p>
        <button onclick="window.selectEntry(${entry.id})" style="background:#000;color:#fff;width:100%;padding:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;border:none;cursor:pointer">Details</button>
      </div>
    `);
    marker.on('click', () => selectEntry(entry.id, false));
    markerRefs[entry.id] = marker;
  });
}

window.selectEntry = function(id, panMap = true) {
  document.querySelectorAll('.card').forEach(c => c.classList.remove('expanded'));
  const card = document.getElementById(`card-${id}`);
  if (card) {
    card.classList.add('expanded');
    // Re-run masonry after the CSS transition completes (400ms)
    setTimeout(() => {
      masonryLayout();
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 420);
  }
  if (panMap) {
    const entry = directoryData.find(e => e.id === id);
    if (entry) {
      map.flyTo([entry.lat, entry.lng], 15, { duration: 1.2 });
      setTimeout(() => { if (markerRefs[id]) markerRefs[id].openPopup(); }, 1200);
    }
  }
};

function selectEntry(id, panMap = true) {
  window.selectEntry(id, panMap);
}

// ---- Gallery ----
function getFilteredData() {
  return directoryData.filter(d => {
    const catMatch = currentFilter === 'all' || d.category === currentFilter;
    const boroughMatch = d.borough ? activeBoroughs.has(d.borough) : true;
    return catMatch && boroughMatch;
  });
}

function renderGallery() {
  const gallery = document.getElementById('gallery');
  const countEl = document.getElementById('entry-count');
  if (!gallery) return;

  gallery.innerHTML = '';
  const filtered = getFilteredData();

  if (countEl) countEl.textContent = String(filtered.length).padStart(2, '0');

  if (filtered.length === 0) {
    gallery.innerHTML = `<div class="empty-state">No entries found for this filter.</div>`;
    return;
  }

  // Newest first — if we have created_at sort by that, else reverse id order
  const sorted = [...filtered].sort((a, b) => {
    if (a.created_at && b.created_at) return new Date(b.created_at) - new Date(a.created_at);
    return b.id - a.id;
  });

  sorted.forEach(entry => {
    const icon = CATEGORY_ICONS[entry.category] || CATEGORY_ICONS['shop'];
    const card = document.createElement('div');
    card.className = 'card';
    card.id = `card-${entry.id}`;
    card.addEventListener('click', () => selectEntry(entry.id));

    card.innerHTML = `
      <div class="card-image-wrapper">
        <img src="${entry.photo || FALLBACK_IMG}" onerror="this.src='${FALLBACK_IMG}'" alt="${entry.name}" loading="lazy">
        <div class="card-badge">${icon}</div>
        <div class="card-overlay">
          <span class="card-category">${entry.category}</span>
          <h3 class="card-name">${entry.name}</h3>
          <div class="card-location">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="square" stroke-linejoin="miter" d="M12 21s-8-7.5-8-12a8 8 0 1 1 16 0c0 4.5-8 12-8 12z"/>
              <circle cx="12" cy="9" r="3"/>
            </svg>
            ${entry.location}
          </div>
        </div>
      </div>
      <div class="expanded-wrapper">
        <div class="expanded-inner">
          <div class="card-detail">
            <p class="card-desc">${entry.desc}</p>
            <a href="${entry.website}" target="_blank" rel="noopener noreferrer" class="card-website-link" onclick="event.stopPropagation()">
              View Website
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="square" stroke-linejoin="miter" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    `;
    gallery.appendChild(card);
  });

  // Run masonry after images load (use a small delay + ResizeObserver for robustness)
  masonryLayout();
  // Re-run once images have loaded in case heights changed
  setTimeout(masonryLayout, 300);
  setTimeout(masonryLayout, 800);
}

// ---- Masonry layout engine ----
// Absolutely positions cards into columns so expanding one never
// causes others to jump or reflow.
function masonryLayout() {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  const cards = Array.from(gallery.querySelectorAll('.card'));
  if (cards.length === 0) return;

  const GAP = 24; // px between cards
  const galleryWidth = gallery.offsetWidth;

  // Decide column count based on container width
  let cols = 1;
  if (galleryWidth >= 900) cols = 3;
  else if (galleryWidth >= 520) cols = 2;

  const colWidth = (galleryWidth - GAP * (cols - 1)) / cols;
  const colHeights = new Array(cols).fill(0);

  cards.forEach(card => {
    // Set width first so height measurement is accurate
    card.style.width = colWidth + 'px';

    // Place in the shortest column
    const shortest = colHeights.indexOf(Math.min(...colHeights));
    card.style.left = (shortest * (colWidth + GAP)) + 'px';
    card.style.top = colHeights[shortest] + 'px';

    colHeights[shortest] += card.offsetHeight + GAP;
  });

  // Set gallery height to tallest column
  gallery.style.height = Math.max(...colHeights) + 'px';
}

// Re-run masonry on window resize
let masonryResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(masonryResizeTimer);
  masonryResizeTimer = setTimeout(masonryLayout, 100);
});

// ---- Filters ----
function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.cat;
      renderGallery();
      renderMap();
    });
  });
}

// ---- Borough Dropdown ----
function initBoroughDropdown() {
  const btn = document.getElementById('borough-dropdown-btn');
  const menu = document.getElementById('borough-dropdown-menu');
  const arrow = document.getElementById('borough-dropdown-arrow');

  btn.addEventListener('click', e => {
    e.stopPropagation();
    menu.classList.toggle('open');
    arrow.classList.toggle('rotated');
  });

  document.addEventListener('click', e => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.remove('open');
      arrow.classList.remove('rotated');
    }
  });

  document.getElementById('select-all-boroughs').addEventListener('change', e => {
    const checked = e.target.checked;
    document.querySelectorAll('.borough-chk').forEach(chk => {
      chk.checked = checked;
      checked ? activeBoroughs.add(chk.value) : activeBoroughs.delete(chk.value);
    });
    updateDropdownLabel();
    updateBoroughStyles();
    renderGallery();
    renderMap();
  });
}

function populateBoroughFilter() {
  const list = document.getElementById('borough-checkbox-list');
  list.innerHTML = '';

  const names = [...boroughFeatures.map(f => f.properties.name), "Outside London"].sort();
  names.forEach(name => {
    activeBoroughs.add(name);
    const id = `chk-${name.replace(/\s+/g, '-')}`;
    const label = document.createElement('label');
    label.className = 'borough-label';
    label.innerHTML = `
      <input type="checkbox" id="${id}" value="${name}" checked class="borough-chk">
      <span>${name}</span>
    `;
    list.appendChild(label);
  });

  document.querySelectorAll('.borough-chk').forEach(chk => {
    chk.addEventListener('change', e => {
      e.target.checked ? activeBoroughs.add(e.target.value) : activeBoroughs.delete(e.target.value);
      updateSelectAllState();
      updateDropdownLabel();
      updateBoroughStyles();
      renderGallery();
      renderMap();
    });
  });
}

function updateSelectAllState() {
  const total = document.querySelectorAll('.borough-chk').length;
  const checked = document.querySelectorAll('.borough-chk:checked').length;
  const allChk = document.getElementById('select-all-boroughs');
  allChk.checked = total > 0 && total === checked;
  allChk.indeterminate = checked > 0 && checked < total;
}

function updateDropdownLabel() {
  const total = document.querySelectorAll('.borough-chk').length;
  const checked = document.querySelectorAll('.borough-chk:checked').length;
  const label = document.getElementById('borough-dropdown-label');
  if (total === 0 || checked === total) label.textContent = "All Boroughs";
  else if (checked === 0) label.textContent = "No Boroughs Selected";
  else if (checked === 1) label.textContent = document.querySelector('.borough-chk:checked').value;
  else label.textContent = `${checked} Boroughs Selected`;
}

// ---- Form / geocoding ----
function initForm() {
  const locationInput = document.getElementById('location');
  const suggestionsList = document.getElementById('location-suggestions');
  let geocodeTimeout;

  locationInput.addEventListener('input', e => {
    clearTimeout(geocodeTimeout);
    delete locationInput.dataset.lat;
    delete locationInput.dataset.lng;
    const val = e.target.value.trim();
    if (val.length < 3) { suggestionsList.classList.remove('open'); return; }

    geocodeTimeout = setTimeout(async () => {
      try {
        const q = encodeURIComponent(val + ', London, UK');
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&addressdetails=1&limit=5`);
        const data = await res.json();
        suggestionsList.innerHTML = '';
        if (data.length > 0) {
          suggestionsList.classList.add('open');
          data.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.display_name;
            li.addEventListener('click', () => {
              const shortName = item.address.suburb || item.address.neighbourhood || item.address.road || item.address.town || "London";
              locationInput.value = shortName + ", " + (item.address.city || "London");
              locationInput.dataset.lat = item.lat;
              locationInput.dataset.lng = item.lon;
              suggestionsList.classList.remove('open');
            });
            suggestionsList.appendChild(li);
          });
        } else {
          suggestionsList.classList.remove('open');
        }
      } catch (err) {
        console.error("Autocomplete error:", err);
      }
    }, 500);
  });

  document.addEventListener('click', e => {
    if (!locationInput.contains(e.target) && !suggestionsList.contains(e.target)) {
      suggestionsList.classList.remove('open');
    }
  });

  document.getElementById('add-entry-form').addEventListener('submit', handleFormSubmit);
}

async function geocode(locationString) {
  try {
    const q = encodeURIComponent(`${locationString}, London, UK`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`);
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('submit-btn');
  const msgEl = document.getElementById('form-message');
  const locationInput = document.getElementById('location');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing…';
  msgEl.className = 'form-message';
  msgEl.textContent = '';

  const name = document.getElementById('name').value.trim();
  const category = document.getElementById('category').value;
  const website = document.getElementById('website').value.trim();
  const locationVal = locationInput.value.trim();
  const photo = document.getElementById('photo').value.trim();
  const desc = document.getElementById('description').value.trim();

  let coords = null;
  if (locationInput.dataset.lat && locationInput.dataset.lng) {
    coords = { lat: parseFloat(locationInput.dataset.lat), lng: parseFloat(locationInput.dataset.lng) };
  } else {
    coords = await geocode(locationVal);
  }

  if (!coords) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Entry';
    msgEl.textContent = 'Location not found. Please try again.';
    msgEl.className = 'form-message error';
    return;
  }

  // Assign borough via Turf
  const pt = turf.point([coords.lng, coords.lat]);
  let borough = "Outside London";
  for (const feature of boroughFeatures) {
    if (turf.booleanPointInPolygon(pt, feature)) { borough = feature.properties.name; break; }
  }

  const newEntry = {
    name, category, website,
    location: locationVal.split(',')[0],
    lat: coords.lat, lng: coords.lng,
    photo: photo || FALLBACK_IMG,
    desc, borough
  };

  try {
    const saved = await insertEntry(newEntry);

    // Switch to all-filter view so user sees their submission
    currentFilter = 'all';
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.filter-btn[data-cat="all"]').classList.add('active');

    // Ensure new borough is active
    if (!activeBoroughs.has(borough)) {
      activeBoroughs.add(borough);
      const chk = document.getElementById(`chk-${borough.replace(/\s+/g, '-')}`);
      if (chk) { chk.checked = true; updateSelectAllState(); updateDropdownLabel(); }
    }

    directoryData.unshift(saved);
    renderGallery();
    renderMap();
    selectEntry(saved.id);

    document.getElementById('add-entry-form').reset();
    delete locationInput.dataset.lat;
    delete locationInput.dataset.lng;

    msgEl.textContent = 'Initiative added successfully!';
    msgEl.className = 'form-message success';
    setTimeout(() => { msgEl.className = 'form-message'; }, 4000);
  } catch (err) {
    console.error('Insert error:', err);
    msgEl.textContent = 'Failed to save entry. Please try again.';
    msgEl.className = 'form-message error';
  }

  submitBtn.disabled = false;
  submitBtn.textContent = 'Submit Entry';
}

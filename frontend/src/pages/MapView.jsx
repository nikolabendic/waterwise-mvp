import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup, GeoJSON, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Droplets, AlertTriangle, Building2, Info, Users, MapPin } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const sampleStations = [
  { id: 1, name: 'Novi Sad - Dunav', lat: 45.2572, lng: 19.8583, level: '243 cm', temp: '16.4 °C', status: 'Normalno', type: 'Merna Stanica' },
];

const sampleEvents = [
  { 
    id: 101, 
    title: 'Prekid - Janka Čmelika', 
    location: 'Ulica Janka Čmelika (Detelinara)', 
    lat: 45.2588, 
    lng: 19.8130, 
    date: '02.07.2026.', 
    status: 'Završen', 
    note: 'Planirana zamena magistralnog cevovoda', 
    radius: 350, 
    popAffected: '~3.200 stanovnika' 
  },
  { 
    id: 102, 
    title: 'Prekid - Bulevar Slobodana Jovanovića', 
    location: 'Bulevar Slobodana Jovanovića (Novo Naselje)', 
    lat: 45.2538, 
    lng: 19.8020, 
    date: '02.10.2026.', 
    status: 'Završen', 
    note: 'Hitna sanacija vodovodne cevi na raskrsnici', 
    radius: 400, 
    popAffected: '~4.500 stanovnika' 
  },
  { 
    id: 103, 
    title: 'Havarija - Bulevar oslobođenja', 
    location: 'Bulevar oslobođenja (kod Futoške pijace)', 
    lat: 45.2520, 
    lng: 19.8360, 
    date: '31.07.2026.', 
    status: 'Završen', 
    note: 'Zamena ventila na distributivnoj mreži', 
    radius: 500, 
    popAffected: '~5.100 stanovnika' 
  },
  { 
    id: 104, 
    title: 'Radovi - Sremska Kamenica', 
    location: 'Sremska Kamenica (Centar)', 
    lat: 45.2250, 
    lng: 19.8440, 
    date: '02.07.2026.', 
    status: 'Završen', 
    note: 'Ispiranje i dezinfekcija rezervoara', 
    radius: 300, 
    popAffected: '~1.800 stanovnika' 
  }
];


const criticalFacilitiesGeoJSON = {
  type: 'FeatureCollection',
  features: [
    { 
      type: 'Feature', 
      properties: { name: 'Klinički centar Vojvodine (KCV)', type: 'Bolnica', priority: 'Kritičan' }, 
      geometry: { type: 'Point', coordinates: [19.8236, 45.2492] } 
    },
    { 
      type: 'Feature', 
      properties: { name: 'Dom zdravlja Liman (Bulevar cara Lazara)', type: 'Zdravstvo', priority: 'Visok' }, 
      geometry: { type: 'Point', coordinates: [19.8315, 45.2386] } 
    },
    { 
      type: 'Feature', 
      properties: { name: 'Dom zdravlja Novo Naselje', type: 'Zdravstvo', priority: 'Visok' }, 
      geometry: { type: 'Point', coordinates: [19.7995, 45.2515] } 
    },
    { 
      type: 'Feature', 
      properties: { name: 'PU Radosno detinjstvo (Detelinara)', type: 'Vrtić', priority: 'Visok' }, 
      geometry: { type: 'Point', coordinates: [19.8120, 45.2590] } 
    }
  ]
};


const populationGridGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { zone: 'Sektor Detelinara', popDensity: '8.500 stan/km²', popAffected: '~3.200' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[19.8050, 45.2550], [19.8200, 45.2550], [19.8200, 45.2650], [19.8050, 45.2650], [19.8050, 45.2550]]]
      }
    },
    {
      type: 'Feature',
      properties: { zone: 'Sektor Novo Naselje', popDensity: '7.800 stan/km²', popAffected: '~4.500' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[19.7920, 45.2480], [19.8100, 45.2480], [19.8100, 45.2570], [19.7920, 45.2570], [19.7920, 45.2480]]]
      }
    },
    {
      type: 'Feature',
      properties: { zone: 'Sektor Liman', popDensity: '6.200 stan/km²', popAffected: '~5.400' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[19.8250, 45.2330], [19.8450, 45.2330], [19.8450, 45.2430], [19.8250, 45.2430], [19.8250, 45.2330]]]
      }
    }
  ]
};

export default function MapView() {
  const [noviSadCenter] = useState([45.2520, 19.8250]);
  const [selectedFeature, setSelectedFeature] = useState(null);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.25rem' }}>
          GIS Prostorni Pregled Novi Sad
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          Kliknite na bilo koji marker na mapi kako biste prikazali tačnu lokaciju i žutu zonu uticaja.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', height: '620px', flexWrap: 'wrap' }}>
        {}
        <div style={{ flex: '1 1 65%', height: '100%', minWidth: '320px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative' }}>
          <MapContainer center={noviSadCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {}
            {selectedFeature && selectedFeature.lat && selectedFeature.radius && (
              <Circle
                center={[selectedFeature.lat, selectedFeature.lng]}
                radius={selectedFeature.radius}
                pathOptions={{ color: '#d97706', fillColor: '#f59e0b', fillOpacity: 0.35, weight: 2, dashArray: '6, 6' }}
              />
            )}

            <LayersControl position="topright">
              <LayersControl.Overlay checked name="Događaji i Prekidi (JKP)">
                <LayerGroup>
                  {sampleEvents.map((ev) => (
                    <Marker key={ev.id} position={[ev.lat, ev.lng]} eventHandlers={{ click: () => setSelectedFeature(ev) }}>
                      <Popup>
                        <b>{ev.title}</b><br />
                        <span style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: '600' }}>{ev.location}</span>
                      </Popup>
                    </Marker>
                  ))}
                </LayerGroup>
              </LayersControl.Overlay>

              <LayersControl.Overlay checked name="Hidrološke stanice">
                <LayerGroup>
                  {sampleStations.map((st) => (
                    <Marker key={st.id} position={[st.lat, st.lng]} eventHandlers={{ click: () => setSelectedFeature(st) }}>
                      <Popup><b>{st.name}</b><br />Vodostaj: {st.level}</Popup>
                    </Marker>
                  ))}
                </LayerGroup>
              </LayersControl.Overlay>

              <LayersControl.Overlay checked name="Kritične ustanove">
                <GeoJSON 
                  data={criticalFacilitiesGeoJSON} 
                  pointToLayer={(f, latlng) => L.circleMarker(latlng, { radius: 8, fillColor: '#0284c7', color: '#fff', weight: 2, fillOpacity: 0.9 })}
                  onEachFeature={(f, l) => l.on('click', () => setSelectedFeature({ name: f.properties.name, note: `Kategorija: ${f.properties.type}`, status: f.properties.priority }))}
                />
              </LayersControl.Overlay>

              <LayersControl.Overlay name="Population Grid (Slojevi Mreže)">
                <GeoJSON 
                  data={populationGridGeoJSON}
                  style={{ color: '#0284c7', weight: 1, fillColor: '#38bdf8', fillOpacity: 0.15 }}
                  onEachFeature={(f, l) => l.on('click', () => setSelectedFeature({ name: f.properties.zone, note: `Gustina: ${f.properties.popDensity}`, popAffected: f.properties.popAffected }))}
                />
              </LayersControl.Overlay>
            </LayersControl>
          </MapContainer>
        </div>

        {}
        <div style={{ width: '320px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <Info size={18} color="#0284c7" />
              <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>Prostorna Analiza Odabira</h3>
            </div>

            {selectedFeature ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Naziv Lokacije / Objekta</label>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>{selectedFeature.name || selectedFeature.title}</div>
                </div>

                {selectedFeature.location && (
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Ulica i Kvart</label>
                    <div style={{ fontSize: '0.9rem', color: '#0284c7', fontWeight: '600' }}>{selectedFeature.location}</div>
                  </div>
                )}

                {selectedFeature.radius && (
                  <div style={{ backgroundColor: '#fef3c7', padding: '0.75rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontSize: '0.8rem', fontWeight: '700' }}>
                      <AlertTriangle size={15} /> Radijus uticaja: {selectedFeature.radius} m
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#92400e', marginTop: '0.25rem' }}>
                      Žuta zona obuhvata ulice u okolini lokacije.
                    </div>
                  </div>
                )}

                {selectedFeature.popAffected && (
                  <div style={{ backgroundColor: '#f0f9ff', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontSize: '0.8rem', fontWeight: '700' }}>
                      <Users size={15} /> Procenjena ugrožena populacija
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0c4a6e', marginTop: '0.1rem' }}>
                      {selectedFeature.popAffected}
                    </div>
                  </div>
                )}

                {selectedFeature.note && (
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Opis / Napomena</label>
                    <div style={{ fontSize: '0.9rem', color: '#334155' }}>{selectedFeature.note}</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 1rem' }}>
                <MapPin size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.875rem', margin: 0 }}>Kliknite na bilo koji marker ili GeoJSON plavu tačku ustanove na mapi da vidite tačne detalje.</p>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#64748b' }}>
            Na pinovima su označene kritične lokacije u Novom Sadu.
          </div>
        </div>
      </div>
    </div>
  );
}

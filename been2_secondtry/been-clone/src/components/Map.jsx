import React, { useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as geoJsonImport from 'world-geojson';
import * as lookup from 'coordinate_to_country';
import * as lookupName from 'country-code-lookup';

// Component to handle map events
const MapEvents = ({ onCountryClick }) => {
  useMapEvents({
    click(e) {
      // Get the coordinates where the user clicked
      const { latlng } = e;
      const { lat, lng } = latlng;
      const countryName = getCountryNameFromCoordinates(lat, lng);

      if (countryName) {
        onCountryClick(countryName);
      }
    }
  });

  return null;
};


const getCountryNameFromCoordinates = (lat, lng) => {

  console.log(lookup(lat, lng)[0]);
  const countryISO = lookup(lat, lng)[0];
  
  const countryNameLookedUp = lookupName.byIso(countryISO).country;
  console.log(countryNameLookedUp);
  return countryNameLookedUp;
};

const Map = () => {
  const [highlightedCountries, setHighlightedCountries] = useState([]);

  const handleCountryClick = (countryName) => {
    const data = geoJsonImport.forCountry(countryName);
    if (data) {
      setHighlightedCountries(prevCountries => [...prevCountries, data]); // Add new data to the list
    }
  };

  return (
    <MapContainer center={[20, 0]} zoom={2} style={{ height: '100vh', width: '100vw' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CartoDB</a> contributors'
      />
      <MapEvents onCountryClick={handleCountryClick} />
      {highlightedCountries.map((data, index) => (
        <GeoJSON key={index} data={data} />
      ))}
    </MapContainer>
  );
};

export default Map;

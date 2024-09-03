import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as geoJsonImport from "world-geojson";
import * as lookup from "coordinate_to_country";
import * as lookupName from "country-code-lookup";

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
    },
  });

  return null;
};

const getCountryNameFromCoordinates = (lat, lng) => {
  // console.log(lookup(lat, lng)[0]);
  const countryISO = lookup(lat, lng)[0];

  if (countryISO) {
    const countryNameLookedUp = lookupName.byIso(countryISO).country;
    // console.log(countryNameLookedUp);
    return countryNameLookedUp;
  } else {
    console.log("That's not a country!");
    
  }
};

const Map = () => {
  const [highlightedCountries, setHighlightedCountries] = useState([]);

  // Fetch visited countries when the component mounts
  const fetchVisitedCountries = () => {
    fetch("http://localhost:3111/api/users/1/countries_visited")
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          const arrayOfVisitedCountries = data.map((country) => {
            const countryName = lookupName.byIso(country.country_id).country;
            return {
              id: country.country_id,
              geojson: geoJsonImport.forCountry(countryName),
              name: countryName,
            };
          });
          setHighlightedCountries(arrayOfVisitedCountries);
        } else {
          console.log("No data available");
          setHighlightedCountries([]); // Clear state if no data
        }
      })
      .catch((error) => console.error("Error fetching countries:", error));
  };

  // Initial fetch of visited countries
  useEffect(() => {
    fetchVisitedCountries();
  }, []);

  const handleCountryClick = (countryName) => {
    const newCountry = {
      id: lookupName.byCountry(countryName).isoNo,
      geojson: geoJsonImport.forCountry(countryName),
      name: countryName,
    };
  
    // Check if the country is already highlighted
    const existingCountry = highlightedCountries.find(
      (country) => country.id === Number(newCountry.id)
    );
  
    // If the country exists, perform a DELETE request
    if (existingCountry) {
      console.log(countryName, " already exists, let's delete it");
  
      fetch("http://localhost:3111/api/users/1/countries_visited", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: 1, country_id: newCountry.id }),
      })
        .then((response) => {
          if (!response.ok) {
            return response.text().then((text) => {
              throw new Error(text);
            });
          }
          return response.json();
        })
        .then((data) => {
          console.log("Delete response:", data);
          // Re-fetch the list of visited countries to update the state correctly
          fetchVisitedCountries();
        })
        .catch((error) => console.error("Delete error:", error));
    } else {
      // If the country does not exist, perform a POST request
      console.log("Add ", countryName, "to API with POST");
  
      fetch("http://localhost:3111/api/users/1/countries_visited", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: 1, country_id: newCountry.id }),
      })
        .then((response) => {
          if (!response.ok) {
            return response.text().then((text) => {
              throw new Error(text);
            });
          }
          return response.json();
        })
        .then((data) => {
          console.log("Add response:", data);
          // Re-fetch the list of visited countries to update the state correctly
          fetchVisitedCountries();
        })
        .catch((error) => console.error("Add error:", error));
    }
  };
  
  
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: "100vh", width: "100vw" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CartoDB</a> contributors'
      />
      <MapEvents onCountryClick={handleCountryClick} />
      {highlightedCountries.map((data, index) => (
        <GeoJSON key={index} data={data.geojson} />
      ))}
    </MapContainer>
  );
};

export default Map;

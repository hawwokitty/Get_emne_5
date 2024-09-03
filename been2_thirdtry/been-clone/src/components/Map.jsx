import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// import * as geoJsonImport from "world-geojson";
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
  const countryISO = lookup(lat, lng)[0];

  if (countryISO) {
    const countryNameLookedUp = lookupName.byIso(countryISO).country;
    return countryNameLookedUp;
  } else {
    console.log("That's not a country!");
  }
};

const Map = () => {
  const [countryData, setCountryData] = useState(null);
  const [highlightedCountries, setHighlightedCountries] = useState([]);

  // Fetching world GeoJSON data
  useEffect(() => {
    fetch("/world.geo.json")
      .then((response) => response.json())
      .then((data) => setCountryData(data))
      .catch((error) => console.error("Error fetching country data:", error));
  }, []);

  // Fetch visited countries
  const fetchVisitedCountries = useCallback(() => {
    fetch("http://localhost:3111/api/users/1/countries_visited")
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          const arrayOfVisitedCountries = data.map((country) => {
            const countryName = lookupName.byIso(country.country_id).country;
            const countryIso = lookupName.byIso(country.country_id).iso2;
            const countryGeoJson =
              countryData && countryData.features
                ? countryData.features.find(
                    (feature) => feature.properties.iso_a2_eh === countryIso
                  )
                : null;
            return {
              id: country.country_id,
              geojson: countryGeoJson,
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
  }, [countryData]); // Add countryData as a dependency since it is used inside

  // Initial fetch of visited countries
  useEffect(() => {
    fetchVisitedCountries();
  }, [fetchVisitedCountries]); 


  const handleCountryClick = (countryName) => {
    const countryIso = lookupName.byCountry(countryName).iso2;
    const countryGeoJson =
      countryData && countryData.features
        ? countryData.features.find(
            (feature) => feature.properties.iso_a2_eh === countryIso
          )
        : null;
    const newCountry = {
      id: lookupName.byCountry(countryName).isoNo,
      geojson: countryGeoJson,
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
      {highlightedCountries.map((data, index) =>
        data.geojson ? <GeoJSON key={index} data={data.geojson} /> : null
      )}
    </MapContainer>
  );
};

export default Map;

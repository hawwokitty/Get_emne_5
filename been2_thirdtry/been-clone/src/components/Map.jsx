import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as lookup from "coordinate_to_country";
import * as lookupName from "country-code-lookup";
import { useAuth } from '../context/AuthContext'; // Ensure this hook is correctly implemented

const MapEvents = ({ onCountryClick }) => {
  useMapEvents({
    click(e) {
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
    return lookupName.byIso(countryISO).country;
  } else {
    console.log("That's not a country!");
  }
};

const Map = () => {
  const [countryData, setCountryData] = useState(null);
  const [highlightedCountries, setHighlightedCountries] = useState([]);
  const { user } = useAuth(); // Access the user data
  const { logout } = useAuth(); // Get the logout function from the context

  const handleLogout = () => {
    logout(); // Call the logout function to clear user data
    window.location.href = '/login'; // Redirect to the login page or home page
  };
  

  // Debugging: Check the value of user
  useEffect(() => {
    console.log("User from AuthContext:", user);
  }, [user]);

  // Fetching world GeoJSON data
  useEffect(() => {
    fetch("/world_countries_geojson.json")
      .then((response) => response.json())
      .then((data) => setCountryData(data))
      .catch((error) => console.error("Error fetching country data:", error));
  }, []);

  // Fetch visited countries
  const fetchVisitedCountries = useCallback(() => {
    if (!user || !user.id) {
      console.error("User is not logged in or user ID is missing");
      return; // Exit if user is not available
    }

    fetch(`http://localhost:3111/api/users/${user.id}/countries_visited`)
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          const arrayOfVisitedCountries = data.map((country) => {
            const countryName = lookupName.byIso(country.country_id).country;
            const countryIso = lookupName.byIso(country.country_id).iso3;
            const countryGeoJson =
              countryData && countryData.features
                ? countryData.features.find(
                    (feature) => feature.properties.su_a3 === countryIso
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
          setHighlightedCountries([]);
        }
      })
      .catch((error) => console.error("Error fetching countries:", error));
  }, [countryData, user]);

  // Initial fetch of visited countries
  useEffect(() => {
    fetchVisitedCountries();
  }, [fetchVisitedCountries]);

  const handleCountryClick = (countryName) => {
    if (!user || !user.id) {
      console.error("Cannot modify countries without a valid user.");
      return;
    }

    const countryIso = lookupName.byCountry(countryName).iso3;
    const countryGeoJson =
      countryData && countryData.features
        ? countryData.features.find(
            (feature) => feature.properties.su_a3 === countryIso
          )
        : null;
    const newCountry = {
      id: lookupName.byCountry(countryName).isoNo,
      geojson: countryGeoJson,
      name: countryName,
    };

    const existingCountry = highlightedCountries.find(
      (country) => country.id === Number(newCountry.id)
    );

    const method = existingCountry ? "DELETE" : "POST";
    const action = existingCountry ? "deleting" : "adding";

    console.log(`${action} ${countryName} for user ID ${user.id}`);

    fetch(`http://localhost:3111/api/users/${user.id}/countries_visited`, {
      method,
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
        console.log("Response:", data);
        fetchVisitedCountries();
      })
      .catch((error) => console.error("Error:", error));
  };

  return (
    <>
    <button onClick={handleLogout} className="btn btn-secondary">
      Logout
    </button>
    <MapContainer center={[20, 0]} zoom={2} style={{ height: "100vh", width: "100vw" }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CartoDB</a> contributors'
      />
      <MapEvents onCountryClick={handleCountryClick} />
      {highlightedCountries.map((data) =>
        data.geojson ? <GeoJSON key={data.id} data={data.geojson} /> : null
      )}
    </MapContainer>

    </>
  );
};

export default Map;

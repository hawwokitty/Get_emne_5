import { useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMapEvents,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as lookup from "coordinate_to_country";
import * as lookupName from "country-code-lookup";
// const lookupCity = require('local-reverse-geocoder');
import { useAuth } from "../context/AuthContext";
// const cities = require('all-the-cities');

// lookupCity.init({}, function () {});
const customIcon = L.icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png", // Update to your custom icon path if needed
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const MapEvents = ({ onCountryClick }) => {
  useMapEvents({
    click(e) {
      const { latlng } = e;
      const { lat, lng } = latlng;
      // getCityNameFromCoordinates(lat, lng);
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

// const getCityNameFromCoordinates = (lat, lng) => {
//  const point = {latitude: lat, longitude: lng};
//   const city = lookupCity.lookup(point);
//   console.log(city.name);
// }

// Define the style function to apply red color to highlighted countries
function style(feature) {
  return {
    fillColor: "#FFB6C1", // Red color
    weight: 2,
    opacity: 1,
    color: "#FFB6C1", // Border color
    // dashArray: "3",
    fillOpacity: 0.5,
  };
}

const Map = () => {
  const [countryData, setCountryData] = useState(null);
  const [capitalData, setCapitalData] = useState(null);
  const [highlightedCountries, setHighlightedCountries] = useState([]);
  const [visitedCapitalsPoints, setVisitedCapitalsPoints] = useState([]);
  const { user } = useAuth(); // Access the user data
  const { logout } = useAuth(); // Get the logout function from the context
  const [isToggled, setIsToggled] = useState(true);

  const handleLogout = () => {
    logout(); // Call the logout function to clear user data
    window.location.href = "/login"; // Redirect to the login page or home page
  };

  const handleToggleMode = () => {
    setIsToggled((prevMode) => !prevMode);
  };

  // // Debugging: Check the value of user
  // useEffect(() => {
  //   console.log("User from AuthContext:", user);
  // }, [user]);

  // Fetching world GeoJSON data
  useEffect(() => {
    fetch("/world_countries_geojson.json")
      .then((response) => response.json())
      .then((data) => setCountryData(data))
      .catch((error) => console.error("Error fetching country data:", error));
  }, []);
  // Fetching capitals GeoJSON data
  useEffect(() => {
    fetch("/capitals.geojson")
      .then((response) => response.json())
      .then((data) => setCapitalData(data))
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
          console.log("No country data available");
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
      body: JSON.stringify({ id: user.id, country_id: newCountry.id }),
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

  // Fetch visited capitals
  const fetchVisitedCapitals = useCallback(() => {
    if (!user || !user.id) {
      console.error("User is not logged in or user ID is missing");
      return; // Exit if user is not available
    }

    fetch(`http://localhost:3111/api/users/${user.id}/capitals_visited`)
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          const arrayOfVisitedCapitals = data.map((capital) => {
            const countryName = lookupName.byIso(capital.country_id).country;
            const capitalGeoJson =
              capitalData && capitalData.features
                ? capitalData.features.find(
                    (feature) => feature.properties.country === countryName
                  )
                : null;
            return {
              // id: capital.id,
              geojson: capitalGeoJson,
              name: capital.name,
              country: countryName,
            };
          });
          setVisitedCapitalsPoints(arrayOfVisitedCapitals);
        } else {
          console.log("No capitals data available");
          setVisitedCapitalsPoints([]);
        }
      })
      .catch((error) => console.error("Error fetching countries:", error));
  }, [capitalData, user]);

  // Initial fetch of visited capitals
  useEffect(() => {
    fetchVisitedCapitals();
  }, [fetchVisitedCapitals]);

  const handleCapitalclick = (countryName) => {
    if (!user || !user.id) {
      console.error("Cannot modify countries without a valid user.");
      return;
    }

    const capitalGeoJson =
      capitalData && capitalData.features
        ? capitalData.features.find(
            (feature) => feature.properties.country === countryName
          )
        : null;
    console.log(capitalGeoJson);

    const newCapital = {
      // id: ????,
      geojson: capitalGeoJson,
      name: capitalGeoJson.properties.city,
      country: countryName,
    };

    const existingCapital = visitedCapitalsPoints.find(
      (capital) => capital.country === countryName
    );

    const countryIso = lookupName.byCountry(countryName).isoNo;
    // console.log(countryIso);
    // console.log(Number(countryIso));
    // console.log(newCapital.name);
    console.log(visitedCapitalsPoints);

    const method = existingCapital ? "DELETE" : "POST";
    const action = existingCapital ? "deleting" : "adding";

    console.log(
      `${action} ${capitalGeoJson.properties.city}  for user ID ${user.id}`
    );

    fetch(`http://localhost:3111/api/users/${user.id}/capitals_visited`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: user.id,
        cityName: newCapital.name,
        country_id: Number(countryIso),
      }),
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
        fetchVisitedCapitals();
      })
      .catch((error) => console.error("Error:", error));
  };

  return (
    <>
      <button onClick={handleLogout} className="btn btn-secondary">
        Logout
      </button>
      <button
        type="button"
        onClick={handleToggleMode}
        className="btn btn-primary"
      >
        Click to toggle to {isToggled ? "Capital City" : "Country"} mode
      </button>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100vh", width: "100vw" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CartoDB</a> contributors'
        />
        <MapEvents
          onCountryClick={isToggled ? handleCountryClick : handleCapitalclick}
        />
        {highlightedCountries.map((data) =>
          data.geojson ? <GeoJSON key={data.id} data={data.geojson} style={style}/> : null
        )}
        {visitedCapitalsPoints.map((point) =>
          point.geojson ? (
            <Marker
              key={point.id}
              position={[
                point.geojson.geometry.coordinates[1], // Latitude
                point.geojson.geometry.coordinates[0], // Longitude
              ]}
              icon={customIcon}
            >
              <Popup>
                <strong>
                  {point.geojson.properties.city},{" "}
                  {point.geojson.properties.country}
                </strong>
                <br />
                ISO2: {point.geojson.properties.iso2}
                <br />
                ISO3: {point.geojson.properties.iso3}
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </>
  );
};

export default Map;

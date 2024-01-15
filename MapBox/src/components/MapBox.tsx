import React, { FormEvent, useState, useEffect } from "react";
import Papa from "papaparse";
import ReactMapGL, {
  FullscreenControl,
  GeolocateControl,
  Marker,
  NavigationControl,
  Source,
  Layer,
  Popup,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";

interface Coordinates {
  longitude: number;
  latitude: number;
}

const MapBox: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);
  const [toggle, setToggle] = useState<boolean>(false);
  const [referenceLocation, setReferenceLocation] = useState<Coordinates>();
  const [routeCoordinates, setRouteCoordinates] = useState<number[][]>([]);

  useEffect(() => {
    if (referenceLocation && coordinates.length > 0) {
      fetchDirections();
    }
  }, [referenceLocation, coordinates]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          result.data.map((loc: any) => {
            const address: string = loc.address;
            const getRequest = async () => {
              try {
                const URI = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                  address
                )}.json?access_token=pk.eyJ1Ijoid2FxYXJtdXJ0YXphLW1hcGJveCIsImEiOiJjbHJhczFlbGkwZHY3MmptazQ4b3Zlanp1In0.VNnw53QuZ7xhnA5cYiycXQ`;
                const response = await axios.get(URI);
                const [longitude, latitude] = response.data.features[0].center;
                console.log(longitude, latitude);
                setCoordinates((prevCoordinates) => [
                  ...prevCoordinates,
                  { longitude, latitude },
                ]);
              } catch (error: any) {
                console.error("Error fetching coordinates", error);
              }
              setToggle(true);
            };
            getRequest();
          });
        },
        error: (error) => {
          console.error(error);
        },
      });
    }
  };

  const handleRef = async (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() === "") {
      return;
    }
    try {
      const URI = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        input
      )}.json?access_token=pk.eyJ1Ijoid2FxYXJtdXJ0YXphLW1hcGJveCIsImEiOiJjbHJhczFlbGkwZHY3MmptazQ4b3Zlanp1In0.VNnw53QuZ7xhnA5cYiycXQ`;
      const response = await axios.get(URI);
      const [longitude, latitude] = response.data.features[0].center;
      setReferenceLocation({ longitude, latitude });
    } catch (error) {
      console.error("Error fetching coordinates for reference location", error);
    }
    setToggle(true);
  };

  const fetchDirections = async () => {
    if (!referenceLocation || coordinates.length === 0) {
      return;
    }
    const waypoints = [
      `${referenceLocation.longitude},${referenceLocation.latitude}`,
      ...coordinates.map(
        (location) => `${location.longitude},${location.latitude}`
      ),
    ];
    const waypointsString = waypoints.join(";");
    try {
      const response = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${waypointsString}?geometries=geojson&access_token=pk.eyJ1Ijoid2FxYXJtdXJ0YXphLW1hcGJveCIsImEiOiJjbHJhczFlbGkwZHY3MmptazQ4b3Zlanp1In0.VNnw53QuZ7xhnA5cYiycXQ`
      );

      const routeCoordinates = response.data.routes[0].geometry.coordinates;
      setRouteCoordinates(routeCoordinates);
    } catch (error) {
      console.error("Error fetching directions", error);
    }
    setToggle(true);
  };

  console.log(coordinates);
  console.log(referenceLocation);

  return (
    <div className="app-wrapper">
      <div className="app-title">
        <h1>MapBox Assignment</h1>
        {!toggle && <input type="file" accept=".csv" onChange={handleFileUpload} />}
      </div>
      {toggle && (
        <ReactMapGL
          mapboxAccessToken="pk.eyJ1Ijoid2FxYXJtdXJ0YXphLW1hcGJveCIsImEiOiJjbHJhczFlbGkwZHY3MmptazQ4b3Zlanp1In0.VNnw53QuZ7xhnA5cYiycXQ"
          style={{
            width: "500px",
            height: "400px",
            borderRadius: "10px",
            border: "2px solid #3FB1CE",
          }}
          initialViewState={{
            longitude: coordinates[0].longitude,
            latitude: coordinates[0].latitude,
            zoom: 9,
          }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
        >
          {toggle &&
            coordinates.map((location, index) => (
              <Marker
                key={index}
                latitude={location.latitude}
                longitude={location.longitude}
                // offsetLeft={-20}
                // offsetTop={-10}
              ></Marker>
            ))}

          {referenceLocation && (
            <div>
              <Popup
                latitude={referenceLocation.latitude}
                longitude={referenceLocation.longitude}
                closeButton={true}
                closeOnClick={true}
                anchor="top"
              >
                <div>Ref Location</div>
              </Popup>
            </div>
          )}

          {routeCoordinates.length > 0 && (
            <Source
              id="route"
              type="geojson"
              data={{
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: routeCoordinates,
                },
              }}
            >
              <Layer
                id="route"
                type="line"
                layout={{
                  "line-join": "round",
                  "line-cap": "round",
                }}
                paint={{
                  "line-color": "#FF0000",
                  "line-width": 5,
                }}
              />
            </Source>
          )}
          <NavigationControl />
          <GeolocateControl />
          <FullscreenControl />
        </ReactMapGL>
      )}
      {toggle && (
        <form onSubmit={handleRef}>
          <input
            style={{ padding: "5px" }}
            type="text"
            placeholder="Enter reference location"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInput(e.target.value)
            }
          />
          <button style={{ padding: "5px" }} type="submit">
            Submit
          </button>
        </form>
      )}
    </div>
  );
};

export default MapBox;

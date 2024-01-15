import React, { FormEvent, useState } from "react";
import Papa from "papaparse";
import ReactMapGL, {
  FullscreenControl,
  GeolocateControl,
  Marker,
  NavigationControl,
  Source, Layer
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";

// interface csvData {
//   data: any[];
// }

interface Coordinates {
  longitude: number;
  latitude: number;
}

const MapBox: React.FC = () => {
  // const [csvData, setCsvData] = useState<csvData | null>(null);
  const [input, setInput] = useState<string>("");
  const [referenceLocation, setReferenceLocation] =
    useState<Coordinates[]>([])
    const [routeCoordinates, setRouteCoordinates] = useState<number[][]>([]);
  // const oldCoordinates = [
  //   { latitude: 37.3541, longitude: -121.9552, label: "Nvidia" },
  //   { latitude: 37.4851, longitude: -122.1483, label: "Meta" },
  //   { latitude: 37.3387, longitude: -121.8853, label: "Adobe" },
  //   { latitude: 37.3346, longitude: -122.009, label: "Apple" },
  //   { latitude: 37.3861, longitude: -122.0839, label: "Google" },
  // ];
  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);
  const [toggle, setToggle] = useState<boolean>(false);

  useEffect(() => {
    // Fetch directions only when referenceLocation and coordinates are available
    if (referenceLocation.length > 0 && coordinates.length > 0) {
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
          // setCsvData({ data: result.data });
          // result.data.map((s)=>{console.log(s.address)})
          result.data.map((loc: any) => {
            const address: string = loc.address;
            const getRequest = async () => {
              try {
                const URI = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                  address
                )}.json?access_token=MapBox_API`;
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
      )}.json?access_token=MapBox_API`;
      const response = await axios.get(URI);
      const [longitude, latitude] = response.data.features[0].center;
      setReferenceLocation([...referenceLocation, { longitude, latitude }]);
    } catch (error) {
      console.error("Error fetching coordinates for reference location", error);
    }
    setToggle(true);
  };

  const fetchDirections = async () => {
    if (!referenceLocation || coordinates.length === 0) {
      return;
    } 

    try {
      const response = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${referenceLocation[0].longitude},${referenceLocation[0].latitude};${coordinates[0].longitude},${coordinates[0].latitude};${coordinates[1].longitude},${coordinates[1].latitude};${coordinates[2].longitude},${coordinates[2].latitude};${coordinates[3].longitude},${coordinates[3].latitude};${coordinates[4].longitude},${coordinates[4].latitude}?geometries=geojson&access_token=MapBox_API`
      );

      // Assuming the API response contains route information
      const routeCoordinates = response.data.routes[0].geometry.coordinates;
      setRouteCoordinates(routeCoordinates);

      // Now, you can use these routeCoordinates to display the route on the map or handle as needed
      console.log('Route Coordinates:', routeCoordinates);
    } catch (error) {
      console.error('Error fetching directions:', error);
    }
    setToggle(true);
  };


  console.log(coordinates);
  console.log(referenceLocation)

  return (
    <div className="app-wrapper">
      <div className="app-title">
        <h1>MapBox Assignment</h1>
        <input type="file" accept=".csv" onChange={handleFileUpload} />
      </div>
      {toggle && (
        <ReactMapGL
          mapboxAccessToken="MapBox_API"
          style={{
            width: "700px",
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
                offsetLeft={-20}
                offsetTop={-10}
              >
                {/* <div style={{ color: 'blue'}}>{location.label}</div> */}
              </Marker>
            ))}

          <NavigationControl />
          <GeolocateControl />
          <FullscreenControl />

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
            </Source>)}
        </ReactMapGL>
      )}
      <form onSubmit={handleRef}>
        <input
          style={{ padding: "5px" }}
          type="text"
          placeholder="Enter reference location"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInput(e.target.value)
          }
        />
      </form>
    </div>
  );
};

export default MapBox;

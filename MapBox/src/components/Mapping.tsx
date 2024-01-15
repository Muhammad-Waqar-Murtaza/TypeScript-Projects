import React from "react";
import { Coordinates } from "./MapGl";
import { Marker } from "react-map-gl";

const Mapping: React.FC<{location: Coordinates, index: number}> = ({location, index}) => {
  return (
    <div>
      <Marker
        key={index}
        latitude={location.latitude}
        longitude={location.longitude}
      ></Marker>
    </div>
  );
};

export default Mapping;

import * as fs from 'fs';
import DUMap from "./DUMap";
import data from "./helios.json";

var map: DUMap = new DUMap(
    document.getElementById("map"),
    document.getElementById("poiList"),
    document.getElementById("poiListFilters"),
    document.getElementById("poiCurrent"),
    JSON.parse(fs.readFileSync('helios.json').toString())
);

export default map;
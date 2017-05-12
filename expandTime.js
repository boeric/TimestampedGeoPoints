// Author: Bo Ericsson, bo@boe.net
// May 10, 2017
"use strict";

const fs = require("fs");
const LatLon = require('geodesy').LatLonEllipsoidal;
const METERS_PER_MILE = 1609.34;

// Defaults
let debug = false;
let lastFirstOnly = false;
let vertexLimit = -1; // -1: no vertex limit, >= 2: vertex limit

// Get command line arguments
if (process.argv.length < 3) {
	console.log("Usage: node expandTime input-file optional-output-file\n");
	process.exit(0);
}

const inputFile = process.argv[2];
const outputFile = process.argv[3] || "stdOut";
let content;
let data;

// Read input file
try {
	content = fs.readFileSync(inputFile, "utf8");
} catch(e) {
	console.log("Could not open file [" + inputFile + "], exiting...\n");
	process.exit(0);
}

try {
	data = JSON.parse(content);
} catch(e) {
	console.log("Could not parse input file, exiting...");
	process.exit(0);
}

// Include only points
const features = data.features;
const points = features.filter(d => {
	return d.geometry.type === "Point"
});
console.log("Geojson total vertex count", points.length)

// Setup for point generation
const timePoints = [];
let timeStamp = 0;
const remaining = {
	time: 0,
	distance: 0
}

// Generate the points
points.length = vertexLimit === -1 ? points.length : vertexLimit; //9;
points.forEach((d, vertexIndex, a) => {
	let lat, lon;

	// Process only Points
	if (d.geometry.type !== "Point") {
		return;
	}
	if ((vertexIndex + 1) === a.length) {
		return;
	}
	if (debug) console.log("\n\npoint" + vertexIndex);

	// Compute base LatLon point
	lon = d.geometry.coordinates[0];
	lat = d.geometry.coordinates[1];
	const p1 = new LatLon(lat, lon);

	// This point
	if (debug) console.log("   this point", d.geometry.coordinates)

	// Get next vertex
	const n = a[vertexIndex + 1];
	if (debug) console.log("   next point", n.geometry.coordinates)

	// Compute next LatLon point
	lon = n.geometry.coordinates[0];
	lat = n.geometry.coordinates[1];
	var p2 = new LatLon(lat, lon);

	// Bearing
	const bearing = p1.initialBearingTo(p2)
	if (debug) console.log("   bearing", bearing)

	// Current speed
	const speed = d.properties.speed || 35;
	if (debug) console.log("   speed", speed);

	if (debug) console.log("   remain.time", remaining.time);
	// Compute the remaining distance from prior vertex
	const startDistance = speed * METERS_PER_MILE * remaining.time / 3600;
	if (debug) console.log("   startDistance", startDistance);

	// Get distance between this point and next point
	const fullDistance = p1.distanceTo(p2);
	if (debug) console.log("   fullDistance", fullDistance);

	// Get effective distance
	const effectiveDistance = fullDistance - startDistance;
	if (debug) console.log("   effectiveDistance", effectiveDistance);

	// Get number of segments
	const oneSecDistance = speed * METERS_PER_MILE / 3600;
	const segmentCount = Math.floor(effectiveDistance / oneSecDistance);
	const usedTime = segmentCount;
	if (debug) console.log("   oneSecDistance", oneSecDistance);
	if (debug) console.log("   segmentCount", segmentCount);

	// Get the remaining distance and time
	remaining.distance = oneSecDistance - (effectiveDistance - (segmentCount * oneSecDistance));
	remaining.time = remaining.distance / oneSecDistance;
	if (debug) console.log("   remaining.distance", remaining.distance);
	if (debug) console.log("   remaining.time", remaining.time);

	// Generate time spaced points
	const segments = [];
	let currDistance = startDistance;
	for (var i = 0; i <= segmentCount; i++) {
		const time = timeStamp + i;
		const point = p1.destinationPoint(currDistance, bearing);

		let generatePoint = lastFirstOnly ? i === 0 || i === segmentCount : true;
		if (generatePoint) timePoints.push(createPoint(point, time, vertexIndex))
		currDistance += oneSecDistance;
	}

	timeStamp += usedTime;
})

// Create a GeoJson point
function createPoint(point, time, segment) {
	const coordinates = [ point.lon, point.lat ]

	return {
		type: "Feature",
		geometry: {
			type: "Point",
			coordinates: coordinates
		},
		properties: {
			time: time,
			segment: segment
		}
	}

}

// Create GeoJson wrapper
var geoJson = {
	type: "FeatureCollection",
	features: timePoints
}

// Format the output
var output = JSON.stringify(geoJson, null, 2);

// Determine output device
if (outputFile === "stdOut") {
	console.log(output);
} else {
	try {
		fs.writeFileSync(outputFile, output, "utf8");
		console.log("Wrote output file [" + outputFile + "] with " + timePoints.length + " timestamped poins");
	} catch(e) {
		console.log("Could not write to output file [" + outputFile + "], exiting...");
	}

}



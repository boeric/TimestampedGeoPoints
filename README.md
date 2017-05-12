# timestamped-geo-points
Expands an array of geo vertices to timestamped geo points. Previously captured verticies indicate geo locations where a geo path is changing direction. For example, a vehicle's path along a road may be captured with a set of verticies, each of which indicate where the vechicle's path is changing direction. The purpose with the `expandTime.js` module is to expand the array of verticies to an array of geo points which are spaced evenly in the time domain, and interpolated properly between the input verticies. One point is generated each second using the current speed (with the default of 35 Mph). Each vertex can have its own speed, which will be maintained for all points generated between the vertex and the following vertex.

#### Input file
The input file must be a valid GeoJson file. In the example below, the first feature of a GeoJson feature collection is shown. This point, here called a vertex, has an optional `speed` value among its properties. If such value is present, the `expandTime.js` module will take it account and properly space the output points

```
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -121.9563121795567,
          37.35941523522688
        ]
      },
      "properties": {
        "id": "1493695500267",
        "speed": 35
      }
    },
```

#### Output file
The output file is a GeoJson file of a Feature collection with the points generated while processing the input GeoJson file. It can be rendered in any tool that accepts GeoJson inputs

#### Command line
```
node expandTime input-file output-file
for example: 
   node expandTime input.json output.json
   node expandTime input.json
```
If the output file is missing, the output GeoJson will be sent to standard output.

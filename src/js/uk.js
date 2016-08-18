/**
 * Created by tom on 15/08/2016.
 */

var uk = require('./data/uk.json');

module.exports = function(divID, width, height) {

    var projection = d3.geoAlbers()
        .center([0, 55.4])
        .rotate([4.4, 0])
        .parallels([50, 60])
        .scale((width * height)/300)
        .translate([width/2, height/2]);

    var path = d3.geoPath()
        .projection(projection);

    var svg = d3.select("#"+divID)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.append("path")
        .datum(topojson.feature(uk, uk.objects.subunits))
        .attr("d", path);

};
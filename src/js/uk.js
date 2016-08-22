/**
 * Created by tom on 15/08/2016.
 */

var uk = require('./data/uk.json');

module.exports = function(svg, width, height) {

    var projection = d3.geoAlbers()
        .center([0, 55.4])
        .rotate([4.4, 0])
        .parallels([50, 60])
        .scale((width * height)/150)
        .translate([width/2, height/2]);

    var path = d3.geoPath()
        .projection(projection);

    svg.append("path")
        .datum(topojson.feature(uk, uk.objects.subunits))
        .attr("d", path);

};
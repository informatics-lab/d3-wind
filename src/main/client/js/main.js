'use strict';

Math.radians = function (degrees) {
    return degrees * Math.PI / 180;
};

var datapoint = require('./datapoint');
var uk = require('./data/uk.json');
// var moObSites = require('./data/mo-datapoint-obs-sites.json');
var moObs = require('./data/mo-datapoint-obs-data-2016-08-26T14Z.json').SiteRep.DV.Location;

const FRAME_RATE = 1000 / 4;
const TRANSFORM_MAGNITUDE = 1 / 4;
const AREA_OF_INFLUENCE = 100;
const PARTICLE_AGE = 100;
const PARTICLE_DECAY_RATE_PER_FRAME = 10;
const NUM_PARTICLES = 2000;
const MAX_SPEED = 20;
var width;
var height;

const WIND_DIRECTIONS = d3.map()
    .set("N", Math.radians(180))
    .set("NNE", Math.radians(202.5))
    .set("NE", Math.radians(225))
    .set("ENE", Math.radians(247.5))
    .set("E", Math.radians(270))
    .set("ESE", Math.radians(292.5))
    .set("SE", Math.radians(315))
    .set("SSE", Math.radians(337.5))
    .set("S", Math.radians(0))
    .set("SSW", Math.radians(22.5))
    .set("SW", Math.radians(45))
    .set("WSW", Math.radians(67.5))
    .set("W", Math.radians(90))
    .set("WNW", Math.radians(112.5))
    .set("NW", Math.radians(135))
    .set("NNW", Math.radians(157.5));

var svg;
var obsSites = [];
var transforms = [];
var particles = [];

getData();

function getData() {
    width = window.innerWidth / 2;
    height = window.innerHeight;

    console.log("width/height : ", width, height, width * height);

    datapoint.getCannedAvailableTimesteps()
        .then(function (data) {
            var timesteps = data.Resource.TimeSteps.TS;
            var latest = datapoint.getTimeStepFromISO8601(timesteps[timesteps.length - 1]);
            return datapoint.getCannedObservationsForTimestep(latest);
        })
        .then(function (data) {
            console.log(data);
            var moObs = data.SiteRep.DV.Location;
            init(moObs);
        })
        .catch(function (error) {
            console.log("ERROR", error);
        });
}

function init(obsData) {
    /*
     * converts MO weird JSON format to GeoJSON
     */
    obsSites = obsData.filter(function (moOb) {
        var speed = moOb.Period.Rep.S;
        var direction = moOb.Period.Rep.D;
        var lat = moOb.lat;
        var lon = moOb.lon;
        var name = moOb.name;
        if (!name || !lon || !lat || !direction || !speed) {
            return false;
        }
        return true;
    }).map(function (moOb) {
        var speed = moOb.Period.Rep.S;
        var direction = WIND_DIRECTIONS.get(moOb.Period.Rep.D);
        var transform = new Vector2D(speed * Math.sin(direction), -1 * (speed * Math.cos(direction)));
        return {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [moOb.lon, moOb.lat]
            },
            properties: {
                name: moOb.name,
                direction_compass: moOb.Period.Rep.D,
                direction: direction,
                speed: speed,
                transform: transform
            }
        }
    });

//init particles
    particles = d3.range(NUM_PARTICLES).map(function () {
        var p = new Particle();
        p.spawn();
        return p;
    });

    svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height);

//set up a geo projection function
    var projection = d3.geoAlbers()
        .center([0, 54.4])
        .rotate([4.4, 0])
        .parallels([50, 60])
        .scale((width * height) / 100)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection)
        .pointRadius(2);

    svg.append("path")
        .datum(topojson.feature(uk, uk.objects.subunits))
        .attr("d", path)
        .attr("class", "uk");

    svg.selectAll(".site")
        .data(obsSites)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "site")
        .each(function (data) {
            var centroid = path.centroid(data);
            data.properties.position = new Vector2D(Math.floor(centroid[0]), Math.floor(centroid[1]));
        })
        .on('mouseover', function (d) {
            console.log(d);
            // console.log(transforms[d.properties.position.y][d.properties.position.x])
        });

    calculateTransforms();

    /* draw calculated transforms */
//     svg.selectAll(".transform-row")
//         .data(transforms)
//         .enter()
//         .selectAll(".transform")
//         .data(function(d,transformRow) {
//             d.forEach(function (e){
//                 e.transformRow=transformRow;
//             });
//             return d;
//         })
//         .enter()
//         .append("rect")
//         .attr("class", "transform")
//         .attr("x", function(d,x) {
//             return x;
//         })
//         .attr("y", function(d){
//             return d.transformRow;
//         })
//         .attr("width", 1)
//         .attr("height", 1)
//         .attr("opacity", 0.2)
//         .style("fill", function(d){
//             if(d && !(d.x === 0 && d.y === 0)) {
//                 return "green"
//             } else {
//                 return "red";
//             }
//         }).on('mouseover', function (d) {
//                 console.log(d);
// }           );

// draw the initial particles to screen
    svg.selectAll(".particle")
        .data(particles)
        .enter()
        .append("circle")
        .attr("class", "particle")
        .attr("cx", function (d) {
            return d.position.x;
        })
        .attr("cy", function (d) {
            return d.position.y;
        })
        .attr("r", 2);

    animate();
}

/**
 * Animation loop called as per the FRAME_RATE setting
 * @returns {number}
 */
function animate() {
    return setInterval(function () {

        svg.selectAll(".particle")
            .data(particles)
            .each(function (d) {
                d.step();
            })
            .transition()
            .duration(FRAME_RATE)
            .ease(d3.easeLinear)
            .attr("cx", function (d) {
                return d.position.x;
            })
            .attr("cy", function (d) {
                return d.position.y;
            })
            .attr("opacity", function (d) {
                if (d.isInBounds()
                    && d.age < PARTICLE_AGE - PARTICLE_DECAY_RATE_PER_FRAME
                    && d.age > 0 + PARTICLE_DECAY_RATE_PER_FRAME) {
                    return d.age / PARTICLE_AGE;
                }
                return 0;

            })
            .style("fill", function (d) {
                return d3.interpolateViridis(d.speed / (MAX_SPEED / 2));
            })
            .attr("r", function (d) {
                return d.speed + 1;
            });

    }, FRAME_RATE);
}

/**
 * loops through all pixel positions in current svg graphic and calculates each unique vector transform
 * for the given location
 */
function calculateTransforms() {
    var t1 = d3.now();
    console.log("calculating pixel transforms...");

    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var pixel = new Vector2D(x, y);
            if (!transforms[y]) {
                transforms[y] = [];
            }
            transforms[y][x] = getTransform(pixel);
        }
    }
    var t2 = new Date().getTime();
    console.log(transforms.length * transforms[0].length + ' pixel transforms calculated in ' + (t2 - t1));

}

/**
 * For a given vector in screen space get its unique transform based upon the observed values at its
 * nearest neighbour sites
 * @param vector2D - location in screen space
 * @returns {{x: number, y: number}}
 */
function getTransform(vector2D) {
    var transform = {x: 0, y: 0};
    var sumComparisons = 0;
    var nns = [];
    obsSites.forEach(function (obSite) {
        var dist = obSite.properties.position.distanceFrom(vector2D);
        if (dist < AREA_OF_INFLUENCE) {
            var comparison = 1 - normalise(0, AREA_OF_INFLUENCE, dist).toFixed(5);
            if (comparison > 0) {
                sumComparisons += parseFloat(comparison);
                nns.push({comparison: comparison, obSite: obSite})
            }
        }
    });
    if (nns.length > 0) {
        transform = nns.map(function (a) {
            var weight = a.comparison / sumComparisons;
            return {
                x: weight * a.obSite.properties.transform.x,
                y: weight * a.obSite.properties.transform.y
            };
        }).reduce(function (a, b) {
            return {
                x: Math.floor(a.x + b.x),
                y: Math.floor(a.y + b.y)
            };
        });
    }
    return transform;
};


/**
 * Convert a value in a given range into a value between 1 and 0
 * @param min - the minimum value of the current range
 * @param max - the maximum value of the current range
 * @param value - the value within the current range
 * @returns {number} normalised valued
 */
function normalise(min, max, value) {
    //Convert the range into a 0-1 range (float)
    var a = value - min;
    var b = max - min;
    if (b == 0) {
        return 1;
    } else {
        var c = a / b;
        return c;
    }
}

/*
 * HELPER CLASSES
 */
function Vector2D(x, y) {
    var self = this;
    self.x = x;
    self.y = y;
    self.distanceFrom = function (other) {
        return Math.sqrt(Math.pow(other.x - self.x, 2) + Math.pow(other.y - self.y, 2)).toFixed(5);
    }
}

function Particle() {
    var self = this;
    self.previousPosition = null;
    self.position = null;
    self.age = null;
    self.decayRate = null;
    self.speed = null;
    self.spawn = function () {
        self.age = PARTICLE_AGE;
        self.decayRate = Math.floor(Math.random() * (PARTICLE_DECAY_RATE_PER_FRAME - PARTICLE_DECAY_RATE_PER_FRAME / 2)) + PARTICLE_DECAY_RATE_PER_FRAME / 2;
        self.position = new Vector2D(Math.floor(Math.random() * width)
            , Math.floor(Math.random() * height));
        self.previousPosition = null;
    };
    self.step = function () {
        self.age = self.age - self.decayRate;
        if (self.age < 0) {
            self.spawn();
            return;
        }
        if (self.isInBounds()) {
            self.previousPosition = self.position;

            var transform = transforms[self.previousPosition.y][self.previousPosition.x];
            // if (!transform) {
            //     // console.log("calculating");
            //     transform = getTransform(self.position);
            //     transforms[self.position.y][self.position.x] = transform;
            // }
            self.position = new Vector2D(self.previousPosition.x + Math.floor(transform.x * TRANSFORM_MAGNITUDE),
                self.previousPosition.y + Math.floor(transform.y * TRANSFORM_MAGNITUDE));
            self.speed = self.previousPosition.distanceFrom(self.position);
            if (self.speed == 0) {
                self.age = -5;
                return;
            }
            return;
        } else {
            self.age = -5;
            return;
        }
    };
    self.isInBounds = function () {
        if (self.position.x >= 0
            && self.position.x < width
            && self.position.y >= 0
            && self.position.y < height) {
            return true;
        }
        return false;
    };
}



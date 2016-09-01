'use strict';

/*
 * I know this key is public but Jacob said it was OK!
 */
const DATAPOINT_API_KEY = "eea8d376-a00a-4443-bce1-ed02fb4656bc";

var cannedObsTimesteps = require('./obs-timesteps');
var cannedObs = require('./obs');

function makeGetRequest(url) {
    return new Promise(function(resolve, reject) {
        var req = new XMLHttpRequest();
        req.addEventListener("load", function(evt) {
            if(req.status == 200) {
                resolve(JSON.parse(req.responseText));
            } else {
                reject(req);
            }
        });
        req.addEventListener("error", function(evt){
            reject(req);
        });
        req.open("GET", url);
        req.send();
    });
}

module.exports = {

    getAvailableTimesteps : function() {
        return makeGetRequest("http://datapoint.metoffice.gov.uk/public/data/val/wxobs/all/json/capabilities?res=hourly&key="+DATAPOINT_API_KEY);
    },

    getCannedAvailableTimesteps : function() {
        return new Promise(function(resolve,reject){
           resolve(cannedObsTimesteps);
        });
    },

    getObservationsForTimestep: function(timestep) {
        return makeGetRequest("http://datapoint.metoffice.gov.uk/public/data/val/wxobs/all/json/all?res=hourly&time="+timestep+"&key="+DATAPOINT_API_KEY);
    },

    getCannedObservationsForTimestep: function(timestep) {
        return new Promise(function(resolve,reject){
           resolve(cannedObs);
        });
    },

    getTimeStepFromISO8601 : function(ISO8601) {
        return ISO8601.slice(0, -7) + "Z";
    }

};
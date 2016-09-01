package uk.co.informaticslab.services;

import org.geojson.Feature;
import org.geojson.FeatureCollection;
import org.geojson.Point;
import uk.co.informaticslab.domain.CoordIndexedVector;
import uk.co.informaticslab.domain.DoubleVector2D;
import uk.co.informaticslab.domain.IntegerVector2D;
import uk.co.informaticslab.domain.Vectorizable;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Created by tom on 26/08/2016.
 */
public class GeoJSONVectorizationService implements VectorizationService<FeatureCollection> {

    private static final Integer AREA_OF_INFLUENCE = 100;

    @Override
    public FeatureCollection vectorize(Vectorizable vectorizable) {

        Integer y = vectorizable.getExtent().getMax().getY() - vectorizable.getExtent().getMin().getY();
        Integer x = vectorizable.getExtent().getMax().getX() - vectorizable.getExtent().getMin().getX();

        List<Feature> features = new ArrayList<>();

        for (int i = 0; i < y; i++) {
            for (int j = 0; j < x; j++) {
                features.add(calcVectorForCoord(new IntegerVector2D(j,i), vectorizable.getCoordIndexedVectors()));
            }
        }

        FeatureCollection fc = new FeatureCollection();
        fc.setFeatures(features);

        return fc;
    }

    public Feature calcVectorForCoord(IntegerVector2D coord, List<CoordIndexedVector> coordIndexedVectors) {

        Double sumComparisons = 0d;
        Map<Double,CoordIndexedVector> nearestNeighbours = new HashMap<>();

        coordIndexedVectors.stream().forEach(civ -> {
            Double distance = civ.getCoord().getDistanceFromVector2D(coord);
            if(distance < AREA_OF_INFLUENCE) {
                nearestNeighbours.put(distance,civ);
            }
        });

        coordIndexedVectors.stream()
                .collect(Collectors.toMap(civ -> civ.getCoord().getDistanceFromVector2D(coord)))

        if(!nearestNeighbours.isEmpty()) {
            DoubleVector2D dv = nearestNeighbours.entrySet().stream()
                    .map(nn -> nearestNeighbourToWeightedDoubleVector(nn.getKey(), sumComparisons, nn.getValue().getVector()))
                    .reduce(new DoubleVector2D(0d, 0d), (dv1, dv2) -> new DoubleVector2D(dv1.getX() + dv2.getX(), dv1.getY() + dv2.getY()));

            Feature f = new Feature();
            f.setGeometry(new Point(coord.getX(), coord.getY()));
            f.setProperty("vector", dv);

            return f;

    }

    public DoubleVector2D nearestNeighbourToWeightedDoubleVector(Double comparison, Double sumComparisons, IntegerVector2D vector){
        Double weight = comparison / sumComparisons;
        return new DoubleVector2D(weight * vector.getX(), weight * vector.getY());
    }

//
//    function getTransform(vector2D) {
//        var transform = {x: 0, y: 0};
//        var sumComparisons = 0;
//        var nns = [];
//        obsSites.forEach(function (obSite) {
//            var dist = obSite.properties.position.distanceFrom(vector2D);
//            if (dist < AREA_OF_INFLUENCE) {
//                var comparison = 1 - normalise(0, AREA_OF_INFLUENCE, dist).toFixed(5);
//                if (comparison > 0) {
//                    sumComparisons += parseFloat(comparison);
//                    nns.push({comparison: comparison, obSite: obSite})
//                }
//            }
//        });
//        if (nns.length > 0) {
//            transform = nns.map(function (a) {
//                var weight = a.comparison / sumComparisons;
//                return {
//                        x: weight * a.obSite.properties.transform.x,
//                        y: weight * a.obSite.properties.transform.y
//                };
//            }).reduce(function (a, b) {
//                return {
//                        x: Math.floor(a.x + b.x),
//                        y: Math.floor(a.y + b.y)
//                };
//            });
//        }
//        return transform;
//    };
}

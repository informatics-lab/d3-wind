package uk.co.informaticslab.domain;


import org.geojson.Feature;
import org.geojson.Point;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;

/**
 * Created by tom on 02/09/2016.
 */
public class CallableFeature implements Callable<Feature> {

    private static final Double AREA_OF_INFLUENCE = 100d;

    private final IntegerVector2D coord;
    private final List<CoordIndexedVector> coordIndexedVectors;

    public CallableFeature(IntegerVector2D coord, List<CoordIndexedVector> coordIndexedVectors) {
        this.coord = coord;
        this.coordIndexedVectors = coordIndexedVectors;
    }

    @Override
    public Feature call() throws Exception {
        DoubleVector2D dv;
        Map<Double, CoordIndexedVector> comparisonMap = new HashMap<>();

        coordIndexedVectors.stream().forEach(civ -> {
            Double dist = civ.getCoord().getDistanceFromVector2D(coord);
            if (dist < AREA_OF_INFLUENCE) {
                Double comparison = 1d - normalize(0d, AREA_OF_INFLUENCE, dist);
                comparisonMap.put(comparison, civ);
            }
        });

        if (!comparisonMap.isEmpty()) {
            Double sumComparisons = comparisonMap.keySet().stream().reduce(0d, Double::sum);
            dv = comparisonMap.entrySet().stream().map(nn -> nearestNeighbourToWeightedDoubleVector(nn.getKey(), sumComparisons, nn.getValue().getVector()))
                    .reduce(new DoubleVector2D(0d, 0d), (dv1, dv2) -> new DoubleVector2D(dv1.getX() + dv2.getX(), dv1.getY() + dv2.getY()));

        } else {
            dv = new DoubleVector2D(0d, 0d);
        }

        Feature f = new Feature();
        f.setGeometry(new Point(coord.getX(), coord.getY()));
        f.setProperty("vector", dv);
        return f;
    }

    public static DoubleVector2D nearestNeighbourToWeightedDoubleVector(Double comparison, Double sumComparisons, IntegerVector2D vector) {
        Double weight = comparison / sumComparisons;
        return new DoubleVector2D(weight * vector.getX(), weight * vector.getY());
    }

    public static Double normalize(Double min, Double max, Double value) {
        Double a = value - min;
        Double b = max - min;
        return a / b;
    }
}

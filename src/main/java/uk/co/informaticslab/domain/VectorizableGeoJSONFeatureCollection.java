package uk.co.informaticslab.domain;

import org.geojson.Feature;
import org.geojson.FeatureCollection;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Created by tom on 26/08/2016.
 */
public class VectorizableGeoJSONFeatureCollection implements Vectorizable {

    private final VectorizationExtent extent;
    private final List<CoordIndexedVector> coordIndexedVectors;

    public VectorizableGeoJSONFeatureCollection(FeatureCollection fc) {
        this.extent = new VectorizationExtent(fc.getBbox());
        this.coordIndexedVectors = fc.getFeatures()
                .parallelStream()
                .map(f -> featureToCoordIndexedVector(f))
                .collect(Collectors.toList());
    }

    @Override
    public VectorizationExtent getExtent() {
        return extent;
    }

    @Override
    public List<CoordIndexedVector> getCoordIndexedVectors() {
        return coordIndexedVectors;
    }

    public static CoordIndexedVector featureToCoordIndexedVector(Feature feature) {
        feature.getGeometry().toString();
        feature.getProperties().get("vector");
        return null;
    }
}

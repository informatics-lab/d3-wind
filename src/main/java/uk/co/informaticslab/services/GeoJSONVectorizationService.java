package uk.co.informaticslab.services;

import org.geojson.Feature;
import org.geojson.FeatureCollection;
import uk.co.informaticslab.domain.CoordIndexedVector;
import uk.co.informaticslab.domain.Vector2D;
import uk.co.informaticslab.domain.Vectorizable;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Created by tom on 26/08/2016.
 */
public class GeoJSONVectorizationService implements VectorizationService<FeatureCollection> {

    @Override
    public FeatureCollection vectorize(Vectorizable vectorizable) {

        List<CoordIndexedVector> vectors = IntStream.rangeClosed(vectorizable.getExtent().getMin().getY(),
                                vectorizable.getExtent().getMax().getY())
                .parallel()
                .mapToObj(y -> IntStream.rangeClosed(vectorizable.getExtent().getMin().getX(),
                                                    vectorizable.getExtent().getMax().getX())
                        .parallel()
                        .mapToObj(x -> new Vector2D(x,y))
                        .map(v -> getTransform(v, vectorizable.getCoordIndexedVectors())).collect()).collect();

        return null;

    }

    private static CoordIndexedVector getTransform(Vector2D v, List<CoordIndexedVector> coordIndexedVectors) {
        return null;
    }
}

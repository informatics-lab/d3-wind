package uk.co.informaticslab.services;

import org.geojson.Feature;
import org.geojson.FeatureCollection;
import org.springframework.stereotype.Component;
import uk.co.informaticslab.domain.CallableFeature;
import uk.co.informaticslab.domain.IntegerVector2D;
import uk.co.informaticslab.domain.Vectorizable;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Component
public class GeoJSONVectorizationService implements VectorizationService<FeatureCollection> {

    @Override
    public FeatureCollection vectorize(Vectorizable vectorizable) {

        ExecutorService executorService = Executors.newWorkStealingPool();

        Integer y = vectorizable.getExtent().getMax().getY() - vectorizable.getExtent().getMin().getY();
        Integer x = vectorizable.getExtent().getMax().getX() - vectorizable.getExtent().getMin().getX();

        List<Callable<Feature>> callableList = new ArrayList<>();

        for (int i = 0; i < y; i++) {
            for (int j = 0; j < x; j++) {
                Callable<Feature> callable = new CallableFeature(new IntegerVector2D(j, i), vectorizable.getCoordIndexedVectors());
                callableList.add(callable);
            }
        }

        try {
            FeatureCollection fc = new FeatureCollection();
            fc.setBbox(new double[]{
                    vectorizable.getExtent().getMin().getX(),
                    vectorizable.getExtent().getMin().getY(),
                    vectorizable.getExtent().getMax().getX(),
                    vectorizable.getExtent().getMax().getY()
            });
            fc.setFeatures(executorService.invokeAll(callableList)
                    .stream()
                    .map(future -> {
                        try {
                            return future.get();
                        } catch (Exception e) {
                            throw new IllegalStateException(e);
                        }
                    })
                    .collect(Collectors.toList()));
            return fc;
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            executorService.shutdown();
        }

    }

}

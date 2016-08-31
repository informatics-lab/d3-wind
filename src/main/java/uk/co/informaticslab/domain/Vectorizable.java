package uk.co.informaticslab.domain;

import java.util.List;

/**
 * Created by tom on 26/08/2016.
 */
public interface Vectorizable {

    VectorizationExtent getExtent();

    List<CoordIndexedVector> getCoordIndexedVectors();

}

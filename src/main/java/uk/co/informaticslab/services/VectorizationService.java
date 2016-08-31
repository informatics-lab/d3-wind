package uk.co.informaticslab.services;

import uk.co.informaticslab.domain.Vectorizable;

/**
 * Created by tom on 26/08/2016.
 */
public interface VectorizationService<T> {

    T vectorize(Vectorizable vectorizable);

}

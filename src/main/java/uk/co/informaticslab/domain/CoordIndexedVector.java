package uk.co.informaticslab.domain;

/**
 * Created by tom on 26/08/2016.
 */
public class CoordIndexedVector {

    private final IntegerVector2D coord;
    private final IntegerVector2D vector;

    public CoordIndexedVector(IntegerVector2D coord, IntegerVector2D vector) {
        this.coord = coord;
        this.vector = vector;
    }

    public IntegerVector2D getCoord() {
        return coord;
    }

    public IntegerVector2D getVector() {
        return vector;
    }
}


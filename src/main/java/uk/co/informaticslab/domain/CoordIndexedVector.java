package uk.co.informaticslab.domain;

/**
 * Created by tom on 26/08/2016.
 */
public class CoordIndexedVector {

    private final Vector2D coord;
    private final Vector2D vector;

    public CoordIndexedVector(Vector2D coord, Vector2D vector) {
        this.coord = coord;
        this.vector = vector;
    }

    public Vector2D getCoord() {
        return coord;
    }

    public Vector2D getVector() {
        return vector;
    }
}


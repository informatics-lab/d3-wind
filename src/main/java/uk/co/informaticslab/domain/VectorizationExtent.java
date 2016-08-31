package uk.co.informaticslab.domain;

/**
 * Created by tom on 26/08/2016.
 */
public class VectorizationExtent {

    private final Vector2D min;
    private final Vector2D max;

    public VectorizationExtent(double[] extent) {
        this(new Vector2D(new Double(extent[0]).intValue() ,new Double(extent[1]).intValue()),
                new Vector2D(new Double(extent[2]).intValue(), new Double(extent[3]).intValue()));
    }

    public VectorizationExtent(Vector2D min, Vector2D max) {
        this.min = min;
        this.max = max;
    }

    public Vector2D getMin() {
        return min;
    }

    public Vector2D getMax() {
        return max;
    }

}

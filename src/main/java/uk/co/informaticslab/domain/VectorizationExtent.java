package uk.co.informaticslab.domain;

/**
 * Created by tom on 26/08/2016.
 */
public class VectorizationExtent {

    private final IntegerVector2D min;
    private final IntegerVector2D max;

    public VectorizationExtent(double[] extent) {
        this(new IntegerVector2D(new Double(extent[0]).intValue() ,new Double(extent[1]).intValue()),
                new IntegerVector2D(new Double(extent[2]).intValue(), new Double(extent[3]).intValue()));
    }

    public VectorizationExtent(IntegerVector2D min, IntegerVector2D max) {
        this.min = min;
        this.max = max;
    }

    public IntegerVector2D getMin() {
        return min;
    }

    public IntegerVector2D getMax() {
        return max;
    }

}

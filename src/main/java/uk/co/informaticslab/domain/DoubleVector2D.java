package uk.co.informaticslab.domain;

/**
 * Created by tom on 01/09/2016.
 */
public class DoubleVector2D implements Vector2D<Double> {

    private final Double x;
    private final Double y;

    public DoubleVector2D(Double x, Double y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public Double getX() {
        return x;
    }

    @Override
    public Double getY() {
        return y;
    }
}

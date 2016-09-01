package uk.co.informaticslab.domain;

import java.util.stream.IntStream;

/**
 * Created by tom on 26/08/2016.
 */
public class Text {

    private static final Integer RANGE = 2000;

    public static void main(String[] args) {

        //parallel streams
        long t1 = System.currentTimeMillis();
        IntStream.rangeClosed(0, RANGE)
                .parallel()
                .forEach(y -> IntStream.rangeClosed(0, RANGE)
                        .parallel()
                        .forEach(x -> System.out.println(y + "," + x)));
        long t2 = System.currentTimeMillis();

        //sequential streams
        long t5 = System.currentTimeMillis();
        IntStream.rangeClosed(0, RANGE)
                .forEach(y -> IntStream.rangeClosed(0, RANGE)
                        .forEach(x -> System.out.println(y + "," + x)));
        long t6 = System.currentTimeMillis();

        //stardard way
        long t3 = System.currentTimeMillis();
        for (int i = 0; i <= RANGE; i++) {
            for (int j = 0; j <= RANGE; j++) {
                System.out.println(i + "," + j);
            }
        }
        long t4 = System.currentTimeMillis();

        System.out.println("--------------------------------");
        System.out.println("Parallel Streams Time: " + (t2 - t1));
        System.out.println("Sequential Streams Time: " + (t6 - t5));
        System.out.println("Standard Time: " + (t4 - t3));
    }

}

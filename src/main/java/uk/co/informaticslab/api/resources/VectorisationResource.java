package uk.co.informaticslab.api.resources;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.geojson.FeatureCollection;
import org.springframework.beans.factory.annotation.Autowired;
import uk.co.informaticslab.domain.VectorizableGeoJSONFeatureCollection;
import uk.co.informaticslab.services.GeoJSONVectorizationService;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;

@Path("vectorize/")
public class VectorisationResource {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final GeoJSONVectorizationService service;

    @Autowired
    public VectorisationResource(GeoJSONVectorizationService service) {
        this.service = service;
    }

    /**
     * Takes a GeoJSON feature collection with bbox and features
     *
     * @return GeoJSON feature collection.
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response vectorize(InputStream geoJsonFeatureCollection) {

        StringBuilder sb = new StringBuilder();
        try {
            BufferedReader in = new BufferedReader(new InputStreamReader(geoJsonFeatureCollection));

            String line = null;
            while ((line = in.readLine()) != null) {
                sb.append(line);
            }
            FeatureCollection fc = MAPPER.readValue(sb.toString(), FeatureCollection.class);
            VectorizableGeoJSONFeatureCollection vfc = new VectorizableGeoJSONFeatureCollection(fc);
            FeatureCollection vectorizedFc = service.vectorize(vfc);
            return Response.ok(MAPPER.writeValueAsString(vectorizedFc)).build();

        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .build();
        }

    }

}

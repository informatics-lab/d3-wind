package uk.co.informaticslab.api.resources;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.core.Response;

/**
 * Root Resource
 */
@Path("/")
public class RootResource {

    @GET
    public Response get() {
        return Response.ok("vectorisation service").build();
    }

}

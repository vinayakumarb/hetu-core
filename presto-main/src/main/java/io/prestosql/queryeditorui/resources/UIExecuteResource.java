/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.prestosql.queryeditorui.resources;

import com.google.common.collect.ImmutableList;
import com.google.inject.Inject;
import io.prestosql.queryeditorui.execution.ExecutionClient;
import io.prestosql.queryeditorui.protocol.ExecutionRequest;
import io.prestosql.queryeditorui.protocol.ExecutionStatus.ExecutionError;
import io.prestosql.queryeditorui.protocol.ExecutionStatus.ExecutionSuccess;
import org.joda.time.Duration;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Path("/api/")
public class UIExecuteResource
{
    private ExecutionClient client;

    @Inject
    public UIExecuteResource(ExecutionClient client)
    {
        this.client = client;
    }

    @PUT
    @Path("execute")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response execute(ExecutionRequest request,
                            @Context HttpServletRequest servletRequest,
                            @Context UriInfo uri)
    {
        String user = "lk";
        if (user != null) {
            final List<UUID> uuids = client.runQuery(
                    request,
                    user,
                    Duration.standardMinutes(15),
                    servletRequest);

            List<ExecutionSuccess> successList = uuids.stream().map(ExecutionSuccess::new).collect(Collectors.toList());
            return Response.ok(successList).build();
        }
        return Response.status(Response.Status.NOT_FOUND)
                .entity(new ExecutionError("Currently not able to execute"))
                .build();
    }

    @DELETE
    @Path("queries/{uuid}")
    public Response cancelQuery(@PathParam("uuid") UUID uuid)
    {
        String user = "lk";
        boolean success = client.cancelQuery(user, uuid);
        if (success) {
            return Response.ok(ImmutableList.of()).build();
        }
        else {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
    }
}

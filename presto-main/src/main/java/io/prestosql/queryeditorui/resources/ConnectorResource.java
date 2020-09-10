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

import com.google.inject.Inject;
import io.prestosql.queryeditorui.protocol.Connector;
import io.prestosql.queryeditorui.store.connectors.ConnectorCache;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import java.util.List;

@Path("/api/connectors")
public class ConnectorResource
{
    private final ConnectorCache connectorCache;

    @Inject
    public ConnectorResource(ConnectorCache connectorCache)
    {
        this.connectorCache = connectorCache;
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getConnectors()
    {
        List<Connector> lk = connectorCache.getConnectors("lk");
        return Response.ok(lk).build();
    }
}

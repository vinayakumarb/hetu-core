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
package io.prestosql.queryeditorui.resources.sse;

import com.google.common.eventbus.EventBus;
import com.google.inject.Inject;
import com.google.inject.name.Named;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.sse.Sse;
import javax.ws.rs.sse.SseBroadcaster;
import javax.ws.rs.sse.SseEventSink;

import java.util.concurrent.ExecutorService;

@Path("/api/updates/subscribe")
public class JobUpdatesSSEResource
{
    private final JobUpdateToSSERelay jobUpdateToSSERelay;
    private volatile SseBroadcaster broadcaster;

    @Inject
    public JobUpdatesSSEResource(EventBus eventBus,
                                 @Named("event-bus-executor") ExecutorService executorService)
    {
        this.jobUpdateToSSERelay = new JobUpdateToSSERelay(executorService);
        eventBus.register(jobUpdateToSSERelay);
    }

    @GET
    @Produces("text/event-stream; charset=UTF-8")
    public void subscribe(@Context SseEventSink sseEventSink,
                          @Context Sse sse,
                          @Context HttpServletRequest request,
                          @Context HttpServletResponse response)
    {
        if (broadcaster == null) {
            broadcaster = sse.newBroadcaster();
        }
        jobUpdateToSSERelay.setBroadcaster(broadcaster, sse);
        broadcaster.register(sseEventSink);
    }
}

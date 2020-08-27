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

import com.google.common.eventbus.Subscribe;
import com.google.common.util.concurrent.RateLimiter;
import io.prestosql.queryeditorui.event.JobEvent;
import io.prestosql.queryeditorui.event.JobFinishedEvent;
import io.prestosql.queryeditorui.event.JobUpdateEvent;

import javax.ws.rs.core.MediaType;
import javax.ws.rs.sse.OutboundSseEvent;
import javax.ws.rs.sse.OutboundSseEvent.Builder;
import javax.ws.rs.sse.Sse;
import javax.ws.rs.sse.SseBroadcaster;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.atomic.AtomicLong;

import static java.util.Objects.requireNonNull;

public class JobUpdateToSSERelay
{
    private final RateLimiter updateLimiter = RateLimiter.create(15.0);
    private SseBroadcaster broadcaster;
    private Builder eventBuilder;
    private final AtomicLong lastEventId = new AtomicLong(-1);
    private final ExecutorService executorService;

    public JobUpdateToSSERelay(ExecutorService executorService)
    {
        this.executorService = requireNonNull(executorService, "executorService was null");
    }

    public void setBroadcaster(SseBroadcaster broadcaster, Sse sse)
    {
        if (this.broadcaster == null) {
            this.broadcaster = broadcaster;
            this.eventBuilder = sse.newEventBuilder();
        }
    }

    private void broadcast(JobEvent message)
    {
        if (broadcaster != null && message != null) {
            executorService.submit(() -> {
                OutboundSseEvent sseEvent = eventBuilder
                        .id(String.valueOf(lastEventId.incrementAndGet()))
                        .mediaType(MediaType.APPLICATION_JSON_TYPE)
                        .data(JobEvent.class, message)
                        .build();
                broadcaster.broadcast(sseEvent);
            });
        }
    }

    @Subscribe
    public void receiveJobUpdate(JobUpdateEvent event)
    {
        if (updateLimiter.tryAcquire()) {
            broadcast(event);
        }
    }

    @Subscribe
    public void receiveJobFinished(JobFinishedEvent event)
    {
        broadcast(event);
    }
}

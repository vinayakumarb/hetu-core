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
package io.prestosql.queryeditorui.execution;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.common.net.MediaType;
import io.airlift.http.client.FullJsonResponseHandler;
import io.airlift.http.client.HttpClient;
import io.airlift.http.client.HttpStatus;
import io.airlift.http.client.Request;
import io.airlift.json.JsonCodec;
import io.prestosql.execution.Input;
import io.prestosql.execution.QueryStats;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.util.Set;

import static com.google.common.base.MoreObjects.firstNonNull;
import static com.google.common.net.HttpHeaders.ACCEPT;
import static com.google.common.net.HttpHeaders.USER_AGENT;
import static io.airlift.http.client.FullJsonResponseHandler.createFullJsonResponseHandler;
import static io.airlift.http.client.Request.Builder.prepareGet;
import static java.util.Objects.requireNonNull;

public class QueryInfoClient
{
    private static final Logger LOG = LoggerFactory.getLogger(QueryInfoClient.class);

    private static final String USER_AGENT_VALUE = QueryInfoClient.class.getSimpleName() +
            "/" +
            firstNonNull(QueryInfoClient.class.getPackage().getImplementationVersion(), "unknown");

    private final HttpClient httpClient;
    private final FullJsonResponseHandler<BasicQueryInfo> queryInfoHandler;

    public QueryInfoClient(HttpClient httpClient, JsonCodec<BasicQueryInfo> queryInfoCodec)
    {
        this.httpClient = httpClient;
        this.queryInfoHandler = createFullJsonResponseHandler(queryInfoCodec);
    }

    public BasicQueryInfo from(URI infoUri, String id)
    {
        infoUri = requireNonNull(infoUri, "infoUri is null");

        infoUri = URI.create(infoUri.getScheme() + "://" + infoUri.getAuthority() + "/v1/query/" + id);

        Request request = prepareGet()
                .setHeader(USER_AGENT, USER_AGENT_VALUE)
                .setHeader(ACCEPT, MediaType.JSON_UTF_8.toString())
                .setUri(infoUri)
                .build();

        FullJsonResponseHandler.JsonResponse<BasicQueryInfo> response;
        try {
            response = httpClient.execute(request, queryInfoHandler);
            if (response.getStatusCode() == HttpStatus.OK.code() && response.hasValue()) {
                return response.getValue();
            }
        }
        catch (RuntimeException e) {
            LOG.error("Caught error in QueryInfoClient load", e);
        }

        return null;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BasicQueryInfo
    {
        private final QueryStats queryStats;
        private final Set<Input> inputs;

        @JsonCreator
        public BasicQueryInfo(
                @JsonProperty("queryStats") QueryStats queryStats,
                @JsonProperty("inputs") Set<Input> inputs)
        {
            this.queryStats = queryStats;
            this.inputs = inputs;
        }

        @JsonProperty
        public QueryStats getQueryStats()
        {
            return queryStats;
        }

        @JsonProperty
        public Set<Input> getInputs()
        {
            return inputs;
        }
    }
}

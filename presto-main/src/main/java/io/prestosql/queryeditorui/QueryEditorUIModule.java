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
package io.prestosql.queryeditorui;

import com.google.common.eventbus.AsyncEventBus;
import com.google.common.eventbus.EventBus;
import com.google.common.util.concurrent.ThreadFactoryBuilder;
import com.google.inject.Binder;
import com.google.inject.Provider;
import com.google.inject.Provides;
import com.google.inject.Scopes;
import com.google.inject.Singleton;
import io.airlift.configuration.AbstractConfigurationAwareModule;
import io.airlift.configuration.ConfigDefaults;
import io.airlift.http.client.HttpClient;
import io.airlift.http.client.HttpClientConfig;
import io.airlift.http.server.HttpServerConfig;
import io.airlift.units.DataSize;
import io.airlift.units.Duration;
import io.prestosql.client.SocketChannelSocketFactory;
import io.prestosql.connector.DataCenterConnectorManager;
import io.prestosql.metadata.CatalogManager;
import io.prestosql.queryeditorui.execution.ClientSessionFactory;
import io.prestosql.queryeditorui.execution.ExecutionClient;
import io.prestosql.queryeditorui.execution.QueryInfoClient;
import io.prestosql.queryeditorui.execution.QueryInfoClient.BasicQueryInfo;
import io.prestosql.queryeditorui.execution.QueryRunner.QueryRunnerFactory;
import io.prestosql.queryeditorui.metadata.ColumnCache;
import io.prestosql.queryeditorui.metadata.PreviewTableCache;
import io.prestosql.queryeditorui.metadata.SchemaCache;
import io.prestosql.queryeditorui.output.PersistentJobOutputFactory;
import io.prestosql.queryeditorui.output.builders.OutputBuilderFactory;
import io.prestosql.queryeditorui.output.persistors.CSVPersistorFactory;
import io.prestosql.queryeditorui.output.persistors.PersistorFactory;
import io.prestosql.queryeditorui.protocol.ExecutionStatus.ExecutionError;
import io.prestosql.queryeditorui.protocol.ExecutionStatus.ExecutionSuccess;
import io.prestosql.queryeditorui.resources.ConnectorResource;
import io.prestosql.queryeditorui.resources.FilesResource;
import io.prestosql.queryeditorui.resources.QueryResource;
import io.prestosql.queryeditorui.resources.ResultsPreviewResource;
import io.prestosql.queryeditorui.resources.TablesResource;
import io.prestosql.queryeditorui.resources.UIExecuteResource;
import io.prestosql.queryeditorui.resources.sse.JobUpdatesSSEResource;
import io.prestosql.queryeditorui.store.connectors.ConnectorCache;
import io.prestosql.queryeditorui.store.files.ExpiringFileStore;
import io.prestosql.queryeditorui.store.history.JobHistoryStore;
import io.prestosql.queryeditorui.store.history.LocalJobHistoryStore;
import io.prestosql.queryeditorui.store.jobs.jobs.ActiveJobsStore;
import io.prestosql.queryeditorui.store.jobs.jobs.InMemoryActiveJobsStore;
import io.prestosql.queryeditorui.store.queries.InMemoryQueryStore;
import io.prestosql.queryeditorui.store.queries.QueryStore;
import okhttp3.OkHttpClient;

import javax.inject.Named;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static io.airlift.configuration.ConfigBinder.configBinder;
import static io.airlift.http.client.HttpClientBinder.httpClientBinder;
import static io.airlift.jaxrs.JaxrsBinder.jaxrsBinder;
import static io.airlift.json.JsonCodec.jsonCodec;
import static io.airlift.json.JsonCodecBinder.jsonCodecBinder;
import static io.prestosql.client.OkHttpUtil.setupCookieJar;
import static io.prestosql.client.OkHttpUtil.setupTimeouts;
import static java.util.concurrent.TimeUnit.SECONDS;

public class QueryEditorUIModule
        extends AbstractConfigurationAwareModule
{
    private static final ConfigDefaults<HttpClientConfig> HTTP_CLIENT_CONFIG_DEFAULTS = d -> new HttpClientConfig()
            .setConnectTimeout(new Duration(10, TimeUnit.SECONDS));

    @Override
    protected void setup(Binder binder)
    {
        configBinder(binder).bindConfig(QueryEditorConfig.class);

        //resources
        jsonCodecBinder(binder).bindJsonCodec(ExecutionSuccess.class);
        jsonCodecBinder(binder).bindJsonCodec(ExecutionError.class);
        jaxrsBinder(binder).bind(UIExecuteResource.class);
        jaxrsBinder(binder).bind(FilesResource.class);
        jaxrsBinder(binder).bind(QueryResource.class);
        jaxrsBinder(binder).bind(ResultsPreviewResource.class);
        jaxrsBinder(binder).bind(TablesResource.class);
        jaxrsBinder(binder).bind(JobUpdatesSSEResource.class);
        jaxrsBinder(binder).bind(ConnectorResource.class);

        binder.bind(ExecutionClient.class).in(Scopes.SINGLETON);
        binder.bind(PersistentJobOutputFactory.class).in(Scopes.SINGLETON);
        binder.bind(JobHistoryStore.class).to(LocalJobHistoryStore.class).in(Scopes.SINGLETON);

        httpClientBinder(binder).bindHttpClient("query-info", ForQueryInfoClient.class)
                .withConfigDefaults(HTTP_CLIENT_CONFIG_DEFAULTS);
    }

    @Provides
    @Singleton
    public ExpiringFileStore provideExpiringFileStore(QueryEditorConfig config)
    {
        return new ExpiringFileStore(config.getMaxResultCount());
    }

    @Provides
    @Singleton
    public CSVPersistorFactory provideCSVPersistorFactory(ExpiringFileStore fileStore)
    {
        return new CSVPersistorFactory(fileStore);
    }

    @Provides
    @Singleton
    public PersistorFactory providePersistorFactory(CSVPersistorFactory csvPersistorFactory)
    {
        return new PersistorFactory(csvPersistorFactory);
    }

    @Provides
    @Singleton
    public ActiveJobsStore provideActiveJobsStore()
    {
        return new InMemoryActiveJobsStore();
    }

    @Provides
    @Singleton
    public OutputBuilderFactory provideOutputBuilderFactory(QueryEditorConfig config)
    {
        long maxFileSizeInBytes = Math.round(Math.floor(config.getMaxResultSize().getValue(DataSize.Unit.BYTE)));
        return new OutputBuilderFactory(maxFileSizeInBytes, false);
    }

    @Singleton
    @Named("event-bus-executor")
    @Provides
    public ExecutorService provideEventBusExecutorService()
    {
        return Executors.newCachedThreadPool(new ThreadFactoryBuilder()
                .setNameFormat("event-bus-%d").setDaemon(true).build());
    }

    @Singleton
    @Provides
    public EventBus provideEventBus(@Named("event-bus-executor") ExecutorService executor)
    {
        return new AsyncEventBus(executor);
    }

    @Singleton
    @Provides
    public OkHttpClient provideOkHttpClient()
    {
        //TODO: Handle ssl setup
        OkHttpClient.Builder builder = new OkHttpClient.Builder();

        builder.socketFactory(new SocketChannelSocketFactory());

        setupTimeouts(builder, 30, SECONDS);
        setupCookieJar(builder);
        return builder.build();
    }

    @Named("coordinator-uri")
    @Provides
    public URI providePrestoCoordinatorURI(HttpServerConfig serverConfig, QueryEditorConfig queryEditorConfig)
    {
        if (queryEditorConfig.isRunningEmbeded()) {
            if (serverConfig.isHttpsEnabled()) {
                return URI.create("https://localhost:" + serverConfig.getHttpsPort());
            }
            return URI.create("http://localhost:" + serverConfig.getHttpPort());
        }
        else {
            return URI.create(queryEditorConfig.getCoordinatorUri());
        }
    }

    @Singleton
    @Named("default-catalog")
    @Provides
    public String provideDefaultCatalog()
    {
        return "hive";
    }

    @Provides
    @Singleton
    public ClientSessionFactory provideClientSessionFactory(@Named("coordinator-uri") Provider<URI> uriProvider)
    {
        return new ClientSessionFactory(uriProvider,
                "lk",
                "ui",
                "system",
                "information_schema",
                Duration.succinctDuration(15, TimeUnit.MINUTES));
    }

    @Provides
    public QueryRunnerFactory provideQueryRunner(ClientSessionFactory sessionFactory,
                                                 OkHttpClient httpClient)
    {
        //TODO: re-setup ssl
        return new QueryRunnerFactory(sessionFactory, httpClient.newBuilder().build());
    }

    @Provides
    public QueryInfoClient provideQueryInfoClient(@ForQueryInfoClient HttpClient httpClient)
    {
        return new QueryInfoClient(httpClient, jsonCodec(BasicQueryInfo.class));
    }

    @Singleton
    @Provides
    public SchemaCache provideSchemaCache(QueryRunnerFactory queryRunnerFactory,
            CatalogManager catalogManager,
            DataCenterConnectorManager dataCenterConnectorManager,
            @Named("hetu") ExecutorService executorService)
    {
        final SchemaCache cache = new SchemaCache(queryRunnerFactory, executorService);
        cache.populateCache(catalogManager, dataCenterConnectorManager);
        return cache;
    }

    @Singleton
    @Provides
    public ColumnCache provideColumnCache(QueryRunnerFactory queryRunnerFactory,
            @Named("hetu") ExecutorService executorService)
    {
        return new ColumnCache(queryRunnerFactory, executorService);
    }

    @Singleton
    @Provides
    public PreviewTableCache providePreviewTableCache(QueryRunnerFactory queryRunnerFactory,
            @Named("hetu") ExecutorService executorService)
    {
        return new PreviewTableCache(queryRunnerFactory,
                executorService);
    }

    @Singleton
    @Named("hetu")
    @Provides
    public ExecutorService provideCompleterExecutorService()
    {
        return Executors.newCachedThreadPool(SchemaCache.daemonThreadsNamed("presto-%d"));
    }

    @Provides
    public QueryStore provideQueryStore(QueryEditorConfig queryEditorConfig) throws IOException
    {
        return new InMemoryQueryStore(new File(queryEditorConfig.getFeaturedQueriesPath()), new File(queryEditorConfig.getUserQueriesPath()));
    }

    @Provides
    public ConnectorCache provideConnectorCache(QueryEditorConfig queryEditorConfig) throws IOException
    {
        return new ConnectorCache(new File(queryEditorConfig.getConnectorsListPath()));
    }
}

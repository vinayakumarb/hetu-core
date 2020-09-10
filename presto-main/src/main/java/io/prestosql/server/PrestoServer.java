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
package io.prestosql.server;

import com.google.common.collect.ImmutableList;
import com.google.inject.Injector;
import com.google.inject.Module;
import com.google.inject.util.Modules;
import io.airlift.bootstrap.Bootstrap;
import io.airlift.discovery.client.Announcer;
import io.airlift.discovery.client.DiscoveryModule;
import io.airlift.event.client.JsonEventModule;
import io.airlift.event.client.http.HttpEventModule;
import io.airlift.http.server.HttpServer;
import io.airlift.http.server.HttpServerModule;
import io.airlift.jaxrs.JaxrsModule;
import io.airlift.jmx.JmxHttpModule;
import io.airlift.json.JsonModule;
import io.airlift.log.LogJmxModule;
import io.airlift.log.Logger;
import io.airlift.node.NodeModule;
import io.airlift.tracetoken.TraceTokenModule;
import io.prestosql.catalog.DynamicCatalogScanner;
import io.prestosql.discovery.HetuDiscoveryModule;
import io.prestosql.eventlistener.EventListenerManager;
import io.prestosql.eventlistener.EventListenerModule;
import io.prestosql.execution.resourcegroups.ResourceGroupManager;
import io.prestosql.execution.warnings.WarningCollectorModule;
import io.prestosql.filesystem.FileSystemClientManager;
import io.prestosql.heuristicindex.HeuristicIndexerManager;
import io.prestosql.jmx.HetuJmxModule;
import io.prestosql.metadata.StaticCatalogStore;
import io.prestosql.metastore.HetuMetaStoreManager;
import io.prestosql.protocol.SmileModule;
import io.prestosql.security.AccessControlManager;
import io.prestosql.security.AccessControlModule;
import io.prestosql.security.PasswordSecurityModule;
import io.prestosql.seedstore.SeedStoreManager;
import io.prestosql.server.security.PasswordAuthenticatorManager;
import io.prestosql.server.security.ServerSecurityModule;
import io.prestosql.sql.parser.SqlParserOptions;
import io.prestosql.statestore.StateStoreLauncher;
import io.prestosql.statestore.StateStoreProvider;
import io.prestosql.utils.HetuConfig;
import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.HandlerContainer;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.gzip.GzipHandler;
import org.weakref.jmx.guice.MBeanModule;

import java.io.IOException;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static io.prestosql.server.PrestoSystemRequirements.verifyJvmRequirements;
import static io.prestosql.server.PrestoSystemRequirements.verifySystemTimeIsReasonable;
import static java.nio.file.LinkOption.NOFOLLOW_LINKS;
import static java.util.Objects.requireNonNull;

public class PrestoServer
        implements Runnable
{
    public static void main(String[] args)
    {
        new PrestoServer().run();
    }

    private final SqlParserOptions sqlParserOptions;

    public PrestoServer()
    {
        this(new SqlParserOptions());
    }

    public PrestoServer(SqlParserOptions sqlParserOptions)
    {
        this.sqlParserOptions = requireNonNull(sqlParserOptions, "sqlParserOptions is null");
    }

    @Override
    public void run()
    {
        verifyJvmRequirements();
        verifySystemTimeIsReasonable();

        Logger log = Logger.get(PrestoServer.class);

        ImmutableList.Builder<Module> modules = ImmutableList.builder();
        modules.add(
                new NodeModule(),
                Modules.override(new DiscoveryModule()).with(new HetuDiscoveryModule()),
                new HttpServerModule(),
                new JsonModule(),
                new SmileModule(),
                new JaxrsModule(),
                new MBeanModule(),
                new PrefixObjectNameGeneratorModule("io.prestosql"),
                new HetuJmxModule(),
                new JmxHttpModule(),
                new LogJmxModule(),
                new TraceTokenModule(),
                new JsonEventModule(),
                new HttpEventModule(),
                new ServerSecurityModule(),
                new AccessControlModule(),
                new PasswordSecurityModule(),
                new EventListenerModule(),
                new ServerMainModule(sqlParserOptions),
                new NodeStateChangeModule(),
                new WarningCollectorModule());

        modules.addAll(getAdditionalModules());

        Bootstrap app = new Bootstrap(modules.build());

        try {
            Injector injector = app.strictConfig().initialize();

            logLocation(log, "Working directory", Paths.get("."));
            logLocation(log, "Etc directory", Paths.get("etc"));

            injector.getInstance(PluginManager.class).loadPlugins();
            FileSystemClientManager fileSystemClientManager = injector.getInstance(FileSystemClientManager.class);
            fileSystemClientManager.loadFactoryConfigs();
            injector.getInstance(HetuMetaStoreManager.class).loadHetuMetatstore(fileSystemClientManager);
            injector.getInstance(HeuristicIndexerManager.class).buildIndexClient();
            injector.getInstance(StaticCatalogStore.class).loadCatalogs();
            injector.getInstance(DynamicCatalogScanner.class).start();
            injector.getInstance(SessionPropertyDefaults.class).loadConfigurationManager();
            injector.getInstance(ResourceGroupManager.class).loadConfigurationManager();
            injector.getInstance(AccessControlManager.class).loadSystemAccessControl();
            injector.getInstance(PasswordAuthenticatorManager.class).loadPasswordAuthenticator();
            injector.getInstance(EventListenerManager.class).loadConfiguredEventListener();

            // Seed Store
            loadSeedStore(injector.getInstance(HetuConfig.class), injector.getInstance(SeedStoreManager.class));
            // State Store
            launchEmbeddedStateStore(injector.getInstance(HetuConfig.class), injector.getInstance(StateStoreLauncher.class));
            injector.getInstance(StateStoreProvider.class).loadStateStore();

            injector.getInstance(Announcer.class).start();

            injector.getInstance(ServerInfoResource.class).startupComplete();

            disableGzip(injector);

            log.info("======== SERVER STARTED ========");
        }
        catch (Throwable e) {
            log.error(e);
            System.exit(1);
        }
    }

    private void disableGzip(Injector injector) throws NoSuchFieldException, IllegalAccessException
    {
        /**
         * SSE data will not reach client if its is encoded. By default client accepts gzip, but in case of broadcast
         * that doesnot work. So had to disable the GZipHandler for this path to avoid response encoding.
         * @param httpServer
         */
        HttpServer instance = injector.getInstance(HttpServer.class);
        Field serverField = HttpServer.class.getDeclaredField("server");
        serverField.setAccessible(true);
        Server server = (Server) serverField.get(instance);
        String excluded = "/api/updates/*";
        Handler handler = server.getHandler();
        excludeGzip(excluded, handler);
    }

    private void excludeGzip(String excluded, Handler handler)
    {
        if (handler instanceof GzipHandler) {
            ((GzipHandler) handler).addExcludedPaths(excluded);
        }
        if (handler instanceof HandlerContainer) {
            Handler[] childHandlers = ((HandlerContainer) handler).getChildHandlers();
            for (Handler child : childHandlers) {
                excludeGzip(excluded, child);
            }
        }
    }

    protected Iterable<? extends Module> getAdditionalModules()
    {
        return ImmutableList.of();
    }

    private static void launchEmbeddedStateStore(HetuConfig config, StateStoreLauncher launcher)
            throws Exception
    {
        // Only launch embedded state store when enabled
        if (config.isEmbeddedStateStoreEnabled()) {
            launcher.launchStateStore();
        }
    }

    private static void loadSeedStore(HetuConfig config, SeedStoreManager manager)
            throws Exception
    {
        // Only load seed store when enabled
        if (config.isSeedStoreEnabled()) {
            manager.loadSeedStore();
        }
    }

    private static void logLocation(Logger log, String name, Path path)
    {
        if (!Files.exists(path, NOFOLLOW_LINKS)) {
            log.info("%s: [does not exist]", name);
            return;
        }
        try {
            path = path.toAbsolutePath().toRealPath();
        }
        catch (IOException e) {
            log.info("%s: [not accessible]", name);
            return;
        }
        log.info("%s: %s", name, path);
    }
}

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

import io.airlift.configuration.Config;
import io.airlift.units.DataSize;

public class QueryEditorConfig
{
    private boolean isRunningEmbeded = true;
    private String coordinatorUri;
    private String featuredQueriesPath = "etc/featured_queries.json";
    private String userQueriesPath = "etc/user_queries.json";
    private String connectorsListPath = "etc/connector_properties.json";
    private int maxResultCount = 1000;
    private DataSize maxResultSize = new DataSize(1, DataSize.Unit.GIGABYTE);

    public int getMaxResultCount()
    {
        return maxResultCount;
    }

    @Config("hetu.queryeditor-ui.max-result-count")
    public void setMaxResultCount(int maxResultCount)
    {
        this.maxResultCount = maxResultCount;
    }

    public DataSize getMaxResultSize()
    {
        return maxResultSize;
    }

    @Config("hetu.queryeditor-ui.max-result-size-mb")
    public void setMaxResultSize(int maxResultSizeBytes)
    {
        this.maxResultSize = new DataSize(maxResultSizeBytes, DataSize.Unit.MEGABYTE);
    }

    @Config("hetu.queryeditor-ui.embeded-mode")
    public QueryEditorConfig setRunningEmbeded(boolean runningEmbeded)
    {
        isRunningEmbeded = runningEmbeded;
        return this;
    }

    public boolean isRunningEmbeded()
    {
        return isRunningEmbeded;
    }

    @Config("hetu.queryeditor-ui.server.uri")
    public QueryEditorConfig setCoordinatorUri(String coordinatorUri)
    {
        this.coordinatorUri = coordinatorUri;
        return this;
    }

    public String getCoordinatorUri()
    {
        return coordinatorUri;
    }

    @Config("hetu.queryeditor-ui.server.featured-queries-json")
    public QueryEditorConfig setFeaturedQueriesPath(String featuredQueriesPath)
    {
        this.featuredQueriesPath = featuredQueriesPath;
        return this;
    }

    public String getFeaturedQueriesPath()
    {
        return featuredQueriesPath;
    }

    @Config("hetu.queryeditor-ui.server.user-queries-json")
    public QueryEditorConfig setUserQueriesPath(String userQueriesPath)
    {
        this.userQueriesPath = userQueriesPath;
        return this;
    }

    @Config("hetu.queryeditor-ui.server.connector-properties-json")
    public QueryEditorConfig setConnectorsListPath(String connectorsListPath)
    {
        this.connectorsListPath = connectorsListPath;
        return this;
    }

    public String getUserQueriesPath()
    {
        return userQueriesPath;
    }

    public String getConnectorsListPath()
    {
        return connectorsListPath;
    }
}

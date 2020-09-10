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

import com.google.common.cache.CacheLoader;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.common.util.concurrent.ListeningExecutorService;

import java.util.concurrent.Callable;

import static java.util.Objects.requireNonNull;

public abstract class BackgroundCacheLoader<K, V>
        extends CacheLoader<K, V>
{
    private final ListeningExecutorService executor;

    protected BackgroundCacheLoader(ListeningExecutorService executor)
    {
        this.executor = requireNonNull(executor, "executor is null");
    }

    @Override
    public final ListenableFuture<V> reload(final K key, V oldValue)
    {
        return executor.submit(new Callable<V>()
        {
            @Override
            public V call()
                    throws Exception
            {
                return load(key);
            }
        });
    }
}

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
import alt from '../alt';
import FluxCollection from '../utils/FluxCollection';
import RunActions from '../actions/RunActions';
import TabActions from '../actions/TabActions';
import ResultsPreviewActions from '../actions/ResultsPreviewActions';
import RunStateConstants from '../constants/RunStateConstants';
import UserStore from '../stores/UserStore';
import TabConstants from "../constants/TabConstants";

// Yeah baby. We're ready to rambo! The SSEConnection has made a connection
// to the API endpoint and now we should start getting updates (if any runs
// are running of course).
const handleOpen = function () {
  RunActions.handleConnectionOpen();
};

// The SSEConnection received an error. Notify the user about this error.
// @param event {Object} the error object from the API
const handleError = function (event) {
  RunActions.handleConnectionError(event);
};

// The SSEConnection has received a message from the API. We should notify
// the application on this.
// @param event {Object} the event object from the API
const handleMessage = function (event) {
  var data = JSON.parse(event.data);
  RunActions.handleConnectionMessage(data);
};

class RunStore {
  constructor() {
    this.bindListeners({
      onConnect: [RunActions.WENT_ONLINE, RunActions.CONNECT],
      onDisconnect: [RunActions.WENT_OFFLINE, RunActions.DISCONNECT],
      onResetOnlineStatus: RunActions.RESET_ONLINE_STATUS,
      onAddMultipleRuns: RunActions.ADD_MULTIPLE_RUNS,
      onAddRun: RunActions.ADD_RUN,
      onMessage: RunActions.HANDLE_CONNECTION_MESSAGE,
      onFetchHistory: RunActions.FETCH_HISTORY,
      onExecute: RunActions.EXECUTE,
    });

    this.exportPublicMethods({
      getCollection: this.getCollection
    });

    this.collection = new FluxCollection({
      comparator: (model) => model.queryStarted
    });

    this.hasFetchedHistory = false;
    this.online = false;
    this.offline = false;
    this.poll = this.poll.bind(this);
    this.setupNextPoll = this.setupNextPoll.bind(this);
    this.pollTimeoutId = null;
    this.currentPollDelay = 10000;
    this.pollErrorDelay = 1000;
  }

  // Creates an SSE connection to the backend to make a real time stream
  // with the API
  onConnect() {
    this.onDisconnect(); // Close any open connection

    //Disabling event updates as broadcast events doesnt seems to be consistent.
    // // Create a new listener to the API endpoint
    // this._eventSource = new EventSource('../api/updates/subscribe');
    //
    // // Listen to incoming messages
    // this._eventSource.addEventListener('open', handleOpen);
    // this._eventSource.addEventListener('error', handleError);
    // this._eventSource.addEventListener('message', handleMessage);

    this.online = true;
    this.offline = false;
    this.poll();
  }

  setupNextPoll(hasError, fastRefresh=false) {
    if (fastRefresh && this.currentPollDelay != 1000) {
      this.currentPollDelay = 1000;
    }

    var delay = this.currentPollDelay;
    if (hasError) {
      // When there is an error, use exponential back off, with a limit of 1 minute
      if (this.pollErrorDelay * 2 < 60000) {
        this.pollErrorDelay *= 2;
      }
      else {
        this.pollErrorDelay = 60000;
      }
      delay = this.pollErrorDelay;
    } else {
      this.pollErrorDelay = this.currentPollDelay;
    }

    clearTimeout(this.pollTimeoutId);
    this.pollTimeoutId = setTimeout(this.poll, delay);
  }

  poll() {
    RunActions.fetchHistory().then((success) => this.setupNextPoll(!success));
  }

  // Close the open SSE connect
  onDisconnect() {
    // if (!!this._eventSource && this._eventSource.readyState) {
    //   this._eventSource.close();
    // }
    //
    // if (this._eventSource) {
    //   this._eventSource.removeEventListener('open', handleOpen);
    //   this._eventSource.removeEventListener('error', handleError);
    //   this._eventSource.removeEventListener('message', handleMessage);
    // }

    clearTimeout(this.pollTimeoutId);
    this.online = false;
    this.offline = true;
  }

  onResetOnlineStatus() {
    this.online = false;
    this.offline = false;
  }

  onAddMultipleRuns(data) {
    this.collection.clear();
    this.collection.add(data, {update: true});

    // Poll successful. Start next poll only if there are running queries.
    let anyRunning = false;
    data.map((run) => {
      if ((run.state != RunStateConstants.FAILED &&
          run.state != RunStateConstants.FINISHED &&
          run.state != RunStateConstants.CANCELED)) {
        anyRunning = true;
      }
    });
    if (anyRunning) {
      this.currentPollDelay = 1000;
    }
    else {
      this.currentPollDelay = 10000;
    }
  }

  onAddRun(data) {
    this.setupNextPoll(false, true);
  }

  onMessage(data) {
    // if (data.state === RunStateConstants.FINISHED && data.output.location &&
    //     data.user === UserStore.getCurrentUser().name) {
    //   ResultsPreviewActions.loadResultsPreview(data.output.location);
    // }
    this.collection.update(data.uuid, data);
  }

  onFetchHistory() {
    if (this.hasFetchedHistory) return;
    this.hasFetchedHistory = true;
  }

  onExecute() {
    TabActions.selectTab.defer(TabConstants.ALL_QUERIES);
  }

  getCollection() {
    return this.getState().collection;
  }
}

export default alt.createStore(RunStore, 'RunStore');

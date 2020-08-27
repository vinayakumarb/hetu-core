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
import React from 'react';
import SearchInputField from './SearchInputField';
import TableActions from '../actions/TableActions';
import TableStore from '../stores/TableStore';
import _ from 'lodash';

let commonSelectizeOptions = {
  closeAfterSelect: true
};

function getActiveItemName(selectize) {
  let activeItems = selectize.$activeItems;

  if (!!activeItems && !!activeItems.length) {
    return $(activeItems[0]).data('value');
  } else {
    return null;
  }
}

// State actions
function getStateFromStore() {
  return {
    table: TableStore.getActiveTable()
  };
}

function highlightOnlyOption(selectize, item) {
  let items = selectize.$control.find('.item');

  if (items.length == 1) {
    selectize.setActiveItem(items[0]);
  } else if (!_.isEmpty(item)) {
    selectize.setActiveItem(item[0]);
  }
}

class TableSearch
    extends React.Component{
  constructor(props) {
    super(props);
    this.state = getStateFromStore();
    this.selectizeRef = React.createRef();
    this.tableSelectizeOptions = this.tableSelectizeOptions.bind(this);
    this.partitionSelectizeOptions = this.partitionSelectizeOptions.bind(this);
    this._onChange = this._onChange.bind(this);
  }

  componentDidMount() {
    TableStore.listen(this._onChange);
  }

  componentWillUnmount() {
    TableStore.unlisten('change');
  }

  render() {
    return (
      <section className="flex flex-column flex-initial table-search-row panel-body">
        <div className="flex flex-column form-group">
          <label htmlFor="tables-input">Tables</label>
          <SearchInputField
            ref="tableSelectize"
            placeholder="Select a table"
            selectizeOptions={this.tableSelectizeOptions} />
        </div>
      </section>);
  }

  /* - Selectize options --------------------------------------------------- */
  tableSelectizeOptions() {
    return _.extend({}, commonSelectizeOptions, {
      preload: true,

      render: {
        option: this._renderTableOptions
      },

      valueField: 'fqn',
      labelField: 'fqn',

      sortField: [{
        field: 'usages',
        direction: 'desc'
      }],

      searchField: ['fqn', 'tableName', 'schema'],

      plugins: {
        'remove_button': {},

        'header': {
          headers: ['Table', 'Usages']
        }
      },

      load(query, callback) {
        $.ajax({
          url: '../api/table',
          type: 'GET',
          error() { callback(); },

          success(res) {
            callback(res);
          }
        });
      },

      onItemAdd(table, $element) {
        TableActions.addTable({
          name: table
        });
        highlightOnlyOption(this, $element);
      },

      onItemRemove(table) {
        TableActions.removeTable(table);
        highlightOnlyOption(this);
      },

      onItemSelected(element) {
        let $el = $(element);
        TableActions.selectTable($(element).data('value'));
      },

      onOptionActive($activeOption) {
        let itemName = getActiveItemName(this);

        if ($activeOption == null) {
          TableActions.unselectTable(itemName)
        } else {
          if (!TableStore.containsTable(itemName)) {
            TableActions.unselectTable(itemName);
          } else {
            TableActions.selectTable(itemName);
          }
        }
      }
    });
  }

  _renderTableOptions(item, escape) {
    return (
      '<div class="row">' +
        '<div class="col-sm-11 col-name"><span>' + escape(item.fqn) + '</span></div>' +
        '<div class="col-sm-1"><span>' + escape(item.usages) + '</span></div>' +
      '</div>'
    );
  }

  _renderPartitionOptions(item, escape) {
    const strVal = [item.name, item.value].join('=');
    return (
      '<div class="row">' +
        '<div class="col-sm-11 col-name"><span>' +
          escape(strVal) +
        '</span></div>' +
      '</div>'
    );
  }

  partitionSelectizeOptions() {
    let partitions = [];
    const self = this;

    if (!_.isEmpty(this.state.table)) {
      partitions = this.state.table.partitions;
    }

    return _.extend({}, commonSelectizeOptions, {
      preload: 'focus',
      openOnFocus: true,
      valueField: 'partitionValue',
      labelField: 'partitionValue',

      searchField: [
        'partitionValue',
      ],

      sortField: [
        {
          field: 'value',
          direction: 'desc'
        },
        {
          field: 'name',
          direction: 'asc'
        }
      ],

      plugins: {
        'remove_button': {}
      },

      render: {
        option: this._renderPartitionOptions
      },

      load(query, callback) {
        // Call it async consistently
        _.defer(function() {
          callback(partitions);
        });
      },

      onItemAdd(partition, $element) {
        if (!self.state.table) {
          return;
        }
        TableActions.selectPartition({
          partition: partition,
          table: self.state.table.name,
        });
        highlightOnlyOption(this, $element);
      },

      onOptionActive($activeOption) {
        if (!self.state.table) {
          return;
        }

        const itemName = getActiveItemName(this);

        if ($activeOption == null) {
          TableActions.unselectPartition({
            partition: itemName,
            table: self.state.table.name,
          });
        } else {
          TableActions.selectPartition({
            partition: itemName,
            table: self.state.table.name,
          });
          //}
        }
      },
    });
  }

  _onChange() {
    this.setState(getStateFromStore());
  }
}

export default TableSearch;

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
import ReactDOM from 'react-dom';
import _ from 'lodash';
import PropTypes from 'prop-types';

require('../plugins/plugin');

class SearchInputField
    extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true
    };
    this.selectizeRef = React.createRef();
    this._defaultSelectizeOptions = this._defaultSelectizeOptions.bind(this);
    this.componentWillReceiveProps = this.componentWillReceiveProps.bind(this);
    this.enable = this.enable.bind(this);
    this._enable = this._enable.bind(this);
    this.disable = this.disable.bind(this);
    this._disable = this._disable.bind(this);
  }

  propTypes: {
    placeholder: React.PropTypes.string.isRequired,
    selectizeOptions: React.PropTypes.func.isRequired
  }

  componentDidMount() {
    // Define the input for this component
    // this.input = this.selectizeRef.current;
    this.input = ReactDOM.findDOMNode(this.selectizeRef.current);
    this.$input = $(this.input);


    // this.$input.extend(this._defaultSelectizeOptions(), this.props.selectizeOptions());
    // Activate the selectize plugin
    this.$input.selectize(this.$input.extend(this._defaultSelectizeOptions(), this.props.selectizeOptions()));

    // Define the $selectize instance
    this.$selectize = this.$input[0].selectize;

    this.$selectize.on('load', () => {
      this.setState({
        loading: false
      });
    });

    // Check or the editor is disabled
    if(this.props.disabled) {
      this._disable();
    }
  }

  componentWillUnmount() {
    // raghu this.$selectize.destroy();
  }

  render() {
    return (
        <div className="selectize-container">
          <div>
            <input ref={this.selectizeRef} type="text" placeholder={this.props.placeholder} />
          </div>
          {this.state.loading ?
              <span className="glyphicon glyphicon-repeat indicator-spinner selectize-indicator"></span>
              : null}
        </div>);
  }

  /* Internal Helpers ------------------------------------------------------ */
  _defaultSelectizeOptions() {
    return {
      create:       false,
      openOnFocus:  true,
      preload:      'focus',
      loadThrottle: 1000,
      closeAfterSelect: true,
      hideSelected: true,

      onChange() {
        this.close();
      }
    };
  }

  componentWillReceiveProps(nextProps) {
    let nextSelectizeOpts = nextProps.selectizeOptions();

    if (this.props.placeholder !== nextProps.placeholder) {
      this.$selectize.
      $control_input.
      attr('placeholder', nextProps.placeholder).
      data('grow', true).
      trigger('update');
    }

    this.$selectize.settings.load = nextSelectizeOpts.load;

    if (nextProps.activeOption) {
      window.$selectize = this.$selectize;
      this.$selectize.load(function(callback) {
        nextSelectizeOpts.load(null, callback);
      });
      _.defer(function() {
        this.$selectize.addItem(nextProps.activeOption, true);
        const $item = this.$selectize.getItem(nextProps.activeOption);
        if (!_.isEmpty($item)) {
          this.$selectize.setActiveItem($item[0], undefined, true);
        }
      }.bind(this));
    }

    if (this.props.disabled !== nextProps.disabled) {
      if (!nextProps.disabled) {
        this.$selectize.enable();
        this.$selectize.loadedSearches = {};
        this.$selectize.refreshOptions(false);
      } else {
        this.$selectize.disable();
        this.$selectize.clear();
        this.$selectize.clearOptions();
      }
    }
  }

  // Enables the selectize plugin
  // Alias for internal function
  enable() {
    return this._enable();
  }

  _enable() {
    this.$selectize.enable();
  }

  // Disables the selectize plugin
  // Alias for internal function
  disable() {
    return this._disable();
  }

  _disable() {
    this.$selectize.disable();
  }
}

SearchInputField.propTypes = {
  placeholder: PropTypes.string.isRequired,
  selectizeOptions: PropTypes.func.isRequired
};

export default SearchInputField;

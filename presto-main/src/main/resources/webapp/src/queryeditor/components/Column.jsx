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
import _ from 'lodash';
import PropTypes from 'prop-types';

class Column
    extends React.Component{
  constructor(props) {
    super(props);
  }

  propTypes: {
    name: React.PropTypes.string.isRequired,
    type: React.PropTypes.string.isRequired
  }

  render() {
    // Return the template
    return (
      <div>
        <div className="flex justify-flex-end column-item">
          <div className='flex'>
            <strong>{this.props.name}</strong>
          </div>
          <div>
            <small>{this.props.type} {this.props.partition ? '(Partition)' : null}</small>
          </div>
        </div>
      </div>
    );
  }
}

export default Column;

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
import UserActions from '../actions/UserActions';
import UserStore from '../stores/UserStore';
import AddCatalogContainer from "../../addcatalog";

// State actions
function getStateFromStore() {
  return {
    user: UserStore.getCurrentUser()
  };
}

class Header
    extends React.Component {
  constructor(props) {
    super(props);
    this.state = getStateFromStore();
    this._onChange = this._onChange.bind(this);
  }

  componentDidMount() {
    UserStore.listen(this._onChange);
    UserActions.fetchCurrentUser();
  }

  componentWillUnmount() {
    UserStore.unlisten(this._onChange);
  }

  render() {
    return (
      <header className='flex flex-row'>
        <div className='flex'>
          <a className={"hetu-header-brand-name"} href={"/"} style={{fontFamily:"roboto!important"}}>
            <img src={"assets/lk-logo.png"} alt={"openLooKeng logo"} className={"hetu-header-brand-name"}/>
          </a>
        </div>
        <div className='flex justify-flex-end menu'>
          <div className='flex flex-initial'>
            <i className='glyphicon glyphicon-user' />
            {this.state.user.name}
          </div>
          {/*<div className='flex flex-initial permissions'>*/}
          {/*  <i className='glyphicon glyphicon-lock' />*/}
          {/*  {this.state.user.executionPermissions.accessLevel}*/}
          {/*</div>*/}
        </div>
      </header>
    );
  }

  /* Store events */
  _onChange() {
    this.setState(getStateFromStore());
  }
}

export default Header;

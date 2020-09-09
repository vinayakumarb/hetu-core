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
import React from "react";
import {TreeView} from "@bosket/react";
import {string} from "@bosket/tools";
import AddCatalogContainer from "../../addcatalog";
import SchemaActions, {dataType} from "../actions/SchemaActions";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import TableActions from "../actions/TableActions";
import TabActions from "../actions/TabActions";
import TabConstants from "../constants/TabConstants";
import _ from "lodash";

function getIcon(type) {
    switch (type) {
        case dataType.TABLE: {
            return (<i className="icon fa fa-table valign-middle"></i>);
            // return (<i className="material-icons">table_view</i>);
        }
        case dataType.SCHEMA: {
            return (<i className="icon fa fa-database valign-middle"></i>);
            // return (<i className="material-icons">storage</i>);
        }
        case dataType.CATALOG: {
            return (<i className="icon fa fa-server valign-middle"></i>);
            // return (<i className="material-icons">source</i>);
        }
        default: {
            return (<i className="material-icons">dashboard</i>);
        }
    }
}

function renderItem(tree, item) {
    let style = (item.children == undefined || item.children.length == 0) ? {marginLeft: "14.5px"} : {};
    if (item.type == dataType.TABLE) {
        let tableStyle = {};
        Object.assign(tableStyle, style, {cursor: "pointer"})
        if (item.fqn == tree.state.selectedTableName) {
            tableStyle.color = "#0000ff"
        }
        return (
        <a style={tableStyle} id={item.fqn}>
                <ContextMenuTrigger id={item.fqn}>
                    {getIcon(item.type)}<span>{item.name}</span>
                </ContextMenuTrigger>
                <ContextMenu id={item.fqn}>
                    <MenuItem data={{item:item, tree: tree}} onClick={(e, data) => {
                        data.tree.selectTable(data.item.fqn);
                        TableActions.addTable({
                            name: data.item.fqn
                        });
                        TableActions.selectTable(data.item.fqn);
                        TabActions.selectLeftPanelTab(TabConstants.LEFT_PANEL_COLUMNS);
                    }}>
                        <i className="icon fa fa-columns valign-middle"></i><span>Show columns</span>
                    </MenuItem>
                    <MenuItem divider/>
                    <MenuItem data={{item:item, tree: tree}} onClick={(e, data) => {
                        data.tree.selectTable(data.item.fqn);
                        TableActions.addTable({
                            name: data.item.fqn
                        });
                        TableActions.selectTable(data.item.fqn);
                        TabActions.selectTab(TabConstants.DATA_PREVIEW);
                    }}>
                        <i className="icon fa fa-list valign-middle"></i><span>Preview data</span>
                    </MenuItem>
                </ContextMenu>
            </a>
        )
    }
    return (<a style={style}>{getIcon(item.type)}<span>{item.name}</span></a>);
}

class SchemaTree extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            category: "children",
            selection: [],
            onSelect: _ => this.setState({selection: _}),
            search: (input) => (i) => string(i.name).contains(input),
            display: renderItem.bind(null, this),
            sort: (a, b) => a.name.localeCompare(b.name),
            strategies: {
                selection: [],
                click: [],
                fold: ["opener-control"]
            },
            css: {TreeView: "schema-tree"},
            openerOpts: {
                position: "left",
            },
            height:0,
            model: this.getInitialModel(),
            name: "name",
            selectedTableName: ""
        };
        this.updateTree = this.updateTree.bind(this);
        this.refresh = this.refresh.bind(this);
        this.selectTable = this.selectTable.bind(this);
        this.unselectTable = this.unselectTable.bind(this);
    }

    updateTree(refresh = false) {
        clearTimeout(this.timer);
        SchemaActions.fetchSchemas(this.state.model, refresh).then((catalogs) => {
            return SchemaActions.fetchTables(catalogs);
        }).then((catalogs) => {
            let state = this.state;
            if (refresh) {
                state.model = [];
                this.setState(state);
                state = this.state;
            }
            state.model = catalogs;
            this.setState(state);
        }).then(() => {
            this.timer = setTimeout(this.updateTree, 30000)
        });
    }

    refresh() {
        this.updateTree(true)
    }

    componentDidMount() {
        this.updateTree();
    }

    componentWillUnmount() {
        clearTimeout(this.timer)
    }

    getInitialModel() {
        return [];
    }

    selectTable(tableName) {
        this.unselectTable();
        let element = document.getElementById(tableName);
        if (!_.isElement(element)) {
            return;
        }
        element.style.color = "#0000ff";
        this.state.selectedTableName = tableName;
    }

    unselectTable() {
        if (this.state.selectedTableName == "") {
            return;
        }
        let element = document.getElementById(this.state.selectedTableName);
        this.state.selectedTableName = "";
        if (!_.isElement(element)) {
            return;
        }
        element.style.color = "#222222";
    }

    renderButtons() {
        return (
            <div className={"flex flex-row"} style={{justifyContent: 'space-between'}}>
                <AddCatalogContainer  refreshCallback={this.refresh}/>
                    <button className={"btn btn-default"}
                            style={{margin: "10px"}}
                            onClick={this.refresh}>
                        <i className="fa fa-refresh" style={{top:'3px',color:'#39b0d2',marginRight:'0'}}></i>
                    </button>
            </div>
        )
    }

    render() {
        if (this.state.model.length == 0) {
            return (
                <div style={{height: this.state.height + 71, minHeight: this.state.height + 71}}>
                    {this.renderButtons()}
                </div>
            );
        }
        //total height - header - tab header - footer - statusbar - menu bar
        return (
            <div>
                {this.renderButtons()}
                <div style={{height: "calc(100vh - 200px)"}}>
                    <TreeView {...this.state}></TreeView>
                </div>
            </div>
        );
    }
}

export default SchemaTree;
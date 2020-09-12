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
import QueryActions from "../actions/QueryActions";

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
    let tableStyle = {};
    Object.assign(tableStyle, style, {cursor: "pointer"})
    if (item.type == dataType.TABLE) {
        if (item.fqn == tree.selectedTableName) {
            tableStyle.color = "#0000ff"
        }
        return (
        <a style={tableStyle} id={item.fqn}>
                <ContextMenuTrigger id={item.fqn}>
                    {getIcon(item.type)}<span>{item.name}</span>{tree.isFavorite(item) ? <i className="icon fa fa-star valign-middle schema-tree-icons favorite"/> : null}
                </ContextMenuTrigger>
                <ContextMenu id={item.fqn}>
                    {tree.isFavorite(item) ?
                        <MenuItem data={{item: item, tree: tree}} onClick={(e, data) => {
                            tree.removeFromFavorites(item);
                        }}>
                            <i className="icon fa fa-minus-square-o valign-middle contextmenu-icons remove-favorite"/><span>Remove from Favorites</span>
                        </MenuItem>
                        :
                        <MenuItem data={{item: item, tree: tree}} onClick={(e, data) => {
                            tree.addToFavorites(item);
                        }}>
                            <i className="icon fa fa-star valign-middle contextmenu-icons favorite"/><span>Add to Favorites</span>
                        </MenuItem>
                    }
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
    else {
        return (
            <a style={tableStyle} id={item.fqn}>
                <ContextMenuTrigger id={item.fqn}>
                    {getIcon(item.type)}<span>{item.name}</span>{tree.isFavorite(item) ? <i className="icon fa fa-star valign-middle schema-tree-icons favorite"/> : null}
                </ContextMenuTrigger>
                <ContextMenu id={item.fqn}>
                    {tree.isFavorite(item) ?
                        <MenuItem data={{item: item, tree: tree}} onClick={(e, data) => {
                            tree.removeFromFavorites(item);
                        }}>
                            <i className="icon fa fa-minus-square-o valign-middle contextmenu-icons remove-favorite"/><span>Remove from Favorites</span>
                        </MenuItem>
                        :
                        <MenuItem data={{item: item, tree: tree}} onClick={(e, data) => {
                            tree.addToFavorites(item);
                        }}>
                            <i className="icon fa fa-star valign-middle contextmenu-icons favorite"/><span>Add to Favorites</span>
                        </MenuItem>
                    }
                    {(item.type == dataType.SCHEMA) ?
                        <MenuItem data={{item: item, tree: tree}} onClick={(e, data) => {
                            QueryActions.setSessionContext({
                                catalog: item.catalog,
                                schema: item.name
                            })
                        }}>
                            <i className="icon fa fa-database valign-middle"/><span>Use as default</span>
                        </MenuItem>
                        : null
                    }
                </ContextMenu>
            </a>
        )
    }
    // return (<a style={style}>{getIcon(item.type)}<span>{item.name}</span></a>);
}

function sortItems(tree, item1, item2) {
    let isItem1Fav = tree.isFavorite(item1);
    let isItem2Fav = tree.isFavorite(item2);
    if (isItem1Fav && !isItem2Fav) {
        return -1;
    }
    if (isItem2Fav && !isItem1Fav) {
        return 1;
    }
    if((isItem1Fav && isItem2Fav) || (!isItem1Fav && !isItem2Fav)){
        return item1.name.localeCompare(item2.name);
    }
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
            sort: sortItems.bind(null, this),
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
            name: "name"
        };
        this.selectedTableName = "";
        this.treeRef = React.createRef();
        this.favourites = {
            catalogs: [],
            schemas: [],
            tables: []
        }
        this.updateTree = this.updateTree.bind(this);
        this.refresh = this.refresh.bind(this);
        this.selectTable = this.selectTable.bind(this);
        this.unselectTable = this.unselectTable.bind(this);
        this.addToFavorites = this.addToFavorites.bind(this);
        this.removeFromFavorites = this.removeFromFavorites.bind(this);
        this.isFavorite = this.isFavorite.bind(this);
        this.refreshItem = this.refreshItem.bind(this);
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
        this.selectedTableName = tableName;
    }

    unselectTable() {
        if (this.selectedTableName == "") {
            return;
        }
        let element = document.getElementById(this.selectedTableName);
        this.selectedTableName = "";
        if (!_.isElement(element)) {
            return;
        }
        element.style.color = "#222222";
    }

    addToFavorites(item) {
        let catalog = {catalog: (item.type == dataType.CATALOG ? item.name : item.catalog)};
        item.favorite = true;
        if (item.type == dataType.CATALOG) {
            let favoriteCatalog = _.find(this.favourites.catalogs, catalog);
            if (_.isUndefined(favoriteCatalog)) {
                this.favourites.catalogs.push(catalog);
                this.refreshItem(item);
            }
            return;
        }
        let schema = {catalog: catalog.catalog, schema: (item.type == dataType.SCHEMA) ? item.name : item.schema};
        if (item.type == dataType.SCHEMA) {
            let favoriteSchema = _.find(this.favourites.schemas, schema);
            if (_.isUndefined(favoriteSchema)) {
                this.favourites.schemas.push(schema);
                this.refreshItem(item);
            }
            return;
        }
        let table = {catalog: catalog.catalog, schema: schema.schema, table: item.name};
        let favoriteTable = _.find(this.favourites.tables, table);
        if (_.isUndefined(favoriteTable)) {
            this.favourites.tables.push(table);
            this.refreshItem(item);
        }
    }

    removeFromFavorites(item) {
        item.favorite = false;
        if (item.type == dataType.CATALOG) {
            let catalog = {catalog: item.name};
            let index = _.findIndex(this.favourites.catalogs, catalog);
            if (index !== -1) {
                this.favourites.catalogs.splice(index, 1);
            }
        }
        else if (item.type == dataType.SCHEMA) {
            let schema = {catalog: item.catalog, schema: item.name};
            let index = _.findIndex(this.favourites.schemas, schema);
            if (index !== -1) {
                this.favourites.schemas.splice(index, 1);
            }
        }
        else if (item.type == dataType.TABLE) {
            let table = {catalog: item.catalog, schema: item.schema, table: item.name};
            let index = _.findIndex(this.favourites.tables, table);
            if (index !== -1) {
                this.favourites.tables.splice(index, 1);
            }
        }
        this.refreshItem(item);
    }

    /**
     * Finds whether item is favorite as below.
     *  1. If item is catalog, searches all catalogs,schemas,tables
     *  2. If item is schema, searches in schemas and tables;
     *  3. If item is table, searches in tables;
     * @param item
     * @returns {boolean}
     */
    isFavorite(item) {
        let predicate;
        if (item.type == dataType.CATALOG) {
            predicate = {catalog: item.name};
        }
        if (item.type == dataType.SCHEMA) {
            predicate = {catalog: item.catalog, schema: item.name};
        }
        if (item.type == dataType.TABLE) {
            predicate = {catalog: item.catalog, schema: item.schema, table: item.name};
        }
        if (item.type == dataType.CATALOG) {
            let index = _.findIndex(this.favourites.catalogs, predicate);
            if (index !== -1) {
                return true;
            }
        }
        if (item.type == dataType.SCHEMA || item.type == dataType.CATALOG) {
            let index = _.findIndex(this.favourites.schemas, predicate);
            if (index !== -1) {
                return true;
            }
        }
        let index = _.findIndex(this.favourites.tables, predicate);
        if (index !== -1) {
            return true;
        }
        return false;
    }

    refreshItem(item) {
        let model = this.state.model;
        this.state.model = [];
        this.setState(this.state);
        setTimeout((() => {
            this.state.model = model;
            this.setState(this.state);
        }).bind(model), 100);
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
                    <TreeView {...this.state} ref={this.treeRef}></TreeView>
                </div>
            </div>
        );
    }
}

export default SchemaTree;
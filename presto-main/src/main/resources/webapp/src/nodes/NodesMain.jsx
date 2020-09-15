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
import Header from '../queryeditor/components/Header';
import Footer from "../queryeditor/components/Footer";
import { formatDataSizeBytes } from "../utils";
import NavigationMenu from "../NavigationMenu";
import OverviewStore from "../overview/OverviewStore";

class NodesMain extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tableData: [],
        }
        this._onChange = this._onChange.bind(this);
    }
    componentDidMount() {
        OverviewStore.listen(this._onChange);
    }

    _onChange(data) {
        let table = [];
        if (data.memoryData) {
            Object.keys(data.memoryData).map(key => {
                let obj = {};
                obj.id = key.slice(0, key.indexOf(" "));
                obj.ip = key.slice(key.indexOf("[") + 1, key.indexOf("]"))
                obj.count = data.memoryData[key].availableProcessors;
                obj.nodeMemory = totalMemory;
                obj.freeMemory = data.memoryData[key].pools.general.freeBytes + (data.memoryData[key].pools.reserved ? data.memoryData[key].pools.reserved.freeBytes : 0);
                table.push(obj);
            })
        }
        this.setState({
            tableData: table
        })
    }

    render() {
        return (
            <div>
                <div className='flex flex-row flex-initial header'>
                    <Header />
                </div>
                <div className='nodes'>
                    <NavigationMenu active={"nodes"} />
                    <div className="line-right">
                        <div className="line-show">
                            <div className="summary-table">
                                <h3>Cluster info</h3>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>IP</th>
                                            <th>CPU Count</th>
                                            <th>Node Memory</th>
                                            <th>Free Memory</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.tableData.map((ele, index) => (
                                            <tr key={index}>
                                                <td>{ele.id}</td>
                                                <td>{ele.ip}</td>
                                                <td>{ele.count}</td>
                                                <td>{formatDataSizeBytes(ele.nodeMemory)}</td>
                                                <td>{formatDataSizeBytes(ele.freeMemory)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='flex flex-row flex-initial footer'>
                    <Footer />
                </div>
            </div>
        )
    }
}

export default NodesMain;
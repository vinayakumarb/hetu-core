import  React from "react";
import EchartPart from "./EchartPart";
import Header from '../queryeditor/components/Header';
import Footer from "../queryeditor/components/Footer";
import OverviewActions from "./OverviewActions";
import OverviewStore from "./OverviewStore";
import {formatDataSizeBytes} from "../utils";
class OverviewMain extends React.Component{
    constructor(props) {
        super(props);
        this.state={
            checkStatus:{
                checkOne:true,
                checkTwo:true,
                checkThree:true,
                checkFour:true,
                checkFive:true,
                checkSix:true,
                checkSeven:true,
                checkEight:true,
                checkNine:true
            },
            chartName:['Running Queries','Active Workers','Rows/Sec','Queued Queries','Runnable drivers','Bytes/Sec','Blocked Queries','Reserved Memory(B)','Worker Parallelism'],
            totalNodes:0,
            totalMemory:0,
            memoryUsed:0,
            processCpuLoad:0,
            systemCpuLoad:0,
            tableData:[]
        }
        this._onChange=this._onChange.bind(this)
    }
    componentDidMount() {
        OverviewStore.listen(this._onChange);
    }

    _onChange(data){
        let table=[];
        if(data.memoryData){
            Object.keys(data.memoryData).map(key => {
                let obj = {};
                obj.id = key.slice(0, key.indexOf(" "));
                obj.ip = key.slice(key.indexOf("[") + 1, key.indexOf("]"))
                obj.count = data.memoryData[key].availableProcessors;
                let totalMemory = data.memoryData[key].totalNodeMemory.slice(0, -1);
                obj.nodeMemory = totalMemory;
                obj.freeMemory = data.memoryData[key].pools.general.freeBytes + (data.memoryData[key].pools.reserved ? data.memoryData[key].pools.reserved.freeBytes : 0);
                table.push(obj);
            })
        }
        this.setState({
            totalNodes:data.memoryData ? Object.keys(data.memoryData).length : '',
            totalMemory:data.lineData.totalMemory,
            memoryUsed:data.lineData.reservedMemory,
            processCpuLoad:(data.lineData.processCpuLoad*100).toFixed(2)+'%',
            systemCpuLoad:(data.lineData.systemCpuLoad*100).toFixed(2)+'%',
            tableData:table
        })
    }

    changeState(name){
        let state = this.state;
        state.checkStatus[name] = !state.checkStatus[name];
        this.setState(state);
    }


    render() {
        return(
            <div>
                <div className='flex flex-row flex-initial header'>
                    <Header />
                </div>
                <div className='overview'>
                    <div className="menu-left">
                        <ul>
                            <li>
                                <a href="./queryeditor.html">
                                    <div><i className="fa fa-pencil-square-o"></i></div>
                                    <div>Query Editor</div>
                                </a>
                            </li>
                            <li className="active">
                                <a href="#">
                                    <div><i className="fa fa-line-chart"></i></div>
                                    <div>Metrics</div>
                                </a>
                            </li>
                            <li>
                                <a href="#">
                                    <div><i className="fa fa-server"></i></div>
                                    <div>Nodes</div>
                                </a>
                            </li>
                            <li>
                                <a href="#">
                                    <div><i className="fa fa-history"></i></div>
                                    <div>Query History</div>
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="line-right">
                        <h2>Overview Dashboard</h2>
                        <div className="checkbox-group">
                            <ul>
                                <li onClick={this.changeState.bind(this,'checkOne')}><span><i className={`fa ${!this.state.checkStatus.checkOne ? 'fa-square-o' : 'fa-check-square-o'}`}></i>Running Queries</span></li>
                                <li onClick={this.changeState.bind(this,'checkTwo')}><span><i className={`fa ${!this.state.checkStatus.checkTwo ? 'fa-square-o' : 'fa-check-square-o'}`}></i>Active Workers</span></li>
                                <li onClick={this.changeState.bind(this,'checkThree')}><span><i className={`fa ${!this.state.checkStatus.checkThree ? 'fa-square-o' : 'fa-check-square-o'}`}></i>Rows/Sec</span></li>
                                <li onClick={this.changeState.bind(this,'checkFour')}><span><i className={`fa ${!this.state.checkStatus.checkFour ? 'fa-square-o' : 'fa-check-square-o'}`}></i>Queued Queries</span></li>
                                <li onClick={this.changeState.bind(this,'checkFive')}><span><i className={`fa ${!this.state.checkStatus.checkFive ? 'fa-square-o' : 'fa-check-square-o'}`}></i>Runnable drivers</span></li>
                                <li onClick={this.changeState.bind(this,'checkSix')}><span><i className={`fa ${!this.state.checkStatus.checkSix ? 'fa-square-o' : 'fa-check-square-o'}`}></i>Bytes/Sec</span></li>
                                <li onClick={this.changeState.bind(this,'checkSeven')}><span><i className={`fa ${!this.state.checkStatus.checkSeven ? 'fa-square-o' : 'fa-check-square-o'}`}></i>Blocked Queries</span></li>
                                <li onClick={this.changeState.bind(this,'checkEight')}><span><i className={`fa ${!this.state.checkStatus.checkEight ? 'fa-square-o' : 'fa-check-square-o'}`}></i>Reserved Memory(B)</span></li>
                                <li onClick={this.changeState.bind(this,'checkNine')}><span><i className={`fa ${!this.state.checkStatus.checkNine ? 'fa-square-o' : 'fa-check-square-o'}`}></i>Worker Parallelism</span></li>
                            </ul>
                        </div>
                        <div className="line-show">
                            <div className="line-part">
                                <EchartPart state={this.state.checkStatus} name={this.state.chartName} />
                            </div>
                            <div className="summary-info">
                                <div className="summary-detail">
                                    <h3>Summary Info</h3>
                                    <div className="border-bottom">
                                        <p className="font-20">Total Nodes <span className="float-right color-2b610a">{this.state.totalNodes}</span></p>
                                    </div>
                                    <div className="border-bottom">
                                        <p className="font-20 padding-top-10">Total Memory <span className="float-right color-2b610a">{formatDataSizeBytes(this.state.totalMemory)}</span></p>
                                    </div>
                                    <div className="border-bottom">
                                        <p className="font-20 padding-top-10">Memory Used <span className="float-right color-2b610a">{this.state.memoryUsed}</span></p>
                                    </div>
                                    <div className="border-bottom">
                                        <p className="font-20 padding-top-10">Process CPU Load <span className="float-right color-2b610a">{this.state.processCpuLoad}</span></p>
                                    </div>
                                    <div>
                                        <p className="font-20 padding-top-10">System CPU Load <span className="float-right color-2b610a">{this.state.systemCpuLoad}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default OverviewMain;
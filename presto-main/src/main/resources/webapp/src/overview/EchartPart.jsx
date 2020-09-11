import  React from "react";
import echarts from 'echarts/lib/echarts';
import "echarts/lib/chart/line";
import "echarts/lib/component/tooltip";
import "echarts/lib/component/title";
import OverviewActions from "./OverviewActions";
import OverviewStore from "./OverviewStore";
import {formatCount, formatDataSizeBytes} from "../utils";
class EchartPart extends React.Component{
    constructor(props) {
        super(props);
        this.state={
            step:10,
            timer:null,
            chartCpu:[],
            chart1:[],
            chart2:[],
            chart3:[],
            chart4:[],
            chart5:[],
            chart6:[],
            chart7:[],
            chart8:[],
            chart9:[],
            chartRef:Object.keys(this.props.state),
            lastRow:null,
            lastByte:null,
            lastWorker:null,
            memoryInit:false,
            unitArr:['quantity','quantity','quantity','quantity','quantity','bytes','quantity','bytes','quantity']
        };
        this._onChange=this._onChange.bind(this)
    }
    //echarts
    componentDidMount() {
        this.setXAxis();
        OverviewActions.getData();
        OverviewActions.getMemoryData();
        OverviewStore.listen(this._onChange);
        this.lineDatas();
    }
    componentWillUnmount() {
        clearInterval(this.state.timer);
    }

    //obtained data per sec
    lineDatas(){
        this.state.timer=setInterval(()=>{
            OverviewActions.getData();
            OverviewActions.getMemoryData();
        },1000)
    }
    //refresh line
    _onChange(data){
        if(data.requestNum%2===0){
            // if(!this.state.memoryInit && data.memoryData){
            //     let  mychart1=echarts.init(this.refs.cpuLoad);
            //     let option=mychart1.getOption();
            //     let memoryInitData=[];
            //     let cpuSeries={};
            //     let initOp=option.series[0];
            //     Object.keys(data.memoryData).map(key=>{
            //         let op = Object.assign({}, initOp);
            //         op.name=key.slice(0,key.indexOf(" "));
            //         op.data=[...this.delete(this.state.chartCpu),[new Date().format('yyyy-MM-dd hh:mm:ss'),(data.memoryData[key].processCpuLoad*100).toFixed(4)]];
            //         op.data = this.state.step===10 ? op.data.slice(1200):this.state.step===20 ? op.data.slice(600):op.data;
            //         memoryInitData.push(op);
            //         cpuSeries[key]=[...this.delete(this.state.chartCpu),[new Date().format('yyyy-MM-dd hh:mm:ss'),(data.memoryData[key].processCpuLoad*100).toFixed(4)]];
            //     })
            //     option.series=memoryInitData;
            //     mychart1.setOption(option);
            //     this.setState({
            //         memoryInit:true,
            //         chartCpu:cpuSeries
            //     })
            // }else{
            //     let dataCpu=this.state.chartCpu;
            //     let  mychart1=echarts.init(this.refs.cpuLoad);
            //     let option=mychart1.getOption();
            //     let memoryInitData=option.series;
            //     Object.keys(data.memoryData).map(key=>{
            //         dataCpu[key] = [...this.delete(dataCpu[key]),[new Date().format('yyyy-MM-dd hh:mm:ss'),(data.memoryData[key].processCpuLoad*100).toFixed(4)]];
            //         for(let i=0,len=memoryInitData.length;i<len;i++){
            //             if(memoryInitData[i].name===key.slice(0,key.indexOf(" "))){
            //                 memoryInitData[i].data=this.state.step===10 ? dataCpu[key].slice(1200):this.state.step===20 ? dataCpu[key].slice(600):dataCpu[key];
            //             }
            //         }
            //     })
            //     option.series=memoryInitData;
            //     mychart1.setOption(option);
            //     this.setState({
            //         chartCpu:dataCpu
            //     })
            // }
            let lastRow=this.state.lastRow ? data.lineData.totalInputRows-this.state.lastRow : data.lineData.totalInputRows;
            let lastByte=this.state.lastByte? data.lineData.totalInputBytes-this.state.lastByte : data.lineData.totalInputBytes;
            let lastWorker=this.state.lastWorker? (data.lineData.totalCpuTimeSecs-this.state.lastWorker)/data.lineData.activeWorkers : data.lineData.totalCpuTimeSecs;
            this.setState({
                chartCpu:[...this.delete(this.state.chartCpu),[new Date().format('yyyy-MM-dd hh:mm:ss'), (data.lineData.systemCpuLoad * 100).toFixed(4)]],
                chart1:[...this.delete(this.state.chart1),[new Date().format('yyyy-MM-dd hh:mm:ss'),data.lineData.runningQueries]],
                chart2:[...this.delete(this.state.chart2),[new Date().format('yyyy-MM-dd hh:mm:ss'),data.lineData.activeWorkers]],
                chart3:[...this.delete(this.state.chart3),[new Date().format('yyyy-MM-dd hh:mm:ss'),lastRow]],
                chart4:[...this.delete(this.state.chart4),[new Date().format('yyyy-MM-dd hh:mm:ss'),data.lineData.queuedQueries]],
                chart5:[...this.delete(this.state.chart5),[new Date().format('yyyy-MM-dd hh:mm:ss'),data.lineData.runningDrivers]],
                chart6:[...this.delete(this.state.chart6),[new Date().format('yyyy-MM-dd hh:mm:ss'),lastByte]],
                chart7:[...this.delete(this.state.chart7),[new Date().format('yyyy-MM-dd hh:mm:ss'),data.lineData.blockedQueries]],
                chart8:[...this.delete(this.state.chart8),[new Date().format('yyyy-MM-dd hh:mm:ss'),data.lineData.reservedMemory]],
                chart9:[...this.delete(this.state.chart9),[new Date().format('yyyy-MM-dd hh:mm:ss'),lastWorker]],
                lastRow:data.lineData.totalInputRows,
                lastByte:data.lineData.totalInputBytes,
                lastWorker:data.lineData.totalCpuTimeSecs,
            });
            if (!this.refs.cpuLoad.className) {
                let mychart = echarts.init(this.refs.cpuLoad);
                let option = mychart.getOption();
                option.series[0].data = this.state.step === 10 ? this.state.chartCpu.slice(1200) : this.state.step === 20 ? this.state.chartCpu.slice(600) : this.state.chartCpu;
                option.series[0].areaStyle = {
                    color: "#41BB04",
                    shadowBlur: 10,
                    opacity: 0.1
                };
                option.series[0].lineStyle = {color: "#137113"};
                option.series[0].itemStyle = {color: "#137113"};
                option.yAxis = {max: 100, min: 0, type: "value"};
                mychart.setOption(option);
            }
            for(let i=0;i<this.props.name.length;i++){
                if(!this.refs[this.state.chartRef[i]].className){
                    let  mychart=echarts.init(this.refs[this.state.chartRef[i]]);
                    let option=mychart.getOption();
                    option.series[0].data = this.state.step===10 ? this.state['chart'+parseInt(i+1)].slice(1200):this.state.step===20 ? this.state['chart'+parseInt(i+1)].slice(600):this.state['chart'+parseInt(i+1)];
                    option.series[0].areaStyle = {
                        color: "#c3c683",
                        shadowBlur: 10,
                        opacity: 0.1
                    };
                    option.series[0].lineStyle = {color: "#b6a019"};
                    option.series[0].itemStyle = {color: "#b6a019"};
                    mychart.setOption(option);
                }
            }
        }
    }

    // delete first data
    delete(arr){
        arr.splice(0,1);
        return arr;
    }
    //according to step to set XAxis data
    setXAxis(){
        let arr = [];
        for(let i =0,len=30*60;i<len;i++){
            arr[i]=[new Date(new Date().getTime()-1000*i).format('yyyy-MM-dd hh:mm:ss'),''];
        }
        arr=arr.reverse();
        this.setState({
            chartCpu:[...arr],
            chart1:[...arr],
            chart2:[...arr],
            chart3:[...arr],
            chart4:[...arr],
            chart5:[...arr],
            chart6:[...arr],
            chart7:[...arr],
            chart8:[...arr],
            chart9:[...arr]
        });
        let  mychart1=echarts.init(this.refs.cpuLoad);
        mychart1.setOption({
            title:{text:'CPU Usage'},
            tooltip:{
                trigger:'axis'
            },
            xAxis:{
                type:'time',
                name:'time',
                interval:60*1000*this.state.step/10,
                boundaryGap: false,
                axisLabel:{
                    formatter:function(value,index){
                        if (index % 2 == 1) {
                            return "";
                        }
                        let date=new Date(value).format("yyyy-MM-dd hh:mm:ss");
                        return date.slice(11,16);
                    }
                }
            },
            yAxis:{
                name:'usage(%)',
                axisTick:{
                    show:false
                },
                axisLabel:{
                    formatter: function (value, index) {
                        if (index % 2 == 1) {
                            return "";
                        }
                        return value;
                    }
                }
            },
            series:[{
                type:'line',
                symbol:'none',
                data:[]
            }]
        })
        for(let i=0;i<this.props.name.length;i++){
            if(!this.refs[this.state.chartRef[i]].className){
                let  mychart=echarts.init(this.refs[this.state.chartRef[i]]);
                mychart.setOption({
                    title:{text:this.props.name[i]},
                    tooltip:{
                        trigger:'axis'
                    },
                    xAxis:{
                        type:'time',
                        name:'time',
                        interval:60*1000*this.state.step/10,
                        boundaryGap: false,
                        axisLabel:{
                            formatter:function(value,index){
                                if (index % 2 == 1) {
                                    return "";
                                }
                                let date=new Date(value).format("yyyy-MM-dd hh:mm:ss");
                                return date.slice(11,16);
                            }
                        }
                    },
                    yAxis:{
                        name:this.state.unitArr[i],
                        axisTick:{
                            show:false
                        },
                        axisLabel:{
                            formatter: function (name, value, index) {
                                if (index % 2 == 1) {
                                    return "";
                                }
                                if (name === 'quantity') {
                                    return formatCount(value);
                                }
                                else if (name === 'bytes') {
                                    return formatDataSizeBytes(value);
                                }
                                else {
                                    return value;
                                }
                            }.bind(null, this.state.unitArr[i])
                        }
                    },
                    series:[{
                        type:'line',
                        symbol:'none',
                        data:this.state.step===10 ? this.state['chart'+parseInt(i+1)].slice(1200):this.state.step===20 ? this.state['chart'+parseInt(i+1)].slice(600):this.state['chart'+parseInt(i+1)]
                    }]
                })
            }
        }
    }

    selected(e){
        clearInterval(this.state.timer);
        e.preventDefault();
        let val=e.target.selectedIndex===0?10:e.target.selectedIndex===1?20:30;
        let state = this.state;
        state.step = val;
        this.setState(state);
        for(let i=0;i<this.props.name.length;i++){
            if(!this.refs[this.state.chartRef[i]].className){
                let  mychart=echarts.init(this.refs[this.state.chartRef[i]]);
                let option=mychart.getOption();
                option.xAxis[0].interval=60*1000*this.state.step/10;
                // option.series[0].data=[];
                mychart.setOption(option);
            }
        }
        let  mychart1=echarts.init(this.refs.cpuLoad);
        let option=mychart1.getOption();
        option.xAxis[0].interval=60*1000*this.state.step/10;
        mychart1.setOption(option);
        OverviewActions.getData();
        this.lineDatas();
    }

    render() {
        let style = {height: "25vh", width: "30vw"}
        return(
            <div>
                <div className="select-part">
                    <select onChange={this.selected.bind(this)} value={this.state.step}>
                        <option value="10">Last 10 minutes</option>
                        <option value="20">Last 20 minutes</option>
                        <option value="30">Last 30 minutes</option>
                    </select>
                </div>
                <div className="overviewGraphContainer">
                    <div className="overviewChart">
                        <div ref="cpuLoad" style={style}/>
                    </div>
                    {Object.keys(this.props.state).map((key, index) => (
                        <div className="overviewChart" key={index}>
                            <div ref={key} className={this.props.state[key] ? '' : 'display-none'} style={style}/>
                        </div>
                    ))}
                </div>
            </div>

        )
    }
}

export default EchartPart;
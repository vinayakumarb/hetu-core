import React from 'react';

import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import SchemaTree from "./SchemaTree";


class LeftPanel extends React.Component {
    render() {
        return (
            <div>
                <Tabs className="leftTabContainer">
                    <TabList>
                        <Tab>Schema</Tab>
                        <Tab>All queries</Tab>
                    </TabList>
                    <TabPanel>
                        <SchemaTree />
                    </TabPanel>
                </Tabs>
            </div>
        )
    }
}
export default LeftPanel;
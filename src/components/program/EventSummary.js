import React from "react";
import Tabs2 from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AppBar from '@material-ui/core/AppBar';
import Badge from '@material-ui/core/Badge';
import { withStyles } from "@material-ui/core/styles";

import { inject, observer } from "mobx-react";
import Typography from "@material-ui/core/Typography";
import * as PropTypes from "prop-types";
import { Table, Tabs } from 'antd';

import Step6 from "./step6";

const styles = theme => ({
    margin: {
        margin: theme.spacing.unit * 2,
    },
    padding: {
        padding: `0 ${theme.spacing.unit * 2}px`,
    },
    root: {
        flexGrow: 1,
        width: '100%',
        backgroundColor: theme.palette.background.paper,
    },
    primary: {
        backgroundColor: '#4CA799'
    }
});

function TabContainer(props) {
    return (
        <Typography component="div" style={{ padding: 8 * 3 }}>
            {props.children}
        </Typography>
    );
}

TabContainer.propTypes = {
    children: PropTypes.node.isRequired,
};

const eventColumns = [
    { title: 'Event ID', dataIndex: 'event', key: 'event' },
    { title: 'Organisation', dataIndex: 'orgUnit', key: 'orgUnit' },
    { title: 'Event Date', dataIndex: 'eventDate', key: 'eventDate' },
    { title: 'Program Stage', dataIndex: 'programStage', key: 'programStage' }
];

const conflictColumns = [
    { title: 'Row', dataIndex: 'row', key: 'row' },
    { title: 'Column', dataIndex: 'column', key: 'column' },
    { title: 'Error', dataIndex: 'error', key: 'error' }
];

const dataValueColumns = [
    { title: 'UID', dataIndex: 'dataElement', key: 'dataElement' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Value', dataIndex: 'value', key: 'value' }
];



const TabPane = Tabs.TabPane;

@inject('IntegrationStore')
@observer
class Summary extends React.Component {

    integrationStore = null;

    constructor(props) {
        super(props);
        const { IntegrationStore } = props;
        this.integrationStore = IntegrationStore;
        this.state = {
            value: 0,
        };
    }


    handleChange = (event, value) => {
        this.setState({ value });
    };

    render() {
        const { value } = this.state;
        const { classes, displayResponse } = this.props;
        const { program } = this.integrationStore;
        const {
            newEvents,
            eventsUpdate,
            conflicts,
            errors
        } = program.processedSummary;
        return (
            <div className={classes.root}>
                <AppBar position="static" color="primary">
                    <Tabs2
                        value={value}
                        onChange={this.handleChange}
                        variant="scrollable"
                        scrollButtons="on"
                        indicatorColor="secondary"
                        textColor="inherit"
                    >
                        <Tab value={0} label={<Badge color="primary" className={classes.padding} classes={{ colorPrimary: classes.primary }}
                            badgeContent={newEvents.length}>New Events</Badge>} />

                        <Tab value={1} label={<Badge color="primary" className={classes.padding} classes={{ colorPrimary: classes.primary }}
                            badgeContent={eventsUpdate.length}>Event Updates</Badge>} />
                        <Tab value={2} label={<Badge color="secondary" className={classes.padding}
                            badgeContent={conflicts.length}>Conflicts</Badge>} />
                        <Tab value={3} label={<Badge color="secondary" className={classes.padding}
                            badgeContent={errors.length}>Errors</Badge>} />

                        {displayResponse ? <Tab value={4} label="Response" /> : null}
                    </Tabs2>
                </AppBar>

                {value === 0 && <TabContainer>
                    <Tabs defaultActiveKey="1">
                        <TabPane tab="Preview" key="1">
                            <Table
                                columns={eventColumns}
                                rowKey="event"
                                expandedRowRender={record => <Table
                                    columns={dataValueColumns}
                                    dataSource={record.dataValues}
                                    rowKey="dataElement"
                                />}
                                dataSource={program.currentNewEvents}
                            />
                        </TabPane>
                        <TabPane tab="Payload" key="2">
                            <textarea cols={50} rows={30} defaultValue={JSON.stringify({ events: newEvents }, null, 2)} />
                        </TabPane>
                    </Tabs>
                </TabContainer>}

                {value === 1 && <TabContainer>
                    <Tabs defaultActiveKey="1">
                        <TabPane tab="Preview" key="1">
                            <Table
                                columns={eventColumns}
                                rowKey="event"
                                expandedRowRender={record => <Table
                                    columns={dataValueColumns}
                                    dataSource={record.dataValues}
                                    rowKey="dataElement"
                                />}
                                dataSource={program.currentEventUpdates}
                            />
                        </TabPane>
                        <TabPane tab="Payload" key="2">
                            <textarea cols={50} rows={30}
                                defaultValue={JSON.stringify({ events: eventsUpdate }, null, 2)} />
                        </TabPane>
                    </Tabs>
                </TabContainer>}
                {value === 2 && <TabContainer>

                    <Table
                        columns={conflictColumns}
                        rowKey="id"
                        dataSource={conflicts}
                    />

                </TabContainer>}
                {value === 3 && <TabContainer>
                    <Table
                        columns={conflictColumns}
                        rowKey="row"
                        dataSource={errors}
                    />
                </TabContainer>}
                {value === 4 && displayResponse && <div><br /><br /><Step6 /></div>}
            </div>
        );
    }
}

Summary.propTypes = {
    displayResponse: PropTypes.bool,
};

export default withStyles(styles)(Summary);

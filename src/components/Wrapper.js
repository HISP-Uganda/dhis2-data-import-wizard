import { inject, observer } from 'mobx-react';
import React from 'react';
import Program from './program';
import { Route } from "react-router-dom";
import Aggregate from "./aggregate";
import Schedule from "./schedule";
import { withStyles } from "@material-ui/core/styles";
import styles from "./styles";
import HeaderBar from '@dhis2/d2-ui-header-bar';
import { Link } from "react-router-dom";
import * as PropTypes from 'prop-types';
import { NotificationContainer } from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import LinearProgress from '@material-ui/core/LinearProgress';

import {
    Menu, Icon,
} from 'antd';

@inject('IntegrationStore')
@observer
class Wrapper extends React.Component {
    integrationStore = null;

    constructor(props) {
        super(props);
        const { IntegrationStore } = props;
        this.integrationStore = IntegrationStore;
    }
    render() {
        return <div>><HeaderBar d2={this.props.d2} />
            {this.integrationStore.dialogOpen}
            <div style={{ height: 48 }} />
            <Menu theme="light" defaultSelectedKeys={['1']} mode="horizontal">
                <Menu.Item key="1">
                    <Link to="/">
                        <Icon type="ordered-list" />
                        <span>Tracker</span>
                    </Link>
                </Menu.Item>
                <Menu.Item key="2">
                    <Link to="/aggregates">
                        <Icon type="calculator" />
                        <span>Aggregate</span>
                    </Link>
                </Menu.Item>

                <Menu.Item key="3">
                    <Link to="/schedules">
                        <Icon type="schedule" />
                        <span>Schedules</span>
                    </Link>
                </Menu.Item>
            </Menu>
            <Route
                exact
                path='/'
                component={() => <Program d2={this.props.d2}
                    baseUrl={this.props.baseUrl} />} />
            <Route
                path='/aggregates'
                component={() => <Aggregate d2={this.props.d2} />} />

            <Route
                path='/schedules'
                component={() => <Schedule d2={this.props.d2} />} />
            <NotificationContainer />
        </div>
    }
}

Wrapper.propTypes = {
    d2: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Wrapper);

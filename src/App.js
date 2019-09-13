import React, { Component } from 'react';
import { HashRouter as Router, Route } from "react-router-dom";
import { NotificationContainer } from 'react-notifications';
import 'react-notifications/lib/notifications.css';

import { Provider } from "mobx-react";
import * as PropTypes from 'prop-types';
import IntegrationStore from './stores/IntegrationStore'
import Program from './components/program';

import D2UIApp from '@dhis2/d2-ui-app';
import Aggregate from "./components/aggregate";
import Schedule from "./components/schedule";
import { withStyles } from "@material-ui/core/styles";
import styles from "./components/styles";
import HeaderBar from '@dhis2/d2-ui-header-bar';
import { Link } from "react-router-dom";


import {
  Menu, Icon,
} from 'antd';

import "antd/dist/antd.css";

import './App.css';
import { createMuiTheme } from "@material-ui/core";
import MuiThemeProvider from "@material-ui/core/styles/MuiThemeProvider";

const theme = createMuiTheme({
  typography: {
    useNextVariants: true,
  },
  palette: {
    primary: {
      main: '#2C6693'
    }
  }
});

class App extends Component {

  onCollapse = (collapsed) => {
    this.setState({ collapsed });
  };

  constructor(props) {
    super(props);
    const { d2 } = props;
    d2.i18n.translations['id'] = 'Id';
    d2.i18n.translations['program_name'] = 'Program Name';
    d2.i18n.translations['program_type'] = 'Program Type';
    d2.i18n.translations['last_updated'] = 'Last Updated';
    d2.i18n.translations['last_run'] = 'Last Run';
    d2.i18n.translations['run'] = 'Run';
    d2.i18n.translations['schedule'] = 'Schedule';
    d2.i18n.translations['logs'] = 'Logs';
    d2.i18n.translations['delete'] = 'Delete';
    d2.i18n.translations['actions'] = 'Actions';
    d2.i18n.translations['display_name'] = 'Program Name';
    d2.i18n.translations['mapping_id'] = 'Mapping Id';
    d2.i18n.translations['name'] = 'Name';
    d2.i18n.translations['app_search_placeholder'] = 'Search Apps';
    d2.i18n.translations['manage_my_apps'] = 'Manage My Apps';
    d2.i18n.translations['settings'] = 'Settings';
    d2.i18n.translations['account'] = 'Account';
    d2.i18n.translations['profile'] = 'Profile';
    d2.i18n.translations['log_out'] = 'Logout';
    d2.i18n.translations['help'] = 'Help';
    d2.i18n.translations['about_dhis2'] = 'About DHIS2';
    d2.i18n.translations['aggregate_id'] = 'Id';
    d2.i18n.translations['upload'] = 'Upload';
    d2.i18n.translations['code'] = 'Code';
    d2.i18n.translations['download'] = 'Import from API';
    d2.i18n.translations['template'] = 'Download Mapping';
    d2.i18n.translations['year'] = 'Year';
    d2.i18n.translations['sixMonth'] = 'Six Month';
    d2.i18n.translations['jan-jun'] = 'Jan - Jun';
    d2.i18n.translations['jul-dec'] = 'Jul - Dec';

    d2.i18n.translations['assign_all'] = 'Assign all';
    d2.i18n.translations['hidden_by_filters'] = 'Hidden by filters';
    d2.i18n.translations['day'] = 'Day';

    d2.i18n.translations['year'] = 'Year';
    d2.i18n.translations['week'] = 'Week';
    d2.i18n.translations['day'] = 'Day';
    d2.i18n.translations['month'] = 'Month';
    d2.i18n.translations['quarter'] = 'Quarter';
    d2.i18n.translations['jan'] = 'January';
    d2.i18n.translations['feb'] = 'February';
    d2.i18n.translations['mar'] = 'March';
    d2.i18n.translations['apr'] = 'April';
    d2.i18n.translations['may'] = 'May';
    d2.i18n.translations['jun'] = 'June';
    d2.i18n.translations['jul'] = 'July';
    d2.i18n.translations['aug'] = 'August';
    d2.i18n.translations['sep'] = 'September';
    d2.i18n.translations['oct'] = 'October';
    d2.i18n.translations['nov'] = 'November';
    d2.i18n.translations['dec'] = 'December';
    d2.i18n.translations['Q1'] = 'Q1';
    d2.i18n.translations['Q2'] = 'Q2';
    d2.i18n.translations['Q3'] = 'Q3';
    d2.i18n.translations['Q4'] = 'Q4';
    d2.i18n.translations['mapping_name'] = 'Mapping Name';
    d2.i18n.translations['mapping_description'] = 'Mapping Description';
    d2.i18n.translations['last'] = 'Last Run';
    d2.i18n.translations['next'] = 'Next Run';
    d2.i18n.translations['created'] = 'Created';

    this.state = {
      d2,
      baseUrl: props.baseUrl
    };
  }

  getChildContext() {
    return { d2: this.state.d2 };
  }

  render() {
    return (
      <Provider IntegrationStore={IntegrationStore}>
        <Router>
          <D2UIApp>
            <MuiThemeProvider theme={theme}>
              <HeaderBar d2={this.state.d2} />
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
                component={() => <Program d2={this.state.d2}
                  baseUrl={this.state.baseUrl} />} />
              <Route
                path='/aggregates'
                component={() => <Aggregate d2={this.state.d2} />} />

              <Route
                path='/schedules'
                component={() => <Schedule d2={this.state.d2} />} />
              <NotificationContainer />
            </MuiThemeProvider>
          </D2UIApp>
        </Router>
      </Provider>
    );
  }
}

App.childContextTypes = {
  d2: PropTypes.object,
};

App.propTypes = {
  d2: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};


export default withStyles(styles)(App);

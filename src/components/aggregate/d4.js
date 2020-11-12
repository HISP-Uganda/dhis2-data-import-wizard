import { inject, observer } from "mobx-react";
import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { Table, Tabs } from "antd";
import * as PropTypes from "prop-types";
import Typography from "@material-ui/core/Typography";
import Badge from "@material-ui/core/Badge";
import Tabs2 from "@material-ui/core/Tabs";
import AppBar from "@material-ui/core/AppBar";
import Tab from "@material-ui/core/Tab";
import ImportSummary from "./ImportSummary";

const TabPane = Tabs.TabPane;

const columns = [
  { title: "Data Element", dataIndex: "dataElement", key: "dataElement" },
  {
    title: "Category Option",
    dataIndex: "categoryOptionCombo",
    key: "categoryOptionCombo",
  },
  {
    title: "Attribute Combo",
    dataIndex: "attributeOptionCombo",
    key: "attributeOptionCombo",
  },
  { title: "Period", dataIndex: "period", key: "period" },
  { title: "Organisation", dataIndex: "orgUnit", key: "orgUnit" },
  { title: "Value", dataIndex: "value", key: "value" },
];

const conflictColumns = [{ title: "Error", dataIndex: "error", key: "error" }];

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

const styles = (theme) => ({
  margin: {
    margin: theme.spacing.unit * 2,
  },
  padding: {
    padding: `0 ${theme.spacing.unit * 2}px`,
  },
  root: {
    flexGrow: 1,
    width: "100%",
    backgroundColor: theme.palette.background.paper,
  },
  primary: {
    backgroundColor: "#4CA799",
  },
});

@inject("IntegrationStore")
@observer
class D4 extends React.Component {
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
    const { dataSet } = this.integrationStore;
    const { classes } = this.props;
    const { value } = this.state;
    return (
      <div>
        <AppBar position="static" color="primary">
          <Tabs2
            value={value}
            onChange={this.handleChange}
            variant="scrollable"
            scrollButtons="on"
            indicatorColor="secondary"
            textColor="inherit"
          >
            <Tab
              value={0}
              label={
                <Badge
                  color="primary"
                  className={classes.padding}
                  classes={{ colorPrimary: classes.primary }}
                  badgeContent={dataSet.processed.dataValues.length}
                >
                  Data
                </Badge>
              }
            />
            <Tab
              value={1}
              label={
                <Badge
                  color="secondary"
                  className={classes.padding}
                  badgeContent={dataSet.uniqueErrors.length}
                >
                  Errors
                </Badge>
              }
            />

            {dataSet.isUploadingFromPage ? (
              <Tab value={2} label="Summary" />
            ) : null}
          </Tabs2>
        </AppBar>

        {value === 0 && (
          <TabContainer>
            <Tabs defaultActiveKey="1">
              <TabPane tab="Info" key="1">
                <Table
                  columns={columns}
                  rowKey="id"
                  dataSource={dataSet.finalData}
                />
              </TabPane>
              <TabPane tab="Payload" key="2">
                <textarea
                  cols={50}
                  rows={30}
                  defaultValue={JSON.stringify(
                    { dataValues: dataSet.processed.dataValues },
                    null,
                    2
                  )}
                ></textarea>
              </TabPane>
            </Tabs>
          </TabContainer>
        )}

        {value === 1 && (
          <TabContainer>
            <Table
              columns={conflictColumns}
              rowKey="error"
              dataSource={dataSet.uniqueErrors}
            />
          </TabContainer>
        )}

        {dataSet.isUploadingFromPage && value === 2 && (
          <TabContainer>
            <ImportSummary />
          </TabContainer>
        )}
      </div>
    );
  }
}

export default withStyles(styles)(D4);

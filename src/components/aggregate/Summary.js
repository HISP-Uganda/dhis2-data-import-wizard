import { inject, observer } from "mobx-react";
import React from "react";
import { withStyles } from "@material-ui/core/styles";
import TableHead from "@material-ui/core/TableHead/TableHead";
import TableRow from "@material-ui/core/TableRow/TableRow";
import TableCell from "@material-ui/core/TableCell/TableCell";
import TableBody from "@material-ui/core/TableBody/TableBody";
import * as PropTypes from "prop-types";
import Typography from "@material-ui/core/Typography";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import D4 from "./d4";
import MUITable from "@material-ui/core/Table";
import { Table } from "antd";

const columns = [
  { title: "Affected", dataIndex: "object", key: "object" },
  { title: "Message", dataIndex: "value", key: "value" },
];

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

@inject("IntegrationStore")
@observer
class Summary extends React.Component {
  integrationStore = null;

  constructor(props) {
    super(props);
    const { IntegrationStore } = props;
    this.integrationStore = IntegrationStore;
    this.state = {
      value: this.integrationStore.dataSet.isDhis2 ? 1 : 0,
    };
  }

  handleChange = (event, value) => {
    this.setState({ value });
  };

  render() {
    const { classes } = this.props;
    const { value } = this.state;
    const {
      importCount,
      conflicts,
    } = this.integrationStore.dataSet.processedResponses;

    return (
      <div className={classes.root}>
        <AppBar position="static" color="primary">
          <Tabs
            value={value}
            onChange={this.handleChange}
            variant="scrollable"
            scrollButtons="on"
            indicatorColor="secondary"
            textColor="inherit"
          >
            <Tab label="Data" />
            <Tab label="Summary" />
          </Tabs>
        </AppBar>

        {value === 0 && (
          <TabContainer>
            {this.integrationStore.dataSet.isDhis2 ? (
              <div></div>
            ) : this.integrationStore.dataSet.processed ? (
              <D4 />
            ) : (
              <div></div>
            )}
          </TabContainer>
        )}
        {value === 1 && (
          <TabContainer>
            <MUITable>
              <TableHead>
                <TableRow>
                  <TableCell>Message</TableCell>
                  <TableCell>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Imported</TableCell>
                  <TableCell>{importCount.imported}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Updated</TableCell>
                  <TableCell>{importCount.updated}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Ignored</TableCell>
                  <TableCell>{importCount.ignored}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Deleted</TableCell>
                  <TableCell>{importCount.deleted}</TableCell>
                </TableRow>
              </TableBody>
            </MUITable>
            <h4>Conflicts</h4>

            <Table
              columns={columns}
              size="small"
              rowKey="id"
              pagination={{ defaultPageSize: 5 }}
              dataSource={conflicts}
            />
          </TabContainer>
        )}
      </div>
    );
  }
}

export default withStyles(styles)(Summary);

import { Tab, Tabs } from "@dhis2/d2-ui-core";
import Badge from "@material-ui/core/Badge";
import { withStyles } from "@material-ui/core/styles/index";
import { Table } from "antd";
import { inject, observer } from "mobx-react/index";
import React from "react";
import Progress from "../progress";

const styles = (theme) => ({
  margin: {
    margin: theme.spacing.unit * 2,
  },
  padding: {
    padding: `0 ${theme.spacing.unit * 2}px`,
  },
});

const successesColumns = [
  { title: "Type", dataIndex: "type", key: "type" },
  { title: "Reference", dataIndex: "reference", key: "reference" },
  { title: "Imported", dataIndex: "imported", key: "imported" },
  { title: "Updated", dataIndex: "updated", key: "updated" },
  { title: "Deleted", dataIndex: "deleted", key: "deleted" },
];

const conflictColumns = [
  { title: "Affected", dataIndex: "object", key: "object" },
  { title: "Message", dataIndex: "value", key: "value" },
];

const errorColumns = [{ title: "Message", dataIndex: "value", key: "value" }];

@inject("IntegrationStore")
@observer
class Step6 extends React.Component {
  integrationStore = null;

  constructor(props) {
    super(props);
    const { IntegrationStore } = props;
    this.integrationStore = IntegrationStore;
  }

  componentDidMount() {
    if (this.integrationStore.program.isDHIS2) {
      this.integrationStore.program.create();
    } else {
      if (this.integrationStore.program.totalImports > 0) {
        this.integrationStore.program.create();
      }
    }
  }

  render() {
    const { classes } = this.props;
    const {
      errors,
      successes,
      conflicts,
    } = this.integrationStore.program.processedResponses;
    return (
      <div>
        <Tabs>
          <Tab
            label={
              <Badge
                className={classes.padding}
                color="secondary"
                badgeContent={successes.length}
              >
                Successes
              </Badge>
            }
          >
            <Table
              columns={successesColumns}
              dataSource={successes}
              rowKey="reference"
            />
          </Tab>
          <Tab
            label={
              <Badge
                className={classes.padding}
                color="secondary"
                badgeContent={conflicts.length}
              >
                Conflicts
              </Badge>
            }
          >
            <Table
              columns={conflictColumns}
              dataSource={conflicts}
              rowKey="object"
            />
          </Tab>
          <Tab
            label={
              <Badge
                className={classes.padding}
                color="secondary"
                badgeContent={errors.length}
              >
                Errors
              </Badge>
            }
          >
            <Table
              columns={errorColumns}
              dataSource={errors}
              rowKey="message"
            />
          </Tab>
        </Tabs>
        <Progress
          open={this.integrationStore.program.dialogOpen}
          onClose={this.integrationStore.program.closeDialog}
          message={this.integrationStore.program.message}
        />
      </div>
    );
  }
}

export default withStyles(styles)(Step6);

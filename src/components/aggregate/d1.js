import { inject, observer } from "mobx-react";
import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Table from "@dhis2/d2-ui-table";
import TablePagination from "@material-ui/core/TablePagination";
import { InputField } from "@dhis2/d2-ui-core";
import LinearProgress from "@material-ui/core/LinearProgress";

const styles = (theme) => ({});

@inject("IntegrationStore")
@observer
class D1 extends React.Component {
  integrationStore = null;

  constructor(props) {
    super(props);
    const { IntegrationStore } = props;
    this.integrationStore = IntegrationStore;
  }

  componentDidMount() {
    this.integrationStore.setSearch("", "d1");
    this.integrationStore.fetchDataSets();
  }

  render() {
    return (
      <div>
        {this.integrationStore.dialogOpen ? <LinearProgress /> : null}
        <InputField
          label="Search"
          type="text"
          fullWidth
          value={this.integrationStore.search}
          onChange={(value) => this.integrationStore.setSearch(value, "d1")}
        />
        <Table
          columns={["name", "code"]}
          rows={this.integrationStore.dataSets}
          primaryAction={this.integrationStore.executeEditIfAllowedAgg}
        />
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={this.integrationStore.totalDataSets}
          rowsPerPage={this.integrationStore.paging["d1"]["rowsPerPage"]}
          page={this.integrationStore.paging["d1"]["page"]}
          backIconButtonProps={{
            "aria-label": "Previous Page",
          }}
          nextIconButtonProps={{
            "aria-label": "Next Page",
          }}
          onChangePage={this.integrationStore.handleChangeElementPage("d1")}
          onChangeRowsPerPage={this.integrationStore.handleChangeElementRowsPerPage(
            "d1"
          )}
        />
      </div>
    );
  }
}

export default withStyles(styles)(D1);

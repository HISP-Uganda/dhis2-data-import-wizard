import {inject, observer} from "mobx-react";
import React from "react";
import {withStyles} from "@material-ui/core/styles";
import Table from "@dhis2/d2-ui-table";
import TablePagination from "@material-ui/core/TablePagination";
import Progress from "../progress";
import {InputField} from "@dhis2/d2-ui-core";


const styles = theme => ({});


@inject('IntegrationStore')
@observer
class D1 extends React.Component {

    integrationStore = null;

    constructor(props) {
        super(props);
        const {IntegrationStore} = props;
        this.integrationStore = IntegrationStore;
    }

    componentDidMount() {
        this.integrationStore.setSearch('');
        this.integrationStore.fetchDataSets();
    }

    render() {

        return <div>
            <InputField
                label="Search"
                type="text"
                fullWidth
                value={this.integrationStore.search}
                onChange={(value) => this.integrationStore.setSearch(value)}/>
            <Table
                columns={['name', 'code']}
                rows={this.integrationStore.currentDataSets}
                primaryAction={this.integrationStore.executeEditIfAllowedAgg}
            />
            <TablePagination
                component="div"
                count={this.integrationStore.searchedDataSets.length}
                rowsPerPage={this.integrationStore.paging['d1']['rowsPerPage']}
                page={this.integrationStore.paging['d1']['page']}
                backIconButtonProps={{
                    'aria-label': 'Previous Page',
                }}
                nextIconButtonProps={{
                    'aria-label': 'Next Page',
                }}
                onChangePage={this.integrationStore.handleChangeElementPage('d1')}
                onChangeRowsPerPage={this.integrationStore.handleChangeElementRowsPerPage('d1')}
            />
            <Progress open={this.integrationStore.dialogOpen}
                      onClose={this.integrationStore.closeDialog}/>
        </div>

    }

}

export default withStyles(styles)(D1);


import React from "react";
import Table from '@dhis2/d2-ui-table';
import {withStyles} from "@material-ui/core/styles";
import {inject, observer} from "mobx-react";
import Progress from "../progress";
import TablePagination from "@material-ui/core/TablePagination";
import {InputField} from "@dhis2/d2-ui-core";

const styles = theme => ({});

@inject('IntegrationStore')
@observer
class Step1 extends React.Component {

    integrationStore = null;

    constructor(props) {
        super(props);
        const {IntegrationStore} = props;
        this.integrationStore = IntegrationStore;
    }

    componentDidMount() {
        this.integrationStore.setSearch('');
        this.integrationStore.fetchPrograms();
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
                columns={['displayName', 'programType', 'lastUpdated']}
                rows={this.integrationStore.currentPrograms}
                contextMenuActions={this.integrationStore.multipleCma}
                primaryAction={this.integrationStore.executeEditIfAllowed}
            />
            <TablePagination
                component="div"
                count={this.integrationStore.searchedPrograms.length}
                rowsPerPage={this.integrationStore.paging['step1']['rowsPerPage']}
                page={this.integrationStore.paging['step1']['page']}
                backIconButtonProps={{
                    'aria-label': 'Previous Page',
                }}
                nextIconButtonProps={{
                    'aria-label': 'Next Page',
                }}
                onChangePage={this.integrationStore.handleChangeElementPage('step1')}
                onChangeRowsPerPage={this.integrationStore.handleChangeElementRowsPerPage('step1')}
            />
            <Progress open={this.integrationStore.dialogOpen}
                      onClose={this.integrationStore.closeDialog} message={"Fetching programs"}/>
        </div>
    }
}

export default withStyles(styles)(Step1);

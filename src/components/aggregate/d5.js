import {inject, observer} from "mobx-react";
import React from "react";
import {withStyles} from "@material-ui/core/styles";
import MUITable from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead/TableHead";
import TableRow from "@material-ui/core/TableRow/TableRow";
import TableCell from "@material-ui/core/TableCell/TableCell";
import TableBody from "@material-ui/core/TableBody/TableBody";
import {Table} from 'antd';


import Progress from "../progress";

const styles = theme => ({
    margin: {
        margin: theme.spacing.unit * 2,
    },
    padding: {
        padding: `0 ${theme.spacing.unit * 2}px`,
    },
});
const columns = [
    {title: 'Affected', dataIndex: 'object', key: 'object'},
    {title: 'Message', dataIndex: 'value', key: 'value'}
];

@inject('IntegrationStore')
@observer
class D5 extends React.Component {
    integrationStore = null;

    constructor(props) {
        super(props);
        const {IntegrationStore} = props;
        this.integrationStore = IntegrationStore;
    }

    componentDidMount() {
        this.integrationStore.dataSet.create();
    }

    render() {
        const {importCount, conflicts} = this.integrationStore.dataSet.processedResponses;
        return <div>


            <MUITable>
                <TableHead>
                    <TableRow>
                        <TableCell>Message</TableCell>
                        <TableCell>Value</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell>
                            Imported
                        </TableCell>
                        <TableCell>
                            {importCount.imported}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>
                            Updated
                        </TableCell>
                        <TableCell>
                            {importCount.updated}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>
                            Ignored
                        </TableCell>
                        <TableCell>
                            {importCount.ignored}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>
                            Deleted
                        </TableCell>
                        <TableCell>
                            {importCount.deleted}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </MUITable>
            <h4>Conflicts</h4>

            <Table
                columns={columns}
                rowKey="id"
                dataSource={conflicts}
            />

            <Progress open={this.integrationStore.dataSet.dialogOpen}
                      onClose={this.integrationStore.dataSet.closeDialog} message={this.integrationStore.dataSet.message}/>
        </div>
    }

}

export default withStyles(styles)(D5);

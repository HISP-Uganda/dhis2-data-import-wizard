import { inject, observer } from 'mobx-react';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Select from 'react-select';

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import { Done, Clear, DoneAll } from '@material-ui/icons'
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Typography from "@material-ui/core/Typography";
import Progress from '../progress';
import '../../sticky.css';
import { changeStyle } from "../../utils/data-utils";




const styles = theme => ({
    block: {
        // display: 'block',
        overflow: 'auto',
        maxHeight: 500
    },
    head: {
        backgroundColor: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 10,
    },

    fixed: {
        backgroundColor: "#fff",
        zIndex: 10,
        left: 0
    },
    fixedHead: {
        backgroundColor: "#fff",
        zIndex: 10,
        position: 'relative',
        top: 0,
        left: 0
    },
    hover: {
        "&:hover": {
            backgroundColor: '#E5F7FF'
        }
    }
});


@inject('IntegrationStore')
@observer
class D3 extends React.Component {
    integrationStore = null;

    constructor(props) {
        super(props);
        const { IntegrationStore } = props;
        this.integrationStore = IntegrationStore;
    }

    displayMapping = (de) => {

        if (this.integrationStore.dataSet.templateType.value === '1' || this.integrationStore.dataSet.templateType.value === '6') {
            return <TableCell>
                <Select
                    placeholder="Select mapping"
                    isClearable
                    isSearchable
                    value={de.mapping}
                    options={this.integrationStore.dataSet.uniqueDataElements}
                    onChange={de.handelMappingChange(this.integrationStore.dataSet.data, this.integrationStore.dataSet.categoryOptionComboColumn, this.integrationStore.dataSet.isDhis2)}
                />
            </TableCell>
        }
        return null;
    };

    async componentDidMount() {
        if (this.integrationStore.dataSet.templateType.value === '2') {
            this.integrationStore.dataSet.loadSame();
        } else if (this.integrationStore.dataSet.templateType.value === '1' || this.integrationStore.dataSet.templateType.value === '6') {
            this.integrationStore.dataSet.setDefaults();
        } else if (this.integrationStore.dataSet.templateType.value === '4') {
            this.integrationStore.dataSet.setDefaults();
        } else if (this.integrationStore.dataSet.templateType.value === '5') {
            this.integrationStore.dataSet.setDefaultIndicators();
        }
    }


    displayCell = (de, coc) => {
        if (this.integrationStore.dataSet.templateType.value === '3') {
            return <Select
                placeholder="Select cell"
                value={coc.cell[de.id]}
                isClearable
                isSearchable
                options={this.integrationStore.dataSet.cells}
                onChange={coc.setCellAll(de)}
                styles={changeStyle(coc.cell[de.id])}
            />

        } else if (this.integrationStore.dataSet.templateType.value === '2') {
            return <Select
                placeholder="Select column"
                isClearable
                isSearchable
                value={coc.column[de.id]}
                options={this.integrationStore.dataSet.cellColumns}
                onChange={coc.setColumnAll(de)}
                styles={changeStyle(coc.column[de.id])}
            />
        } else if (this.integrationStore.dataSet.templateType.value === '1' || this.integrationStore.dataSet.templateType.value === '4' || this.integrationStore.dataSet.templateType.value === '6') {
            return <Select
                isClearable
                isSearchable
                placeholder="Select cell"
                value={coc.mapping[de.id]}
                options={de.uniqueCategoryOptionCombos}
                onChange={coc.setMappingAll(de)}
                styles={changeStyle(coc.mapping[de.id])}

            />
        } else if (this.integrationStore.dataSet.templateType.value === '5') {
            return <Select
                isClearable
                isSearchable
                placeholder="Select indicator"
                value={coc.mapping[de.id]}
                options={this.integrationStore.dataSet.indicatorOptions}
                onChange={coc.setMappingAll(de)}
                styles={changeStyle(coc.mapping[de.id])}
            />
        }

    };

    displayDynamicCell = de => {
        return <Select
            placeholder="Select cell"
            isClearable
            isSearchable
            value={this.integrationStore.dataSet.cell2[de.name]}
            options={this.integrationStore.dataSet.allCategoryOptionCombos}
            onChange={this.integrationStore.dataSet.setMappingAll2(de)}
            styles={changeStyle(this.integrationStore.dataSet.cell2[de.name])}
        />
    };

    render() {
        const { dataSet } = this.integrationStore;
        const { classes } = this.props;
        let displayMappingHeader = null;
        let display = null;
        if (this.integrationStore.dataSet.templateType.value === '1' || this.integrationStore.dataSet.templateType.value === '6') {
            displayMappingHeader = <TableCell style={{ minWidth: 400, padding: 2 }}>
                Mapping
            </TableCell>;
        }

        if (this.integrationStore.dataSet.templateType.value !== '2') {
            display = dataSet.forms.map((form, k) => {
                return (
                    <ExpansionPanel key={k} expanded={this.integrationStore.expanded === k}
                        onChange={this.integrationStore.handlePanelChange(k)}>
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>{form.name}</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <div className="scrollable">
                                <Table style={{ minWidth: '100%' }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell style={{ minWidth: 500, padding: 2 }}>
                                                Data Element
                                            </TableCell>

                                            {displayMappingHeader}

                                            {form.categoryOptionCombos.map(coc => {
                                                return <TableCell key={coc.id} style={{ minWidth: 400, padding: 2 }}>
                                                    {coc.name}
                                                </TableCell>
                                            })}
                                            <TableCell style={{ width: 40 }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {form.dataElements.map(de => {
                                            return <TableRow key={de.id} hover classes={{ hover: classes.hover }}>
                                                <TableCell component="th" scope="row" style={{ padding: 2 }}>
                                                    {de.name}
                                                </TableCell>

                                                {this.displayMapping(de)}

                                                {form.categoryOptionCombos.map(coc => {
                                                    return <TableCell key={de.id + coc.id} style={{ padding: 2 }}>
                                                        {this.displayCell(de, coc)}
                                                    </TableCell>
                                                })}
                                                <TableCell>
                                                    {form.status[de.id].all ? <DoneAll /> : form.status[de.id].some ?
                                                        <Done /> :
                                                        <Clear />}
                                                </TableCell>
                                            </TableRow>
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                );
            });
        } else {
            display = <div className="scrollable">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell style={{ width: '49%' }}>
                                Source Data Element with disaggregation
                            </TableCell>
                            <TableCell style={{ width: '49%' }}>
                                Destination Data Element with disaggregation
                            </TableCell>
                            <TableCell style={{ width: '2%' }}>
                                Mapped?
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {this.integrationStore.dataSet.mergedCellsWithDataElementRow.map(de => {
                            return <TableRow key={de.column} hover>
                                <TableCell>
                                    {typeof de.name === 'object' ? JSON.stringify(de.name) : de.name}
                                </TableCell>
                                <TableCell>
                                    {this.displayDynamicCell(de)}
                                </TableCell>

                                <TableCell>
                                    {!!this.integrationStore.dataSet.cell2[de.name] ? <Done /> : <Clear />}
                                </TableCell>
                            </TableRow>
                        })}
                    </TableBody>
                </Table>
            </div>
        }

        return (<div>
            {display}
            <Progress open={this.integrationStore.dataSet.dialogOpen}
                message="Processing data..."
                onClose={this.integrationStore.dataSet.closeDialog} />
        </div>
        );
    }
}

export default withStyles(styles)(D3);

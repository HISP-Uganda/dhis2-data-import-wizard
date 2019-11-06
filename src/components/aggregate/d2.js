import { inject, observer } from 'mobx-react';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { InputField, PeriodPicker } from "@dhis2/d2-ui-core";
import Select from 'react-select';
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import FormGroup from '@material-ui/core/FormGroup';
import TextField from '@material-ui/core/TextField';
import Progress from "../progress";

import { createParam } from '../../stores/converters'
import Grid from "@material-ui/core/Grid";
import GroupEditor from "../GroupEditor";
import Table from "@material-ui/core/Table";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import TableHead from "@material-ui/core/TableHead";
import TablePagination from "@material-ui/core/TablePagination";
import * as PropTypes from "prop-types";
import customStyles from "../customStyles";
import { changeStyle } from "../../utils/data-utils";
import PeriodDialog from '../PeriodDialog';

const styles = theme => ({
    block: {
        display: 'block',
        overflow: 'auto'
    },
    table: {
        // marginBottom:10 856177
    },
    formControl: {
        margin: theme.spacing.unit * 3,
    },
    group: {
        // margin: `${theme.spacing.unit}px 0`,
        width: 'auto',
        height: 'auto',
        display: 'flex',
        flexWrap: 'nowrap',
        flexDirection: 'row',
    },
    textField: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        width: 200,
    },
});

@inject('IntegrationStore')
@observer
class D2 extends React.Component {
    integrationStore = null;

    constructor(props) {
        super(props);
        const { IntegrationStore } = props;
        this.integrationStore = IntegrationStore;

    }

    componentDidMount() {
        if (this.integrationStore.dataSet.templateType.value === '4') {
            this.integrationStore.dataSet.onCheckIsDhis2();
        } else if (this.integrationStore.dataSet.templateType.value === '5') {
            this.integrationStore.dataSet.fetchIndicators();
        } else if (this.integrationStore.dataSet.templateType.value === '6') {
            this.integrationStore.dataSet.pullData()
        }
    }


    attribution = () => {
        let columns;
        switch (this.integrationStore.dataSet.templateType.value) {
            case '1':
                columns = this.integrationStore.dataSet.columns;
                break;
            case '2':
                columns = this.integrationStore.dataSet.cellColumns;
                break;
            case '3':
                columns = this.integrationStore.dataSet.cells;
                break;
            default:
                columns = this.integrationStore.dataSet.columns;
        }
        if (this.integrationStore.dataSet.categoryCombo.categories.length > 0) {
            return <Grid container spacing={8}>
                {this.integrationStore.dataSet.categoryCombo.categories.map(category => {
                    return <Grid key={category.id} item
                        xs={12 / this.integrationStore.dataSet.categoryCombo.categories.length}>
                        <span style={{ fontWeight: 'bold' }}>{category.name + ' column'}</span>
                        <Select
                            placeholder={category.name + ' column'}
                            value={category.mapping}
                            options={this.integrationStore.dataSet.templateType.value === '3' ? this.integrationStore.dataSet.attributeCombosInExcel ? columns : category.options : columns}
                            onChange={category.setMapping}
                            isClearable
                            isSearchable
                            styles={customStyles}
                        />
                    </Grid>
                })}
            </Grid>
        }
        return null;
    };

    mapping = () => {
        return <Grid spacing={8} container>
            <Grid xs={3} item>
                <span style={{ fontWeight: 'bold' }}>Data element column</span>
                <Select
                    placeholder="Data element column"
                    value={this.integrationStore.dataSet.dataElementColumn}
                    options={this.integrationStore.dataSet.columns}
                    onChange={this.integrationStore.dataSet.setDataElementColumn}
                    isClearable
                    isSearchable
                />
            </Grid>
            <Grid xs={3} item>
                <span style={{ fontWeight: 'bold' }}>Category option combination column</span>
                <Select
                    placeholder="Category option combination column"
                    value={this.integrationStore.dataSet.categoryOptionComboColumn}
                    options={this.integrationStore.dataSet.columns}
                    onChange={this.integrationStore.dataSet.setCategoryOptionComboColumn}
                    isClearable
                    isSearchable
                />
            </Grid>
            <Grid xs={3} item>
                <span style={{ fontWeight: 'bold' }}>Period column</span>
                <Select
                    placeholder="Period column"
                    value={this.integrationStore.dataSet.periodColumn}
                    options={this.integrationStore.dataSet.columns}
                    onChange={this.integrationStore.dataSet.setPeriodColumn}
                    isClearable
                    isSearchable
                />
            </Grid>
            <Grid xs={3} item>
                <span style={{ fontWeight: 'bold' }}>Data value column</span>
                <Select
                    placeholder="Data value column"
                    value={this.integrationStore.dataSet.dataValueColumn}
                    options={this.integrationStore.dataSet.columns}
                    onChange={this.integrationStore.dataSet.setDataValueColumn}
                    isClearable
                    isSearchable
                />
            </Grid>
        </Grid>
    };


    organisationColumn = () => {
        let value;
        let columns;
        let onChange;
        let label = 'Organisation column';

        switch (this.integrationStore.dataSet.templateType.value) {
            case '2':
                value = this.integrationStore.dataSet.orgUnitColumn;
                columns = this.integrationStore.dataSet.cellColumns;
                onChange = this.integrationStore.dataSet.setOrgUnitColumn;
                break;
            case '3':
                if (this.integrationStore.dataSet.organisationUnitInExcel) {
                    value = this.integrationStore.dataSet.organisationCell;
                    columns = this.integrationStore.dataSet.cells;
                    onChange = this.integrationStore.dataSet.setOrganisationCell;
                } else {
                    value = this.integrationStore.dataSet.organisation;
                    columns = this.integrationStore.dataSet.organisations;
                    onChange = this.integrationStore.dataSet.setOrganisation;
                }
                break;

            default:
                value = this.integrationStore.dataSet.orgUnitColumn;
                columns = this.integrationStore.dataSet.columns;
                onChange = this.integrationStore.dataSet.setOrgUnitColumn

        }

        return <Grid container spacing={8}>
            <Grid item xs={12}>
                <span style={{ fontWeight: 'bold' }}>{label}</span>
                <Select
                    placeholder={label}
                    value={value}
                    options={columns}
                    onChange={onChange}
                    isClearable
                    isSearchable
                    styles={customStyles}
                />
            </Grid>
        </Grid>
    };

    periodColumn = () => {
        let value;
        let columns;
        let onChange;
        let label = 'Period column';
        let showPeriod = true;

        switch (this.integrationStore.dataSet.templateType.value) {
            case '2':
                value = this.integrationStore.dataSet.periodColumn;
                columns = this.integrationStore.dataSet.cellColumns;
                onChange = this.integrationStore.dataSet.setPeriodColumn;
                break;
            case '3':
                if (this.integrationStore.dataSet.periodInExcel) {
                    value = this.integrationStore.dataSet.periodColumn;
                    columns = this.integrationStore.dataSet.cells;
                    onChange = this.integrationStore.dataSet.setPeriodColumn;
                    label = 'Period Cell';
                }
                break;

            default:
                showPeriod = false;

        }

        return <div>
            {showPeriod ? this.integrationStore.dataSet.periodInExcel || this.integrationStore.dataSet.templateType.value === '2' ?
                <div>
                    <span style={{ fontWeight: 'bold' }}>{label}</span>
                    <Select
                        placeholder={label}
                        value={value}
                        options={columns}
                        onChange={onChange}
                        isClearable
                        isSearchable
                        styles={customStyles}
                    />
                </div> : <div>
                    <PeriodPicker
                        periodType={this.integrationStore.dataSet.periodType}
                        onPickPeriod={(value) => this.integrationStore.dataSet.pick(value)}
                    />
                </div>
                : null}
        </div>
    };


    fileColumn = () => {
        let value;
        let columns;
        let onChange;
        let label = 'Organisation column';
        let showPeriod = true;

        switch (this.integrationStore.dataSet.templateType.value) {
            case '2':
                value = this.integrationStore.dataSet.orgUnitColumn;
                columns = this.integrationStore.dataSet.cellColumns;
                onChange = this.integrationStore.dataSet.setOrgUnitColumn;
                break;
            case '3':
                if (this.integrationStore.dataSet.periodInExcel) {
                    value = this.integrationStore.dataSet.periodColumn;
                    columns = this.integrationStore.dataSet.cells;
                    onChange = this.integrationStore.dataSet.setPeriodColumn;
                    showPeriod = false;
                    label = 'Period Cell';
                } else {
                    value = this.integrationStore.dataSet.organisation;
                    columns = this.integrationStore.dataSet.organisations;
                    onChange = this.integrationStore.dataSet.setOrganisation;
                }
                break;

            default:
                showPeriod = false;

        }

        return <div>
            <span style={{ fontWeight: 'bold' }}>{label}</span>
            <Select
                placeholder={label}
                value={value}
                options={columns}
                onChange={onChange}
                isClearable
                isSearchable
                styles={customStyles}
            />

            {showPeriod ? null : <PeriodPicker
                periodType={this.integrationStore.dataSet.periodType}
                onPickPeriod={(value) => this.integrationStore.dataSet.pick(value)}
            />}
        </div>
    };

    fileOption = () => {

        let label = 'Header Row';
        let showHeader = true;
        let showDataStartColumn = false;
        const { displayFull } = this.props;
        switch (this.integrationStore.dataSet.templateType.value) {
            case '2':

                showDataStartColumn = true;
                label = 'Data Element Row';
                break;
            case '3':
                showHeader = false;
                if (this.integrationStore.dataSet.periodInExcel) {
                    label = 'Period Cell';
                }
                break;

            default:
                showHeader = false;

        }

        return <div>
            <span style={{ fontWeight: 'bold' }}>Excel sheet</span>
            <Select
                placeholder="Select sheet"
                value={this.integrationStore.dataSet.selectedSheet}
                options={this.integrationStore.dataSet.sheets}
                onChange={this.integrationStore.dataSet.setSelectedSheet}
                isClearable
                isSearchable
                styles={customStyles}
            />

            {showHeader && displayFull ? <div>
                <InputField
                    label={label}
                    type="number"
                    fullWidth
                    value={this.integrationStore.dataSet.headerRow}
                    onChange={(value) => this.integrationStore.dataSet.handelHeaderRowChange(value)}
                />
                <InputField
                    label="Data start row"
                    type="number"
                    fullWidth
                    value={this.integrationStore.dataSet.dataStartRow}
                    onChange={(value) => this.integrationStore.dataSet.handelDataRowStartChange(value)}
                />
            </div> : null}

            {showDataStartColumn && displayFull ?
                <div>
                    <span style={{ fontWeight: 'bold' }}>Data start column</span>
                    <Select
                        placeholder="Data start column"
                        value={this.integrationStore.dataSet.dataStartColumn}
                        options={this.integrationStore.dataSet.cellColumns}
                        onChange={this.integrationStore.dataSet.setDataStartColumn}
                        isClearable
                        isSearchable
                        styles={customStyles}
                    />
                </div> : null}
        </div>
    };

    organisationUnitMapping = () => {
        return <div>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>
                            Source Organisation Units
                        </TableCell>
                        <TableCell>
                            Destination Organisation Units
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>

                    {this.integrationStore.sourceUnits.map(u => <TableRow hover key={u.id + u.name}>
                        <TableCell>
                            {u.name}
                        </TableCell>
                        <TableCell>
                            <Select
                                placeholder="Select destination unit"
                                value={u.mapping}
                                options={this.integrationStore.dataSet.organisationUnits.map(ui => {
                                    return { label: ui.name, value: ui.id }
                                })}
                                onChange={u.setMapping}
                                isClearable
                                isSearchable
                                styles={changeStyle(u.mapping)}
                            />
                        </TableCell>
                    </TableRow>)}

                </TableBody>
            </Table>

            <TablePagination
                component="div"
                count={this.integrationStore.dataSet.sourceOrganisationUnits.length}
                rowsPerPage={this.integrationStore.paging['d25']['rowsPerPage']}
                page={this.integrationStore.paging['d25']['page']}
                backIconButtonProps={{
                    'aria-label': 'Previous Page',
                }}
                nextIconButtonProps={{
                    'aria-label': 'Next Page',
                }}
                onChangePage={this.integrationStore.handleChangeElementPage('d25')}
                onChangeRowsPerPage={this.integrationStore.handleChangeElementRowsPerPage('d25')}
            />
        </div>
    };


    fixedOption = () => {

        return <FormGroup row>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={this.integrationStore.dataSet.periodInExcel}
                        onChange={this.integrationStore.dataSet.handlePeriodInExcel}
                        disabled={this.integrationStore.dataSet.disableCheckBox1}
                    />
                }
                label="Period provided"
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={this.integrationStore.dataSet.organisationUnitInExcel}
                        onChange={this.integrationStore.dataSet.handleOrganisationInExcel}
                        disabled={this.integrationStore.dataSet.disableCheckBox2}
                    />
                }
                label="Organisation provided"
            />

            {this.integrationStore.dataSet.categoryCombo.categories.length > 0 ?
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={this.integrationStore.dataSet.attributeCombosInExcel}
                            onChange={this.integrationStore.dataSet.handleAttributeCombosInExcel}
                            disabled={this.integrationStore.dataSet.disableCheckBox4}
                        />
                    }
                    label="Dataset attribute combo provided"
                /> : null}


        </FormGroup>
    };

    api = () => {
        return <div>
            {this.organisationColumn()}
            <br />
            {this.organisationUnitMapping()}
            <br />
            {this.mapping()}
        </div>
    };

    dataSetPeriod = () => {
        return <Grid container spacing={8}>
            <Grid item xs={12}>
                <Checkbox checked={this.integrationStore.dataSet.multiplePeriods}
                    onChange={this.integrationStore.dataSet.onCheckMultiplePeriods}
                    value="checked" /> Multiple Periods

                {/* <PeriodDialog /> */}

                {this.integrationStore.dataSet.multiplePeriods ? <div>
                    <Grid container spacing={8}>
                        <Grid item xs={6}>
                            <TextField
                                id="startDate"
                                label="Start Date"
                                type="date"
                                value={this.integrationStore.dataSet.startPeriod}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                onChange={this.integrationStore.dataSet.handleStartPeriodChange}
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <TextField
                                id="endDate"
                                label="End Date"
                                type="date"
                                value={this.integrationStore.dataSet.endPeriod}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                onChange={this.integrationStore.dataSet.handleEndPeriodChange}
                            />
                        </Grid>
                    </Grid>
                </div> : <div>{this.integrationStore.dataSet.templateType.value === '4' ?
                    <PeriodPicker
                        periodType={this.integrationStore.dataSet.periodType}
                        onPickPeriod={(value) => this.integrationStore.dataSet.replaceParam(createParam({
                            param: 'period',
                            value: value
                        }))}
                    /> : <PeriodPicker
                        periodType={this.integrationStore.dataSet.periodType}
                        onPickPeriod={(value) => this.integrationStore.dataSet.replaceParamByValue(createParam({
                            param: 'dimension',
                            value: `pe:${value}`
                        }), 'pe:')}
                    />
                }</div>}
            </Grid>
        </Grid>
    };

    dhis2Indicators = () => {
        return <div>
            {this.dataSetPeriod()}
            <Grid container spacing={8}>
                <Grid item xs={12}>
                    <Select
                        placeholder="Select indicator aggregation level"
                        value={this.integrationStore.dataSet.currentLevel}
                        options={this.integrationStore.dataSet.levels}
                        onChange={this.integrationStore.dataSet.setCurrentLevel}
                        isClearable
                        isSearchable
                        styles={customStyles}
                    />
                </Grid>
            </Grid>
            <Grid container spacing={8}>
                <Grid item xs={12}>
                    {this.organisationUnitMapping()}
                </Grid>
            </Grid>
            <Grid container spacing={8}>
                <Grid item xs={12}>
                    <InputField
                        id="filter"
                        placeholder="Filter indicators"
                        type="text"
                        fullWidth
                        value={this.integrationStore.dataSet.filterText}
                        onChange={(value) => this.integrationStore.dataSet.filterChange(value)}
                    />
                    <GroupEditor
                        itemStore={this.integrationStore.dataSet.itemStore}
                        assignedItemStore={this.integrationStore.dataSet.assignedItemStore}
                        onAssignItems={this.integrationStore.dataSet.assignItems}
                        onRemoveItems={this.integrationStore.dataSet.unAssignItems}
                        height={150}
                        filterText={this.integrationStore.dataSet.filterText}
                    />
                </Grid>
            </Grid>
            <br />
            <br />
        </div>
    };

    dhis2DataSet = () => {
        return <div>
            <Grid container spacing={8}>
                <Grid item xs={6}>
                    <Select
                        placeholder="Select data set to import"
                        value={this.integrationStore.dataSet.selectedDataSet}
                        options={this.integrationStore.dataSet.dhis2DataSets}
                        onChange={this.integrationStore.dataSet.setDhis2DataSetChange}
                        isClearable
                        isSearchable
                    />
                </Grid>
                <Grid item xs={6}>
                    <Select
                        placeholder="Organisation unit level"
                        value={this.integrationStore.dataSet.currentLevel}
                        options={this.integrationStore.dataSet.levels}
                        onChange={this.integrationStore.dataSet.setCurrentLevel}
                        isClearable
                        isSearchable
                    />
                </Grid>
            </Grid>
            {this.dataSetPeriod()}
            <Grid container spacing={8}>
                <Grid item xs={12}>
                    {this.integrationStore.dataSet.dhis2DataSet ? this.organisationUnitMapping() : null}
                </Grid>
            </Grid>


        </div>
    };


    form1 = () => {
        const showFixedOptions = this.integrationStore.dataSet.templateType.value === '3';
        const showMapping = this.integrationStore.dataSet.templateType.value === '1';
        const { displayFull } = this.props;
        return <div>
            {showFixedOptions && displayFull ? <Grid container spacing={8}>
                <Grid item xs={12}>
                    {this.fixedOption()}
                </Grid>
            </Grid> : null}
            <Grid container spacing={8}>
                <Grid item xs={12}>
                    {this.fileOption()}
                    <br />
                    {displayFull ? this.organisationColumn() : null}
                    {showFixedOptions ? null : this.organisationUnitMapping()}
                    <br />
                    {displayFull ? this.periodColumn() : null}
                </Grid>
            </Grid>
            {showMapping && displayFull ? this.mapping() : null}
            {displayFull ? this.attribution() : null}
        </div>
    };


    step2Form = () => {
        switch (this.integrationStore.dataSet.templateType.value) {
            case '4':
                return this.dhis2DataSet();
            case '5':
                return this.dhis2Indicators();
            case '6':
                return this.api();
            default:
                return this.form1()

        }
    };

    render() {
        return (
            <div>
                {this.step2Form()}
                <Progress open={this.integrationStore.dataSet.dialogOpen}
                    onClose={this.integrationStore.dataSet.closeDialog} />
            </div>
        );
    }
}

D2.propTypes = {
    displayFull: PropTypes.bool.isRequired,
};

export default withStyles(styles)(D2);

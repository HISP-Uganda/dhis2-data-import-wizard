import {inject, observer} from "mobx-react";
import React from 'react';
import Dropzone from "react-dropzone";
import Icon from "@material-ui/core/Icon";
import {InputField, PeriodPicker} from "@dhis2/d2-ui-core";
import Select from "react-select";
import Grid from "@material-ui/core/Grid";
import TextField from '@material-ui/core/TextField';
import Checkbox from "@material-ui/core/Checkbox";
import {createParam} from '../stores/converters'
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Button from "@material-ui/core/es/Button";
import Params from "./aggregate/Params";
import {withStyles} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from '@material-ui/icons/Close';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';


const items = [{
    value: 'auto',
    label: 'auto',
}, {
    value: 'name',
    label: 'name',
}, {
    value: 'uid',
    label: 'uid',
}, {
    value: 'code',
    label: 'code',
}];

export const Upload = inject("IntegrationStore")(observer(({obj}) => {
    return <section>
        <div className="dropzone">
            <Dropzone
                accept=".csv, .xls, .xlsx"
                onDrop={obj.onDrop}>
                <p align="center">Drop files here</p>
                <p align="center">
                    <Icon color="primary"
                          style={{fontSize: 48}}>
                        add_circle
                    </Icon>
                </p>
                <p align="center">{obj.fileName}</p>
                <p align="center"
                   style={{color: 'red'}}>{obj.uploadMessage}</p>
            </Dropzone>
        </div>
    </section>
}));


export const Attribution = inject("IntegrationStore")(observer(({obj}) => {
    let columns;
    switch (obj.templateType) {
        case '1':
            columns = obj.columns;
            break;
        case '2':
            columns = obj.cellColumns;
            break;
        case '3':
            columns = obj.cells;
            break;
        default:
            columns = obj.columns;
    }
    if (obj.categoryCombo.categories.length > 0) {
        return <Grid container spacing={8}>
            {obj.categoryCombo.categories.map(category => {
                return <Grid key={category.id} item
                             xs={12 / obj.categoryCombo.categories.length}>

                    <Select
                        placeholder={category.name + ' column'}
                        value={category.mapping}
                        options={obj.templateType === '3' ? obj.attributeCombosInExcel ? columns : category.options : columns}
                        onChange={category.setMapping}
                        isClearable
                        isSearchable
                    />
                </Grid>
            })}
        </Grid>
    }
    return null;
}));


export const OrganisationColumn = inject("IntegrationStore")(observer(({obj}) => {
    let value;
    let columns;
    let onChange;
    let label = 'Organisation column';
    let showStrategy = true;

    switch (obj.templateType) {
        case '2':
            value = obj.orgUnitColumn;
            columns = obj.cellColumns;
            onChange = obj.setOrgUnitColumn;
            break;
        case '3':
            if (obj.organisationUnitInExcel) {
                value = obj.organisationCell;
                columns = obj.cells;
                onChange = obj.setOrganisationCell;
            } else {
                value = obj.organisation;
                columns = obj.organisations;
                onChange = obj.setOrganisation;
                showStrategy = false;
            }
            break;

        default:
            value = obj.orgUnitColumn;
            columns = obj.columns;
            onChange = obj.setOrgUnitColumn

    }

    return <div>
        <Select
            placeholder={label}
            value={value}
            options={columns}
            onChange={onChange}
            isClearable
            isSearchable
        />
        <br/>
        {showStrategy ? <Select
            placeholder="Identifier scheme"
            value={obj.orgUnitStrategy}
            options={items}
            onChange={obj.setOrgUnitStrategy}
            isClearable
            isSearchable
        /> : null}
    </div>
}));

export const PeriodColumn = inject("IntegrationStore")(observer(({obj}) => {
    let value;
    let columns;
    let onChange;
    let label = 'Period column';
    let showPeriod = true;

    switch (obj.templateType) {
        case '2':
            value = obj.periodColumn;
            columns = obj.cellColumns;
            onChange = obj.setPeriodColumn;
            break;
        case '3':
            if (obj.periodInExcel) {
                value = obj.periodColumn;
                columns = obj.cells;
                onChange = obj.setPeriodColumn;
                label = 'Period Cell';
            }
            break;

        default:
            showPeriod = false;

    }

    return <div>
        {showPeriod ? obj.periodInExcel || obj.templateType === '2' ? <div>
                <br/>
                <Select
                    placeholder={label}
                    value={value}
                    options={columns}
                    onChange={onChange}
                    isClearable
                    isSearchable
                />
            </div> : <PeriodPicker
                periodType={obj.periodType}
                onPickPeriod={(value) => obj.pick(value)}
            />
            : null}
    </div>
}));


export const FileColumn = inject("IntegrationStore")(observer(({obj}) => {
    let value;
    let columns;
    let onChange;
    let label = 'Organisation column';
    let showPeriod = true;

    switch (obj.templateType) {
        case '2':
            value = obj.orgUnitColumn;
            columns = obj.cellColumns;
            onChange = obj.setOrgUnitColumn;
            break;
        case '3':
            if (obj.periodInExcel) {
                value = obj.periodColumn;
                columns = obj.cells;
                onChange = obj.setPeriodColumn;
                showPeriod = false;
                label = 'Period Cell';
            } else {
                value = obj.organisation;
                columns = obj.organisations;
                onChange = obj.setOrganisation;
            }
            break;

        default:
            showPeriod = false;

    }

    return <div>
        <Select
            placeholder={label}
            value={value}
            options={columns}
            onChange={onChange}
            isClearable
            isSearchable
        />

        {showPeriod ? <Select
            placeholder="Identifier scheme"
            value={obj.orgUnitStrategy}
            options={items}
            onChange={obj.setOrgUnitStrategy}
            isClearable
            isSearchable
        /> : <PeriodPicker
            periodType={obj.periodType}
            onPickPeriod={(value) => obj.pick(value)}
        />}
    </div>
}));

export const FileOption = inject("IntegrationStore")(observer(({obj}) => {

    let label = 'Header Row';
    let showHeader = true;
    let showDataStartColumn = false;
    switch (obj.templateType) {
        case '2':

            showDataStartColumn = true;
            label = 'Data Element Row';
            break;
        case '3':
            showHeader = false;
            if (obj.periodInExcel) {
                label = 'Period Cell';
            }
            break;

        default:
            showHeader = false;

    }

    return <div>
        <Select
            placeholder="Select sheet"
            value={obj.selectedSheet}
            options={obj.sheets}
            onChange={obj.setSelectedSheet}
            isClearable
            isSearchable
        />

        {showHeader ? <div>
            <InputField
                label={label}
                type="number"
                fullWidth
                value={obj.headerRow}
                onChange={(value) => obj.handelHeaderRowChange(value)}
            />
            <InputField
                label="Data start row"
                type="number"
                fullWidth
                value={obj.dataStartRow}
                onChange={(value) => obj.handelDataRowStartChange(value)}
            />
        </div> : null}

        {showDataStartColumn ? <Select
            placeholder="Data start column"
            value={obj.dataStartColumn}
            options={obj.cellColumns}
            onChange={obj.setDataStartColumn}
            isClearable
            isSearchable
        /> : null}
    </div>
}));

export const APIDataSource = inject("IntegrationStore")(observer(({obj}) => {

    return <div>
        <Grid container spacing={8}>
            <Grid item xs={12}>
                <InputField
                    label="URL"
                    type="text"
                    fullWidth
                    value={obj.url}
                    onChange={(value) => obj.handelURLChange(value)}/>
            </Grid>
        </Grid>

        <Grid container spacing={8}>
            <Grid item xs={6}>
                <InputField
                    label="Username"
                    type="text"
                    fullWidth
                    value={obj.username}
                    onChange={(value) => obj.setUsername(value)}/>
            </Grid>
            <Grid item xs={6}>
                <InputField
                    label="Password"
                    type="text"
                    fullWidth
                    value={obj.password}
                    onChange={(value) => obj.setPassword(value)}/>
            </Grid>
        </Grid>
    </div>
}));

export const FixedOption = inject("IntegrationStore")(observer(({obj}) => {

    return <FormGroup row>
        <FormControlLabel
            control={
                <Checkbox
                    checked={obj.periodInExcel}
                    onChange={obj.handlePeriodInExcel}
                    disabled={obj.disableCheckBox1}
                />
            }
            label="Period provided"
        />
        <FormControlLabel
            control={
                <Checkbox
                    checked={obj.organisationUnitInExcel}
                    onChange={obj.handleOrganisationInExcel}
                    disabled={obj.disableCheckBox2}
                />
            }
            label="Organisation provided"
        />

        {obj.categoryCombo.categories.length > 0 ?
            <FormControlLabel
                control={
                    <Checkbox
                        checked={obj.attributeCombosInExcel}
                        onChange={obj.handleAttributeCombosInExcel}
                        disabled={obj.disableCheckBox4}
                    />
                }
                label="Dataset attribute combo provided"
            /> : null}


    </FormGroup>
}));

export const DHIS2Indicators = inject("IntegrationStore")(observer(({obj}) => {

    return <div>
        <APIDataSource obj={obj}/>
        <br/>
        <Button
            variant="contained"
            color="primary"
            disabled={!obj.url}
            onClick={obj.fetchIndicators}>
            Pull
        </Button>
        <br/>
        <br/>
        <Grid container spacing={8}>
            <Grid item xs={6}>
                <Select
                    placeholder="Organisation unit level"
                    value={obj.currentLevel}
                    options={obj.levels}
                    onChange={obj.setCurrentLevel}
                    isClearable
                    isSearchable
                />
            </Grid>
        </Grid>
    </div>
}));

export const DHIS2DataSet = inject("IntegrationStore")(observer(({obj}) => {

    return <div>
        <APIDataSource obj={obj}/>
        <br/>
        <Button
            variant="contained"
            color="primary"
            disabled={!obj.url}
            onClick={obj.onCheckIsDhis2}>
            Pull
        </Button>
        <br/>
        <br/>
        <Grid container spacing={8}>
            <Grid item xs={6}>
                <Select
                    placeholder="Select data set to import"
                    value={obj.selectedDataSet}
                    options={obj.dhis2DataSets}
                    onChange={obj.setDhis2DataSetChange}
                    isClearable
                    isSearchable
                />
                <br/>
                <Select
                    placeholder="Organisation unit level"
                    value={obj.currentLevel}
                    options={obj.levels}
                    onChange={obj.setCurrentLevel}
                    isClearable
                    isSearchable
                />
                <br/>

                <Checkbox checked={obj.multiplePeriods}
                          onChange={obj.onCheckMultiplePeriods}
                          value="checked"/> Multiple Periods

                {obj.multiplePeriods ? <div>
                    <Grid container spacing={8}>
                        <Grid item xs={6}>
                            <TextField
                                id="startDate"
                                label="Start Date"
                                type="date"
                                value={obj.startPeriod}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                onChange={obj.handleStartPeriodChange}
                            />
                        </Grid>

                        <Grid item xs={6}>
                            <TextField
                                id="endDate"
                                label="End Date"
                                type="date"
                                value={obj.endPeriod}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                onChange={obj.handleEndPeriodChange}
                            />
                        </Grid>
                    </Grid>
                </div> : <div>
                    <PeriodPicker
                        periodType={obj.periodType}
                        onPickPeriod={(value) => obj.replaceParam(createParam({
                            param: 'period',
                            value: value
                        }))}
                    />
                </div>}
            </Grid>
            <Grid item xs={6}>
                <Params/>
            </Grid>
        </Grid>
    </div>
}));


export const Form1 = inject("IntegrationStore")(observer(({obj}) => {
    const showFixedOptions = obj.templateType === '3';
    return <div>
        {showFixedOptions ? <Grid container spacing={8}>
            <Grid item xs={12}>
                <FixedOption obj={obj}/>
            </Grid>
        </Grid> : null}
        <Grid container spacing={8}>
            <Grid item xs={6}>
                <Upload obj={obj}/>
            </Grid>
            <Grid item xs={6}>
                <FileOption obj={obj}/>
                <br/>
                <OrganisationColumn obj={obj}/>
                <PeriodColumn obj={obj}/>
            </Grid>
        </Grid>
        <Attribution obj={obj}/>
    </div>
}));


export const Form2 = inject("IntegrationStore")(observer(({obj}) => {
    return <div>
        <DHIS2DataSet obj={obj}/>
    </div>
}));


export const Step2Form = inject("IntegrationStore")(observer(({obj}) => {
    switch (obj.templateType) {
        case '4':
            return <DHIS2DataSet obj={obj}/>;
        case '5':
            return <DHIS2Indicators obj={obj}/>;
        default:
            return <Form1 obj={obj}/>

    }
}));


export const DialogTitle = withStyles(theme => ({
    root: {
        borderBottom: `1px solid ${theme.palette.divider}`,
        margin: 0,
        padding: theme.spacing.unit * 2,
    },
    closeButton: {
        position: 'absolute',
        right: theme.spacing.unit,
        top: theme.spacing.unit,
        color: theme.palette.grey[500],
    },
}))(props => {
    const {children, classes, onClose} = props;
    return (
        <MuiDialogTitle disableTypography className={classes.root}>
            <Typography variant="h6">{children}</Typography>
            {onClose ? (
                <IconButton aria-label="Close" className={classes.closeButton} onClick={onClose}>
                    <CloseIcon/>
                </IconButton>
            ) : null}
        </MuiDialogTitle>
    );
});

export const DialogContent = withStyles(theme => ({
    root: {
        margin: 0,
        padding: theme.spacing.unit * 2,
    },
}))(MuiDialogContent);

export const DialogActions = withStyles(theme => ({
    root: {
        borderTop: `1px solid ${theme.palette.divider}`,
        margin: 0,
        padding: theme.spacing.unit,
    },
}))(MuiDialogActions);


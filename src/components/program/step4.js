import React from "react";
import {withStyles} from "@material-ui/core/styles";
import Select from 'react-select';
import Checkbox from "@material-ui/core/Checkbox";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TablePagination from "@material-ui/core/TablePagination";
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import LinearProgress from '@material-ui/core/LinearProgress';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FormHelperText from "@material-ui/core/FormHelperText";
import {InputField} from '@dhis2/d2-ui-core';
import {inject, observer} from "mobx-react";
import Button from '@material-ui/core/Button';
import DialogTitle from "@material-ui/core/DialogTitle";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Dialog from "@material-ui/core/Dialog";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import {Clear, Done} from "@material-ui/icons";
import Grid from "@material-ui/core/Grid";
import {GreenCheckbox} from "../common";
import customStyles from "../customStyles";
import Progress from "../progress";


const styles = theme => ({
    block: {
        display: 'block'
    }
});

@inject('IntegrationStore')
@observer
class Step4 extends React.Component {

    integrationStore = null;

    state = {
        open: false,
    };

    constructor(props) {
        super(props);
        const {IntegrationStore} = props;
        this.integrationStore = IntegrationStore;
    }

    componentDidMount() {
        if (this.integrationStore.program.isTracker && this.integrationStore.program.fetchingEntities === 0) {
            this.integrationStore.program.searchTrackedEntities();
        }
    }

    render() {
        const {classes} = this.props;
        const {program} = this.integrationStore;
        return <div>
            {program.fetchingEntities === 1 && program.isTracker ? <LinearProgress/> : ''}
            {program.programStages.map(n => {
                return (
                    <ExpansionPanel key={n.id} expanded={this.integrationStore.expanded === n.id}
                                    onChange={this.integrationStore.handlePanelChange(n.id)}>
                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                            <Typography>{n.displayName}</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails className={classes.block}>
                            <Grid spacing={8} container>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <GreenCheckbox
                                                checked={n.updateEvents}
                                                onChange={n.handleUpdateEventsCheck}
                                            />}
                                        label="Update events"
                                    />
                                    <FormControlLabel
                                        control={
                                            <GreenCheckbox
                                                checked={n.createNewEvents}
                                                onChange={n.handleCreateNewEventsCheck}
                                            />}
                                        label="Create new events"
                                    />
                                </Grid>
                            </Grid>
                            <br/>
                            <Grid spacing={8} container>
                                <Grid item xs={4}>
                                    <span>Select event date column for stage</span>
                                    <Select
                                        placeholder="Event Date Column"
                                        isClearable
                                        isSearchable
                                        options={program.columns}
                                        value={n.eventDateColumn}
                                        onChange={n.setEventDateColumn(program.columns)}
                                        styles={customStyles}
                                    />
                                </Grid>
                                <Grid item xs={4}>
                                    <span>Select latitude column for stage</span>
                                    <Select
                                        placeholder="Latitude Column"
                                        isClearable
                                        isSearchable
                                        options={program.columns}
                                        value={n.latitudeColumn}
                                        onChange={n.setLatitudeColumn}
                                        styles={customStyles}
                                    />
                                </Grid>
                                <Grid item xs={4}>
                                    <span>Select longitude column for stage</span>
                                    <Select
                                        placeholder="Longitude Column"
                                        isClearable
                                        isSearchable
                                        options={program.columns}
                                        value={n.longitudeColumn}
                                        onChange={n.setLongitudeColumn}
                                        styles={customStyles}
                                    />
                                </Grid>
                            </Grid>

                            <Grid spacing={8} container>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <GreenCheckbox
                                                checked={n.eventDateIdentifiesEvent}
                                                onChange={program.isTracker ? n.makeEventDateAsIdentifier({}) : n.makeEventDateAsIdentifier(program)}
                                            />
                                        }
                                        label="Event Date Uniquely Identifies Event"
                                    />
                                    <FormControlLabel
                                        control={
                                            <GreenCheckbox
                                                checked={n.completeEvents}
                                                onChange={n.markEventsAsComplete}
                                            />
                                        }
                                        label="Mark events as complete"
                                    />
                                </Grid>
                            </Grid>

                            <InputField
                                id={n.id}
                                label="Filter"
                                type="text"
                                fullWidth
                                value={n.dataElementsFilter}
                                onChange={(value) => n.filterDataElements(value)}
                            />
                            <Table className={classes.table}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell style={{width:30}}>Compulsory</TableCell>
                                        <TableCell>Data Element Name</TableCell>
                                        <TableCell>Data Element Mapping</TableCell>
                                        <TableCell style={{width:30}}>Uniquely Identifies Event</TableCell>
                                        <TableCell style={{width:30}}>Options Mapping</TableCell>
                                        <TableCell style={{width:30}}>Mapping Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {n.dataElements.map(s => {
                                        let de = '';
                                        if (s.dataElement.optionSet) {
                                            de = <div>
                                                <Button onClick={s.handleClickOpen}>Map Options</Button>

                                                <Dialog onClose={s.handleClose} open={s.open}
                                                        aria-labelledby="simple-dialog-title">
                                                    <DialogTitle id="simple-dialog-title">Mapping
                                                        options</DialogTitle>
                                                    <div>
                                                        <Table className={classes.table}>
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell>
                                                                        Option
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        Value
                                                                    </TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {s.dataElement.optionSet.options.map(o => {
                                                                    return (
                                                                        <TableRow key={o.code} hover>
                                                                            <TableCell>
                                                                                {o.name}
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <InputField
                                                                                    label="Value"
                                                                                    type="text"
                                                                                    value={o.value}
                                                                                    onChange={(value) => o.setValue(value)}
                                                                                />
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                        <List>
                                                            <ListItem button onClick={() => s.handleClose()}>
                                                                {/*<ListItemAvatar>
                                                                    <Avatar>
                                                                        <AddIcon/>
                                                                    </Avatar>
                                                                </ListItemAvatar>*/}
                                                                <ListItemText primary="Close"/>
                                                            </ListItem>
                                                        </List>
                                                    </div>
                                                </Dialog>
                                            </div>;
                                        }
                                        return (
                                            <TableRow key={s.dataElement.id} hover>
                                                <TableCell>
                                                    <Checkbox disabled checked={s['compulsory']}/>
                                                </TableCell>
                                                <TableCell>
                                                    {s.dataElement.displayName}
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        placeholder="Select one"
                                                        isClearable
                                                        isSearchable
                                                        value={s.column}
                                                        options={program.columns}
                                                        onChange={s.setColumn}
                                                        styles={customStyles}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <GreenCheckbox checked={s.dataElement.identifiesEvent}
                                                              onChange={n.makeElementAsIdentifier(s, program)}/>
                                                </TableCell>

                                                <TableCell>
                                                    {de}
                                                </TableCell>
                                                <TableCell>
                                                    {!!s.column ? <Done/> : <Clear/>}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            <TablePagination
                                component="div"
                                count={n.pages}
                                rowsPerPage={n.rowsPerPage}
                                page={n.page}
                                backIconButtonProps={{
                                    'aria-label': 'Previous Page',
                                }}
                                nextIconButtonProps={{
                                    'aria-label': 'Next Page',
                                }}
                                onChangePage={n.handleChangeElementPage}
                                onChangeRowsPerPage={n.handleChangeElementRowsPerPage}
                            />
                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                );
            })}

            <FormHelperText>
                Make sure that all compulsory data elements for a program stage are mapped, otherwise next
                button will
                be disabled
            </FormHelperText>
        </div>
    }
}

export default withStyles(styles)(Step4);

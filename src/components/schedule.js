import React from "react";
import * as PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { inject, observer } from "mobx-react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import { DialogActions, DialogContent, DialogTitle } from "./Fragments";
import { InputField } from "@dhis2/d2-ui-core";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import Select from "react-select";
import { PlayArrow, Stop, Delete } from "@material-ui/icons";
import Checkbox from "@material-ui/core/Checkbox";
import Table from "@dhis2/d2-ui-table";

const styles = (theme) => ({
  card: {
    margin: "5px",
  },
  button: {
    marginRight: theme.spacing.unit,
  },
  instructions: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
  hidden: {
    display: "none",
  },
  block: {
    display: "block",
  },
});

@inject("IntegrationStore")
@observer
class Schedule extends React.Component {
  integrationStore = null;

  constructor(props) {
    super(props);
    const { d2, IntegrationStore } = props;
    this.integrationStore = IntegrationStore;
    this.integrationStore.setD2(d2);
  }

  componentDidMount() {
    this.integrationStore.checkScheduleDataStore();
    this.integrationStore.checkAggregateDataStore();
    this.integrationStore.checkDataStore();
    this.integrationStore.allPrograms();
  }

  render() {
    return (
      <div style={{ margin: 5 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={this.integrationStore.fetchSavedSchedules}
        >
          Refresh
        </Button>
        <br />
        <br />
        {this.integrationStore.schedules.length > 0 ? (
          <Table
            columns={["name", "created", "last", "next"]}
            rows={this.integrationStore.schedules}
            contextMenuActions={this.integrationStore.scheduleActions}
            contextMenuIcons={{
              delete: <Delete />,
              start: <PlayArrow />,
              stop: <Stop />,
            }}
            primaryAction={this.integrationStore.updateSchedule}
          />
        ) : (
          <p style={{ textAlign: "center", fontSize: 15 }}>
            There are no items
          </p>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={this.integrationStore.createSchedule}
        >
          New Schedule
        </Button>

        <Dialog
          fullWidth={true}
          maxWidth={"lg"}
          open={this.integrationStore.scheduled}
          onClose={this.integrationStore.closeScheduledDialog}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle
            id="alert-dialog-title"
            onClose={this.integrationStore.closeScheduledDialog}
          >
            {"Schedule"}
          </DialogTitle>
          <DialogContent>
            <InputField
              label="Scheduling server"
              type="text"
              fullWidth
              value={this.integrationStore.currentSchedule.url}
              onChange={(value) =>
                this.integrationStore.currentSchedule.setUrl(value)
              }
            />

            <InputField
              label="Schedule name"
              type="text"
              fullWidth
              value={this.integrationStore.currentSchedule.name}
              onChange={(value) =>
                this.integrationStore.currentSchedule.setName(value)
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={this.integrationStore.currentSchedule.immediate}
                  onChange={
                    this.integrationStore.currentSchedule.handleImmediate
                  }
                />
              }
              label="Run Immediately"
            />
            <br/>
            <FormControl component="fieldset">
              <FormLabel component="legend">Type</FormLabel>
              <RadioGroup
                row={true}
                aria-label="Gender"
                name="gender1"
                value={this.integrationStore.currentSchedule.type}
                onChange={this.integrationStore.handleChange}
              >
                <FormControlLabel
                  value="aggregate"
                  control={<Radio />}
                  label="Aggregate"
                />
                <FormControlLabel
                  value="tracker"
                  control={<Radio />}
                  label="Tracker"
                />
                <FormControlLabel
                  value="attributes"
                  control={<Radio />}
                  label="Push Attributes"
                />
              </RadioGroup>
            </FormControl>
            <Select
              placeholder="Select mapping"
              isClearable
              isSearchable
              value={this.integrationStore.currentSchedule.value}
              options={this.integrationStore.currentOptions}
              onChange={this.integrationStore.currentSchedule.setValue}
            />

            {this.integrationStore.currentSchedule.type === "attributes" ? (
              <InputField
                label="Upstream URL"
                type="text"
                fullWidth
                value={this.integrationStore.currentSchedule.upstream}
                onChange={(value) =>
                  this.integrationStore.currentSchedule.setUpstream(value)
                }
              />
            ) : null}
            <br />
            <br />

            {this.integrationStore.currentSchedule.value &&
            !this.integrationStore.currentSchedule.immediate ? (
              <FormControl component="fieldset">
                <FormLabel component="legend">Schedule</FormLabel>
                <RadioGroup
                  row={true}
                  name="gender1"
                  value={this.integrationStore.currentSchedule.schedule}
                  onChange={
                    this.integrationStore.currentSchedule.handleScheduleChange
                  }
                >
                  <FormControlLabel
                    value="Every5s"
                    control={<Radio />}
                    label="Every Five Seconds"
                  />
                  <FormControlLabel
                    value="Minutely"
                    control={<Radio />}
                    label="Every Minute"
                  />
                  <FormControlLabel
                    value="Every5m"
                    control={<Radio />}
                    label="Every Five Minutes"
                  />
                  <FormControlLabel
                    value="Hourly"
                    control={<Radio />}
                    label="Hourly"
                  />
                  <FormControlLabel
                    value="Daily"
                    control={<Radio />}
                    label="Daily"
                  />
                  <FormControlLabel
                    value="Weekly"
                    control={<Radio />}
                    label="Weekly"
                  />
                  <FormControlLabel
                    value="Monthly"
                    control={<Radio />}
                    label="Monthly"
                  />
                  <FormControlLabel
                    value="Quarterly"
                    control={<Radio />}
                    label="Quarterly"
                  />
                  <FormControlLabel
                    value="SixMonthly"
                    control={<Radio />}
                    label="Semi Yearly"
                  />
                  <FormControlLabel
                    value="Yearly"
                    control={<Radio />}
                    label="Yearly"
                  />
                  <FormControlLabel
                    value="FinancialJuly"
                    control={<Radio />}
                    label="Financial July"
                  />
                  <FormControlLabel
                    value="FinancialApril"
                    control={<Radio />}
                    label="Financial April"
                  />
                  <FormControlLabel
                    value="FinancialOct"
                    control={<Radio />}
                    label="Financial October"
                  />
                </RadioGroup>
              </FormControl>
            ) : null}

            {this.integrationStore.currentSchedule.canAddDays ? (
              <InputField
                label="Additional days"
                type="number"
                fullWidth
                value={this.integrationStore.currentSchedule.additionalDays}
                onChange={(value) =>
                  this.integrationStore.currentSchedule.setAdditionalDays(value)
                }
              />
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={this.integrationStore.closeScheduledDialog}
              color="primary"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={this.integrationStore.currentSchedule.isSaveDisabled}
              onClick={this.integrationStore.saveSchedule}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

Schedule.propTypes = {
  d2: PropTypes.object.isRequired,
  classes: PropTypes.object,
};

export default withStyles(styles)(Schedule);

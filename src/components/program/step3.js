import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Select from "react-select";
import Checkbox from "@material-ui/core/Checkbox";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TablePagination from "@material-ui/core/TablePagination";
import FormHelperText from "@material-ui/core/FormHelperText";
import { InputField } from "@dhis2/d2-ui-core";

import { inject, observer } from "mobx-react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import { Clear, Done } from "@material-ui/icons";
import { DialogActions, DialogContent, DialogTitle } from "../Fragments";
import { changeStyle } from "../../utils/data-utils";

const styles = (theme) => ({
  selected: {
    backgroundColor: "yellow !important",
  },
});

@inject("IntegrationStore")
@observer
class Step3 extends React.Component {
  integrationStore = null;

  constructor(props) {
    super(props);
    const { IntegrationStore } = props;
    this.integrationStore = IntegrationStore;
  }

  componentDidMount() {
    this.integrationStore.program.loadDefaultAttributes();
  }

  render() {
    const { classes } = this.props;
    const { program } = this.integrationStore;

    return (
      <div>
        <InputField
          label="Filter"
          type="text"
          fullWidth
          value={program.attributesFilter}
          onChange={(value) => program.filterAttributes(value)}
        />
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell style={{ width: 30 }}>Unique</TableCell>
              <TableCell style={{ width: 30 }}>Mandatory</TableCell>
              <TableCell>Attribute name</TableCell>
              <TableCell>Attribute mapping</TableCell>
              <TableCell style={{ width: 50 }}>Options Mapping</TableCell>
              <TableCell style={{ width: 50 }}>Mapping Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {program.programAttributes.map((n) => {
              let de = "";
              if (n.trackedEntityAttribute.optionSetValue) {
                de = (
                  <div>
                    <Button onClick={n.handleClickOpen}>Map Options</Button>
                    <Dialog
                      onClose={n.handleClose}
                      open={n.open}
                      aria-labelledby="simple-dialog-title"
                    >
                      {/*<DialogTitle id="simple-dialog-title">Mapping options</DialogTitle>*/}
                      <DialogTitle
                        id="alert-dialog-title"
                        onClose={n.handleClose}
                      >
                        Mapping options
                      </DialogTitle>
                      <DialogContent>
                        <Table className={classes.table}>
                          <TableHead>
                            <TableRow>
                              <TableCell>Destination Option</TableCell>
                              <TableCell>Source Option</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {n.trackedEntityAttribute.optionSet.options.map(
                              (o) => {
                                return (
                                  <TableRow key={o.code} hover>
                                    <TableCell>{o.name}</TableCell>
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
                              }
                            )}
                          </TableBody>
                        </Table>
                      </DialogContent>

                      <DialogActions>
                        <Button onClick={n.handleClose} color="secondary">
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={n.handleClose}
                        >
                          OK
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </div>
                );
              }
              return (
                <TableRow key={n.trackedEntityAttribute.id} hover>
                  <TableCell>
                    <Checkbox
                      disabled
                      checked={n.trackedEntityAttribute.unique}
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox disabled checked={n.mandatory} />
                  </TableCell>
                  <TableCell>{n.trackedEntityAttribute.displayName}</TableCell>
                  <TableCell>
                    <Select
                      placeholder="Select one"
                      isClearable
                      isSearchable
                      value={n.column}
                      options={program.columns}
                      onChange={n.setColumn}
                      styles={changeStyle(n.column)}
                    />
                  </TableCell>

                  <TableCell>{de}</TableCell>
                  <TableCell>{!!n.column ? <Done /> : <Clear />}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={program.allAttributes}
          rowsPerPage={program.rowsPerPage}
          page={program.page}
          backIconButtonProps={{
            "aria-label": "Previous Page",
          }}
          nextIconButtonProps={{
            "aria-label": "Next Page",
          }}
          onChangePage={program.handleChangePage}
          onChangeRowsPerPage={program.handleChangeRowsPerPage}
        />

        <FormHelperText>
          When create new enrollments is checked all mandatory attributes must
          be mapped
        </FormHelperText>
      </div>
    );
  }
}

export default withStyles(styles)(Step3);

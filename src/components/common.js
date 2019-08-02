import {withStyles} from "@material-ui/core";
import green from "@material-ui/core/colors/green";
import React from "react";
import Checkbox from "@material-ui/core/Checkbox";
import Radio from "@material-ui/core/Radio";

export const GreenCheckbox = withStyles({
    root: {
        color: green[400],
        '&$checked': {
            color: green[600],
        },
    },
    checked: {},
})(props => <Checkbox color="default" {...props} />);


export const GreenRadio = withStyles({
    root: {
        color: green[400],
        '&$checked': {
            color: green[600],
        },
    },
    checked: {},
})(props => <Radio color="default" {...props} />);

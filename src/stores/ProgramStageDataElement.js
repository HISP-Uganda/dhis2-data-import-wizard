import {action, observable} from "mobx";

class ProgramStageDataElement {
    @observable compulsory;
    @observable dataElement;
    @observable column;
    @observable open = false;

    constructor(compulsory, dataElement) {
        this.compulsory = compulsory;
        this.dataElement = dataElement;
    }

    @action setColumn = value => this.column = value;
    @action setOpen = value => this.open = value;
    @action handleClickOpen = () => this.open = true;

    handleClose = () => {
        this.setOpen(false);
    };
}

export default ProgramStageDataElement;

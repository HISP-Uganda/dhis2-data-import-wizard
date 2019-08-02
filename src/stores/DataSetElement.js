import {action, observable} from "mobx";

class DataSetElement {
    @observable id;
    @observable code;
    @observable name;
    @observable open = false;

    @observable dataElement;

    @action setId = val => this.id = val;
    @action setName = val => this.name = val;
    @action setCode = val => this.code = val;
    @action setDataElement = val => this.dataElement = val;

    @action
    setOpen = value => this.open = value;

    @action
    handleClickOpen = () => {
        this.setOpen(true)
    };

    @action handleClose = () => {
        this.setOpen(false);
    };


}

export default DataSetElement;

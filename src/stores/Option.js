import {action, observable} from "mobx";

class Option {
    @observable code;
    @observable name;
    @observable value = '';

    constructor(code, name) {
        this.code = code;
        this.name = name;
    }

    @action
    setValue = value => this.value = value;
}

export default Option;

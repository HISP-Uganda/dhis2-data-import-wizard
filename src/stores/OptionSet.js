import {observable} from 'mobx';

class OptionSet {
    @observable options;

    constructor(options) {
        this.options = options;
    }
}

export default OptionSet;

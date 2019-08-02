import {observable} from "mobx";

class TrackedEntityType {
    @observable id;

    constructor(id) {
        this.id = id;
    }
}

export default TrackedEntityType;

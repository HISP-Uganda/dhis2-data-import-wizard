import { observable } from "mobx";

class TrackedEntityAttribute {
    @observable code;
    @observable name;
    @observable id;
    @observable displayName;
    @observable optionSet;
    @observable unique;

    constructor(id, code, name, displayName, unique, optionSet) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.displayName = displayName;
        this.unique = unique;
        this.optionSet = optionSet;
    }
}

export default TrackedEntityAttribute;

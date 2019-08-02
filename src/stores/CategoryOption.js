import {action, observable} from "mobx";

class CategoryOption {
    @observable id;
    @observable name;
    @observable code;

    constructor(id, name, code) {
        this.id = id;
        this.name = name;
        this.code = code;
    }


    @action setId = val => this.id = val;
    @action setName = val => this.name = val;
    @action setCode = val => this.code = val;



}

export default CategoryOption;

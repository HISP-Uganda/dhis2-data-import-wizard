import {action, computed, observable} from "mobx";

class Category {
    @observable id;
    @observable name;
    @observable code;
    @observable mapping;

    @observable categoryOptions = [];

    constructor(id, name, code) {
        this.id = id;
        this.name = name;
        this.code = code;
    }


    @action setId = val => this.id = val;
    @action setName = val => this.name = val;
    @action setCode = val => this.code = val;
    @action setMapping = val => this.mapping = val;
    @action setCategoryOptions = val => this.categoryOptions = val;

    @computed get options() {
        return this.categoryOptions.map(co => {
            return {label: co.name, value: co.id}
        })
    }
}

export default Category;

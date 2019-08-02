import {action, observable} from "mobx";

class CategoryCombo {
    @observable id;
    @observable code;
    @observable name;

    @observable categoryOptionCombos = [];

    @observable categories = [];

    constructor(id, code, name) {
        this.id = id;
        this.code = code;
        this.name = name;
    }

    @action setId = val => this.id = val;
    @action setName = val => this.name = val;
    @action setCode = val => this.code = val;
    @action setCategoryOptionCombos = val => this.categoryOptionCombos = val;
    @action setCategories = val => this.categories = val;
}

export default CategoryCombo;

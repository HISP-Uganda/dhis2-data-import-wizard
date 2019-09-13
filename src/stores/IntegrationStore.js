import { action, computed, configure, observable } from 'mobx';
import _ from "lodash";
import saveAs from 'file-saver';
import { callAxios2, postAxios } from '../utils/data-utils'
import { convert, convertAggregate, convertSchedules } from './converters'
import { NotificationManager } from "react-notifications";
import Schedule from "./Schedule";
import { convertDataToURL } from "../utils/utils";


configure({
    enforceActions: "observed"
});

class IntegrationStore {

    @observable programs = [];
    @observable dataSets = [];
    @observable program = {};
    @observable dataSet = {};
    @observable d2 = {};
    @observable trackedEntityInstances = [];
    @observable error = '';
    @observable activeStep = 0;
    @observable activeAggregateStep = 0;
    @observable skipped = new Set();
    @observable completed = new Set();
    @observable completedAggregate = new Set();
    @observable steps = ['SAVED MAPPINGS', 'SELECT PROGRAM', 'IMPORT TYPE', 'DATA OPTIONS', 'MAP PROGRAM ATTRIBUTES', 'MAP PROGRAM STAGES', 'IMPORT DATA', 'IMPORT SUMMARY'];
    @observable aggregateSteps = ['SAVED MAPPINGS', 'SELECT DATA SET', 'IMPORT TYPE', 'IMPORT OPTIONS', 'DATA SET MAPPING', 'IMPORT DATA', 'IMPORT SUMMARY'];
    @observable totalSteps = 8;
    @observable totalAggregateSteps = 7;
    @observable multipleCma = {};
    @observable mappings = [];
    @observable tracker;
    @observable dataElements = [];
    @observable userGroups = [];
    @observable search = '';

    @observable params = [];

    @observable programsFilter = '';
    @observable expanded;
    @observable hasMappingsNameSpace;

    @observable aggregate;
    @observable aggregates = [];

    @observable schedulerEnabled = true;

    @observable isFull = true;
    @observable dialogOpen = false;
    @observable uploadData = false;
    @observable importData = false;
    @observable scheduled = false;
    @observable schedules = [];
    @observable currentSchedule = {};

    @observable scheduleTypes = [{
        value: 'Second',
        label: 'Second',
    }, {
        value: 'Minute',
        label: 'Minute',
    }, {
        value: 'Hour',
        label: 'Hour',
    }];


    @observable jump = false;
    @observable aggregateJump = false;
    @observable loading = false;
    @observable open = true;
    @observable totalDataSets = 0;
    @observable totalPrograms = 0;

    @observable paging = {
        d1: {
            page: 0,
            rowsPerPage: 10
        },
        d2: {
            page: 0,
            rowsPerPage: 10
        },
        d3: {
            page: 0,
            rowsPerPage: 10
        },

        step1: {
            page: 0,
            rowsPerPage: 10
        },
        d25: {
            page: 0,
            rowsPerPage: 5
        },
        step25: {
            page: 0,
            rowsPerPage: 5
        },
        dataSets: {
            page: 0,
            rowsPerPage: 10
        }

    };

    @action setDialogOpen = val => this.dialogOpen = val;
    @action setTotalDataSets = val => this.totalDataSets = val;
    @action setTotalPrograms = val => this.totalPrograms = val;
    @action openDialog = () => this.setDialogOpen(true);
    @action closeDialog = () => this.setDialogOpen(false);
    @action openSchedule = () => this.setScheduled(true);
    @action setCurrentSchedule = val => this.currentSchedule = val;

    @action setOpen = val => this.open = val;

    @action createSchedule = () => {
        this.currentSchedule = new Schedule();
        this.openSchedule();
    };

    @action handleDrawerOpen = () => {
        this.setOpen(true)
    };

    @action handleDrawerClose = () => {
        const open = !this.open;
        this.setOpen(open)
    };

    @action saveSchedules = async () => {
        try {
            const namespace = await this.d2.dataStore.get('bridge');
            namespace.set('schedules', this.schedules);
            NotificationManager.success('Success', 'Mapping saved successfully', 5000);
        } catch (e) {
            NotificationManager.error('Error', `Could not save mapping ${e.message}`, 5000);
        }
    };

    @action saveSchedule = async () => {

        const mapping = _.findIndex(this.schedules, {
            name: this.currentSchedule.name
        });


        if (mapping !== -1) {
            this.schedules.splice(mapping, 1, this.currentSchedule);
        } else {
            this.schedules = [...this.schedules, this.currentSchedule];
        }

        try {
            const namespace = await this.d2.dataStore.get('bridge');
            namespace.set('schedules', this.schedules);
            NotificationManager.success('Success', 'Mapping saved successfully', 5000);
        } catch (e) {
            NotificationManager.error('Error', `Could not save mapping ${e.message}`, 5000);
        }

        this.closeScheduledDialog();
    };

    log = args => {
        // const program = {...args};
    };

    @action updateSchedule = args => {
        this.setCurrentSchedule(args);
        this.openSchedule();
    };

    @action startSchedule = async args => {
        try {
            const data = await postAxios(args.url + '/schedules', args);
            args.setNext(data.next);
            args.setLast(data.last);
            this.setCurrentSchedule(args);
            await this.saveSchedule()
        } catch (e) {
            NotificationManager.error('Error', `Could not schedule ${e.message}`, 5000);
        }
    };

    @action deleteSchedule1 = async args => {
        await this.deleteSchedule(args);
    };

    @action stopSchedule = async args => {
        await postAxios(args.url + '/stop', { name: args.name });
        await this.saveSchedule()
    };


    upload = args => {
        this.setProgram(args);
        this.setUpload(true);
    };

    uploadAgg = args => {
        this.setDataSet(args);
        this.setUpload(true);
    };

    delete = args => {
        args.deleteMapping(this.mappings);
    };

    deleteAgg = async args => {
        await args.deleteAggregate(this.aggregates);
    };

    import = args => {
        this.setProgram(args);
        this.setImportData(true);
    };

    importAgg = args => {
        if (args.templateType.value === "4" || args.templateType.value === "5" || args.templateType.value === "6") {
            this.setDataSet(args);
            this.setImportData(true);
        } else {
            NotificationManager.warning(`Mapping type does not support API import`, 'Warning');
        }
    };

    downloadData = args => {
        const blob = new Blob([JSON.stringify(args.canBeSaved, null, 2)], { type: 'application/json' });
        saveAs(blob, "data.json");
    };

    @action setSearch = async (val, what) => {
        this.search = val;
        switch (what) {
            case 'd1':
                await this.fetchDataSets();
                break;
            case 'step1':
                await this.fetchPrograms();
                break;
            default:
                console.log('Nothing to do');
        }


    };

    @action downloadProgramData = () => {
        const {
            newTrackedEntityInstances,
            newEnrollments,
            newEvents,
            trackedEntityInstancesUpdate,
            eventsUpdate
        } = this.program.processed;


        if (newTrackedEntityInstances.length > 0) {
            const blob = new Blob([JSON.stringify({ trackedEntityInstances: newTrackedEntityInstances }, null, 2)], { type: 'application/json' });
            saveAs(blob, "NewTrackedEntityInstances.json");
        }

        if (trackedEntityInstancesUpdate.length > 0) {
            const blob = new Blob([JSON.stringify({ trackedEntityInstances: trackedEntityInstancesUpdate }, null, 2)], { type: 'application/json' });
            saveAs(blob, "TrackedEntityInstancesUpdate.json");
        }

        if (newEnrollments.length > 0) {
            const blob = new Blob([JSON.stringify({ enrollments: newEnrollments }, null, 2)], { type: 'application/json' });
            saveAs(blob, "NewEnrollments.json");
        }

        if (newEvents.length > 0) {
            const blob = new Blob([JSON.stringify({ events: newEvents }, null, 2)], { type: 'application/json' });
            saveAs(blob, "NewEvents.json");
        }

        if (newEvents.length > 0) {
            const blob = new Blob([JSON.stringify({ events: eventsUpdate }, null, 2)], { type: 'application/json' });
            saveAs(blob, "EventsUpdate.json");
        }

    };

    @action downloadAggregateData = () => {
        const dataValues = this.dataSet.processed;

        const blob = new Blob([JSON.stringify({ dataValues }, null, 2)], { type: 'application/json' });
        saveAs(blob, "DataValues.json");
    };

    @action setD2 = (d2) => {
        this.d2 = d2;
    };

    @action
    handleNext = async () => {
        // if (this.activeStep === 3 && (!this.program.isTracker || (!this.program.createEntities && !this.program.updateEntities))) {
        if (this.activeStep === 3 && !this.program.isTracker) {
            this.changeSet(this.activeStep + 2);
        } else if (this.activeStep === 6 && this.program.totalImports === 0) {
            this.handleReset()
        } else if (this.activeStep === 7) {
            this.handleReset()
        } else {
            this.changeSet(this.activeStep + 1);
        }

        // if (this.activeStep === 8) {
        //     await this.saveMapping();
        //     this.changeSet(0)
        // }
    };

    @action
    handleNextAggregate = () => {
        if (this.dataSet.templateType && (this.dataSet.templateType.value === '4' || (this.dataSet.templateType.value === '5' && this.dataSet.multiplePeriods)) && this.activeAggregateStep === 4) {
            this.changeAggregateSet(this.activeAggregateStep + 1);
            this.handleNextAggregate();
        } else if (this.activeAggregateStep === 6) {
            this.handleResetAggregate()
        } else {
            this.changeAggregateSet(this.activeAggregateStep + 1);
        }
    };

    @action goFull = () => {
        this.isFull = true;
    };

    @action setFull = val => {
        this.isFull = val;
    };

    @action
    handleBack = () => {
        if (this.activeStep === 5 && !this.program.isTracker) {
            this.changeSet(this.activeStep - 2);
        } else if (this.activeStep === 2 && this.jump) {
            this.changeSet(0);
        } else {
            this.changeSet(this.activeStep - 1);
        }
    };

    @action
    handleAggregateBack = () => {
        if (this.activeAggregateStep === 2 && this.aggregateJump) {
            this.changeAggregateSet(0)
        } else if (this.dataSet.isDhis2 && this.activeAggregateStep === 5) {
            this.changeAggregateSet(this.activeAggregateStep - 2);
        } else {
            this.changeAggregateSet(this.activeAggregateStep - 1)
        }
    };

    @action
    saveMapping = () => {
        this.program.saveMapping(this.mappings);
    };

    @action
    saveAggregate = async () => {
        await this.dataSet.saveAggregate(this.aggregates);
    };

    @action changeSet = (step) => {
        this.activeStep = step;
    };

    @action
    handleStep = step => () => {
        this.changeSet(step);
    };


    @action changeAggregateSet = (step) => {
        this.activeAggregateStep = step;
    };

    @action changeActiveStep = (step) => {
        this.activeStep = step;
    };

    @action
    handleAggregateStep = step => () => {
        this.changeAggregateSet(step);
    };

    @action
    handleComplete = async () => {
        const completed = new Set(this.completed);
        completed.add(this.activeStep);
        this.completed = completed;
        if (completed.size !== this.totalSteps() - this.skippedSteps()) {
            await this.handleNext();
        }
    };

    @action closeImportDialog = () => {
        this.setImportData(false);
    };

    @action closeUploadDialog = () => {
        this.setUpload(false);
        this.setImportData(false);
    };

    @action closeScheduledDialog = () => {
        this.setScheduled(false);
    };

    @action
    handleReset = () => {
        this.activeStep = 0;
        this.completed = new Set();
        this.skipped = new Set();
    };

    @action
    handleResetAggregate = () => {
        this.activeAggregateStep = 0;
        this.completedAggregate = new Set();
        this.skipped = new Set();
    };

    skippedSteps() {
        return this.skipped.size;
    }

    isStepComplete(step) {
        return this.completed.has(step);
    }

    isAggregateStepComplete(step) {
        return this.completedAggregate.has(step);
    }


    allStepsCompleted() {
        return this.completed === this.totalSteps - this.skippedSteps();
    }

    allAggregateStepsCompleted() {
        return this.completedAggregate === this.totalAggregateSteps - this.skippedSteps();
    }


    @action
    executeEditIfAllowed = async model => {
        this.jump = false;
        model.createNewEvents = true;
        model.dataStartRow = 2;
        model.headerRow = 1;
        model.orgUnitStrategy = {
            value: 'auto',
            label: 'auto'
        };
        model.schedule = 30;
        model.scheduleType = {
            value: 'Minute',
            label: 'Minute'
        };


        this.program = convert(model, this.d2);
        const maxMapping = _.maxBy(this.mappings, 'mappingId');

        if (maxMapping) {
            this.program.setMappingId(maxMapping.mappingId + 1);
        } else {
            this.program.setMappingId(1);
        }

        await this.handleNext()
    };

    @action
    executeEditIfAllowedAgg = async model => {
        this.openDialog();
        try {
            const api = this.d2.Api.getApi();
            const { dataValues } = await api.get('dataSets/' + model.id + '/dataValueSet', {});
            model.forms.forEach(f => {
                const des = f.dataElements.map(de => de.id);
                f.categoryOptionCombos.forEach(coc => {

                    const filtered = dataValues.filter(dv => {
                        return dv.categoryOptionCombo === coc.id && des.indexOf(dv.dataElement) !== -1
                    });

                    const mappings = filtered.map(m => {
                        return [m.dataElement, null]
                    });

                    coc.mapping = _.fromPairs(mappings);
                });
            });

            model = {
                ...model,
                dataValues
            };
            this.setDataSet(convertAggregate(model, this.d2));

            const maxAggregate = _.maxBy(this.aggregates, 'aggregateId');


            if (maxAggregate) {
                this.dataSet.setAggregateId(maxAggregate.aggregateId + 1);
            } else {
                this.dataSet.setAggregateId(1);
            }
            await this.handleNextAggregate();
            this.openDialog();
        } catch (e) {
            this.closeDialog();
            NotificationManager.error(`${e.message} could not fetch data value sets`, 'Error', 5000);
        }
    };

    @action handleRadioChange = data => {
        this.dataSet.setTemplateType(data);
        this.dataSet.setFileName('');
        this.dataSet.destroy();

        if (this.dataSet.templateType && this.dataSet.templateType.value === '4') {
            this.dataSet.setIsDhis2(true);
        }
        // await this.handleNextAggregate();
    };

    @action handleTemplateTypeChange = data => {
        this.program.setTemplateType(data);
        this.program.setFileName('');
    };

    @action
    useSaved = model => {
        this.program = model;
        this.jump = true;
        this.activeStep = this.activeStep + 2;
    };

    @action
    useSavedAggregate = model => {
        this.dataSet = model;
        this.aggregateJump = true;
        this.activeAggregateStep = this.activeAggregateStep + 2;
    };

    @action getScheduleInfo = async () => {
        const data = await callAxios2('http://localhost:3001/api/v1/info', {});
        const schedules = this.schedules.map(s => {
            const val = data[s.name];

            if (val) {
                s = { ...s, val };
            }
            return s;
        });

        this.setSchedules(schedules);
    };

    @action deleteSchedule = async (schedule) => {
        const mapping = _.findIndex(this.schedules, { name: schedule.name });
        this.schedules.splice(mapping, 1);

        try {
            const namespace = await this.d2.dataStore.get('bridge');
            await namespace.set('schedules', this.schedules);
        } catch (e) {
            NotificationManager.error(`Could not save schedule ${e.message}`, 'Error', 5000);
        }
    };

    @action
    fetchPrograms = async () => {
        this.openDialog();
        const api = this.d2.Api.getApi();

        let params = [{
            param: 'page',
            value: this.paging.step1.page + 1

        }, {
            param: 'pageSize',
            value: this.paging.step1.rowsPerPage
        }, {
            param: 'fields',
            value: 'id,name,displayName,lastUpdated,programType,trackedEntityType,trackedEntity,programTrackedEntityAttributes[mandatory,valueType,trackedEntityAttribute[id,code,name,displayName,unique,optionSet[options[name,code]]]],programStages[id,name,displayName,repeatable,programStageDataElements[compulsory,dataElement[id,code,valueType,name,displayName,optionSet[options[name,code]]]]],organisationUnits[id,code,name]'
        }, {
            param: 'order',
            value: 'name:asc'
        }];

        if (this.search !== '') {
            params = [...params, {
                param: 'filter',
                value: `name:ilike:${this.search}`
            }, {
                param: 'filter',
                value: `code:like:${this.search}`
            }, {
                param: 'rootJunction',
                value: 'OR'
            }]
        }

        const stringParams = convertDataToURL(params);

        try {
            const { programs, pager: { total } } = await api.get(`programs?${stringParams}`);
            this.setPrograms(programs);
            this.setTotalPrograms(total);
            this.toggleLoading(false);
            this.closeDialog();
        } catch (e) {
            NotificationManager.error(`${e.message} could not fetch programs`, 'Error', 5000);
            console.log(e);
            this.closeDialog();
        }
    };

    @action
    fetchDataSets = async () => {
        this.openDialog();
        const api = this.d2.Api.getApi();

        let params = [{
            param: 'page',
            value: this.paging.d1.page + 1

        }, {
            param: 'pageSize',
            value: this.paging.d1.rowsPerPage
        }, {
            param: 'fields',
            value: 'id,name,code,periodType,categoryCombo[id,name,categories[id,name,code,categoryOptions[id,name,code]],categoryOptionCombos[id,name,categoryOptions[id,name]]],dataSetElements[dataElement[id,name,code,valueType,categoryCombo[id,name,categoryOptionCombos[id,name]]]],organisationUnits[id,name,code],organisationUnits[id,name,code]'
        }, {
            param: 'order',
            value: 'name:asc'
        }];

        if (this.search !== '') {
            params = [...params, {
                param: 'filter',
                value: `name:ilike:${this.search}`
            }, {
                param: 'filter',
                value: `code:like:${this.search}`
            }, {
                param: 'rootJunction',
                value: 'OR'
            }]
        }

        const stringParams = convertDataToURL(params);


        try {
            let { dataSets, pager: { total } } = await api.get(`dataSets?${stringParams}`);
            dataSets = dataSets.map(dataSet => {
                const groupedDataElements = _.groupBy(dataSet['dataSetElements'], 'dataElement.categoryCombo.id');

                const forms = _.map(groupedDataElements, v => {
                    const dataElements = v.map(des => {
                        return {
                            id: des.dataElement.id,
                            name: des.dataElement.name,
                            code: des.dataElement.code,
                            valueType: des.dataElement.valueType
                        };
                    });
                    const categoryOptionCombos = v[0]['dataElement']['categoryCombo']['categoryOptionCombos'];
                    const name = v[0]['dataElement']['categoryCombo']['name'];
                    return {
                        name,
                        dataElements,
                        categoryOptionCombos
                    }
                });

                const organisationUnits = dataSet['organisationUnits'];

                return {
                    ..._.pick(dataSet, ['id', 'name', 'code', 'periodType', 'categoryCombo']),
                    organisationUnits,
                    forms
                };
            });

            this.setDataSets(dataSets);
            this.setTotalDataSets(total);
            this.closeDialog();
        } catch (e) {
            this.closeDialog();
            NotificationManager.error(`${e.message} could not fetch data sets`, 'Error', 5000);
        }

    };


    @action checkAggregateDataStore = async () => {
        this.openDialog();
        const val = await this.d2.dataStore.has('bridge');
        if (!val) {
            await this.createAggregateDataStore()
        } else {
            await this.fetchSavedAggregates();
        }
        this.closeDialog();
    };

    @action checkDataStore = async () => {
        this.setLoading(true);
        this.openDialog();
        const val = await this.d2.dataStore.has('bridge');
        if (!val) {
            await this.createDataStore()
        } else {
            await this.fetchSavedMappings();
        }

        this.setLoading(false);
        this.closeDialog();
    };


    @action checkScheduleDataStore = async () => {
        this.setLoading(true);
        this.openDialog();

        const val = await this.d2.dataStore.has('bridge');
        if (!val) {
            await this.createAggregateDataStore()
        } else {
            await this.fetchSavedSchedules();
        }

        this.setLoading(false);
        this.closeDialog();
    };

    @action fetchSavedMappings = async () => {
        try {
            const namespace = await this.d2.dataStore.get('bridge');
            const mappings = await namespace.get('mappings');
            const processedMappings = mappings.map(m => {
                return convert(m, this.d2);
            });
            this.setMappings(processedMappings);
        } catch (e) {
            this.setMappings([]);
            // NotificationManager.error(`${e.message} could not fetch saved mappings`, 'Error', 5000);
        }
    };

    @action handleChange = event => {
        this.currentSchedule.setValue(null);
        this.currentSchedule.setType(event.target.value);
    };


    @action fetchSavedSchedules = async () => {
        try {
            const namespace = await this.d2.dataStore.get('bridge');
            const schedules = await namespace.get('schedules');
            let foundSchedules = convertSchedules(schedules);
            const all = foundSchedules.map(async s => {
                return callAxios2(s.url + '/info', {});
            });
            const data = await Promise.all(all);

            let obj = {};

            data.forEach(d => {
                obj = { ...obj, ...d }
            });

            const processed = foundSchedules.map(s => {
                const cs = obj[s.name];

                if (cs !== null && cs !== undefined) {
                    s = { ...s, ...cs }
                }

                return s;
            });

            this.setSchedules(processed);
            await this.saveSchedules()
        } catch (e) {
            // this.setSchedules(foundSchedules)
        }
    };

    @action fetchSavedAggregates = async () => {

        try {
            const namespace = await this.d2.dataStore.get('bridge');
            const aggregates = await namespace.get('aggregates');

            const processedAggregates = aggregates.map(m => {
                return convertAggregate(m, this.d2);
            });
            this.setAggregates(processedAggregates);
        } catch (e) {
            this.setAggregates([]);
            // NotificationManager.error(`${e.message} could not fetch saved aggregate mappings`, 'Error', 5000);
        }
    };

    @action createDataStore = async () => {

        try {
            const namespace = await this.d2.dataStore.create('bridge');
            namespace.set('mappings', this.mappings);
        } catch (e) {
            NotificationManager.error('Could not create data store', 'Error', 5000);
        }
    };

    @action createScheduleDataStore = async () => {

        try {
            const namespace = await this.d2.dataStore.create('bridge');
            namespace.set('schedules', this.schedules);
        } catch (e) {
            NotificationManager.error('Could not create data store', 'Error', 5000);
        }
    };

    @action createAggregateDataStore = async () => {
        try {
            const namespace = await this.d2.dataStore.create('bridge');
            namespace.set('aggregates', this.aggregates);
        } catch (e) {
            NotificationManager.error('Could not create data store', 'Error', 5000);
        }
    };

    @action
    toggleLoading = (val) => {
        this.loading = val;
    };

    @action
    filterPrograms = (programsFilter) => {
        programsFilter = programsFilter.toLowerCase();
        this.programsFilter = programsFilter;
    };


    @action setExpanded = expanded => {
        this.expanded = expanded;
    };


    @action
    handlePanelChange = panel => (event, expanded) => {
        this.setExpanded(expanded ? panel : false);
    };


    @action
    toggleCanCreateEvents() {
        this.createNewEvents = true;
    }

    @action setPrograms = val => this.programs = val;
    @action setDataSets = val => this.dataSets = val;
    @action setDataSet = val => this.dataSet = val;
    @action setMappings = val => this.mappings = val;
    @action setSchedules = val => this.schedules = val;
    @action setAggregate = val => this.aggregate = val;
    @action setAggregates = val => this.aggregates = val;
    @action setLoading = val => this.loading = val;
    @action setUpload = val => this.uploadData = val;
    @action setScheduled = val => this.scheduled = val;
    @action setImportData = val => this.importData = val;
    @action setProgram = val => this.program = val;
    @action setPaging = val => this.paging = val;

    @action fetchDataElements = () => {
        this.d2.models.dataElement.list({
            paging: false,
            fields: 'id,name,code',
            filter: 'domainType:eq:AGGREGATE'
        }).then(action(response => {
            this.dataElements = response.toArray();
        }), action(e => {
            console.log(e);
        }))
    };

    @action fetchUserGroups = () => {
        this.d2.models.userGroups.list({
            paging: false,
        }).then(action(response => {
            this.userGroups = response.toArray();
        }), action(e => {
            console.log(e);
        }))
    };

    @action
    handleChangeElementPage = what => async (event, page) => {
        const current = this.paging[what];
        const change = {};
        if (current) {
            change.page = page;
            change.rowsPerPage = current.rowsPerPage;
            const data = _.fromPairs([
                [what, change]
            ]);

            const p = {
                ...this.paging,
                ...data
            };
            this.setPaging(p);
            switch (what) {
                case 'd1':
                    await this.fetchDataSets();
                    break;
                case 'step1':
                    await this.fetchPrograms();
                    break;
                default:
                    console.log('Nothing to do');
            }
        }
    };

    @action
    handleChangeElementRowsPerPage = what => async (event) => {
        const current = this.paging[what];
        const change = {};
        if (current) {
            change.rowsPerPage = event.target.value;
            change.page = 0;
            const data = _.fromPairs([
                [what, change]
            ]);
            const p = {
                ...this.paging,
                ...data
            };

            this.setPaging(p);

            switch (what) {
                case 'd1':
                    await this.fetchDataSets();
                    break;
                case 'step1':
                    await this.fetchPrograms();
                    break;
                default:
                    console.log('Nothing to do');
            }
        }
    };

    @computed
    get disableNext() {
        if (this.activeStep === 2) {
            if (!this.program.templateType) {
                return true;
            } else if (this.program.templateType.value === '1') {
                return !this.program.data || this.program.data.length === 0 || this.program.mappingName === ''
            } else if (this.program.templateType.value === '2') {

                try {
                    const url = new URL(this.program.url);
                    return this.program.mappingName === '' || !url.protocol || (url.protocol !== 'http:' && url.protocol !== 'https:');
                } catch (e) {
                    return true;
                }
            }
        } else if (this.activeStep === 3) {
            return (!this.program.enrollmentDateColumn && this.program.createNewEnrollments) || (this.program.incidentDateProvided && !this.program.incidentDateColumn)
        } else if (this.activeStep === 4 && (this.program.createEntities || this.program.updateEntities)) {
            return !this.program.mandatoryAttributesMapped;
        } else if (this.activeStep === 5) {
            return !this.program.compulsoryDataElements || (this.program.fetchingEntities === 1 && this.program.isTracker);
        }
        // else if (this.activeStep === 5) {
        //     return this.program.disableCreate;
        // }
        return false;
    }

    @computed
    get disableDownload() {
        if (this.activeStep === 6) {
            return this.program.totalImports === 0
        }
        return false;
    }


    @computed
    get disableNextAggregate() {
        if (this.activeAggregateStep === 2) {
            if (this.dataSet.templateType) {
                if (this.dataSet.templateType.value === '1' || this.dataSet.templateType.value === '2' || this.dataSet.templateType.value === '3') {
                    return _.keys(this.dataSet.data).length === 0 || this.dataSet.mappingName === '';
                } else {
                    let cond;
                    try {
                        const url = new URL(this.dataSet.url);
                        cond = this.dataSet.mappingName === '' || !url.protocol || (url.protocol !== 'http:' && url.protocol !== 'https:');
                    } catch (e) {
                        cond = true;
                    }

                    if (this.dataSet.templateType.value === '4' || this.dataSet.templateType.value === '5') {
                        return this.dataSet.username === '' || this.dataSet.password === '' || cond
                    }
                    return cond;
                }
            } else {
                return true
            }
        } else if (this.activeAggregateStep === 3) {
            if (this.dataSet.templateType.value === '1' || this.dataSet.templateType.value === '6') {
                return _.keys(this.dataSet.data).length === 0
                    || !this.dataSet.ouMapped
                    // || !this.dataSet.allAttributesMapped
                    || !this.dataSet.periodMapped
                    || !this.dataSet.dataElementColumn
                    || !this.dataSet.categoryOptionComboColumn
                    || !this.dataSet.dataValueColumn;
            } else if (this.dataSet.templateType.value === '2') {
                return !this.dataSet
                    || !this.dataSet.data
                    || this.dataSet.data.length === 0
                    || !this.dataSet.ouMapped
                    // || !this.dataSet.allAttributesMapped
                    || !this.dataSet.periodMapped
                    || !this.dataSet.dataStartColumn
                    || this.dataSet.dataStartColumn.length === 0

            } else if (this.dataSet.templateType.value === '3') {
                return !this.dataSet
                    || !this.dataSet.data
                    || this.dataSet.data.length === 0
                    || !this.dataSet.ouMapped
                    // || !this.dataSet.allAttributesMapped
                    || !this.dataSet.periodMapped
            } else if (this.dataSet.templateType.value === '4') {
                return !this.dataSet
                    || !this.dataSet.selectedDataSet
                    // || !this.dataSet.allAttributesMapped
                    || !this.dataSet.currentLevel
                    || (this.dataSet.multiplePeriods && (!this.dataSet.startPeriod || !this.dataSet.endPeriod))
                    || (!this.dataSet.multiplePeriods && !this.dataSet.periodExists)
            } else if (this.dataSet.templateType.value === '5') {
                return !this.dataSet
                    || !this.dataSet.currentLevel
                    || !this.dataSet.periodExists2
                    || this.dataSet.selectedIndicators.length === 0
            }
        } else if (this.activeAggregateStep === 4) {
            // return !this.dataSet.isDhis2 && (!this.dataSet.processed || this.dataSet.processed.length === 0)
        }
        return false;
    }

    @computed
    get nextLabel() {
        if (this.activeStep === 0) {
            return 'Create New Mapping';
        } else if (this.activeStep === 5 && this.program.fetchingEntities === 1 && this.program.isTracker) {
            return 'Fetching tracked entity instances'
        } else if (this.activeStep === 6) {
            if (this.program.totalImports > 0 && this.program.processed.conflicts.length > 0) {
                return 'Import With Conflicts';
            } else if (this.program.totalImports === 0) {
                return 'Finish';
            }
            return 'Import';
        } else if (this.activeStep === 7) {
            return 'Finish'
        } else {
            return 'Next';
        }
    }

    @computed
    get nextAggregateLabel() {
        if (this.activeAggregateStep === 0) {
            return 'New Mapping';
        } else if (this.activeAggregateStep === 5) {
            return 'Import';
        } else if (this.activeAggregateStep === 6) {
            return 'Finish'
        } else {
            return 'Next';
        }
    }

    @computed
    get finishLabel() {
        if (this.activeStep === 5) {
            return 'Cancel'
        } else {
            return 'Finish';
        }
    }

    @computed
    get finishAggregateLabel() {
        if (this.activeAggregateStep === 5) {
            return 'Cancel'
        } else {
            return 'Finish';
        }
    }

    @computed get rows() {
        return this.dataElements.length + 1;
    }

    @computed get columns() {
        return this.userGroups.length + 1;
    }

    @computed get searchedDataSets() {
        if (this.search !== '') {
            return this.dataSets.filter(v => {
                return v.name.toLowerCase().indexOf(this.search.toLowerCase()) > -1;
            })
        }

        return this.dataSets;

    }

    @computed get currentDataSets() {
        const info = this.paging['d1'];
        return this.searchedDataSets.slice(info.page * info.rowsPerPage, info.page * info.rowsPerPage + info.rowsPerPage);

    }

    @computed get sourceUnits() {
        const info = this.paging['d25'];
        return this.dataSet.sourceOrganisationUnits.slice(info.page * info.rowsPerPage, info.page * info.rowsPerPage + info.rowsPerPage);
    }

    @computed get sourceProgramUnits() {
        const info = this.paging['step25'];
        return this.program.sourceOrganisationUnits.slice(info.page * info.rowsPerPage, info.page * info.rowsPerPage + info.rowsPerPage);
    }

    @computed get searchedPrograms() {
        if (this.search !== '') {
            return this.programs.filter(v => {
                return v.name.toLowerCase().indexOf(this.search.toLowerCase()) > -1;
            })
        }
        return this.programs;
    }

    @computed get currentPrograms() {
        const info = this.paging['step1'];
        return this.searchedPrograms.slice(info.page * info.rowsPerPage, info.page * info.rowsPerPage + info.rowsPerPage);
    }


    @computed get currentOptions() {
        if (this.currentSchedule.type === 'aggregate') {
            return this.aggregates.filter(v => {
                return v.url && v.url !== '';
            }).map(m => {
                return { label: m.mappingName, value: m.canBeSaved }
            })
        } else if (this.currentSchedule.type === 'tracker') {
            return this.mappings.filter(v => {
                return v.url && v.url !== '';
            }).map(m => {
                return { label: m.mappingName, value: m.canBeSaved }
            })
        }
        return [];
    }

    @observable tableActions = {
        download: this.import,
        upload: this.upload,
        template: this.downloadData,
        delete: this.delete,
        // schedule: this.schedule
    };


    @observable scheduleActions = {
        start: this.startSchedule,
        stop: this.stopSchedule,
        delete: this.deleteSchedule1
    };

    @observable tableAggActions = {
        upload: this.uploadAgg,
        // download: this.importAgg,
        template: this.downloadData,
        delete: this.deleteAgg

    };

    @observable otherAggActions = {
        log: this.log
    };

    @computed get currentMessage() {
        return this.program.message || this.dataSet.message;
    }
}

const store = new IntegrationStore();
export default store;

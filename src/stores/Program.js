import {
    action,
    computed,
    observable
} from 'mobx';
import _ from 'lodash';
import moment from 'moment';

import {
    NotificationManager
} from 'react-notifications';

import XLSX from 'xlsx';

import axios from 'axios';
import {
    encodeData, groupEntities, isTracker, processEvents, processProgramData, programUniqueAttribute, programUniqueColumn
} from "../utils/utils";
import Param from "./Param";
import OrganisationUnit from "./OrganisationUnit";

import ProgramWorker from 'workerize-loader?inline!./Workers'; // eslint-disable-line import/no-webpack-loader-syntax


class Program {
    @observable lastUpdated;
    @observable name;
    @observable id;
    @observable programType;
    @observable displayName;
    @observable programStages = [];
    @observable programTrackedEntityAttributes = [];
    @observable trackedEntityType;
    @observable trackedEntity;
    @observable mappingId = 1;
    @observable running = false;

    @observable orgUnitColumn = '';
    @observable orgUnitStrategy = {
        value: 'auto',
        label: 'auto'
    };
    @observable organisationUnits = [];

    @observable headerRow = 1;
    @observable dataStartRow = 2;

    @observable createNewEnrollments = false;

    @observable createEntities = false;
    @observable updateEntities = true;

    @observable enrollmentDateColumn = '';
    @observable incidentDateColumn = '';

    @observable url = '';
    @observable dateFilter = '';
    @observable dateEndFilter = '';
    @observable lastRun = '';

    @observable uploaded = 0;
    @observable uploadMessage = '';

    @observable page = 0;
    @observable rowsPerPage = 5;
    @observable dialogOpen = false;

    @observable paging = {
        nel: {
            page: 0,
            rowsPerPage: 10
        },
        nte: {
            page: 0,
            rowsPerPage: 10
        },
        nev: {
            page: 0,
            rowsPerPage: 10
        },
        teu: {
            page: 0,
            rowsPerPage: 10
        },
        evu: {
            page: 0,
            rowsPerPage: 10
        },
        err: {
            page: 0,
            rowsPerPage: 10
        },
        con: {
            page: 0,
            rowsPerPage: 10
        },
        dup: {
            page: 0,
            rowsPerPage: 10
        }
    };

    @observable orderBy = 'mandatory';
    @observable order = 'desc';
    @observable attributesFilter = '';

    @observable trackedEntityInstances = [];
    @observable d2;
    @observable fetchingEntities = 0;

    @observable responses = [];

    @observable increment = 0;

    @observable errors = [];
    @observable conflicts = [];
    @observable duplicates = [];

    @observable longitudeColumn;
    @observable latitudeColumn;

    @observable pulling = false;

    @observable workbook = null;

    @observable selectedSheet = null;

    @observable pulledData = null;

    @observable sheets = [];

    @observable dataSource = 1;

    @observable scheduleTime = 0;

    @observable percentages = [];

    @observable total = 0;
    @observable displayProgress = false;

    @observable username = '';
    @observable password = '';
    @observable params = [];
    @observable responseKey = '';
    @observable fileName;
    @observable mappingName;
    @observable mappingDescription;
    @observable templateType;
    @observable sourceOrganisationUnits = [];
    @observable message = '';
    @observable incidentDateProvided = false;
    @observable worker;


    constructor(lastUpdated, name, id, programType, displayName, programStages, programTrackedEntityAttributes) {
        this.lastUpdated = lastUpdated;
        this.name = name;
        this.id = id;
        this.programType = programType;
        this.displayName = displayName;
        this.programStages = programStages;
        this.programTrackedEntityAttributes = programTrackedEntityAttributes;
    }

    @action setDialogOpen = val => this.dialogOpen = val;
    @action openDialog = () => this.setDialogOpen(true);
    @action closeDialog = () => this.setDialogOpen(false);

    @action
    setD2 = (d2) => {
        this.d2 = d2;
    };

    @action
    toggleDataPull() {
        this.dataPulled = !this.dataPulled;
    }


    @action
    handelHeaderRowChange = value => {
        this.headerRow = value;
        if (value) {
            this.handelDataRowStartChange(parseInt(value, 10) + 1)
        } else {
            this.handelDataRowStartChange('')
        }
    };

    @action
    handleMappingNameChange = value => {
        this.mappingName = value;
    };

    @action
    handleMappingDescriptionChange = value => {
        this.mappingDescription = value;
    };

    @action
    handelDataRowStartChange = value => this.dataStartRow = value;

    @action
    handelScheduleTimeChange = value => this.scheduleTime = value;

    @action pushPercentage = val => this.percentages = [...this.percentages, val];

    @action
    handleOrgUnitSelectChange = value => {
        this.orgUnitColumn = value;
        this.computeUnits();
    };

    @action
    handleOrgUnitStrategySelectChange = value => this.orgUnitStrategy = value;


    @action
    handleCreateNewEnrollmentsCheck = event => {
        this.createNewEnrollments = event.target.checked;

        if (!this.createNewEnrollments) {
            this.enrollmentDateColumn = null;
            this.incidentDateColumn = null;
        }
    };

    @action
    handleIncidentDateProvidedCheck = event => {
        this.incidentDateProvided = event.target.checked;
    };


    @action
    handleChangeElementPage = what => (event, page) => {
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
        }
    };

    @action
    handleChangeElementRowsPerPage = what => event => {
        const current = this.paging[what];
        const change = {};
        if (current) {
            change.rowsPerPage = event.target.value;
            change.page = current.page;
            const data = _.fromPairs([
                [what, change]
            ]);
            const p = {
                ...this.paging,
                ...data
            };

            this.setPaging(p);
        }
    };

    @action
    handleCreateEntitiesCheck = event => {
        this.createEntities = event.target.checked;
    };

    @action
    handleUpdateEntitiesCheck = event => {
        this.updateEntities = event.target.checked;
    };

    @action
    handleEventDateColumnSelectChange = value => this.eventDateColumn = value;

    @action
    handleEnrollmentDateColumnSelectChange = value => this.enrollmentDateColumn = value;

    @action
    handleIncidentDateColumnSelectChange = value => this.incidentDateColumn = value;

    @action
    handelURLChange = value => this.url = value;

    @action
    handelDateFilterChange = value => this.dateFilter = value;

    @action
    handelDateEndFilterChange = value => this.dateEndFilter = value;

    @action
    handelScheduleChange = value => this.schedule = value.target.value;

    @action
    scheduleTypeChange = () => action(value => {
        this.scheduleType = value.value;
    });

    @action addParam = () => {
        this.params = [...this.params, new Param()]
    };

    @action removeParam = i => () => {
        const current = [...this.params.slice(0, i), ...this.params.slice(i + 1)];
        this.setParams(current);
    };

    @action setDataSource = val => this.dataSource = val;


    @action
    onDrop = async (accepted, rejected) => {
        if (accepted.length > 0) {
            this.openDialog();
            this.uploadMessage = '';
            const f = accepted[0];
            this.setFileName(f.name);

            let instance = new ProgramWorker();
            const workbook = await instance.expensive(accepted);
            this.setWorkbook(workbook);
            const sheets = this.workbook.SheetNames.map(s => {
                return {
                    label: s,
                    value: s
                }
            });

            this.setSheets(sheets);

            if (sheets.length > 0) {
                await this.setSelectedSheet(sheets[0]);
            }

            if (this.uniqueIds) {
                await this.searchTrackedEntities();
            }

            if (!this.isTracker) {
                const programStage = this.programStages[0];
                await programStage.findEventsByDates(this);
                await programStage.findEventsByElements(this);
            }

            this.closeDialog();
        } else if (rejected.length > 0) {
            NotificationManager.error('Only XLS, XLSX and CSV are supported', 'Error', 5000);
        }

    };


    @action
    pullData = async () => {
        let param = '';

        if (this.params.length > 0) {
            param = encodeData(this.params);
        }

        if (this.url) {
            this.openDialog();
            try {
                let response;
                if (this.username !== '' && this.password !== '') {
                    this.setPulling(true);
                    response = await axios.get(this.url + '?' + param, {
                        params: {},
                        withCredentials: true,
                        auth: {
                            username: this.username,
                            password: this.password
                        }
                    });
                } else {
                    this.setPulling(true);
                    response = await axios.get(this.url + '?' + param);
                }

                if (response.status === 200) {
                    let {
                        data
                    } = response;
                    this.setPulling(false);
                    this.setDataSource(3);

                    if (this.responseKey && this.responseKey !== '') {
                        this.setPulledData(data[this.responseKey]);
                    } else {
                        this.setPulledData(data);
                    }

                    await this.searchTrackedEntities();

                    if (!this.isTracker) {
                        const programStage = this.programStages[0];
                        await programStage.findEventsByDates(this);
                        await programStage.findEventsByElements(this);
                    }
                    this.setLastRun(moment(new Date()).format('YYYY-MM-DD HH:mm:ss'));

                    this.closeDialog();
                }
            } catch (e) {
                NotificationManager.error(e.message, 'Error', 5000);
                this.setPulling(false);
                this.closeDialog();
            }
        }
    };

    @action
    onProgress = ev => {
        this.uploaded = (ev.loaded * 100) / ev.total
    };

    @action
    onLoadStart = ev => {
        this.uploaded = 0
    };

    @action
    setPulling = val => this.pulling = val;

    @action
    onLoadEnd = ev => {
        this.uploaded = null
    };

    @action
    handleChangePage = (event, page) => this.page = page;

    @action
    handleChangeRowsPerPage = event => this.rowsPerPage = event.target.value;

    @action createSortHandler = property => event => {
        const orderBy = property;
        let order = 'desc';

        if (this.orderBy === property && this.order === 'desc') {
            order = 'asc';
        }
        this.setOrderBy(orderBy);
        this.setOrder(order);

    };

    @action setOrder = val => this.order = val;
    @action setOrderBy = val => this.orderBy = val;
    @action setOrganisationUnits = val => this.organisationUnits = val;
    @action setOrgUnitStrategy = val => this.orgUnitStrategy = val;
    @action setHeaderRow = val => this.headerRow = val;
    @action setDataStartRow = val => this.dataStartRow = val;
    @action setCreateNewEnrollments = val => this.createNewEnrollments = val;
    @action setEnrollmentDateColumn = val => this.enrollmentDateColumn = val;
    @action setIncidentDateColumn = val => this.incidentDateColumn = val;
    @action setUrl = val => this.url = val;
    @action setDateFilter = val => this.dateFilter = val;
    @action setDateEndFilter = val => this.dateEndFilter = val;
    @action setScheduleTime = val => this.scheduleTime = val;
    @action setLastRun = val => this.lastRun = val;
    @action setUploaded = val => this.uploaded = val;
    @action setUploadMessage = val => this.uploadMessage = val;
    @action setOrgUnitColumn = val => this.orgUnitColumn = val;
    @action setMappingId = val => this.mappingId = val;
    @action setErrors = val => this.errors = val;
    @action setConflicts = val => this.conflicts = val;
    @action setDuplicates = val => this.duplicates = val;
    @action setLongitudeColumn = val => this.longitudeColumn = val;
    @action setLatitudeColumn = val => this.latitudeColumn = val;
    @action setMessage = val => this.message = val;
    @action setSelectedSheet = async val => {
        this.selectedSheet = val;
        if (val) {
            if (this.uniqueIds) {
                await this.searchTrackedEntities();
            }

            if (!this.isTracker) {
                const programStage = this.programStages[0];
                await programStage.findEventsByDates(this);
                await programStage.findEventsByElements(this);
            }

            this.computeUnits();
        }
    };
    @action setWorkbook = val => this.workbook = val;
    @action setSheets = val => this.sheets = val;
    @action setFetchingEntities = val => this.fetchingEntities = val;
    @action setPulledData = val => this.pulledData = val;
    @action setResponse = val => this.responses = [...this.responses, val];
    @action setDisplayProgress = val => this.displayProgress = val;
    @action setTrackedEntity = val => this.trackedEntity = val;
    @action setTrackedEntityType = val => this.trackedEntityType = val;
    @action setRunning = val => this.running = val;
    @action setUpdateEnrollments = val => this.updateEnrollments = val;
    @action setCreateEntities = val => this.createEntities = val;
    @action setUpdateEntities = val => this.updateEntities = val;
    @action setTrackedEntityInstances = val => this.trackedEntityInstances = val;
    @action setPaging = val => this.paging = val;
    @action setUsername = val => this.username = val;
    @action setPassword = val => this.password = val;
    @action setParams = val => this.params = val;
    @action setResponseKey = val => this.responseKey = val;
    @action setFileName = val => this.fileName = val;
    @action setMappingName = val => this.mappingName = val;
    @action setMappingDescription = val => this.mappingDescription = val;
    @action setTemplateType = val => this.templateType = val;
    @action setSourceOrganisationUnit = val => this.sourceOrganisationUnits = val;
    @action setIncidentDateProvided = val => this.incidentDateProvided = val;

    @action
    filterAttributes = attributesFilter => {
        attributesFilter = attributesFilter.toLowerCase();
        this.attributesFilter = attributesFilter;
    };

    @action
    searchTrackedEntities = async () => {
        this.openDialog();
        const api = this.d2.Api.getApi();
        try {
            if (this.uniqueIds.length > 0) {
                this.setFetchingEntities(1);
                const all = this.uniqueIds.map(uniqueId => {
                    return api.get('trackedEntityInstances', {
                        ouMode: 'ALL',
                        filter: this.uniqueAttribute + ':EQ:' + uniqueId,
                        fields: 'trackedEntityInstance',
                        pageSize: 1
                    })
                });

                const results = await Promise.all(all);

                const ids = results.map(r => {
                    const {trackedEntityInstances} = r;
                    return trackedEntityInstances.map(t => {
                        return t.trackedEntityInstance;
                    })
                });

                const entities = _.chunk(_.flatten(ids), 50).map(ids => ids.join(';'));

                const all1 = entities.map(entityGroup => {
                    const params = {
                        paging: false,
                        ouMode: 'ALL',
                        trackedEntityInstance: entityGroup,
                        fields: 'trackedEntityInstance,orgUnit,attributes[attribute,value],enrollments[enrollment,program,' +
                            'trackedEntityInstance,trackedEntityType,trackedEntity,enrollmentDate,incidentDate,orgUnit,events[program,trackedEntityInstance,event,' +
                            'eventDate,status,completedDate,coordinate,programStage,orgUnit,dataValues[dataElement,value]]]'
                    };
                    return api.get('trackedEntityInstances', params)
                });

                const results1 = await Promise.all(all1);

                let foundEntities = [];

                for (let instance of results1) {
                    const {trackedEntityInstances} = instance;
                    foundEntities = [...foundEntities, ...trackedEntityInstances];
                }
                this.setTrackedEntityInstances(foundEntities);
                this.setFetchingEntities(2);
            }
        } catch (e) {
            NotificationManager.error(e.message, 'Error', 5000);
        }
        this.closeDialog();
    };

    @action
    insertTrackedEntityInstance = (data) => {
        const api = this.d2.Api.getApi();
        return api.post('trackedEntityInstances', data, {});
    };

    @action
    updateTrackedEntityInstances = (trackedEntityInstances) => {
        const api = this.d2.Api.getApi();
        return trackedEntityInstances.map(trackedEntityInstance => {
            return api.update('trackedEntityInstances/' + trackedEntityInstance['trackedEntityInstance'], trackedEntityInstance, {});
        });
    };

    @action
    insertEnrollment = (data) => {
        const api = this.d2.Api.getApi();
        return api.post('enrollments', data, {});
    };

    @action
    insertEvent = (data) => {
        const api = this.d2.Api.getApi();
        return api.post('events', data, {});
    };

    @action
    updateDHISEvents = (eventsUpdate) => {
        const api = this.d2.Api.getApi();
        const events = eventsUpdate.map(event => {
            return event.dataValues.map(dataValue => {
                const {eventDate, ...others} = event;
                return {event: {...others, dataValues: [dataValue]}, dataElement: dataValue.dataElement};
            });
        });

        return _.flatten(events).map(ev => {
            return api.update('events/' + ev.event.event + '/' + ev.dataElement, ev.event, {})
        })
    };

    @action setResponses = val => {

        if (Array.isArray(val)) {
            this.responses = [...this.responses, ...val]
        } else {
            this.responses = [...this.responses, val]
        }
    };

    @action create = async () => {
        this.setDisplayProgress(true);
        this.openDialog();
        const {
            newTrackedEntityInstances,
            newEnrollments,
            newEvents,
            trackedEntityInstancesUpdate,
            eventsUpdate
        } = this.processed;
        try {
            if (newTrackedEntityInstances.length > 0) {
                const chunkedTEI = _.chunk(newTrackedEntityInstances, 250);
                const total = newTrackedEntityInstances.length;
                let current = 0;
                this.setMessage(`Creating tracked entities ${current}/${total}`);

                for (const tei of chunkedTEI) {
                    current = current + tei.length;
                    this.setMessage(`Creating tracked entities ${current}/${total}`);
                    const instancesResults = await this.insertTrackedEntityInstance({
                        trackedEntityInstances: tei
                    });
                    instancesResults.type = 'trackedEntityInstance';
                    this.setResponses(instancesResults);
                }
                this.setMessage('Finished creating tracked entities');

            }
        } catch (e) {
            this.setResponses(e);
        }

        try {
            if (trackedEntityInstancesUpdate.length > 0) {
                const total = trackedEntityInstancesUpdate.length;
                let current = 0;
                this.setMessage(`Updating tracked entities ${current}/${total}`);
                const chunkedTEI = _.chunk(trackedEntityInstancesUpdate, 250);
                for (const tei of chunkedTEI) {
                    current = current + tei.length;
                    this.setMessage(`Updating tracked entities ${current}/${total}`);
                    const instancesResults = await this.insertTrackedEntityInstance({trackedEntityInstances: tei});
                    instancesResults.type = 'trackedEntityInstance';
                    this.setResponses(instancesResults);

                }

                this.setMessage('Finished updating tracked entities');
            }
        } catch (e) {
            this.setResponses(e);
        }

        try {
            if (newEnrollments.length > 0) {
                const total = newEnrollments.length;
                let current = 0;
                this.setMessage(`Creating enrollments for tracked entities ${current}/${total}`);
                const chunkedEnrollments = _.chunk(newEnrollments, 250);
                for (const enrollments of chunkedEnrollments) {
                    current = current + enrollments.length;
                    this.setMessage(`Creating enrollments for tracked entities ${current}/${total}`);
                    const enrollmentsResults = await this.insertEnrollment({
                        enrollments: enrollments
                    });
                    enrollmentsResults.type = 'enrollment';
                    this.setResponses(enrollmentsResults);
                }

                this.setMessage('Finished creating enrollments for tracked entities');

            }
        } catch (e) {
            this.setResponses(e);
        }
        try {
            if (newEvents.length > 0) {
                const total = newEvents.length;
                let current = 0;
                this.setMessage(`Creating events ${current}/${total}`);
                const chunkedEvents = _.chunk(newEvents, 250);

                for (const events of chunkedEvents) {
                    current = current + events.length;
                    this.setMessage(`Creating events ${current}/${total}`);
                    const eventsResults = await this.insertEvent({
                        events
                    });

                    eventsResults.type = 'event';
                    this.setResponses(eventsResults);

                }
                this.setMessage('Finished creating tracked entities');
            }
        } catch (e) {
            this.setResponses(e);
        }

        try {
            if (eventsUpdate.length > 0) {
                const total = newEvents.length;
                let current = 0;
                this.setMessage(`Updating events ${current}/${total}`);
                const chunkedEvents = _.chunk(eventsUpdate, 250);
                for (const events of chunkedEvents) {
                    current = current + events.length;
                    this.setMessage(`Updating events ${current}/${total}`);
                    const eventsResults = await Promise.all(this.updateDHISEvents(events));
                    this.setResponses(eventsResults);
                }
                this.setMessage('Finished updating events');
            }
        } catch (e) {
            this.setResponses(e);
        }

        this.setPulledData(null);
        this.setWorkbook(null);
        await this.setSelectedSheet(null);
        this.setDisplayProgress(false);
        this.setMessage('');
        this.closeDialog();
    };

    @action saveMapping = async mappings => {
        const {
            conflicts,
            duplicates,
            errors
        } = this.processed;
        this.setConflicts(conflicts);
        this.setErrors(errors);
        this.setDuplicates(duplicates);
        const mapping = _.findIndex(mappings, {
            mappingId: this.mappingId
        });


        if (mapping !== -1) {
            mappings.splice(mapping, 1, this);
        } else {
            mappings = [...mappings, this]
        }

        const toBeSaved = mappings.map(p => {
            return p.canBeSaved;
        });
        try {
            const namespace = await this.d2.dataStore.get('bridge');
            namespace.set('mappings', toBeSaved);
            NotificationManager.success('Success', 'Mapping saved successfully', 5000);
        } catch (e) {
            NotificationManager.error('Error', `Could not save mapping ${e.message}`, 5000);
        }
    };

    @action deleteMapping = async mappings => {
        const mapping = _.findIndex(mappings, {
            mappingId: this.mappingId
        });
        mappings.splice(mapping, 1);

        mappings = mappings.map(p => {
            return p.canBeSaved;
        });

        const namespace = await this.d2.dataStore.get('bridge');
        namespace.set('mappings', mappings);
    };

    @action scheduleProgram = mappings => {
        if (this.scheduleTime !== 0) {
            setInterval(action(async () => {
                if (!this.running) {
                    this.setRunning(true);
                    await this.pullData();
                    await this.create();
                    this.lastRun = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                    await this.saveMapping(mappings);
                    this.setRunning(false);
                }
            }), this.scheduleTime * 60 * 1000);
        } else {
            console.log('Schedule time not set');
        }
    };


    @action runWhenURL = mappings => {
        this.setRunning(true);
        this.pullData();
        this.create();
        this.lastRun = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        this.saveMapping(mappings);
    };

    @action runWithFile = mappings => {
        if (this.scheduleTime !== 0) {
            setInterval(action(() => {
                if (!this.running) {
                    this.setRunning(true);
                    this.pullData();
                    this.create();
                    this.lastRun = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                    this.saveMapping(mappings);
                    this.setRunning(false);
                }
            }), this.scheduleTime * 60 * 1000);
        } else {
            console.log('Schedule time not set');
        }
    };

    @action loadDefaultAttributes = () => {
        if (this.updateEntities || this.createEntities) {
            this.programAttributes.forEach(pa => {
                const match = this.columns.find(column => {
                    return column.value === pa.trackedEntityAttribute.name;
                });

                if (match && !pa.column) {
                    pa.setColumn(match);
                }
            });
        }
    };

    @action
    searchedEvents = async () => {

        const {possibleEvents} = this.processed;
        let newEvents = [];
        let eventsUpdate = [];

        if (possibleEvents.length > 0 && !this.isTracker) {

            for (const event of possibleEvents) {
                const ev = await this.searchEvent(event);
                if (ev.update) {
                    eventsUpdate = [...eventsUpdate, ev]
                } else {
                    newEvents = [...newEvents, ev]
                }
            }
        }
    };

    @action  computeUnits = () => {
        if (this.orgUnitColumn && this.data.length > 0 && _.keys(this.data[0]).indexOf(this.orgUnitColumn.value) !== -1) {
            let units = this.data.map(d => {
                return new OrganisationUnit('', d[this.orgUnitColumn.value], '');
            });

            units = _.uniqBy(units, v => JSON.stringify(v)).map(org => {
                let foundOU = undefined;

                const foundOUById = _.find(this.organisationUnits, o => {
                    return o.id === org.name;
                });

                if (foundOUById) {
                    foundOU = foundOUById;
                } else {
                    const foundOUByCode = _.find(this.organisationUnits, o => {
                        return o.code === org.name;
                    });

                    if (foundOUByCode) {
                        foundOU = foundOUByCode;
                    } else {

                        const foundOUByName = _.find(this.organisationUnits, o => {
                            return org.name === o.name;
                        });

                        if (foundOUByName) {
                            foundOU = foundOUByName;
                        }
                    }
                }
                if (foundOU) {
                    org.setMapping({label: foundOU.name, value: foundOU.id});
                }
                return org
            });
            this.setSourceOrganisationUnit(units);
        }
    };

    @computed
    get disableCreate() {
        return this.totalImports === 0
    }

    @computed
    get data() {
        if (this.workbook && this.selectedSheet) {
            return XLSX.utils.sheet_to_json(this.workbook.Sheets[this.selectedSheet.value], {
                range: this.headerRow - 1,
                dateNF: 'YYYY-MM-DD'
            });
        } else if (this.pulledData) {
            return this.pulledData
        }

        return [];
    }

    @computed
    get percentage() {
        return _.reduce(this.percentages, (memo, num) => {
            return memo + num
        }, 0);
    }

    @computed
    get columns() {
        if (this.workbook && this.selectedSheet) {
            const workSheet = this.workbook.Sheets[this.selectedSheet.value];
            if (workSheet) {
                const range = XLSX.utils.decode_range(workSheet['!ref']);
                return _.range(0, range.e.c + 1).map(v => {
                    const cell = XLSX.utils.encode_cell({
                        r: this.headerRow - 1,
                        c: v
                    });
                    const cellValue = workSheet[cell];
                    if (cellValue) {
                        return {
                            label: cellValue.v.toString(),
                            value: cellValue.v.toString()
                        };
                    } else {
                        return {
                            label: '',
                            value: ''
                        };
                    }
                }).filter(c => {
                    return c.label !== '';
                });
            }
        } else if (this.pulledData) {
            return _.keys(this.pulledData[0]).map(e => {
                return {
                    label: e,
                    value: e
                }
            });
        }
        return [];
    }

    @computed
    get canBeSaved() {
        return _.pick(this,
            [
                'lastUpdated',
                'name',
                'id',
                'programType',
                'displayName',
                'programStages',
                'programTrackedEntityAttributes',
                'trackedEntityType',
                'trackedEntity',
                'mappingId',
                'orgUnitColumn',
                'orgUnitStrategy',
                'organisationUnits',
                'headerRow',
                'dataStartRow',
                'updateEvents',
                'createNewEnrollments',
                'createEntities',
                'updateEntities',
                'eventDateColumn',
                'enrollmentDateColumn',
                'incidentDateColumn',
                'scheduleTime',
                'url',
                'dateFilter',
                'dateEndFilter',
                'lastRun',
                'uploaded',
                'uploadMessage',
                // 'errors',
                // 'conflicts',
                // 'duplicates',
                // 'responses',
                'username',
                'password',
                'responseKey',
                'params',
                'longitudeColumn',
                'latitudeColumn',
                'selectedSheet',
                'mappingName',
                'mappingDescription',
                'sourceOrganisationUnits',
                'templateType',
                'incidentDateProvided'
            ])
    }

    @computed
    get processedResponses() {
        let errors = [];
        let conflicts = [];
        let successes = [];

        this.responses.forEach(response => {
            const type = response.type;
            if (response['httpStatusCode'] === 200) {
                const rep = response['response'];
                const {
                    importSummaries,
                    importCount
                } = rep;

                if (importCount) {
                    successes = [...successes, {
                        ...importCount,
                        type: 'Event',
                        reference: rep.reference
                    }];
                } else if (importSummaries) {
                    importSummaries.forEach(importSummary => {
                        const {
                            importCount,
                            reference,
                        } = importSummary;
                        successes = [...successes, {
                            ...importCount,
                            type,
                            reference
                        }];
                    });
                }

                if (importSummaries) {

                }
            } else if (response['httpStatusCode'] === 409) {
                _.forEach(response['response']['importSummaries'], (s) => {
                    _.forEach(s['conflicts'], (conflict) => {
                        conflicts = [...conflicts, {
                            ...conflict
                        }];
                    });
                    if (s['href']) {
                        successes = [...successes, {
                            href: s['href']
                        }];
                    }
                });
            } else if (response['httpStatusCode'] === 500) {
                errors = [...errors, {
                    ...response['error']
                }];
            }
        });
        const pro = _.groupBy(successes, 'reference');

        let s = [];

        _.forOwn(pro, (d, k) => {
            const reduced = _.reduce(d, (result, value) => {
                result.updated = result.updated + value.updated;
                result.imported = result.imported + value.imported;
                result.deleted = result.deleted + value.deleted;
                return result
            }, {updated: 0, imported: 0, deleted: 0});

            reduced.type = d[0]['type'];
            reduced.reference = k;
            s = [...s, reduced]
        });

        return {
            errors,
            successes: s,
            conflicts
        }
    }


    @computed
    get isTracker() {
        return isTracker(this)
    }

    @computed get allOrganisationUnits() {
        return _.fromPairs(this.organisationUnits.map(ou => [ou.id, ou.name]));
    }


    @computed
    get programAttributes() {
        const sorter = this.order === 'desc' ?
            (a, b) => (b[this.orderBy] < a[this.orderBy] ? -1 : 1) :
            (a, b) => (a[this.orderBy] < b[this.orderBy] ? -1 : 1);

        return this.programTrackedEntityAttributes.filter(item => {
            const displayName = item.trackedEntityAttribute.displayName.toLowerCase();
            return displayName.includes(this.attributesFilter)
        }).sort(sorter).slice(this.page * this.rowsPerPage, this.page * this.rowsPerPage + this.rowsPerPage);
    }

    @computed
    get allAttributes() {
        return this.programTrackedEntityAttributes.length;
    }


    @computed
    get uniqueAttribute() {
        return programUniqueAttribute(this)
    }


    @computed
    get uniqueColumn() {
        return programUniqueColumn(this)
    }

    @computed
    get uniqueIds() {
        if (this.uniqueColumn !== null && this.data && this.data.length > 0) {
            let foundIds = this.data.map(d => {
                return d[this.uniqueColumn];
            }).filter(c => {
                return c !== null && c !== undefined && c !== '';
            });
            foundIds = _.uniq(foundIds);
            return foundIds;
            // return _.chunk(foundIds, 50).map(ids => ids.join(';'));
        }
        return [];
    }

    @computed
    get searchedInstances() {
        return groupEntities(this.uniqueAttribute, this.trackedEntityInstances)
    }

    @computed
    get mandatoryAttributesMapped() {
        const allMandatory = this.programTrackedEntityAttributes.filter(item => {
            return item.mandatory && !item.column;
        });
        return allMandatory.length === 0;
    }

    @computed
    get compulsoryDataElements() {
        let compulsory = [];
        this.programStages.forEach(ps => {

            const pse = ps.programStageDataElements.filter(item => {
                return item.compulsory;
            }).map(e => {
                return e.dataElement.id
            });

            const me = ps.programStageDataElements.filter(item => {
                return item.compulsory && item.column && item.column.value;
            }).map(e => {
                return e.dataElement.id
            });

            let mapped = false;

            if (me.length === 0) {
                mapped = true;
            } else if ((ps.createNewEvents || ps.updateEvents) && pse.length > 0 && me.length > 0 && _.difference(pse, me).length === 0) {
                mapped = true;
            } else if ((ps.createNewEvents || ps.updateEvents) && pse.length > 0 && me.length > 0 && _.difference(pse, me).length > 0) {
                mapped = false;
            }
            compulsory = [...compulsory, {
                mapped
            }]
        });
        return _.every(compulsory, 'mapped');
    }


    @computed
    get processed() {
        if (this.isTracker) {
            return processProgramData(this.data, this, this.uniqueColumn, this.searchedInstances);
        } else {
            const programStage = this.programStages[0];
            return processEvents(this, this.data, programStage.eventsByDate, programStage.eventsByDataElement);
        }
    }


    @computed get processedAttributes() {
        const data = this.programTrackedEntityAttributes.map(item => {
            return [item.trackedEntityAttribute.id, item.trackedEntityAttribute.displayName];
        });
        return _.fromPairs(data)
    }

    @computed get processedDataElements() {
        let finalDataElements = [];

        for (const stage of this.programStages) {
            for (const element of stage.programStageDataElements) {
                finalDataElements = [...finalDataElements, [element.dataElement.id, element.dataElement.name]]
            }
        }
        return _.fromPairs(finalDataElements)
    }

    @computed get currentNewInstances() {
        const {
            newTrackedEntityInstances
        } = this.processed;

        return newTrackedEntityInstances.map(tei => {
            const attributes = tei.attributes.map(a => {
                return {...a, name: this.processedAttributes[a.attribute]};
            });

            return {...tei, attributes, orgUnit: this.allOrganisationUnits[tei.orgUnit]}
        })
    }

    @computed get allStages() {
        return _.fromPairs(this.programStages.map(s => [s.id, s.name]));
    }

    @computed get currentNewEnrollments() {
        const {
            newEnrollments
        } = this.processed;

        return newEnrollments.map(e => {
            return {...e, orgUnit: this.allOrganisationUnits[e.orgUnit]}
        })
    }

    @computed get currentNewEvents() {
        const {
            newEvents
        } = this.processed;

        return newEvents.map(event => {
            const dataValues = event.dataValues.map(e => {
                return {...e, name: this.processedDataElements[e.dataElement]};
            });

            return {
                ...event,
                dataValues,
                orgUnit: this.allOrganisationUnits[event.orgUnit],
                programStage: this.allStages[event.programStage]
            }
        });
    }

    @computed get currentInstanceUpdates() {
        const {
            trackedEntityInstancesUpdate
        } = this.processed;

        return trackedEntityInstancesUpdate.map(tei => {
            const attributes = tei.attributes.map(a => {
                return {...a, name: this.processedAttributes[a.attribute]};
            });

            return {...tei, attributes, orgUnit: this.allOrganisationUnits[tei.orgUnit]}
        });
    }

    @computed get currentEventUpdates() {
        const {
            eventsUpdate
        } = this.processed;

        return eventsUpdate.map(event => {
            const dataValues = event.dataValues.map(e => {
                return {...e, name: this.processedDataElements[e.dataElement]};
            });

            return {
                ...event,
                dataValues,
                orgUnit: this.allOrganisationUnits[event.orgUnit],
                programStage: this.allStages[event.programStage]
            }
        });
    }

    @computed get currentErrors() {
        const {
            errors
        } = this.processed;

        const info = this.paging['err'];

        if (errors && errors.length > 0) {
            return errors.slice(info.page * info.rowsPerPage, info.page * info.rowsPerPage + info.rowsPerPage);
        }
        return [];
    }

    @computed get currentConflicts() {
        const {
            conflicts
        } = this.processed;

        const info = this.paging['con'];

        if (conflicts && conflicts.length > 0) {
            return conflicts.slice(info.page * info.rowsPerPage, info.page * info.rowsPerPage + info.rowsPerPage);
        }
        return [];
    }

    @computed get currentDuplicates() {
        const {
            duplicates
        } = this.processed;

        const info = this.paging['dup'];

        if (duplicates && duplicates.length > 0) {
            return duplicates.slice(info.page * info.rowsPerPage, info.page * info.rowsPerPage + info.rowsPerPage);
        }
        return [];
    }

    @computed get totalImports() {
        const {
            newTrackedEntityInstances,
            newEnrollments,
            newEvents,
            trackedEntityInstancesUpdate,
            eventsUpdate
        } = this.processed;

        if (this.isTracker) {
            return newTrackedEntityInstances.length + newEnrollments.length + newEvents.length + trackedEntityInstancesUpdate.length + eventsUpdate.length;
        } else {
            return newEvents.length + eventsUpdate.length
        }
    }

    @computed get eventsByDataElement() {
        let data;
        const stage = this.programStages[0];

        for (const psde of stage.programStageDataElements) {
            data = {[psde.dataElement.id]: psde.dataElement.eventsByDataElement}
        }

        return data
    }


}

export default Program;

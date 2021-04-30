import { action, computed, observable } from "mobx";
import _ from "lodash";
import XLSX from "xlsx";
import { encodeData, enumerateDates, nest } from "../utils/utils";
import saveAs from "file-saver";
import { callAxios, postAxios } from "../utils/data-utils";
import { processMergedCells } from "../utils/excel-utils";
import { NotificationManager } from "react-notifications";
import Param from "./Param";
import { Store as GroupStore } from "@dhis2/d2-ui-core";
import OrganisationUnit from "./OrganisationUnit";
import moment from "moment";
import { fromPairs } from "lodash";
import DataSetWorker from "workerize-loader?inline!./Workers"; // eslint-disable-line import/no-webpack-loader-syntax

const instance = new DataSetWorker();

class DataSet {
  @observable id;
  @observable code;
  @observable name;
  @observable categoryCombo;
  @observable forms = [];

  @observable aggregateId = 1;

  @observable selectedSheet;
  @observable sheets = [];
  @observable workbook;
  @observable workSheet;

  @observable orgUnitColumn;
  @observable periodColumn;
  @observable dataStartColumn;
  @observable orgUnitStrategy;

  @observable organisationUnits;

  @observable periodInExcel = false;
  @observable organisationUnitInExcel = false;
  @observable attributeCombosInExcel = false;

  @observable dataElementColumn;
  @observable categoryOptionComboColumn;
  @observable dataValueColumn;

  @observable headerRow = 1;
  @observable dataStartRow = 2;

  @observable uploadMessage = "";
  @observable uploaded = 0;

  @observable page = 0;
  @observable rowsPerPage = 10;

  @observable params = [];

  @observable isDhis2 = false;
  @observable dhis2DataSets = [];
  @observable dhis2DataSet;

  @observable d2;

  @observable mapping;

  @observable currentData;

  @observable dataValues;

  @observable periodType;

  @observable period;
  @observable displayProgress = false;
  @observable displayDhis2Progress = false;

  @observable organisation;
  @observable organisationColumn;
  @observable periodCell;
  @observable organisationCell;
  @observable url = "";
  @observable pulledData = null;
  @observable responses = [];
  @observable cell2 = {};
  @observable sourceOrganisationUnits = [];

  @observable filterText = "";

  @observable pullingErrors = [];

  @observable username = "";

  @observable password = "";

  @observable pulling = false;
  @observable templateType = null;

  @observable responseKey = "";

  @observable dialogOpen = false;
  @observable levels = [];
  @observable indicators = [];
  @observable programIndicators = [];
  @observable selectedIndicators = [];
  @observable remoteOrganisations = [];
  @observable currentLevel;
  @observable selectedDataSet;
  @observable template = 0;
  @observable fileName;

  @observable mappingName;
  @observable mappingDescription;
  @observable completeDataSet = true;
  @observable multiplePeriods = false;

  @observable startPeriod = moment().subtract(3, "months").format("YYYY-MM-DD");
  @observable endPeriod = moment().format("YYYY-MM-DD");

  @observable itemStore = GroupStore.create();
  @observable assignedItemStore = GroupStore.create();
  @observable dataElementStore = GroupStore.create();
  @observable assignedDataElementStore = GroupStore.create();

  @observable dataIndicators = false;
  @observable proIndicators = true;
  @observable dataDataElements = false;
  @observable message = "";
  @observable scheduleServerUrl = "http://localhost:3001";
  @observable useProxy = false;
  @observable proxy = "";
  @observable processed;
  @observable isUploadingFromPage;
  @observable dialogOpened = false;

  @observable selectedPeriods = [];
  @observable action = "upload";

  @observable showOnlyUnmappedUnits = true;
  @observable unitsFilter = "";

  @action setDialogOpen = (val) => (this.dialogOpen = val);
  @action setUnitsFilter = (val) => {
    this.unitsFilter = val;
  };
  @action setProxy = (val) => (this.proxy = val);
  @action setIsUploadingFromPage = (val) => (this.isUploadingFromPage = val);
  @action openDialog = () => this.setDialogOpen(true);
  @action closeDialog = () => this.setDialogOpen(false);
  @action onClose = () => {
    this.setDialogOpened(false);
  };

  @action setSelectedPeriods = (val) => {
    this.selectedPeriods = val;
  };

  @action onDeselect = (val) => {
    const toBeDeselected = val.map((v) => v.id);
    const periods = this.selectedPeriods.filter((p) => {
      return toBeDeselected.indexOf(p.id) === -1;
    });
    this.setSelectedPeriods(periods);
  };

  @action onReorder = () => {};

  @action onUpdate = async (selectedPeriods) => {
    this.setDialogOpened(false);
  };

  @action
  setD2 = (d2) => {
    this.d2 = d2;
  };

  @action
  pick = (val) => {
    this.period = val;
  };

  @action setId = (val) => (this.id = val);
  @action setAction = (val) => (this.action = val);
  @action setName = (val) => (this.name = val);
  @action setCode = (val) => (this.code = val);
  @action setForms = (val) => (this.forms = val);
  @action setCategoryCombo = (val) => (this.categoryCombo = val);
  @action setMapping = (val) => (this.mapping = val);
  @action setDataValues = (val) => (this.dataValues = val);
  @action setDialogOpened = (val) => (this.dialogOpened = val);
  @action changeAction = (event) => {
    this.setAction(event.target.value);
  };
  @action togglePeriodDialog = () => {
    this.setDialogOpened(!this.dialogOpened);
  };
  @action setTemplateType = (val) => {
    this.templateType = val;
    const forms = this.forms.map((f) => {
      if (val) {
        f.setTemplateType(val.value);
      }
      return f;
    });

    if (this.templateType && this.templateType.value !== "3") {
      this.periodInExcel = false;
      this.organisationUnitInExcel = false;
      this.attributeCombosInExcel = false;
    }

    this.setForms(forms);
  };
  @action setFileName = (val) => (this.fileName = val);

  @action setSelectedSheet = async (val) => {
    this.selectedSheet = val;
    if (val && this.workbook) {
      this.setWorkSheet(this.workbook.Sheets[val.value]);
      if (this.isUploadingFromPage) {
        await this.process();
      }
    }
  };

  @action setWorkbook = (val) => (this.workbook = val);
  @action setSheets = (val) => (this.sheets = val);
  @action setDataSets = (val) => (this.dataSets = val);

  @action setOrgUnitColumn = (val) => {
    this.orgUnitColumn = val;
    if (
      this.templateType &&
      this.templateType.value === "2" &&
      !_.isEmpty(this.rowData) &&
      this.orgUnitColumn
    ) {
      let units = this.rows
        .map((r) => {
          const oCell = this.orgUnitColumn.value + r;
          const ouVal = this.data[oCell];
          const ou = ouVal ? ouVal["v"] : "";
          return new OrganisationUnit("", ou, "");
        })
        .filter((ou) => ou.name !== "");
      this.convertAndMakeDefault(units, this.organisationUnits);
    } else if (
      !_.isEmpty(this.rowData) &&
      _.isArray(this.rowData) &&
      this.orgUnitColumn
    ) {
      let units = this.rowData.map((d) => {
        return new OrganisationUnit("", d[this.orgUnitColumn.value], "");
      });
      this.convertAndMakeDefault(units, this.organisationUnits);
    }
  };

  @action setOrgUnitStrategy = (val) => (this.orgUnitStrategy = val);
  @action setPeriodColumn = (val) => (this.periodColumn = val);
  @action setDataStartColumn = (val) => (this.dataStartColumn = val);
  @action setDataElementColumn = (val) => (this.dataElementColumn = val);
  @action setCategoryOptionComboColumn = (val) =>
    (this.categoryOptionComboColumn = val);
  @action setDataValueColumn = (val) => (this.dataValueColumn = val);
  @action setHeaderRow = (val) => (this.headerRow = val);
  @action setDataStartRow = (val) => (this.dataStartRow = val);
  @action setOrganisationUnits = (val) => (this.organisationUnits = val);
  @action setPeriodType = (val) => (this.periodType = val);
  @action setOrganisation = (val) => (this.organisation = val);
  @action setOrganisationCell = (val) => (this.organisationCell = val);
  @action setWorkSheet = (val) => (this.workSheet = val);
  @action setPeriod = (val) => (this.period = val);
  @action setCompleteDataSet = (val) => (this.completeDataSet = val);
  @action setMessage = (val) => (this.message = val);

  @action filterChange = (val) => (this.filterText = val);

  @action setSelectedIndicators = (val) => (this.selectedIndicators = val);
  @action handelURLChange = (value) => {
    this.url = value;
    if (this.url !== "") {
      this.setTemplate(2);
    } else {
      this.setTemplate(0);
    }
  };
  @action setDisplayProgress = (val) => (this.displayProgress = val);
  @action setDisplayDhis2Progress = (val) => (this.displayDhis2Progress = val);
  @action setPulledData = (val) => (this.pulledData = val);
  @action setUrl = (val) => (this.url = val);
  @action setAggregateId = (val) => (this.aggregateId = val);
  @action setOrganisationColumn = (val) => (this.organisationColumn = val);
  @action setCell2 = (val) => (this.cell2 = val);
  @action setPulling = (val) => (this.pulling = val);
  @action setUsername = (val) => (this.username = val);
  @action setDhis2DataSets = (val) => (this.dhis2DataSets = val);
  @action setIsDhis2 = (val) => (this.isDhis2 = val);
  @action setLevels = (val) => (this.levels = val);
  @action setIndicators = (val) => (this.indicators = val);
  @action setProgramIndicators = (val) => (this.programIndicators = val);
  @action setPassword = (val) => (this.password = val);
  @action setResponseKey = (val) => (this.responseKey = val);
  @action setRemoteOrganisations = (val) => (this.remoteOrganisations = val);
  @action setSourceOrganisationUnits = (val) =>
    (this.sourceOrganisationUnits = val);
  @action setUseProxy = (val) => (this.useProxy = val);
  @action setCurrentLevel = async (val) => {
    this.openDialog();
    this.currentLevel = val;
    let organisations = await this.pullOrganisationUnits();

    if (this.templateType && this.templateType.value === "4") {
      const ous = organisations.map((ou) => {
        return new OrganisationUnit(ou.id, ou.name, ou.code);
      });
      this.setRemoteOrganisations(ous);
    }

    if (this.templateType && this.templateType.value === "5") {
      organisations = organisations.map((ou) => {
        const org = new OrganisationUnit(ou.id, ou.name, ou.code);
        let foundOU = this.organisationUnits.find((o) => {
          return o.id && ou.id && o.id === ou.id;
        });

        if (!foundOU) {
          foundOU = this.organisationUnits.find((o) => {
            return (
              o.code &&
              ou.code &&
              o.code !== "" &&
              ou.code !== "" &&
              o.code === ou.code
            );
          });
        }
        if (!foundOU) {
          foundOU = this.organisationUnits.find((o) => {
            return ou.name && o.name && ou.name === o.name;
          });
        }

        if (foundOU) {
          org.setMapping({ label: foundOU.name, value: foundOU.id });
        } else {
          org.setMapping(null);
        }
        return org;
      });
      this.setSourceOrganisationUnits(organisations);
    }
    this.closeDialog();
  };
  @action addPullingError = (val) =>
    (this.pullingErrors = [...this.pullingErrors, val]);
  @action setParams = (val) => (this.params = val);
  @action setMappingName = (val) => (this.mappingName = val);
  @action setMappingDescription = (val) => (this.mappingDescription = val);
  @action setSourceOrganisationUnit = (val) =>
    (this.sourceOrganisationUnits = val);
  @action setStartPeriod = (val) => (this.startPeriod = val);
  @action setEndPeriod = (val) => (this.endPeriod = val);
  @action setProcessed = (val) => (this.processed = val);

  @action handleStartPeriodChange = (event) => {
    this.setStartPeriod(event.target.value);
  };

  @action handleEndPeriodChange = (event) => {
    this.setEndPeriod(event.target.value);
  };

  @action addParam = () => {
    this.params = [...this.params, new Param()];
  };

  @action addParam2 = (param) => {
    this.params = [...this.params, param];
  };

  @action replaceParam = (p) => {
    const foundParam = _.findIndex(this.params, {
      param: p.param,
    });

    if (foundParam !== -1) {
      this.params.splice(foundParam, 1, p);
    } else {
      this.params = [...this.params, p];
    }
  };

  @action replaceParamByValue = (p, search) => {
    const replaced = p.value.replace("Sun", "");
    p.value = replaced;
    const foundParam = _.findIndex(this.params, (v) => {
      return typeof v.value === "string" && v.value.indexOf(search) !== -1;
    });

    if (foundParam !== -1) {
      this.params.splice(foundParam, 1, p);
    } else {
      this.params = [...this.params, p];
    }
  };

  @action
  handelHeaderRowChange = (value) => {
    this.headerRow = value;
    if (value) {
      this.handelDataRowStartChange(parseInt(value, 10) + 1);
    } else {
      this.handelDataRowStartChange("");
    }
  };

  pullIndicatorData = async () => {
    const dataSet = JSON.parse(JSON.stringify(this.canBeSaved));
    const p1 = new Param();
    const p2 = new Param();
    const p3 = new Param();
    p1.setParam("dimension");
    p2.setParam("dimension");
    p3.setParam("skipMeta");
    p3.setValue(true);

    if (this.selectedIndicators.length > 0 && this.currentLevel) {
      const i = this.selectedIndicators.join(";");
      const indicators = `dx:${i}`;

      p1.setValue(indicators);
      p2.setValue(`ou:LEVEL-${this.currentLevel.value}`);
      this.replaceParamByValue(p2, "ou:");

      this.replaceParamByValue(p1, "dx:");
      this.replaceParam(p3);

      const data = await this.pullData();
      const processed = await instance.processDataSetData(data, dataSet);
      this.setProcessed(processed);
    }
  };

  @action pullDataSetData = async () => {
    let organisations = await this.pullOrganisationUnits();

    const param = new Param();
    param.setParam("orgUnit");

    const ou = organisations[0];
    param.setValue(ou.id);
    this.replaceParam(param);

    let period;
    if (
      this.startPeriod &&
      this.endPeriod &&
      this.addition &&
      this.additionFormat
    ) {
      const periods = enumerateDates(
        this.startPeriod,
        this.endPeriod,
        this.addition,
        this.additionFormat
      );
      let index = Math.round(periods.length / 2);
      period = periods[index - 1];
      const pp = new Param();
      pp.setParam("period");
      pp.setValue(period);

      this.replaceParam(param);
    }
  };

  @action
  handelDataRowStartChange = (value) => (this.dataStartRow = value);

  @action setDhis2DataSet = (val) => (this.dhis2DataSet = val);

  @action setDhis2DataSetChange = async (val) => {
    this.selectedDataSet = val;
    if (val && val.value) {
      const p = new Param();
      p.setParam("dataSet");
      p.setValue(val.value);
      this.replaceParam(p);
      const urlBase = this.getDHIS2Url();
      const url = `${urlBase}/dataSets/${val.value}.json`;
      let dataSet;
      if (this.useProxy) {
        dataSet = await postAxios(this.proxy, {
          username: this.username,
          password: this.password,
          url,
          params: {
            fields:
              "id,name,code,periodType,dataSetElements[dataElement[id,name,code,valueType,categoryCombo[id,name,categoryOptionCombos[id,name]]]],organisationUnits[id,name,code]",
          },
        });
      } else {
        dataSet = await callAxios(
          url,
          {
            fields:
              "id,name,code,periodType,dataSetElements[dataElement[id,name,code,valueType,categoryCombo[id,name,categoryOptionCombos[id,name]]]],organisationUnits[id,name,code]",
          },
          this.username,
          this.password
        );
      }
      this.setDhis2DataSet(dataSet);
      const ous = dataSet.organisationUnits.map((ou) => {
        const org = new OrganisationUnit(ou.id, ou.name, ou.code);
        let foundOU = this.organisationUnits.find((o) => {
          return ou.id && o.id && o.id === ou.id;
        });

        if (!foundOU) {
          foundOU = this.organisationUnits.find((o) => {
            return (
              ou.code &&
              o.code &&
              o.code !== "" &&
              ou.code !== "" &&
              o.code === ou.code
            );
          });
        }
        if (!foundOU) {
          foundOU = this.organisationUnits.find((o) => {
            return ou.name && o.name && ou.name === o.name;
          });
        }
        if (foundOU) {
          org.setMapping({ label: foundOU.name, value: foundOU.id });
        } else {
          org.setMapping(null);
        }
        return org;
      });
      this.setSourceOrganisationUnits(ous);
    }
  };

  @action loadLevelsAndDataSets = async () => {
    const urlBase = this.getDHIS2Url();
    if (urlBase) {
      const dataSetUrl = urlBase + "/dataSets.json";
      const orgUnitLevelUrl = urlBase + "/organisationUnitLevels.json";

      let levelResponse;
      let data;

      if (this.useProxy) {
        levelResponse = await postAxios(this.proxy, {
          username: this.username,
          password: this.password,
          url: orgUnitLevelUrl,
          params: {
            paging: false,
            fields: "name,level",
          },
        });
        data = await postAxios(this.proxy, {
          username: this.username,
          password: this.password,
          url: dataSetUrl,
          params: {
            paging: false,
            fields: "id,name,periodType",
          },
        });
      } else {
        levelResponse = await callAxios(
          orgUnitLevelUrl,
          {
            paging: false,
            fields: "name,level",
          },
          this.username,
          this.password
        );

        data = await callAxios(
          dataSetUrl,
          {
            paging: false,
            fields: "id,name,periodType",
          },
          this.username,
          this.password
        );
      }

      if (levelResponse) {
        const levels = levelResponse.organisationUnitLevels.map((l) => {
          return { label: l.name, value: l.level };
        });

        this.setLevels(levels);
      }

      if (data) {
        const dataSets = data.dataSets
          .filter((ds) => this.periodType === ds.periodType)
          .map((d) => {
            return { label: d.name, value: d.id };
          });
        this.setDhis2DataSets(dataSets);
      }
    }
  };

  @action loadIndicators = async () => {
    const urlBase = this.getDHIS2Url();
    if (urlBase) {
      const indicatorUrl = urlBase + "/indicators.json";
      const orgUnitLevelUrl = urlBase + "/organisationUnitLevels.json";
      const programIndicatorUrl = urlBase + "/programIndicators.json";
      const dataElementsUrl = urlBase + "/dataElements.json";
      let levelResponse;
      let programIndicatorResponse;
      let indicatorResponse;
      let dataElementsResponse;

      let items1 = [];
      let items2 = [];
      let items3 = [];

      try {
        if (this.useProxy) {
          levelResponse = await postAxios(this.proxy, {
            username: this.username,
            password: this.password,
            url: orgUnitLevelUrl,
            params: {
              paging: false,
              fields: "name,level",
            },
          });

          if (this.proIndicators) {
            programIndicatorResponse = await postAxios(this.proxy, {
              username: this.username,
              password: this.password,
              url: programIndicatorUrl,
              params: {
                paging: false,
                fields: "id,name",
              },
            });
          }

          if (this.dataIndicators) {
            indicatorResponse = await postAxios(this.proxy, {
              username: this.username,
              password: this.password,
              url: indicatorUrl,
              params: {
                paging: false,
                fields: "id,name",
              },
            });
          }

          if (this.dataDataElements) {
            dataElementsResponse = await postAxios(this.proxy, {
              username: this.username,
              password: this.password,
              url: dataElementsUrl,
              params: {
                paging: false,
                fields: "id,name",
              },
            });
          }
        } else {
          levelResponse = await callAxios(
            orgUnitLevelUrl,
            {
              paging: false,
              fields: "name,level",
            },
            this.username,
            this.password
          );

          if (this.proIndicators) {
            programIndicatorResponse = await callAxios(
              programIndicatorUrl,
              {
                paging: false,
                fields: "id,name",
              },
              this.username,
              this.password
            );
          }

          if (this.dataIndicators) {
            indicatorResponse = await callAxios(
              indicatorUrl,
              {
                paging: false,
                fields: "id,name",
              },
              this.username,
              this.password
            );
          }

          if (this.dataDataElements) {
            dataElementsResponse = await callAxios(
              dataElementsUrl,
              {
                paging: false,
                fields: "id,name",
              },
              this.username,
              this.password
            );
          }
        }

        if (levelResponse) {
          const levels = levelResponse.organisationUnitLevels.map((l) => {
            return { label: l.name, value: l.level };
          });

          this.setLevels(levels);
        }

        if (programIndicatorResponse) {
          items2 = programIndicatorResponse.programIndicators.map(
            (attribute) => {
              return {
                text: attribute.name,
                value: attribute.id,
              };
            }
          );
        }

        if (indicatorResponse) {
          items1 = indicatorResponse.indicators.map((attribute) => {
            return {
              text: attribute.name,
              value: attribute.id,
            };
          });
        }

        if (dataElementsResponse) {
          items3 = dataElementsResponse.dataElements.map((dataElement) => {
            return {
              text: dataElement.name,
              value: dataElement.id,
            };
          });
        }

        const indicators = [...items1, ...items2, ...items3];
        this.setIndicators(indicators);

        this.itemStore.setState(indicators);
        this.assignedItemStore.setState(this.selectedIndicators);
      } catch (e) {
        NotificationManager.error(e.message, "Error", 5000);
      }
    }
  };

  @action assignItems = (items) => {
    const assigned = this.assignedItemStore.state.concat(items);
    this.assignedItemStore.setState(assigned);
    this.setSelectedIndicators(assigned);
    return Promise.resolve();
  };

  @action unAssignItems = (items) => {
    const assigned = this.assignedItemStore.state.filter(
      (item) => items.indexOf(item) === -1
    );
    this.assignedItemStore.setState(assigned);
    this.setSelectedIndicators(assigned);
    return Promise.resolve();
  };

  getDHIS2Url = () => {
    if (
      this.templateType &&
      (this.templateType.value === "4" || this.templateType.value === "5") &&
      this.url !== "" &&
      this.username !== "" &&
      this.password !== ""
    ) {
      try {
        const url = new URL(this.url);
        const dataURL = url.pathname.split("/");
        const apiIndex = dataURL.indexOf("api");

        if (apiIndex !== -1) {
          return url.href;
        } else {
          if (dataURL[dataURL.length - 1] === "") {
            return url.href + "api";
          } else {
            return url.href + "/api";
          }
        }
      } catch (e) {
        NotificationManager.error(e.message, "Error", 5000);
      }
    }

    return null;
  };

  pullOrganisationUnits = async () => {
    const baseUrl = this.getDHIS2Url();
    if (baseUrl && this.currentLevel) {
      const url = baseUrl + "/organisationUnits.json";
      let data;
      if (this.useProxy) {
        data = await postAxios(this.proxy, {
          username: this.username,
          password: this.password,
          url,
          params: {
            level: this.currentLevel.value,
            fields: "id,name,code",
            paging: false,
          },
        });
      } else {
        data = await callAxios(
          url,
          {
            level: this.currentLevel.value,
            fields: "id,name,code",
            paging: false,
          },
          this.username,
          this.password
        );
      }
      if (data) {
        return data.organisationUnits;
      }
    }

    return [];
  };

  @action setTemplate = (val) => (this.template = val);

  @action onCheckCompleteDataSet = async (event) => {
    this.completeDataSet = event.target.checked;
  };

  @action onCheckMultiplePeriods = (event) => {
    this.multiplePeriods = event.target.checked;
  };

  @action fetchIndicators = async () => {
    const urlBase = this.getDHIS2Url();

    if (urlBase) {
      this.openDialog();
      await this.loadIndicators();
      this.closeDialog();
    }
  };

  @action onCheckIsDhis2 = async () => {
    const urlBase = this.getDHIS2Url();
    if (urlBase) {
      this.openDialog();
      await this.loadLevelsAndDataSets();
      this.setDataElementColumn({ label: "dataElement", value: "dataElement" });
      this.setCategoryOptionComboColumn({
        label: "categoryOptionCombo",
        value: "categoryOptionCombo",
      });
      this.setPeriodColumn({ label: "period", value: "period" });
      this.setDataValueColumn({ label: "value", value: "value" });

      // const p1 = new Param();
      // p1.setParam('dataElementIdScheme');
      // p1.setValue('ID');

      const p2 = new Param();
      p2.setParam("orgUnitIdScheme");
      p2.setValue("NAME");

      const p3 = new Param();
      p3.setParam("includeDeleted");
      p3.setValue(false);

      const p4 = new Param();
      p4.setParam("children");
      p4.setValue(true);

      // const p5 = new Param();
      // p5.setParam('categoryOptionComboIdScheme');
      // p5.setValue('ID');

      // this.replaceParam(p1);
      this.replaceParam(p2);
      this.replaceParam(p3);
      this.replaceParam(p4);
      // this.replaceParam(p5);

      this.setOrgUnitStrategy({ label: "name", value: "name" });
      this.setOrgUnitColumn({ label: "orgUnit", value: "orgUnit" });

      this.closeDialog();
    } else {
      this.setLevels([]);
      this.setDhis2DataSet(null);
      this.setDhis2DataSets([]);
    }
  };

  @action
  onDrop = async (accepted, rejected) => {
    this.openDialog();
    if (accepted.length > 0) {
      this.uploadMessage = "";
      const f = accepted[0];
      this.setFileName(f.name);
      this.setMessage("Uploading");
      const workbook = await instance.expensive(accepted);
      this.setWorkbook(workbook);

      const sheets = this.workbook.SheetNames.map((s) => {
        return { label: s, value: s };
      });

      if (sheets.length > 0) {
        this.setSelectedSheet(sheets[0]);
      }
      this.setSheets(sheets);
      this.setTemplate(1);
    } else if (rejected.length > 0) {
      NotificationManager.error(
        "Only XLS, XLSX and CSV are supported",
        "Error",
        5000
      );
      this.closeDialog();
    }

    this.closeDialog();
  };

  @action setCurrentData = (val) => (this.currentData = val);

  @action setDefaultIndicators = () => {
    this.forms.forEach((form) => {
      form.categoryOptionCombos.forEach((coc) => {
        _.keys(coc.mapping).forEach((k) => {
          const search = form.dataElements.find((de) => de.id === k);
          let name = search.name;
          if (search && this.indicatorOptions.length > 0) {
            if (coc.name !== "default") {
              name = search.name + ": " + coc.name;
            }
            // const str1 = name.replace(/\s/g, "");
            const match = this.indicatorOptions.find((ucoc) => {
              // const str2 = ucoc.label.replace(/\s/g, "");
              return (
                String(name).toLowerCase() === String(ucoc.label).toLowerCase()
              );
            });
            if (match) {
              coc.mapping[k] = match;
            }
          }
        });
      });
    });
  };

  @action setDefaults = () => {
    this.forms.forEach((form) => {
      form.dataElements.forEach((de) => {
        const mapping = this.uniqueDataElements.find((u) => {
          return (
            u.value === de.name || u.value === de.code || u.value === de.id
          );
        });

        if (mapping && !de.mapping) {
          de.mapping = mapping;
        }
      });

      form.categoryOptionCombos.forEach((coc) => {
        _.keys(coc.mapping).forEach((k) => {
          const search = form.dataElements.find((de) => de.id === k);
          if (search && search.mapping) {
            search.handelMappingChange(
              this.data,
              this.categoryOptionComboColumn,
              this.isDhis2
            )(search.mapping);
            if (this.isDhis2) {
              if (this.dhis2DataSet) {
                const found = this.dhis2DataSet.dataSetElements.find((dde) => {
                  return dde.dataElement.id === search.id;
                });

                if (found) {
                  const cocs = found.dataElement.categoryCombo.categoryOptionCombos.map(
                    (coc) => {
                      return { label: coc.name, value: coc.name };
                    }
                  );
                  search.setUniqueCategoryOptionCombos(cocs);
                } else {
                  search.setUniqueCategoryOptionCombos([]);
                }
              }
            }
            if (search && search.uniqueCategoryOptionCombos) {
              const match = search.uniqueCategoryOptionCombos.find((ucoc) => {
                const str1 = coc.name.replace(/\s/g, "");
                const str2 = ucoc.value.replace(/\s/g, "");
                return str1 === str2;
              });
              if (match) {
                coc.mapping[k] = match;
              }
            }
          } else {
            console.log("Something silly happened here");
          }
        });
      });
    });
  };

  @action autoMapDataSet = () => {
    let maps = {};
    this.allCategoryOptionCombos.forEach((coc) => {
      const match = this.allSourceOptionCombos.find((cell) => {
        return (
          cell.label === coc.label ||
          `${cell.value.dataElement}${cell.value.categoryOptionCombo}` ===
            `${coc.value.dataElement}${coc.value.categoryOptionCombo}`
        );
      });
      if (match) {
        let value = coc.value;
        value = { ...value, mapping: match.value };
        coc = {
          ...coc,
          value,
        };
        const obj = _.fromPairs([[coc.label, coc]]);
        maps = { ...maps, ...obj };
      }
    });
    maps = { ...maps, ...this.cell2 };
    this.setCell2(maps);
  };

  @action
  handleCreateNewEventsCheck = (event) => {
    this.createNewEvents = event.target.checked;

    if (!this.createNewEvents) {
      this.eventDateColumn = null;
    }
  };

  @action handlePeriodInExcel = (event) => {
    this.periodInExcel = event.target.checked;
  };
  @action handleShowOnlyUnmapped = (event) => {
    this.showOnlyUnmappedUnits = event.target.checked;
  };

  @action handleProIndicators = (event) => {
    this.proIndicators = event.target.checked;
  };

  @action handleDataIndicators = (event) => {
    this.dataIndicators = event.target.checked;
  };
  @action handleDataDataElements = (event) => {
    this.dataDataElements = event.target.checked;
  };

  @action handleOrganisationInExcel = (event) => {
    this.organisationUnitInExcel = event.target.checked;

    if (this.organisationUnitInExcel && this.cells.length > 0) {
      this.organisationCell = this.cells[0];
      this.organisation = null;
    } else if (this.organisationUnitInExcel) {
      this.organisationCell = null;
      this.organisation = null;
    }

    if (!this.organisationUnitInExcel) {
      this.organisation = this.organisations[0];
      this.organisationCell = null;
    }
  };

  @action handleAttributeCombosInExcel = (event) => {
    this.attributeCombosInExcel = event.target.checked;
  };

  @action saveAggregate = async (aggregates) => {
    const dataSetIndex = _.findIndex(aggregates, (agg) => {
      return agg.aggregateId === this.aggregateId;
    });

    if (dataSetIndex !== -1) {
      aggregates.splice(dataSetIndex, 1, this);
    } else {
      aggregates = [...aggregates, this];
    }

    const toBeSaved = aggregates.map((p) => {
      return p.canBeSaved;
    });

    try {
      const namespace = await this.d2.dataStore.get("bridge");
      namespace.set("aggregates", toBeSaved);
      NotificationManager.info(`Mapping saved successfully`, "Success", 5000);
    } catch (e) {
      NotificationManager.error(
        `Could not save to data store ${e.message}`,
        "Error",
        5000
      );
    }
  };

  pullData = async () => {
    let param = "";
    if (this.params.length > 0) {
      param = encodeData(this.params);
    }
    if (this.url !== "") {
      let response;
      let url = this.url;
      if (this.templateType.value === "4") {
        url = this.getDHIS2Url() + "/dataValueSets.json";
      } else if (this.templateType.value === "5") {
        url = this.getDHIS2Url() + "/analytics.json";
      }

      url = param !== "" ? url + "?" + param : url;

      if (this.useProxy) {
        response = await postAxios(this.proxy, {
          username: this.username,
          password: this.password,
          url,
        });
      } else {
        response = await callAxios(url, {}, this.username, this.password);
      }

      if (response) {
        if (this.templateType.value === "4") {
          if (response.dataValues) {
            return response.dataValues;
          }

          return [];
        } else if (this.templateType.value === "5") {
          const headers = response.headers.map((h) => h["name"]);
          return response.rows
            .map((r) => {
              return Object.assign.apply(
                {},
                headers.map((v, i) => ({
                  [v]: r[i],
                }))
              );
            })
            .map((v) => {
              return { ...v, value: Math.round(v.value) };
            });
        } else {
          return response;
        }
      }
    }
  };

  @action
  insertDataValues = (data) => {
    const api = this.d2.Api.getApi();
    return api.post("dataValueSets.json", data, {
      dryRun: false,
      idScheme: "ID",
      orgUnitIdScheme: "ID",
      preheatCache: true,
      skipExistingCheck: true,
      strategy: "NEW_AND_UPDATES",
      skipAudit: false,
      format: "json",
      async: true,
    });
  };

  @action destroy = () => {
    this.setPulledData(null);
    this.setWorkSheet(null);
    this.setWorkbook(null);
    this.setSelectedSheet(null);
    this.setProcessed(null);
  };

  @action completeDataSets = (data) => {
    const api = this.d2.Api.getApi();
    const p = data.map((d) => {
      return _.pick(d, ["orgUnit", "period"]);
    });

    const whatToComplete = _.uniqWith(p, _.isEqual).map((p) => {
      return {
        dataSet: this.id,
        organisationUnit: p.orgUnit,
        period: p.period,
      };
    });
    return api.post(
      "completeDataSetRegistrations",
      { completeDataSetRegistrations: whatToComplete },
      {}
    );
  };

  @action create1 = () => {
    try {
      if (this.processed.dataValues && this.processed.dataValues.length > 0) {
        this.setMessage(
          `Inserting ${this.processed.dataValues.length} of ${this.processed.dataValues.length}`
        );
        return this.insertDataValues({ dataValues: this.processed.dataValues });
      }
    } catch (e) {
      this.setResponses(e);
      NotificationManager.error(
        `Could not insert data values ${e.message}`,
        "Error",
        5000
      );
    }
  };

  @action insertDataSet = async (message = "", others = "") => {
    // let initial = 0;
    if (this.processed.dataValues && this.processed.dataValues.length > 0) {
      let name = `${this.id}-${moment().format("YYYYMMDD")}`;
      if (others !== "") {
        name = `${others}-${this.id}-${moment().format("YYYYMMDD")}`;
      }
      if (this.action === "csv") {
        const worksheet = XLSX.utils.json_to_sheet(this.processed.dataValues);
        const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
        saveAs(
          new Blob([csvOutput], { type: "application/octet-stream" }),
          `${name}.csv`
        );
      } else if (this.action === "json") {
        const blob = new Blob([JSON.stringify(this.processed.dataValues)], {
          type: "application/json",
        });
        saveAs(blob, `${name}.json`);
      } else {
        // const chunked = _.chunk(this.processed.dataValues, 5000);
        // for (const c of chunked) {
        //   const current = c.length + initial;
        this.setMessage(`Inserting data for ${message}`);
        const results = await this.insertDataValues({
          dataValues: this.processed.dataValues,
        });
        this.setResponses(results);
        this.setMessage(`Completing data set`);
        await this.completeDataSets(this.processed.dataValues);
        this.setMessage(`Finished completing data set`);
        // initial = current;
        // }
      }
      this.destroy();
    }
  };

  @action create = async () => {
    this.setDisplayProgress(true);
    this.openDialog();
    const dataSet = JSON.parse(JSON.stringify(this.canBeSaved));
    try {
      if (this.templateType && this.templateType.value === "4") {
        if (this.dhis2DataSet) {
          this.setMessage("Fetching organisations");
          const orgUnits = this.remoteOrganisations.filter(
            (ou) => ou.isSelected
          );
          const param = new Param();
          param.setParam("orgUnit");
          if (this.multiplePeriods) {
            this.removeParam("period");
            if (this.startPeriod && this.endPeriod) {
              const start = new Param();
              const end = new Param();

              start.setParam("startDate");
              end.setParam("endDate");

              start.setValue(moment(this.startPeriod).format("YYYY-MM-DD"));
              end.setValue(moment(this.endPeriod).format("YYYY-MM-DD"));

              this.replaceParam(start);
              this.replaceParam(end);

              for (const ou of orgUnits) {
                this.setMessage(
                  `Fetching data for ${ou.name} from ${this.startPeriod} to ${this.endPeriod}`
                );
                param.setValue(ou.id);
                this.replaceParam(param);
                const data = await this.pullData();
                try {
                  const processed = await instance.processDataSetData(
                    data,
                    dataSet
                  );
                  this.setProcessed(processed);
                  this.setMessage(
                    `Inserting processed data for ${ou.name} from ${this.startPeriod} to ${this.endPeriod}`
                  );
                  await this.insertDataSet(
                    ` for ${ou.name} from ${this.startPeriod} to ${this.endPeriod}`,
                    String(ou.name).replace(/\s+/g, "-")
                  );
                } catch (e) {
                  console.log(e);
                }
              }
            } else {
              NotificationManager.warning(
                "Either period type not supported or start and end date not provided",
                "Warning"
              );
            }
          } else {
            this.removeParam("startDate");
            this.removeParam("endDate");
            for (const ou of orgUnits) {
              this.setMessage(`Fetching data for ${ou.name}`);
              param.setValue(ou.id);
              this.replaceParam(param);
              const data = await this.pullData();
              try {
                if (data) {
                  const processed = await instance.processDataSetData(
                    data,
                    dataSet
                  );
                  this.setProcessed(processed);
                  this.setMessage(`Inserting processed data for ${ou.name}`);
                  await this.insertDataSet(
                    `for ${ou.name}`,
                    String(ou.name).replace(/\s+/g, "-")
                  );
                } else {
                  this.setMessage(`No data for ${ou.name}`);
                }
              } catch (e) {
                console.log(e);
              }
            }
          }
        }
      } else if (
        this.templateType &&
        this.templateType.value === "5" &&
        this.multiplePeriods
      ) {
        if (
          this.startPeriod &&
          this.endPeriod &&
          this.addition &&
          this.additionFormat
        ) {
          const periods = enumerateDates(
            this.startPeriod,
            this.endPeriod,
            this.addition,
            this.additionFormat
          );
          const pp = new Param();
          pp.setParam("dimension");
          for (const p of periods) {
            this.setMessage(`Processing data for ${p}`);
            pp.setValue(`pe:${p}`);
            this.replaceParamByValue(pp, "pe:");
            this.setMessage(`Pulling from analytics for period ${p}`);
            await this.pullIndicatorData();
            this.setMessage(`Finished pulling from analytics for period ${p}`);
            await this.insertDataSet();
          }
        }
      } else {
        this.setMessage(`Inserting processed data`);
        await this.insertDataSet();
      }
    } catch (e) {
      this.setResponses(e);
    }
    this.setDisplayProgress(false);
    this.closeDialog();

    const { importCount, conflicts } = this.processedResponses;
    NotificationManager.success(`${importCount.imported}`, "Imported");
    NotificationManager.success(`${importCount.deleted}`, "Deleted");
    NotificationManager.success(`${importCount.updated}`, "Updated");

    if (importCount.ignored > 0) {
      NotificationManager.warning(`${importCount["ignored"]}`, "Ignored");
    }

    if (this.pullingErrors.length > 0) {
      const vals = _.groupBy(this.pullingErrors, "message");
      _.forOwn(vals, (val, key) => {
        NotificationManager.error(
          `${key}`,
          `Error - Affected ${val.length}`,
          10000
        );
      });
    }
    _.uniqBy(conflicts, "message").forEach((s) => {
      NotificationManager.error(`${s.message}`, "Error");
    });
  };

  @action setResponses = (val) => {
    if (Array.isArray(val)) {
      this.responses = [...this.responses, ...val];
    } else {
      this.responses = [...this.responses, val];
    }
  };

  @action removeParam = (i) => () => {
    const current = [...this.params.slice(0, i), ...this.params.slice(i + 1)];
    this.setParams(current);
  };

  @action removeParam = (param) => {
    this.params = this.params.filter((p) => p.param !== param);
  };

  @action deleteAggregate = async (aggregates) => {
    const mapping = _.findIndex(aggregates, { aggregateId: this.aggregateId });
    aggregates.splice(mapping, 1);

    aggregates = aggregates.map((p) => {
      return p.canBeSaved;
    });

    try {
      const namespace = await this.d2.dataStore.get("bridge");
      await namespace.set("aggregates", aggregates);
    } catch (e) {
      NotificationManager.error(
        `Could not delete aggregate mapping ${e.message}`,
        "Error",
        5000
      );
    }
  };

  @action setMappingAll2 = (de) => (val) => {
    if (val && val.value) {
      let value = val.value;
      value = { ...value, column: de.column };
      val = {
        ...val,
        value,
      };
      const obj = _.fromPairs([[de.name, val]]);
      const c = { ...this.cell2, ...obj };
      this.setCell2(c);
    } else {
      const final = _.omit(this.cell2, [de.name]);
      this.setCell2(final);
    }
  };

  @action setMappingAll3 = (de) => (val) => {
    if (val && val.value) {
      let value = val.value;
      value = { ...value, mapping: de.value };
      val = {
        ...val,
        value,
      };
      const obj = _.fromPairs([[de.label, val]]);
      const c = { ...this.cell2, ...obj };
      this.setCell2(c);
    } else {
      const final = _.omit(this.cell2, [de.label]);
      this.setCell2(final);
    }
  };

  @action loadSame = () => {
    let maps = {};

    this.allCategoryOptionCombos.forEach((coc) => {
      const match = this.mergedCellsWithDataElementRow.find((cell) => {
        return cell.name === coc.label;
      });

      if (match) {
        let value = coc.value;
        value = { ...value, column: match.column };
        coc = {
          ...coc,
          value,
        };
        const obj = _.fromPairs([[coc.label, coc]]);
        maps = { ...maps, ...obj };
      }
    });
    maps = { ...maps, ...this.cell2 };
    this.setCell2(maps);
  };

  @action
  handleChangePage = (event, page) => (this.page = page);

  @action
  handleChangeRowsPerPage = (event) => (this.rowsPerPage = event.target.value);

  @action
  handleMappingNameChange = (value) => {
    this.mappingName = value;
  };

  @action
  handleMappingDescriptionChange = (value) => {
    this.mappingDescription = value;
  };

  @action
  convertAndMakeDefault = (units) => {
    units = _.uniqBy(units, (v) => JSON.stringify(v)).map((org) => {
      let foundOU = this.organisationUnits.find((o) => {
        return o.id && o.id === org.name;
      });

      if (!foundOU) {
        foundOU = this.organisationUnits.find((o) => {
          return o.code && o.code !== "" && o.code === org.name;
        });
      }

      if (!foundOU) {
        foundOU = this.organisationUnits.find((o) => {
          return o.name && o.name !== "" && org.name === o.name;
        });
      }

      if (foundOU) {
        org.setMapping({ label: foundOU.name, value: foundOU.id });
      } else {
        org.setMapping(null);
      }
      return org;
    });
    this.setSourceOrganisationUnits(units);
  };

  @action handleUseProxyChange = (event) => {
    this.setUseProxy(event.target.checked);
  };

  @action process = async () => {
    this.openDialog();
    this.setMessage("Processing");
    const dataSet = JSON.parse(JSON.stringify(this.canBeSaved));
    const data = JSON.parse(JSON.stringify(this.data));
    const dataResponse = await instance.processDataSetData(data, dataSet);
    this.setProcessed(dataResponse);
    this.closeDialog();
  };

  @action checkAll = (e) => {
    const processedRemote = this.remoteOrganisations.map((r) => {
      r.changeIsSelected(e.target.checked);
      return r;
    });
    this.setRemoteOrganisations(processedRemote);
  };

  @computed get showDetails() {
    if (this.templateType.value === "5") {
      return this.indicators.length > 0;
    } else if (this.templateType.value === "4") {
      return this.dhis2DataSets.length > 0;
    } else if (this.templateType.value === "6") {
      return this.pulledData && this.pulledData.length > 0;
    }
    return false;
  }

  @computed get processedResponses() {
    let errors = [];
    let conflicts = [];

    let updatedTotal = 0;
    let deletedTotal = 0;
    let importedTotal = 0;
    let ignoredTotal = 0;

    this.responses.forEach((response) => {
      if (
        response &&
        (response["status"] === "SUCCESS" || response["status"] === "WARNING")
      ) {
        const { imported, deleted, updated, ignored } = response["importCount"];
        if (imported) {
          importedTotal = importedTotal + imported;
        }

        if (deleted) {
          deletedTotal = deletedTotal + deleted;
        }

        if (updated) {
          updatedTotal = updatedTotal + updated;
        }

        if (ignored) {
          ignoredTotal = ignoredTotal + ignored;
        }

        if (response["conflicts"]) {
          const processedConflicts = response["conflicts"];
          conflicts = [...conflicts, ...processedConflicts];
        }
      } else if (response && response["httpStatusCode"] === 500) {
        errors = [...errors, { ...response["error"] }];
      }
    });
    conflicts = _.uniqWith(conflicts, _.isEqual);
    const importCount = {
      deleted: deletedTotal,
      imported: importedTotal,
      updated: updatedTotal,
      ignored: ignoredTotal,
    };
    return { errors, importCount, conflicts };
  }

  @computed get columns() {
    if (this.workSheet) {
      const range = XLSX.utils.decode_range(this.workSheet["!ref"]);
      return _.range(0, range.e.c + 1)
        .map((v) => {
          const cell = XLSX.utils.encode_cell({ r: this.headerRow - 1, c: v });
          const cellValue = this.workSheet[cell];
          if (cellValue) {
            return {
              label: cellValue.v.toString(),
              value: cellValue.v.toString(),
            };
          } else {
            return { label: "", value: "" };
          }
        })
        .filter((c) => {
          return c.label !== "";
        });
    } else if (this.pulledData) {
      return _.keys(this.pulledData[0]).map((e) => {
        return { label: e, value: e };
      });
    }

    return [];
  }

  @computed get mergedCells() {
    return this.workSheet["!merges"] || [];
  }

  @computed get dhis2Dhis2DataSet() {
    return this.forms.map((f) => {
      return f;
    });
  }

  @computed get mergedCellsWithDataElementRow() {
    let processed = [];
    this.mergedCells
      .filter((e) => {
        return e.s.r === this.headerRow - 1;
      })
      .sort()
      .forEach((val) => {
        const cell_address = { c: val.s.c, r: val.s.r };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        if (this.data[cell_ref]) {
          const dataElement = this.data[cell_ref]["v"];

          processed = processMergedCells(
            this.mergedCells,
            this.data,
            val,
            processed,
            dataElement
          );
        } else {
          NotificationManager.error(
            `Make sure that headers are merged properly`,
            "Mapping"
          );
        }
      });

    const others = this.cellColumns
      .map((col) => {
        const cell = col.value + this.headerRow;
        const name = this.data[cell];
        return { name: name ? name["v"] : null, column: col.value };
      })
      .filter((d) => {
        const match = processed.find((p) => {
          return p.column === d.column;
        });
        const col1 = XLSX.utils.decode_col(d.column);
        const col2 = XLSX.utils.decode_col(this.dataStartColumn.value);
        return d.name !== null && col1 >= col2 && !match;
      });

    processed = [...processed, ...others];

    const sorter = (a, b) => (a["name"] < b["name"] ? -1 : 1);
    return processed.sort(sorter);
  }

  @computed get processedDhis2DataSets() {
    return this.dhis2DataSets.map((ds) => {
      return { label: ds.name, value: ds };
    });
  }

  @computed get cells() {
    if (this.workSheet) {
      const keys = _.keys(this.workSheet);
      return keys
        .map((v) => {
          return { label: v, value: v };
        })
        .filter((v) => ["!margins", "!merges", "!ref"].indexOf(v.label) === -1);
    }
    return [];
  }

  @computed get rows() {
    if (this.workSheet) {
      const range = XLSX.utils.decode_range(this.workSheet["!ref"]);
      return _.range(this.dataStartRow, range.e.r + 2);
    }
    return [];
  }

  @computed get cellColumns() {
    if (this.workSheet) {
      const range = XLSX.utils.decode_range(this.workSheet["!ref"]);
      return _.range(0, range.e.c + 1).map((v) => {
        const cell_ref = XLSX.utils.encode_col(v);
        return { label: cell_ref, value: cell_ref };
      });
    }
    return [];
  }

  @computed get data() {
    if (this.workSheet) {
      if (this.templateType.value === "1" && this.dataElementColumn) {
        const data = XLSX.utils.sheet_to_json(this.workSheet, {
          range: this.headerRow - 1,
          dateNF: "YYYY-MM-DD",
        });
        return nest(data, [this.dataElementColumn.value]);
      } else if (this.cells.length > 0) {
        const d = _.omit(this.workSheet, ["!margins", "!merges", "!ref"]);
        return d;
      }
    } else if (this.pulledData) {
      if (this.templateType.value === "6" && this.dataElementColumn) {
        return nest(this.pulledData, [this.dataElementColumn.value]);
      } else if (this.templateType.value === "4") {
        return nest(this.pulledData, ["dataElement"]);
      } else if (this.templateType.value === "5") {
        return this.pulledData;
      }
    }
    return [];
  }

  @computed get rowData() {
    if (this.workSheet) {
      return XLSX.utils.sheet_to_json(this.workSheet, {
        range: this.headerRow - 1,
        dateNF: "YYYY-MM-DD",
      });
    } else if (this.pulledData) {
      return this.pulledData;
    }
    return [];
  }

  @computed get allCategoryOptionCombos() {
    let cocs = [];
    this.forms.forEach((f) => {
      f.dataElements.forEach((de) => {
        f.categoryOptionCombos.forEach((coc) => {
          cocs = [
            ...cocs,
            {
              label: de.name + " " + coc.name,
              value: { dataElement: de.id, categoryOptionCombo: coc.id },
            },
          ];
        });
      });
    });
    return cocs;
  }

  @computed get allSourceOptionCombos() {
    let cocs = [];
    if (this.dhis2DataSet) {
      this.dhis2DataSet.dataSetElements.forEach((dse) => {
        dse.dataElement.categoryCombo.categoryOptionCombos.forEach((coc) => {
          cocs = [
            ...cocs,
            {
              label: dse.dataElement.name + " " + coc.name,
              value: {
                dataElement: dse.dataElement.id,
                categoryOptionCombo: coc.id,
              },
            },
          ];
        });
      });
    }
    return cocs;
  }

  @computed get allAttributesMapped() {
    const mappings = this.categoryCombo.categories.map((c) => {
      return !!c;
    });
    return _.every(mappings);
  }

  @computed get orgUniNames() {
    return _.fromPairs(
      this.organisationUnits.map((o) => {
        return [o.id, o.name];
      })
    );
  }

  @computed get indicatorOptions() {
    if (this.selectedIndicators.length > 0) {
      return this.indicators
        .filter((i) => {
          return this.selectedIndicators.indexOf(i.value) !== -1;
        })
        .map((i) => {
          return { ...i, label: i.text };
        });
    }
    return [];
  }

  @computed get whatToComplete() {
    const p = this.processed.dataValues.map((d) => {
      return _.pick(d, ["orgUnit", "period"]);
    });

    return _.uniqWith(p, _.isEqual).map((p) => {
      return {
        dataSet: this.id,
        organisationUnit: p.orgUnit,
        period: p.period,
      };
    });
  }

  @computed get allAttributeCombos() {
    return _.fromPairs(
      this.categoryCombo.categoryOptionCombos.map((v) => [v.id, v.name])
    );
  }

  @computed get allDataElements() {
    let dataElements = {};
    let categoryOptionCombos = {};

    for (const f of this.forms) {
      for (const e of f.dataElements) {
        dataElements = { ...dataElements, [e.id]: e.name };
      }
      for (const c of f.categoryOptionCombos) {
        categoryOptionCombos = { ...categoryOptionCombos, [c.id]: c.name };
      }
    }
    return { dataElements, categoryOptionCombos };
  }

  @computed get finalData() {
    const { dataElements, categoryOptionCombos } = this.allDataElements;
    return this.processed.dataValues.map((v, k) => {
      return {
        ...v,
        id: k,
        orgUnit: this.orgUniNames[v.orgUnit],
        dataElement: dataElements[v.dataElement],
        categoryOptionCombo: categoryOptionCombos[v.categoryOptionCombo],
        attributeOptionCombo: this.allAttributeCombos[v.attributeOptionCombo],
      };
    });
  }

  @computed get dhis2DataElements() {
    if (this.dhis2DataSet) {
      const elements = this.dhis2DataSet.dataSetElements.map((e) => [
        e.dataElement.id,
        e.dataElement.categoryCombo.categoryOptionCombos.map((coc) => {
          return { label: coc.name, value: coc.id };
        }),
      ]);
      return fromPairs(elements);
    }
    return {};
  }

  @computed get disableCheckBox1() {
    return this.templateType.value !== "3";
  }

  @computed get disableCheckBox2() {
    return this.templateType.value !== "3";
  }

  @computed get disableCheckBox3() {
    return !this.organisationUnitInExcel;
  }

  @computed get disableCheckBox4() {
    return this.templateType.value !== "3";
  }

  @computed get organisations() {
    if (this.organisationUnits) {
      return this.organisationUnits.map((o) => {
        return { label: o.name, value: o.id };
      });
    }

    return [];
  }

  @computed get organisationColumns() {
    if (this.organisationUnits) {
      return this.organisationUnits.map((o) => {
        return { label: o.name, value: o.id };
      });
    }
    return [];
  }

  @computed get uniqueDataElements() {
    if (this.isDhis2) {
      if (this.dhis2DataSet) {
        return this.dhis2DataSet.dataSetElements.map((dse) => {
          return { label: dse.dataElement.name, value: dse.dataElement.id };
        });
      }
      return [];
    } else {
      return _.keys(this.data).map((d) => {
        return { label: d, value: d };
      });
    }
  }

  @computed get periodMapped() {
    if (
      this.templateType.value === "1" ||
      this.templateType.value === "2" ||
      this.templateType.value === "6"
    ) {
      return !!this.periodColumn;
    } else {
      if (this.periodInExcel) {
        return !!this.periodColumn;
      }

      return !!this.period;
    }
  }

  @computed get ouMapped() {
    if (
      this.templateType.value === "1" ||
      this.templateType.value === "2" ||
      this.templateType.value === "6"
    ) {
      return !!this.orgUnitColumn || !!this.orgUnitStrategy;
    } else {
      if (this.organisationUnitInExcel) {
        return !!this.organisationCell || !!this.orgUnitStrategy;
      }

      return !!this.organisation;
    }
  }

  @computed get canBeSaved() {
    return _.pick(this, [
      "id",
      "aggregateId",
      "name",
      "orgUnitColumn",
      "periodColumn",
      "orgUnitStrategy",
      "dataElementColumn",
      "categoryOptionComboColumn",
      "dataValueColumn",
      "headerRow",
      "dataStartRow",
      "forms",
      "organisationUnits",
      "organisationColumn",
      "periodInExcel",
      "organisationUnitInExcel",
      "attributeCombosInExcel",
      "categoryCombo",
      "url",
      "mapping",
      "currentData",
      "dataValues",
      "periodType",
      "period",
      "organisation",
      "organisationCell",
      "dataStartColumn",
      "templateType",
      "cell2",
      "username",
      "password",
      "params",
      "responseKey",
      "isDhis2",
      "selectedDataSet",
      "currentLevel",
      "template",
      "mappingName",
      "mappingDescription",
      "completeDataSet",
      "sourceOrganisationUnits",
      "levels",
      "indicators",
      "selectedIndicators",
      "proxy",
      "useProxy",
      "rows",
      "proIndicators",
      "dataIndicators",
      "dataDataElements",
      "selectedPeriods",
      "action",
    ]);
  }

  @computed get categories() {
    return this.categoryCombo.categories.map((category) => {
      return { label: category.name, value: category.id };
    });
  }

  @computed get currentDataValues() {
    if (this.processed.dataValues && this.processed.dataValues.length > 0) {
      return this.processed.dataValues.slice(
        this.page * this.rowsPerPage,
        this.page * this.rowsPerPage + this.rowsPerPage
      );
    }
    return [];
  }

  @computed get addition() {
    switch (this.periodType) {
      case "Daily":
        return "days";
      case "Weekly":
        return "weeks";
      case "Monthly":
        return "months";
      case "Quarterly":
        return "quarters";
      case "Yearly":
      case "FinancialJuly":
      case "FinancialApril":
      case "FinancialOct":
        return "years";

      default:
        return null;
    }
  }

  @computed get additionFormat() {
    switch (this.periodType) {
      case "Daily":
        return "YYYYMMDD";
      case "Weekly":
        return "YYYY[W]WW";
      case "Monthly":
        return "YYYYMM";
      case "Quarterly":
        return "YYYY[Q]Q";
      case "Yearly":
        return "YYYY";
      case "FinancialJuly":
        return "YYYY[July]";
      case "FinancialApril":
        return "YYYY[April]";
      case "FinancialOct":
        return "YYYY[Oct]";
      default:
        return null;
    }
  }

  @computed get periodExists() {
    return (
      _.findIndex(this.params, {
        param: "period",
      }) !== -1
    );
  }

  @computed get periodExists2() {
    return (
      _.findIndex(this.params, (v) => {
        return v.value.indexOf("pe:") !== -1;
      }) !== -1
    );
  }

  @computed get disableImport() {
    const templates = ["1", "2", "3"];
    if (
      this.templateType &&
      (templates.indexOf(this.templateType.value) !== -1 ||
        (this.templateType.value === "5" && !this.multiplePeriods))
    ) {
      return !this.processed || this.processed.dataValues.length === 0;
    }
    return false;
  }

  @computed get getImportDataSource() {
    const templates = ["1", "2", "3"];
    if (templates.indexOf(this.templateType.value) !== -1) {
      return 1;
    }
    return 2;
  }

  @computed get canPull() {
    return (
      this.templateType &&
      (this.templateType.value === "6" ||
        (this.templateType.value === "5" && !this.multiplePeriods))
    );
  }

  @computed get uniqueErrors() {
    return _.uniqBy(this.processed.errors, "error");
  }

  @computed get isExcel() {
    return this.getImportDataSource === 1;
  }

  @computed get allChecked() {
    return _.every(this.remoteOrganisations, (v) => v.isSelected);
  }

  @computed get totalLength() {
    if (this.showOnlyUnmappedUnits) {
      return this.sourceOrganisationUnits.filter((x) => !x.mapping).length;
    }

    return this.sourceOrganisationUnits.length;
  }
}

export default DataSet;

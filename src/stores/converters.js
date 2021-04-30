import _ from "lodash";
import DataSet from "./DataSet";
import CategoryCombo from "./CategoryCombo";
import Category from "./Category";
import CategoryOption from "./CategoryOption";
import CategoryOptionCombo from "./CategoryOptionCombo";
import Form from "./Form";
import Element from "./Element";
import Param from "./Param";
import OrganisationUnit from "./OrganisationUnit";
import Option from "./Option";
import OptionSet from "./OptionSet";
import DataElement from "./DataElement";
import ProgramStageDataElement from "./ProgramStageDataElement";
import ProgramStage from "./ProgramStage";
import TrackedEntityAttribute from "./TrackedEntityAttribute";
import ProgramTrackedEntityAttribute from "./ProgramTrackedEntityAttribute";
import Program from "./Program";
import TrackedEntityType from "./TrackedEntityType";
import Schedule from "./Schedule";
import { generateUid } from "../utils/uid";

export const makeCategoryCombo = (val) => {
  if (val.categoryCombo) {
    const categoryCombo = new CategoryCombo();
    categoryCombo.setId(val.categoryCombo.id);
    categoryCombo.setCode(val.categoryCombo.code);
    categoryCombo.setName(val.categoryCombo.name);

    const categories = val.categoryCombo.categories
      .filter((c) => c.name !== "default")
      .map((c) => {
        const category = new Category(c.id, c.name, c.code);

        if (c.mapping) {
          category.setMapping(c.mapping);
        }

        const categoryOptions = c.categoryOptions.map((co) => {
          return new CategoryOption(co.id, co.name, co.code);
        });

        category.setCategoryOptions(categoryOptions);

        return category;
      });

    const dateSetCategoryOptionCombos = val.categoryCombo.categoryOptionCombos.map(
      (coc) => {
        const categoryOptionCombo = new CategoryOptionCombo();
        categoryOptionCombo.setId(coc.id);
        categoryOptionCombo.setName(coc.name);

        const categoryOptions = coc.categoryOptions.map((co) => {
          return new CategoryOption(co.id, co.name, co.code);
        });
        categoryOptionCombo.setCategoryOptions(categoryOptions);
        return categoryOptionCombo;
      }
    );

    categoryCombo.setCategoryOptionCombos(dateSetCategoryOptionCombos);
    categoryCombo.setCategories(categories);

    return categoryCombo;
  }
  return null;
};

export const convertAggregate = (ds, d2) => {
  const grouped = _.groupBy(ds.dataValues, "dataElement");

  const dataSet = new DataSet();

  const dateSetCategoryCombo = makeCategoryCombo(ds);

  dataSet.setCategoryCombo(dateSetCategoryCombo);

  const forms = ds.forms.map((form) => {
    const f = new Form();
    const dataElements = form.dataElements
      .slice()
      .sort((a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      })
      .map((de) => {
        const dataElement = new Element();
        dataElement.setId(de.id);
        dataElement.setCode(de.code);
        dataElement.setName(de.name);
        dataElement.setValueType(de.valueType);
        dataElement.setMapping(de.mapping);
        return dataElement;
      });

    const cocs = grouped[form.dataElements[0]["id"]];

    const groupedOption = _.groupBy(form.categoryOptionCombos, "id");

    let categoryOptionCombos = cocs.map((coc) => {
      const found = groupedOption[coc["categoryOptionCombo"]];
      const categoryOptionCombo = new CategoryOptionCombo();

      if (found) {
        categoryOptionCombo.setId(found[0].id);
        categoryOptionCombo.setName(found[0].name);
        categoryOptionCombo.setMapping(found[0].mapping || {});
        categoryOptionCombo.setCell(found[0].cell || {});
        categoryOptionCombo.setColumn(found[0].column || {});
      }
      return categoryOptionCombo;
    });

    f.setCategoryOptionCombos(categoryOptionCombos);
    f.setDataElements(dataElements);
    f.setName(form.name);
    return f;
  });

  dataSet.setForms(forms);

  dataSet.setD2(d2);

  dataSet.setId(ds.id);
  dataSet.setCode(ds.code);
  dataSet.setName(ds.name);
  dataSet.setPeriodType(ds.periodType);
  dataSet.setPeriodType(ds.periodType);
  dataSet.setDataValues(ds.dataValues);
  dataSet.setOrgUnitColumn(ds.orgUnitColumn);
  dataSet.setOrganisationColumn(ds.organisationColumn);
  dataSet.setOrgUnitStrategy(ds.orgUnitStrategy);
  dataSet.setPeriodColumn(ds.periodColumn);
  dataSet.setDataElementColumn(ds.dataElementColumn);
  dataSet.setCategoryOptionComboColumn(ds.categoryOptionComboColumn);
  dataSet.setDataValueColumn(ds.dataValueColumn);
  dataSet.setHeaderRow(ds.headerRow || 1);
  dataSet.setDataStartRow(ds.dataStartRow || 2);
  dataSet.setPeriod(ds.period);
  dataSet.setAggregateId(ds.aggregateId || 1);
  dataSet.setUsername(ds.username || "");
  dataSet.setPassword(ds.password || "");
  dataSet.setResponseKey(ds.responseKey || "");
  dataSet.setProxy(ds.proxy || "");
  dataSet.setUseProxy(ds.useProxy);
  dataSet.proIndicators = ds.proIndicators;
  dataSet.dataIndicators = ds.dataIndicators;
  dataSet.dataDataElements = ds.dataDataElements;
  dataSet.selectedPeriods = ds.selectedPeriods || [];
  dataSet.setAction(ds.action || "upload");

  if (ds.params) {
    const params = ds.params.map((p) => {
      const param = new Param();
      param.setParam(p.param);
      param.setValue(p.value);

      return param;
    });

    dataSet.setParams(params);
  }

  const ous = ds.organisationUnits.map((ou) => {
    return new OrganisationUnit(ou.id, ou.name, ou.code);
  });

  let sourceOus = [];

  if (ds.sourceOrganisationUnits) {
    sourceOus = ds.sourceOrganisationUnits.map((ou) => {
      const o = new OrganisationUnit(ou.id, ou.name, ou.code);
      if (ou.mapping) {
        o.setMapping(ou.mapping);
      }
      return o;
    });
  }
  dataSet.setOrganisationUnits(ous);

  dataSet.setOrganisation(ds.organisation);
  dataSet.setPeriod(ds.period);
  dataSet.setOrganisationCell(ds.organisationCell);
  dataSet.setDataStartColumn(ds.dataStartColumn);
  dataSet.setUrl(ds.url || "");
  dataSet.setTemplateType(ds.templateType);
  dataSet.setCell2(ds.cell2 || {});
  dataSet.setIsDhis2(ds.isDhis2);
  dataSet.setTemplate(ds.template || 0);
  dataSet.setMappingName(ds.mappingName || "");
  dataSet.setMappingDescription(ds.mappingDescription || "");
  dataSet.setCompleteDataSet(ds.completeDataSet);
  dataSet.setSourceOrganisationUnits(sourceOus);
  dataSet.setSelectedIndicators(ds.selectedIndicators || []);
  dataSet.setCurrentLevel(ds.currentLevel);
  if (dataSet.isDhis2) {
    // dataSet.setDhis2DataSetChange(ds.selectedDataSet);
    dataSet.setCurrentLevel(ds.currentLevel);
    dataSet.loadLevelsAndDataSets();
  }

  if (ds.sourceOrganisationUnits) {
    const units = ds.sourceOrganisationUnits.map((u) => {
      const o = new OrganisationUnit(u.id, u.name, u.code);
      o.setMapping(u.mapping);
      return o;
    });
    dataSet.setSourceOrganisationUnit(units);
  }

  return dataSet;
};

export const convert = (program, d2, latestProgram) => {
  const programStages = latestProgram.programStages.map((ps) => {
    const savedStage = program.programStages
      ? program.programStages.find((s) => s.id === ps.id)
      : {} || {};
    const programStageDataElements = ps.programStageDataElements.map((psd) => {
      const savedDataElement = savedStage.programStageDataElements
        ? savedStage.programStageDataElements.find(
            (savedElement) => savedElement.dataElement.id === psd.dataElement.id
          )
        : {};

      let optionSet = null;
      if (psd.dataElement.optionSetValue) {
        const options = psd.dataElement.optionSet.options.map((o) => {
          const option = new Option(o.code, o.name);
          const savedOption =
            !_.isEmpty(savedDataElement) &&
            !!savedDataElement.dataElement.optionSet
              ? savedDataElement.dataElement.optionSet.options.find(
                  (oo) => o.code === oo.code
                )
              : "";
          option.setValue(
            !!savedOption && savedOption.value ? savedOption.value : ""
          );
          return option;
        });
        optionSet = new OptionSet(options);
      }

      const dataElement = new DataElement(
        psd.dataElement.id,
        psd.dataElement.code,
        psd.dataElement.name,
        psd.dataElement.displayName,
        psd.dataElement.valueType,
        psd.dataElement.optionSetValue,
        optionSet
      );

      if (savedDataElement && savedDataElement.dataElement) {
        dataElement.setAsIdentifier(
          savedDataElement.dataElement.identifiesEvent
        );
      }
      const programStageDataElement = new ProgramStageDataElement(
        psd.compulsory,
        dataElement
      );
      if (savedDataElement && savedDataElement.column) {
        programStageDataElement.setColumn(savedDataElement.column);
      }
      return programStageDataElement;
    });
    const programStage = new ProgramStage(
      ps.id,
      ps.name,
      ps.displayName,
      ps.repeatable,
      programStageDataElements
    );
    programStage.setEventDateAsIdentifier(savedStage.eventDateIdentifiesEvent);
    programStage.setCompleteEvents(savedStage.completeEvents);
    programStage.setLongitudeColumn(savedStage.longitudeColumn);
    programStage.setLatitudeColumn(savedStage.latitudeColumn);
    programStage.setCreateNewEvents(savedStage.createNewEvents);
    programStage.setUpdateEvents(savedStage.updateEvents);
    programStage.setDate(savedStage.eventDateColumn);
    return programStage;
  });

  const programTrackedEntityAttributes = latestProgram.programTrackedEntityAttributes.map(
    (pa) => {
      const savedAttribute = program.programTrackedEntityAttributes
        ? program.programTrackedEntityAttributes.find(
            (spa) =>
              spa.trackedEntityAttribute.id === pa.trackedEntityAttribute.id
          )
        : null;
      let optionSet = null;
      if (pa.trackedEntityAttribute.optionSetValue) {
        const options = pa.trackedEntityAttribute.optionSet.options.map((o) => {
          const option = new Option(o.code, o.name);
          const savedOption =
            !_.isEmpty(savedAttribute) &&
            !!savedAttribute.trackedEntityAttribute.optionSet
              ? savedAttribute.trackedEntityAttribute.optionSet.options.find(
                  (oo) => o.code === oo.code
                )
              : "";
          option.setValue(
            !!savedOption && savedOption.value ? savedOption.value : ""
          );
          return option;
        });
        optionSet = new OptionSet(options);
      }

      const trackedEntityAttribute = new TrackedEntityAttribute(
        pa.trackedEntityAttribute.id,
        pa.trackedEntityAttribute.code,
        pa.trackedEntityAttribute.name,
        pa.trackedEntityAttribute.displayName,
        pa.trackedEntityAttribute.unique,
        pa.trackedEntityAttribute.optionSetValue,
        optionSet
      );

      const programTrackedEntityAttribute = new ProgramTrackedEntityAttribute(
        pa.valueType,
        pa.mandatory,
        trackedEntityAttribute
      );
      if (savedAttribute) {
        programTrackedEntityAttribute.setColumn(savedAttribute.column);
      }
      return programTrackedEntityAttribute;
    }
  );
  const programCategoryCombo = makeCategoryCombo(latestProgram);
  const p = new Program(
    latestProgram.lastUpdated,
    latestProgram.name,
    latestProgram.id,
    latestProgram.programType,
    latestProgram.displayName,
    programStages,
    programTrackedEntityAttributes
  );

  p.setCategoryCombo(programCategoryCombo);
  p.setOrganisationUnits(latestProgram.organisationUnits);

  if (latestProgram.trackedEntityType && latestProgram.trackedEntityType.id) {
    p.setTrackedEntityType(
      new TrackedEntityType(latestProgram.trackedEntityType.id)
    );
  } else if (latestProgram.trackedEntity && latestProgram.trackedEntity) {
    p.setTrackedEntity(new TrackedEntityType(latestProgram.trackedEntity.id));
  }

  p.setD2(d2);
  // p.setOrder(program.order);
  // p.setOrderBy(program.orderBy);
  p.setOrgUnitStrategy(program.orgUnitStrategy);
  p.setHeaderRow(program.headerRow || 1);
  p.setDataStartRow(program.dataStartRow || 2);
  p.setCreateNewEnrollments(program.createNewEnrollments);
  p.setCreateEntities(program.createEntities);
  p.setUpdateEntities(program.updateEntities);
  p.setEnrollmentDateColumn(program.enrollmentDateColumn);
  p.setIncidentDateColumn(program.incidentDateColumn);
  p.setUrl(program.url || "");
  p.setDateFilter(program.dateFilter || "");
  p.setLastRun(program.lastRun);
  p.setUploaded(program.uploaded);
  p.setUploadMessage(program.uploadMessage);
  p.setOrgUnitColumn(program.orgUnitColumn);
  p.setMappingId(program.mappingId || generateUid());
  p.setLatitudeColumn(program.latitudeColumn);
  p.setLongitudeColumn(program.longitudeColumn);
  p.setDateEndFilter(program.dateEndFilter || "");
  p.setScheduleTime(program.scheduleTime || 0);
  // p.setSelectedSheet(program.selectedSheet);
  p.setErrors([]);
  p.setConflicts([]);
  p.setMappingName(program.mappingName || "");
  p.setMappingDescription(program.mappingDescription || "");
  p.setTemplateType(program.templateType || "");
  p.setIncidentDateProvided(program.incidentDateProvided);
  p.setSelectEnrollmentDatesInFuture(
    program.selectEnrollmentDatesInFuture || false
  );
  p.setSelectIncidentDatesInFuture(
    program.selectIncidentDatesInFuture || false
  );
  p.setDataSource(program.dataSource);
  p.setPassword(program.password);
  p.setUsername(program.username);
  p.isDHIS2 = program.isDHIS2 || false;
  p.remoteId = program.remoteId || "";
  p.trackedEntityInstances = program.trackedEntityInstances || false;
  p.enrollments = program.enrollments || false;
  p.events = program.events || false;
  p.remoteStage = program.remoteStage;
  p.remoteProgram = program.remoteProgram;

  if (program.sourceOrganisationUnits) {
    const units = program.sourceOrganisationUnits.map((u) => {
      const o = new OrganisationUnit(u.id, u.name, u.code);
      o.setMapping(u.mapping);
      return o;
    });
    p.setSourceOrganisationUnit(units);
  }

  if (program.params) {
    const params = program.params.map((p) => {
      const param = new Param();
      param.setParam(p.param);
      param.setValue(p.value);
      param.setIsPeriod(p.isPeriod);
      param.setPeriodType(p.periodType);

      return param;
    });
    p.setParams(params);
  }
  return p;
};

export const convertSchedule = (schedule) => {
  const sc = new Schedule();
  sc.setSchedule(schedule.schedule);
  sc.setType(schedule.type);
  sc.setName(schedule.name);
  sc.setValue(schedule.value);
  sc.setCreated(schedule.created);
  sc.setNext(schedule.next);
  sc.setLast(schedule.last);
  sc.setUrl(schedule.url);

  return sc;
};

export const convertSchedules = (schedules) => {
  return schedules.map((s) => convertSchedule(s));
};

export const createParam = (val) => {
  const param = new Param();

  param.setParam(val.param);
  param.setValue(val.value);

  return param;
};

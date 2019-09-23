import XLSX from 'xlsx';
import { processDataSet, processProgramData, processEvents } from '../utils/utils'

export function expensive(files) {

    let buffers = [];

    [].forEach.call(files, function (file) {
        const reader = new FileReaderSync();
        buffers.push(reader.readAsArrayBuffer(file));
    });


    const data = buffers[0];

    return XLSX.read(data, {
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false
    });
}

export function processDataSetData(data, dataSet) {
    try {
        return processDataSet(data, dataSet);
    } catch (e) {
        console.log(e);
        return {}
    }
}

export function processTrackerProgramData(data, program, uniqueColumn, instances) {
    return processProgramData(data, program, uniqueColumn, instances)
}

export function processEventProgramData(data, program, uniqueColumn, instances) {
    return processEvents(data, program, uniqueColumn, instances)
}

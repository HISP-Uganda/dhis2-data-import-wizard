import XLSX from 'xlsx';

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

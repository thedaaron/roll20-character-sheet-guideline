const parseEvent = ({ sourceAttribute, newValue, previousValue, removedInfo }) => {
    const [section, id, attribute] = sourceAttribute.split('_');
    return {
        id,
        sectionName: `${section}_${id}`,
        changedAttribute: attribute,
        newValue,
        previousValue,
        removedInfo
    };
};

const attributes = {
    emptyText: "",
    settedText: "settedText",
    emptyNumber: "",
    settedNumber: "6",
    falseBoolean: "0",
    trueBoolean: "1",
    enumNotSelected: "",
    enumSelected: "Člověk",
    radioNotSelected: "",
    radioSelected: "5",
    emptyTextarea: "",
    settedTextarea: "settedText",
    totalCount: "0"
};

const createRepeatingSection = (name) => ({
    name,
    attrs: {
        sourceId: '',
        targetId: '',
        name: '',
        count: 0
    },
    getValues: (id, values) => {
        const prefix = `${name}_${id}_`;
        return Object.keys(this.attrs).reduce((acc, key) => {
            acc[key] = values[prefix + key];
            return acc;
        }, {});
    },
    getAttrs: (id) => Object.keys(this.attrs).map(key => `${name}_${id}_${key}`)
});

const repeatingSections = {
    first: createRepeatingSection('repeating_first'),
    second: createRepeatingSection('repeating_second')
};

on("sheet:opened", () => {
    getAttrs(Object.keys(attributes), (values) => {
        setAttrs(attributes, { silent: true });
    });
});

Object.keys(attributes).forEach(attribute => {
    on(`change:${attribute}`, (eventinfo) => {
        setAttrs({ [`${attribute}Worker`]: eventinfo.newValue });
    });
});

const getSectionIDsOrdered = (sectionName, callback) => {
    getAttrs([`_reporder_${sectionName}`], (v) => {
        getSectionIDs(sectionName, (idArray) => {
            const reporderArray = v[`_reporder_${sectionName}`]?.toLowerCase().split(',') || [];
            const ids = [...new Set(reporderArray.filter(x => idArray.includes(x)).concat(idArray))];
            callback(ids);
        });
    });
};

const syncTotalCount = (totalCount) => {
    setAttrs(
        { totalCount },
        { silent: false },
        () => {
            console.log('setAttrs', data);
        }
    );
};

const handleRepeatingChange = (sectionName, targetSectionName, eventinfo) => {
    const { id, changedAttribute, newValue } = parseEvent(eventinfo);
    if (changedAttribute === 'synced') {
        syncTotalCount(10);
    } else {
        getAttrs(repeatingSections[sectionName].getAttrs(id), (values) => {
            console.log({values});
            const data = repeatingSections[sectionName].getValues(id, values);
            console.log({data});
            // Process data...
            getSectionIDsOrdered(repeatingSections[sectionName].name, (ids) => {
                console.log('ids', ids);
            });
            let sourceSyncIds = {};
            if (targetId === '') {
                targetId = generateRowID();
                sourceSyncIds = {
                    [`${sectionName}_${sourceId}_sourceId`]: sourceId,
                    [`${sectionName}_${sourceId}_targetId`]: targetId.toLowerCase(),
                    [`${targetSectionName}_${targetId}_sourceId`]: targetId.toLowerCase(),
                    [`${targetSectionName}_${targetId}_targetId`]: sourceId,
                };
            }
            // sync everything silent
            const syncData = {
                ...sourceSyncIds,
                [`${targetSectionName}_${targetId}_${changedAttribute}`]: data[changedAttribute]
            };
            // tell repeating second that it is synced, to recalculate computed values
            const synced = {
                [`${targetSectionName}_${targetId}_synced`]: '1'
            }
            setAttrs(
                syncData,
                { silent: true },
                () => {
                    window.setTimeout(() => {
                        console.log('setAttrs', syncData);
                        setAttrs(
                            synced,
                            { silent: false },
                            () => {
                                console.log('setAttrs', synced);
                            }
                        );
                    }, 2000);
                }
            );
        });
    }
};

on('change:repeating_first', (eventinfo) => handleRepeatingChange('first', 'second', eventinfo));
on('change:repeating_second', (eventinfo) => handleRepeatingChange('second', 'first', eventinfo));

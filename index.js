const parseEvent = ({ sourceAttribute, newValue, previousValue, removedInfo }) => {
    const [section, name, id, attribute] = sourceAttribute.split('_');
    return {
        id,
        sectionName: `${section}_${name}`,
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

const createRepeatingSection = (name) => {
    const attrs = {
        sourceId: '',
        targetId: '',
        name: '',
        count: 0
    };
    return {
        name,
        attrs,
        getValues: (id, values) => {
            const prefix = `repeating_${name}_${id}_`;
            return Object.keys(attrs).reduce((acc, key) => {
                acc[key] = values[prefix + key];
                return acc;
            }, {});
        },
        getAttrs: (id) => Object.keys(attrs).map(key => `repeating_${name}_${id}_${key}`)
    };
};

const repeatingSections = {
    first: createRepeatingSection('first'),
    second: createRepeatingSection('second')
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
    setAttrs({ totalCount }, { silent: false }, () => {
        console.log('setAttrs totalCount', totalCount);
    });
};

const handleRepeatingChange = (sectionName, targetSectionName, eventinfo) => {
    const { id, changedAttribute, newValue } = parseEvent(eventinfo);
    console.log(id, changedAttribute, newValue, eventinfo)
    if (changedAttribute === 'synced') {
        syncTotalCount(10);
    } else {
        getAttrs(repeatingSections[sectionName].getAttrs(id), (values) => {
            console.log({ values });
            const data = repeatingSections[sectionName].getValues(id, values);
            // getSectionIDsOrdered(repeatingSections[sectionName].name, (ids) => {
            //     console.log('ids', ids);
            // });
            console.log({data});
            let targetId = data.targetId;
            let syncData = {};
            if (!targetId) {
                targetId = generateRowID();
                data.targetId = targetId; // Update data with new targetId
                syncData = {
                    [`repeating_${sectionName}_${id}_sourceId`]: id,
                    [`repeating_${sectionName}_${id}_targetId`]: targetId,
                    [`repeating_${targetSectionName}_${targetId}_sourceId`]: targetId,
                    [`repeating_${targetSectionName}_${targetId}_targetId`]: id,
                    [`repeating_${targetSectionName}_${targetId}_${changedAttribute}`]: newValue
                };
                setAttrs(syncData, { silent: true }, 
                () => {
                    // window.setTimeout(() => {
                    //     console.log('setAttrs', syncData);
                    //     setAttrs(
                    //         { [`repeating_${targetSectionName}_${targetId}_synced`]: '1' }, 
                    //         { silent: false }, 
                    //         () => {
                    //             console.log('setAttrs', synced);
                    //         }
                    //     );
                    // }, 2000);
                }
                );
            } else {
                setAttrs(
                    {[`repeating_${targetSectionName}_${targetId}_${changedAttribute}`]: newValue},
                    { silent: true }, () => {
                        // window.setTimeout(() => {
                        //     console.log('setAttrs', syncData);
                        //     setAttrs(
                        //         { [`repeating_${targetSectionName}_${targetId}_synced`]: '1' }, 
                        //         { silent: false }, 
                        //         () => {
                        //             console.log('setAttrs', synced);
                        //         }
                        //     );
                        // }, 2000);
                    }
                );
            }
        });
    }
};

on('change:repeating_first', (eventinfo) => handleRepeatingChange('first', 'second', eventinfo));
on('change:repeating_second', (eventinfo) => handleRepeatingChange('second', 'first', eventinfo));

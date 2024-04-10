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
    settedTextarea: "settedText"
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
        getAttrs: (ids) => {
            return ids.flatMap(id => Object.keys(attrs).map(key => `repeating_${name}_${id}_${key}`));
        }
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

const syncTotalCount = (sectionName, targetSectionName) => {
    getSectionIDsOrdered(targetSectionName, (idarray) => {
        getAttrs(repeatingSections[targetSectionName].getAttrs(idarray), (values) => {
            let total = 0;
            let itemsCount = idarray.length;
            for (let id of idarray) {
                total += Number(values[`repeating_${targetSectionName}_${id}_count`]) ?? 0;
            }
            setAttrs(
                { totalCount: total },
                { silent: true },
                () => {
                    syncAvarage(itemsCount);
                }
            );
        });
    });
};

const syncAvarage = (itemsCount) => {
    getAttrs(['totalCount'], (values) => {
        const totalCount = Number(values.totalCount);
        console.log(totalCount, itemsCount)
        const avarage = itemsCount === 0 ? 0 : totalCount / itemsCount;
        setAttrs({ avarage }, { silent: true });
    });
};

const handleRepeatingChange = (sectionName, targetSectionName, eventinfo) => {
    const { id, changedAttribute, newValue } = parseEvent(eventinfo);
    getAttrs(repeatingSections[sectionName].getAttrs([id]), (values) => {
        const data = repeatingSections[sectionName].getValues(id, values);
        const value = data[changedAttribute]
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
                [`repeating_${targetSectionName}_${targetId}_${changedAttribute}`]: value
            };
            setAttrs(syncData,
                { silent: true },
                () => {
                    syncTotalCount(sectionName, targetSectionName);
                }
            );
        } else {
            setAttrs(
                { [`repeating_${targetSectionName}_${targetId}_${changedAttribute}`]: value },
                { silent: true },
                () => {
                    syncTotalCount(sectionName, targetSectionName);
                }
            );
        }
    });
};

const handleRepeatingRemove = (sectionName, targetSectionName, eventinfo) => {
    const { sourceAttribute, removedInfo } = eventinfo;
    const targetId = removedInfo[`${sourceAttribute}_targetId`];
    removeRepeatingRow(`repeating_${targetSectionName}_${targetId}`);
    syncTotalCount(sectionName, targetSectionName);
};

on('change:repeating_first', (eventinfo) => handleRepeatingChange('first', 'second', eventinfo));
on('remove:repeating_first', (eventinfo) => handleRepeatingRemove('first', 'second', eventinfo));


on('change:repeating_second', (eventinfo) => handleRepeatingChange('second', 'first', eventinfo));
on('remove:repeating_second', (eventinfo) => handleRepeatingRemove('second', 'first', eventinfo));

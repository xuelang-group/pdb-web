import { Button, Checkbox, Divider, Segmented } from "antd";
import 'dayjs/locale/zh-cn';
import _ from "lodash";
import React, { useState } from "react";

import { optionLabelMap, optionSymbolMap } from "@/utils/common";
import { typeLabelMap } from ".";
import ExploreFilterContent from "./ExploreFilterContent";
import { AttrConfig } from "@/reducers/type";

interface ExploreFilterProps {
  originType: any
  saveConfig: Function
  close: Function
}

export const operators: any = {
  "AND": "与",
  "OR": "或"
};

const CheckboxGroup = Checkbox.Group;

export default function ExploreFilter(props: ExploreFilterProps) {
  const { originType, saveConfig, close } = props;
  const childRef = React.createRef();

  const tagType: string = _.get(originType, 'type', ''),
    tagLabel: string = _.get(originType, 'label', ''),
    tagTypeData = _.get(originType, 'data', {}),
    tagTypeAttr = tagType === 'type' ? tagTypeData['x.type.attrs'] : [],
    tagTypeId = tagType === 'type' ? tagTypeData['x.type.name'] : '',
    tagTypeCsv = _.get(originType, 'csv', []);

  const defaultCheckedList: string[] = tagTypeCsv.map(({ attrId, attrName, attrType }: any) => (`${attrId}|${attrName}|${attrType}`)),
    allCheckedList = tagTypeAttr.map(({ name, display, type }: AttrConfig) => (`${name}|${display}|${type}`));
  const [selectedTab, setSelectedTab] = useState(tagType === 'type' ? 'column' : 'filter'),
    [checkedList, setCheckedList] = useState<string[]>(defaultCheckedList),
    [indeterminate, setIndeterminate] = useState(defaultCheckedList.length !== allCheckedList.length),
    [checkAll, setCheckAll] = useState(defaultCheckedList.length === allCheckedList.length);

  const save = function () {
    const { filterOptions } = childRef.current as any;

    let filterLabel = "", filterKey = "", conditions: any = [];
    if (filterOptions && filterOptions.length > 0) {
      filterOptions.forEach((opt: any, index: number) => {
        const condition = _.get(opt, 'condition.value', ""),
          attrLabel = _.get(opt, 'attr.label'),
          attrValue = _.get(opt, 'attr.value');
        let keyword = _.get(opt, 'keyword', ""),
          keywordValue = keyword;
        if (typeof keyword === "object") {
          keyword = keyword.format(_.get(opt, 'attr.data.datetimeFormat', "YYYY-MM-DD"));
          keywordValue = new Date(keyword);
        }
        let conditionDetail = {};
        if (index > 0) {
          filterLabel += `${operators[opt.operator]} `;
          filterKey += `${opt.operator} `;
          Object.assign(conditionDetail, {
            connectives: opt.operator
          });
        }
        let raw = "";
        if (condition === "has") {
          filterLabel += `存在属性 ${attrLabel}`;
          raw += `HAS ${attrValue}`;
        } else {
          const conditionLabel = (condition === "anyofterms" || condition === "allofterms" ? optionLabelMap[condition] : optionSymbolMap[condition]) || ""
          filterLabel += `${opt.isNot ? "NOT " : ""}${attrLabel} ${conditionLabel} ${keyword}`;
          raw += `${opt.isNot ? "NOT " : ""}${attrValue} ${optionSymbolMap[condition] || ""} ${typeof _.get(opt, 'keyword', "") === "string" ? `'${keywordValue}'` : keywordValue}`;
        }
        Object.assign(conditionDetail, {
          // raw,
          name: attrValue,
          function: optionSymbolMap[condition] || "",
          value: keywordValue,
          not: opt.isNot
        });
        conditions.push(conditionDetail);
        filterKey += raw;
        if (index < filterOptions.length - 1) {
          filterLabel += " ";
          filterKey += " ";
        }
      });
    }

    const csv: { typeId: any; attrId: string; attrName: string; attrType: string; }[] = [];
    if (checkedList.length > 0) {
      checkedList.forEach(function (value) {
        const valArr = value.split("|");
        csv.push({
          typeId: tagTypeId,
          attrId: valArr[0],
          attrName: valArr[1],
          attrType: valArr[2]
        })
      });
    }
    saveConfig({
      key: filterKey,
      label: filterLabel,
      conditions,
      options: filterOptions
    }, csv);
  }

  const onChange = (list: any[]) => {
    setCheckedList(list);
    setIndeterminate(!!list.length && list.length < tagTypeAttr.length);
    setCheckAll(list.length === tagTypeAttr.length);
  };

  const onCheckAllChange = (e: any) => {
    console.log(allCheckedList)
    setCheckedList(e.target.checked ? allCheckedList : []);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
  };

  const renderColumnSelect = function () {
    return (
      <div className="pdb-explore-filter-column">
        <div className="pdb-explore-filter-column-all">
          <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
            <span>{checkedList.length}</span>
            <span>/</span>
            <span>{tagTypeAttr.length}项</span>
          </Checkbox>
        </div>
        <CheckboxGroup
          options={tagTypeAttr.map(({ display, name, type }: AttrConfig) => ({
            label: display,
            value: `${name}|${display}|${type}`
          }))}
          value={checkedList}
          onChange={onChange}
        />
      </div>
    )
  }
  return (
    <div className="pdb-explore-filter">
      <div className="pdb-explore-filter-header">
        <span>{typeLabelMap[tagType]} - {tagLabel}</span>
        <i className="spicon icon-guanbi" onClick={() => close()}></i>
      </div>
      <div className="pdb-explore-filter-container">
        {tagType === 'type' &&
          <Segmented
            value={selectedTab}
            options={[{
              label: '字段筛选',
              value: 'column'
            }, {
              label: '数据过滤',
              value: 'filter'
            }]}
            onChange={key => { setSelectedTab(key); }}
            block
          />
        }
        <ExploreFilterContent
          visible={selectedTab === 'filter'}
          onRef={childRef}
          originType={originType}
        />
        {selectedTab === 'column' && renderColumnSelect()}
      </div>
      <div className="pdb-explore-filter-footer">
        <Button onClick={() => close()}>取消</Button>
        <Button type="primary" onClick={save}>确定</Button>
      </div>
    </div>
  )
}
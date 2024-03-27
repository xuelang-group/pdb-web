import { Button, Form } from "antd";
import 'dayjs/locale/zh-cn';
import _ from "lodash";
import React, { useState } from "react";

import { optionLabelMap, optionSymbolMap } from "@/utils/common";
import { typeLabelMap } from ".";
import ExploreFilterContent from "./ExploreFilterContent";

interface ExploreFilterProps {
  originType: any
  saveConfig: Function
  close: Function
}

export const operators: any = {
  "AND": "与",
  "OR": "或"
};

export default function ExploreFilter(props: ExploreFilterProps) {
  const { originType, saveConfig, close } = props;
  const [configForm] = Form.useForm(),
    childRef = React.createRef();

  const [isNew, setIsNew] = useState(false),
    [editConditionIndex, setEditConditionIndex] = useState(-1);
  const tagType: string = _.get(originType, 'type', '');

  const add = function () {
    const { filterOptions, setEditCondition, setActivePanelKey } = childRef.current as any;
    configForm.resetFields();
    const initalValue = {
      condition: {
        value: "has",
        label: optionLabelMap["has"]
      }
    }
    if (filterOptions.length > 0) {
      Object.assign(initalValue, { operator: "AND" });
    }
    setEditCondition(initalValue);
    configForm.setFieldsValue(initalValue);
    setActivePanelKey(["new"]);
    setIsNew(true);
  }

  const save = function () {
    const { filterOptions } = childRef.current as any;

    let filterLabel = "", filterKey = "", conditions: any = [];
    if (filterOptions && filterOptions.length > 0) {
      // filterLabel = " (";
      // filterKey = "(";
      filterOptions.forEach((opt: any, index: number) => {
        const condition = _.get(opt, 'condition.value', ""),
          attrLabel = _.get(opt, 'attr.label'),
          attrValue = _.get(opt, 'attr.value');
        let keyword = _.get(opt, 'keyword', ""),
          keywordValue = keyword;
        if (typeof keyword === "object") {
          keyword = keyword.format("YYYY-MM-DD HH:mm:ss");
          keywordValue = new Date(keywordValue).getTime();
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
          raw,
          name: attrValue,
          function: optionSymbolMap[condition] || "",
          value: keywordValue
        });
        conditions.push(conditionDetail);
        filterKey += raw;
        if (index < filterOptions.length - 1) {
          filterLabel += " ";
          filterKey += " ";
        } else {
          // filterLabel += ")";
          // filterKey += ")";
        }
      });
    }
    saveConfig({
      key: filterKey,
      label: filterLabel,
      conditions,
      options: filterOptions
    });
  }

  return (
    <div className="pdb-explore-filter">
      <div className="pdb-explore-filter-header">
        <span>过滤条件 - {typeLabelMap[tagType]}</span>
        <i className="spicon icon-guanbi" onClick={() => close()}></i>
      </div>
      <ExploreFilterContent
        isNew={isNew}
        setIsNew={setIsNew}
        editConditionIndex={editConditionIndex} 
        setEditConditionIndex={setEditConditionIndex}
        onRef={childRef}
        originType={originType}
        configForm={configForm}
      />
      <div className="pdb-explore-filter-add">
        <Button
          icon={<i className="spicon icon-add"></i>}
          onClick={add}
          disabled={isNew || editConditionIndex > -1}
        >添加条件</Button>
        <Button
          type="primary"
          icon={<i className="spicon icon-baocun1"></i>}
          onClick={save}
          disabled={isNew || editConditionIndex > -1}
        >保存配置</Button>
      </div>
    </div>
  )
}
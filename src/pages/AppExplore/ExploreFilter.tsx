import { Alert, Button, Checkbox, Divider, Radio, Segmented } from "antd";
import 'dayjs/locale/zh-cn';
import _ from "lodash";
import React, { useEffect, useState } from "react";

import { optionLabelMap, optionSymbolMap } from "@/utils/common";
import { typeLabelMap } from ".";
import ExploreFilterContent from "./ExploreFilterContent";
import { AttrConfig } from "@/reducers/type";

interface ExploreFilterProps {
  originType: any
  saveConfig: Function
  close: Function
  isLastTag: boolean
}

export const operators: any = {
  "AND": "与",
  "OR": "或"
};

const joinTypes: any = {
  "all": "全联接",
  "left": "左联接",
  "right": "右联接",
  "inner": "内联接"
}

const CheckboxGroup = Checkbox.Group;

export default function ExploreFilter(props: ExploreFilterProps) {
  const { originType, saveConfig, close, isLastTag } = props;
  const childRef = React.createRef();

  const [allCheckedList, setAllCheckedList] = useState([]),
    [selectedTab, setSelectedTab] = useState('filter'),
    [checkedList, setCheckedList] = useState<string[]>([]),
    [indeterminate, setIndeterminate] = useState(false),
    [checkAll, setCheckAll] = useState(true),
    [segmentedOpt, setSegmentedOpt] = useState<{ label: string, value: string }[]>([]);
    // [groupMethod, setGroupMethod] = useState("inner");

  const [joinType, setJoinType] = useState("all"),
    [leftSelected, setLeftSelected] = useState(true),
    [rightSelected, setRightSelected] = useState(true),
    [ovalSelected, setOvalSelected] = useState(true);

  useEffect(() => {
    const tagType: string = _.get(originType, 'type', ''),
      tagTypeData = _.get(originType, 'data', {}),
      tagTypeAttr = tagType === 'type' ? tagTypeData['x.type.attrs'] : [],
      tagTypeCsv = _.get(originType, 'csv', []);

    const _segmentedOpt = [];
    _segmentedOpt.push(tagType === 'type' ? {
      label: '字段筛选',
      value: 'column'
    } : {
      label: '数据联接',
      value: 'group'
    });
    _segmentedOpt.push({
      label: '数据过滤',
      value: 'filter'
    });

    const defaultCheckedList: string[] = tagTypeCsv.map(({ attrId, attrName, attrType }: any) => (`${attrId}|${attrName}|${attrType}`));
    setSelectedTab(_.get(originType, 'type', '') === 'type' ? 'column' : 'group');
    setCheckedList(defaultCheckedList);
    setIndeterminate(defaultCheckedList.length !== tagTypeAttr.length);
    setCheckAll(defaultCheckedList.length === tagTypeAttr.length);
    setAllCheckedList(tagTypeAttr.map(({ name, display, type }: AttrConfig) => (`${name}|${display}|${type}`)));
    setSegmentedOpt(_segmentedOpt);
  }, [originType]);

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
      const tagType: string = _.get(originType, 'type', ''),
        tagTypeData = _.get(originType, 'data', {}),
        tagTypeId = tagType === 'type' ? tagTypeData['x.type.name'] : '';

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
    const tagType: string = _.get(originType, 'type', ''),
      tagTypeData = _.get(originType, 'data', {}),
      tagTypeAttr = tagType === 'type' ? tagTypeData['x.type.attrs'] : [];

    setCheckedList(list);
    setIndeterminate(!!list.length && list.length < tagTypeAttr.length);
    setCheckAll(list.length === tagTypeAttr.length);
  };

  const onCheckAllChange = (e: any) => {
    setCheckedList(e.target.checked ? allCheckedList : []);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
  };

  // 字段选择
  const renderColumnSelect = function () {
    const tagType: string = _.get(originType, 'type', ''),
      tagTypeData = _.get(originType, 'data', {}),
      tagTypeAttr = tagType === 'type' ? tagTypeData['x.type.attrs'] : [];
    return (
      <div className="pdb-explore-column">
        <div className="pdb-explore-column-all">
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

  const changeJoinType = function (_left: boolean, _right: boolean, _oval: boolean) {
    let joinType = '';
    if (_left && !_right) {
      joinType = 'left';
    } else if (!_left && _right) {
      joinType = 'right';
    } else if (_oval && !_left && !_right) {
      joinType = 'inner';
    } else if (_left && _right) {
      joinType = 'all';
    }
    setJoinType(joinType);
  }


  const changeLeftSelect = function (event: any) {
    setLeftSelected(!leftSelected);
    setOvalSelected(false);
    changeJoinType(!leftSelected, rightSelected, false);
  }

  const changeRightSelect = function (event: any) {
    setRightSelected(!rightSelected);
    setOvalSelected(false);
    changeJoinType(leftSelected, !rightSelected, false);
  }

  const changeOvalSelect = function (event: any) {
    setLeftSelected(false);
    setRightSelected(false);
    setOvalSelected(!ovalSelected);
    changeJoinType(false, false, !ovalSelected);
  }

  // 数据连接
  const renderGroupSetting = function () {
    if (isLastTag) {
      return (
        <Alert message="请先选择目标对象类型。" type="warning" showIcon />
      )
    }
    return (
      <div className="pdb-explore-group">
        <div className="pdb-explore-group-item">
          <div className="pdb-explore-group-item-header">
            <span></span>
            <span>计算方式 - {joinType ? joinTypes[joinType] : "?"}</span>
            <span>(请单击图形更改联接类型)</span>
          </div>
          <div className="pdb-explore-group-item-content">
            {/* <Radio.Group value={groupMethod} onChange={e => { setGroupMethod(e.target.value); }}>
              <Radio.Button value="inner">内联接</Radio.Button>
              <Radio.Button value="left">左联接</Radio.Button>
              <Radio.Button value="right ">右联接</Radio.Button>
              <Radio.Button value="all">全联接</Radio.Button>
            </Radio.Group> */}
            <div className="join-cirle">
              <div className="join-cirle-left" onClick={changeLeftSelect} style={leftSelected ? { background: '#80808061' } : { background: 'none' }}>
              </div>
              <div className="join-cirle-right" onClick={changeRightSelect} style={rightSelected ? { background: '#80808061' } : { background: 'none' }}>
              </div>
              <div className="join-cirle-oval" onClick={changeOvalSelect} style={ovalSelected ? { background: '#80808061' } : { background: 'none' }}>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="pdb-explore-setting">
      <div className="pdb-explore-setting-header">
        <span>{typeLabelMap[_.get(originType, 'type', '')]} - {_.get(originType, 'label', '')}</span>
        <i className="spicon icon-guanbi" onClick={() => close()}></i>
      </div>
      <div className="pdb-explore-setting-container">
        <Segmented
          value={selectedTab}
          options={segmentedOpt}
          onChange={key => { setSelectedTab(key); }}
          block
        />
        <ExploreFilterContent
          visible={selectedTab === 'filter'}
          onRef={childRef}
          originType={originType}
        />
        {selectedTab === 'column' && renderColumnSelect()}
        {selectedTab === 'group' && renderGroupSetting()}
      </div>
      <div className="pdb-explore-setting-footer">
        <Button onClick={() => close()}>取消</Button>
        <Button type="primary" onClick={save} disabled={!joinType}>确定</Button>
      </div>
    </div>
  )
}
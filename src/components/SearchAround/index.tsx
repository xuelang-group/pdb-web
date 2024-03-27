import ExploreFilterContent from "@/pages/AppExplore/ExploreFilterContent";
import { setSearchAround } from "@/reducers/editor";
import { ObjectConfig } from "@/reducers/object";
import { StoreState } from "@/store";
import { defaultNodeColor, getBorderColor, getTextColor, optionLabelMap } from "@/utils/common";
import { Button, Dropdown, Empty, Form, Input, Select, Space, Tabs, Tag } from "antd";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PdbPanel from "../Panel";
import "./index.less";

export default function SearchAround() {
  const [exploreForm] = Form.useForm(),
    childRef = React.createRef(),
    dispatch = useDispatch();
  const relationMap = useSelector((state: StoreState) => state.editor.relationMap),
    typeRelationMap = useSelector((state: StoreState) => state.editor.typeRelationMap),
    searchAround = useSelector((state: StoreState) => state.editor.searchAround),
    types = useSelector((state: StoreState) => state.type.data);

  const [relationSearchValue, setRelationSearchValue] = useState(""),
    [activeTab, setActiveTab] = useState("0"),
    [searchAroundOptions, setSearchAroundOptions] = useState([]),
    [isNew, setIsNew] = useState(false),
    [editConditionIndex, setEditConditionIndex] = useState(-1);

  useEffect(() => {
    if (JSON.stringify(searchAroundOptions) !== JSON.stringify(searchAround.options)) {
      setSearchAroundOptions(searchAround.options);
    }
  }, [searchAround.options]);

  useEffect(() => {
    if (JSON.stringify(searchAroundOptions) !== JSON.stringify(searchAround.options)) {
      dispatch(setSearchAround({...searchAround, options: searchAroundOptions}));
    }
  }, [searchAroundOptions]);

  const handleAddRelation = function (item: any) {
    const _searchAroundOptions = JSON.parse(JSON.stringify(searchAroundOptions)),
      opt = _searchAroundOptions[Number(activeTab)];
    opt.options.push({
      id: item.key,
      type: "relation",
      data: _.get(item, "item.props.data")
    });
    setSearchAroundOptions(_searchAroundOptions);
    exploreForm.setFieldsValue(opt);
  }

  const renderAddRelationBtn = function (relations: any[]) {
    const items = !relationSearchValue ? relations :
      relations.filter((val: any) => val.label.toLowerCase().indexOf(relationSearchValue.toLowerCase()) > -1);
    return (
      <Dropdown
        trigger={["click"]}
        menu={{ items, onClick: handleAddRelation }}
        dropdownRender={(menu) => (
          <div className="pdb-search-around-relation-dropdown">
            <Input
              suffix={<i className="spicon icon-sousuo2"></i>}
              size="small"
              onChange={event => setRelationSearchValue(event.target.value)}
            />
            {items.length > 0 ?
              React.cloneElement(menu as React.ReactElement) :
              <Empty />
            }
          </div>
        )}
        placement="bottom"
        arrow
      >
        <Button
          className="pdb-search-around-relation-add"
          icon={<i className="spicon icon-tianjia2"></i>}
        >添加关系</Button>
      </Dropdown>
    )
  }
  const changeValue = function (tabIndex: number, index: number, key: string, value: string) {
    const _searchAroundOptions = JSON.parse(JSON.stringify(searchAroundOptions));
    _searchAroundOptions[tabIndex]['options'][index][key] = value;
    setSearchAroundOptions(_searchAroundOptions);
  }

  const renderOptionPanel = function (tabIndex: number, option: any, index: number, objectType: string, relations: any[]) {
    const relationName = option.id,
      targetTypeMap: any = {};
    relationMap[relationName]['r.type.constraints']['r.binds'].forEach(bind => {
      if (bind.source === objectType) {
        Object.assign(targetTypeMap, { [bind.target]: bind.target });
      }
    });
    const _types = types.filter(type => targetTypeMap[type['x.type.name']]);
    return (
      <div className="pdb-search-around-relation">
        <span><i className="spicon icon-jiantou2-xia"></i></span>
        <div className="pdb-search-around-card">
          <span className="pdb-search-around-card-label">关系</span>
          <Select
            value={relationName}
            options={relations}
            fieldNames={{ value: 'key' }}
            onChange={value => changeValue(tabIndex, index, 'id', value)}
          ></Select>
          <span className="pdb-search-around-card-label">条件</span>
          <ExploreFilterContent
            isNew={isNew}
            setIsNew={setIsNew}
            editConditionIndex={editConditionIndex}
            setEditConditionIndex={setEditConditionIndex}
            onRef={childRef}
            originType={{ data: option.data, type: "relation" }}
            configForm={exploreForm}
          />
          <Button
            className="pdb-search-around-condition-add"
            type="dashed"
            icon={<i className="spicon icon-tianjia" />}
            block
            ghost
            onClick={() => {
              const { filterOptions, setEditCondition, setActivePanelKey } = childRef.current as any;
              exploreForm.resetFields();
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
              exploreForm.setFieldsValue(initalValue);
              setActivePanelKey(["new"]);
              setIsNew(true);
            }}
            disabled={isNew || editConditionIndex > -1}
          > 添加条件 </Button>
          <span className="pdb-search-around-card-label">对象</span>
          <Select
            value={option.object}
            options={_types}
            fieldNames={{ value: 'x.type.name', label: 'x.type.label' }}
            onChange={value => changeValue(tabIndex, index, 'object', value)}
          ></Select>
        </div>
      </div>
    )
  }

  const renderTabChildren = function (item: any, tabIndex: number) {
    const { start, options } = item,
      type = start[0]['x.type.name'];
    const relations = Array.from(new Set(_.get(_.get(typeRelationMap, type, {}), 'source', [])))
      .map((id: string) => ({ key: relationMap[id]['r.type.name'], label: relationMap[id]['r.type.label'], data: relationMap[id] }));
    return (
      <div className="pdb-search-around-item">
        <div className="pdb-search-around-card pdb-search-around-start">
          <span>起始对象</span>
          <span>
            {start.map((item: ObjectConfig) => {
              const metadata = JSON.parse(item['x.metadata'] || '{}'),
                color = _.get(metadata, 'color', defaultNodeColor.fill);
              return (<Tag color={color} style={{ color: getTextColor(color), borderColor: getBorderColor(_.get(metadata, 'borderColor'), color) }}>{item["x.name"]}</Tag>);
            })}
          </span>
        </div>
        {options.map((opt: any, index: number) => {
          let objectType = type;
          if (index > 0) objectType = options[index - 1]['object'];
          return renderOptionPanel(tabIndex, opt, index, objectType, relations);
        })}
        <div>
          {renderAddRelationBtn(relations)}
          {options.length > 0 &&
            <Button
              type="primary"
              icon={<i className="spicon icon-sousuo2"></i>}
              style={{marginLeft: 8}}
            >搜索画布</Button>
          }
        </div>
      </div>
    )
  }

  return (
    <PdbPanel className="pdb-search-around" title="" direction="right" canCollapsed={true}>
      <Tabs
        activeKey={activeTab}
        type="editable-card"
        size="small"
        items={(searchAroundOptions || []).map((item: any, index: number) => ({
          label: `探索${index + 1}`,
          key: index.toString(),
          children: renderTabChildren(item, index)
        }))}
        hideAdd
        onChange={activeKey => setActiveTab(activeKey)}
      >
      </Tabs>
    </PdbPanel>
  )
}
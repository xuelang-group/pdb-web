import { Button, Dropdown, Empty, Form, Input, notification, Select, Tabs, Tag, Tooltip } from "antd";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import ExploreFilterContent from "@/pages/AppExplore/ExploreFilterContent";
import { NodeItemData, setCurrentEditModel, setCurrentGraphTab, setGraphDataMap, setGraphLoading, setSearchAround, setToolbarConfig } from "@/reducers/editor";
import { ObjectConfig } from "@/reducers/object";
import { StoreState } from "@/store";
import { defaultNodeColor, getBorderColor, getTextColor, optionLabelMap, optionSymbolMap } from "@/utils/common";
import PdbPanel from "../Panel";
import "./index.less";
import { api, runVertex } from "@/actions/query";
import { ComboConfig, EdgeConfig } from "@antv/g6";
import { convertResultData } from "@/utils/objectGraph";
import { useParams } from "react-router-dom";
import moment from "moment";

let prevActiveTabIndex: string = "", __searchAroundOptions = {};
export default function SearchAround() {
  const childRef = React.createRef(),
    panelRef = React.createRef(),
    dispatch = useDispatch(),
    routerParams = useParams();

  const relationMap = useSelector((state: StoreState) => state.editor.relationMap),
    typeRelationMap = useSelector((state: StoreState) => state.editor.typeRelationMap),
    searchAround = useSelector((state: StoreState) => state.editor.searchAround),
    types = useSelector((state: StoreState) => state.type.data),
    currentGraphTab = useSelector((state: StoreState) => state.editor.currentGraphTab),
    graphDataMap = useSelector((state: StoreState) => state.editor.graphDataMap);

  const [relationSearchValue, setRelationSearchValue] = useState(""),
    [activeTab, setActiveTab] = useState("0"),
    [searchAroundOptions, setSearchAroundOptions] = useState(searchAround.options),
    [siderHidden, setSiderHidden] = useState(false);

  useEffect(() => {
    if (JSON.stringify(searchAroundOptions) !== JSON.stringify(searchAround.options)) {
      setSearchAroundOptions(searchAround.options);
      if (siderHidden) {
        setSiderHidden(false);
        (panelRef.current as any).setSiderHidden();
      }
      if (searchAround.options.length > 0) {
        setActiveTab((searchAround.options.length - 1).toString());
      }
    }
  }, [searchAround.options]);

  useEffect(() => {
    if (JSON.stringify(searchAroundOptions) !== JSON.stringify(searchAround.options)) {
      dispatch(setSearchAround({
        ...searchAround,
        show: searchAroundOptions.length > 0,
        options: JSON.parse(JSON.stringify(searchAroundOptions))
      }));
    }
    __searchAroundOptions = JSON.parse(JSON.stringify(searchAroundOptions));
  }, [searchAroundOptions]);

  useEffect(() => {
    const graph = (window as any).PDB_GRAPH;
    if (!graph) return;
    graph.on("afterlayout", onAfterGraphLayout);
    return () => {
      graph.off("afterlayout", onAfterGraphLayout);
      closeSearchAround();
    }
  }, []);

  function onAfterGraphLayout() {
    const tabIndex = Number(prevActiveTabIndex);
    openSearchAround(tabIndex, __searchAroundOptions);
  }

  function closeSearchAround() {
    const graph = (window as any).PDB_GRAPH;
    if (!graph) return;
    if (prevActiveTabIndex && _.get(searchAroundOptions[Number(prevActiveTabIndex)], 'start')) {
      (searchAroundOptions[Number(prevActiveTabIndex)].start || []).forEach(({ id }: any) => {
        const nodeItem = graph.findById(id);
        if (nodeItem) {
          nodeItem.setState('searchAround', false);
        }
      });
    }
  }

  function openSearchAround(tabIndex: number, searchAroundOpts = searchAroundOptions) {
    const graph = (window as any).PDB_GRAPH;
    if (tabIndex < 0 || !graph || !_.get(searchAroundOpts[tabIndex], 'start')) return;
    const { start } = searchAroundOpts[tabIndex];
    if (start && start.length > 0) {
      start.forEach(({ id }: any) => {
        const nodeItem = graph.findById(id);
        if (nodeItem) {
          nodeItem.setState('searchAround', true);
        }
      });
    }
  }

  useEffect(() => {
    const tabIndex = Number(activeTab);
    if (prevActiveTabIndex === activeTab) return;
    closeSearchAround();
    openSearchAround(tabIndex, searchAroundOptions);
    prevActiveTabIndex = activeTab;
  }, [activeTab]);

  const handleAddRelation = function (item: any) {
    const _searchAroundOptions = JSON.parse(JSON.stringify(searchAroundOptions)),
      opt = _searchAroundOptions[Number(activeTab)];
    opt.options.push({
      id: item.key,
      type: "relation",
      data: _.get(item, "item.props.data")
    });
    setSearchAroundOptions(_searchAroundOptions);
  }

  const renderAddRelationBtn = function (relations: any[], disabled: boolean) {
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
        disabled={disabled}
      >
        <Button
          className="pdb-search-around-relation-add"
          icon={<i className="spicon icon-tianjia2"></i>}
          disabled={disabled}
        >添加关系</Button>
      </Dropdown>
    )
  }

  const changeValue = function (tabIndex: number, index: number, key: string, value: any, _searchAroundOptions = searchAroundOptions) {
    const _searchAroundOptions_ = JSON.parse(JSON.stringify(_searchAroundOptions));
    if (index > -1) {
      _searchAroundOptions_[tabIndex]['options'][index][key] = value;
      setSearchAroundOptions(_searchAroundOptions_);
      if (key === "object" || key === "conditions") {
        handleSearch(tabIndex, false, _searchAroundOptions_);
      }
    } else {
      _searchAroundOptions_[tabIndex][key] = value;
      setSearchAroundOptions(_searchAroundOptions_);
      if (key === "results") {
        handleSearch(tabIndex, false, _searchAroundOptions_);
      }
    }
  }

  const updateGraphData = function (data: any) {
    const graph = (window as any).PDB_GRAPH;
    if (!data || !graph) return;
    const nodes: NodeItemData[] = [], edges: EdgeConfig[] = [], combos: ComboConfig[] = [], edgeIdMap = {}, relationLines = {};
    convertResultData(data, null, nodes, edges, combos, edgeIdMap, relationLines);
    dispatch(setCurrentGraphTab("vertex"));
    dispatch(setToolbarConfig({
      key: "vertex",
      config: { relationLines, showRelationLine: true, showRelationLabel: true }
    }));
    graph.data({ nodes, edges, combos });
    graph.render();
    graph.zoom(1);
    graph.layout();
  }

  const getVertexParams = function (index: number, _searchAroundOptions = searchAroundOptions) {
    const { start, options } = _searchAroundOptions[index] as any;
    const vertex = [];
    vertex.push({
      type: "object",
      id: start.map((val: any) => val.id)
    });
    options.map((opt: { object: string; id: string; conditions: any[]; }) => {
      const { object, id, conditions } = opt;

      let _conditions: any = [];
      (conditions || []).forEach((opt: any, index: number) => {
        const condition = _.get(opt, 'condition.value', ""),
          attrValue = _.get(opt, 'attr.value');
        let keyword = _.get(opt, 'keyword', ""),
          keywordValue = keyword;
        if (_.get(opt, 'attr.data.type') === "datetime") {
          if (typeof keyword === "string") {
            keyword = moment(keyword);
          }
          keyword = keyword.format(_.get(opt, 'attr.data.datetimeFormat', "YYYY-MM-DD"));
          keywordValue = new Date(keyword).getTime();
        }
        let conditionDetail = {};
        if (index > 0) {
          Object.assign(conditionDetail, {
            connectives: opt.operator
          });
        }
        let raw = "";
        if (condition === "has") {
          raw += `HAS ${attrValue}`;
        } else {
          raw += `${opt.isNot ? "NOT " : ""}${attrValue} ${optionSymbolMap[condition] || ""} ${typeof _.get(opt, 'keyword', "") === "string" ? `'${keywordValue}'` : keywordValue}`;
        }
        Object.assign(conditionDetail, {
          raw,
          name: attrValue,
          function: optionSymbolMap[condition] || "",
          value: keywordValue
        });
        _conditions.push(conditionDetail);
      });

      vertex.push({
        type: "relation",
        id,
        conditions: _conditions
      });
      vertex.push({
        type: "object",
        id: object,
        conditions: []
      });
    });
    return vertex;
  }

  const handleSearch = function (index: number, tree: boolean, _searchAroundOptions = searchAroundOptions) {
    const graph = (window as any).PDB_GRAPH;
    if (tree && graph && currentGraphTab === "main") {
      dispatch(setGraphDataMap({
        ...graphDataMap,
        'main': graph.save()
      }));
    }
    const vertex = getVertexParams(index, _searchAroundOptions);
    const graphId = routerParams.id;
    if (tree) {
      dispatch(setGraphLoading(true));
      dispatch(setCurrentEditModel(null));
    }
    runVertex({ graphId, vertex, tree }, (success: boolean, response: any) => {
      if (success) {
        if (tree) {
          updateGraphData(response);
        } else {
          const _searchAroundOptions_ = JSON.parse(JSON.stringify(_searchAroundOptions));
          _searchAroundOptions_[index]['results'] = response;
          setSearchAroundOptions(_searchAroundOptions_);
        }
      } else {
        tree && notification.error({
          message: '搜索失败',
          description: response.message || response.msg
        });
      }
      tree && dispatch(setGraphLoading(false));
    });
  }

  const handleDeleteRelation = function (tabIndex: number, index: number) {
    const _searchAroundOptions = JSON.parse(JSON.stringify(searchAroundOptions)),
      opt = _searchAroundOptions[tabIndex];
    opt.options.splice(index, 1);
    setSearchAroundOptions(_searchAroundOptions);
    changeValue(tabIndex, -1, "results", {}, _searchAroundOptions);
  }

  const renderOptionPanel = function (tabIndex: number, option: any, index: number, objectType: string, relations: any[], results = {}) {
    const relationName = option.id,
      targetTypeMap: any = {};
    relationMap[relationName]['r.type.constraints']['r.binds'].forEach(bind => {
      if (bind.source === objectType) {
        Object.assign(targetTypeMap, { [bind.target]: bind.target });
      }
    });
    let typeExist = false;
    const _types = types.filter(type => {
      if (!typeExist) typeExist = targetTypeMap[type['x.type.name']] === option.object;
      return targetTypeMap[type['x.type.name']];
    });
    if (!typeExist && option.object) {
      changeValue(tabIndex, index, 'object', '');
    }
    return (
      <div className="pdb-search-around-relation">
        <span><i className="spicon icon-jiantou2-xia"></i></span>
        <div className="pdb-search-around-card">
          <i className="spicon icon-shanchu2" onClick={() => handleDeleteRelation(tabIndex, index)}></i>
          <span className="pdb-search-around-card-label">关系</span>
          <Select
            value={relationName}
            options={relations}
            fieldNames={{ value: 'key' }}
            onChange={value => changeValue(tabIndex, index, 'id', value)}
          ></Select>
          <span className="pdb-search-around-card-label">过滤条件</span>
          <ExploreFilterContent
            onRef={childRef}
            originType={{ data: option.data, type: "relation" }}
            onSave={(value: any) => changeValue(tabIndex, index, 'conditions', value)}
            extraContent={(isNew: boolean, editConditionIndex: number, add: any) => (
              <Button
                className="pdb-search-around-condition-add"
                type="dashed"
                icon={<i className="spicon icon-tianjia" />}
                block
                ghost
                onClick={add}
                disabled={isNew || editConditionIndex > -1}
              > 添加条件 </Button>
            )}
          />

          <span className="pdb-search-around-card-label">对象</span>
          <div className="pdb-search-around-object-select">
            <Select
              value={option.object}
              options={_types}
              fieldNames={{ value: 'x.type.name', label: 'x.type.label' }}
              onChange={value => changeValue(tabIndex, index, 'object', value)}
            ></Select>
            {option.object && <span>{_.get(results, option.object, []).length}</span>}
          </div>
        </div>
      </div>
    )
  }


  function onFocusItem(id: string) {
    const graph = (window as any).PDB_GRAPH;
    if (!graph || !id) return;
    graph.focusItem(id, true);
  }
  const renderTabChildren = function (item: any, tabIndex: number) {
    const { start, options, results } = item;
    let sourceType = start[0]['x.type.name'];
    if (options.length > 0) {
      sourceType = _.get(options[options.length - 1], 'object');
    }
    const relations = !sourceType ? [] :
      Array.from(new Set(_.get(_.get(typeRelationMap, sourceType, {}), 'source', [])))
        .map((id: string) => ({ key: relationMap[id]['r.type.name'], label: relationMap[id]['r.type.label'], data: relationMap[id] }));
    const btnDisabled = options.length > 0 && !_.get(options[options.length - 1], 'object');
    return (
      <div className="pdb-search-around-item">
        <Tooltip title="复制接口">
          <i
            className="spicon icon-fuzhi"
            onClick={event => {
              let textarea: HTMLTextAreaElement = document.createElement('textarea');
              textarea.style.position = 'fixed';
              textarea.style.opacity = "0";
              const vertex = getVertexParams(tabIndex);
              const graphId = routerParams.id;
              textarea.value = JSON.stringify({ api: api.vertex, params: { graphId, vertex, tree: true } });
              document.body.appendChild(textarea);
              textarea.select();
              document.execCommand('copy');
              document.body.removeChild(textarea);
            }}
          ></i>
        </Tooltip>
        <div className="pdb-search-around-card pdb-search-around-start">
          <span>起始对象</span>
          <span>
            {start.map((item: ObjectConfig) => {
              const metadata = JSON.parse(item['x.metadata'] || '{}'),
                color = _.get(metadata, 'color', defaultNodeColor.fill);
              return (
                <Tag
                  color={color}
                  style={{ color: getTextColor(color), borderColor: getBorderColor(_.get(metadata, 'borderColor'), color), cursor: "pointer" }}
                  onClick={() => onFocusItem(item["uid"])}
                >{item["x.name"]}</Tag>
              );
            })
            }
          </span>
        </div>
        {options.map((opt: any, index: number) => {
          let objectType = start[0]['x.type.name'];
          if (index > 0) objectType = options[index - 1]['object'];
          const relations = !objectType ? [] :
            Array.from(new Set(_.get(_.get(typeRelationMap, objectType, {}), 'source', [])))
              .map((id: string) => ({ key: relationMap[id]['r.type.name'], label: relationMap[id]['r.type.label'], data: relationMap[id] }));
          return renderOptionPanel(tabIndex, opt, index, objectType, relations, results);
        })}
        <div>
          {renderAddRelationBtn(relations, btnDisabled)}
          {options.length > 0 &&
            <Button
              type="primary"
              icon={<i className="spicon icon-sousuo2"></i>}
              style={{ marginLeft: 8 }}
              onClick={() => handleSearch(tabIndex, true)}
              disabled={btnDisabled}
            >搜索画布</Button>
          }
        </div>
      </div>
    )
  }

  const handleEditTabs = function (data: any, action: string) {
    if (action === "remove") {
      const _searchAroundOptions = JSON.parse(JSON.stringify(searchAroundOptions));
      _searchAroundOptions.splice(Number(data), 1);
      setSearchAroundOptions(_searchAroundOptions);
      setActiveTab("-1");
      if (prevActiveTabIndex === data) {
        closeSearchAround();
        prevActiveTabIndex = "";
      }
    }
  }

  return (
    <PdbPanel onRef={panelRef} className="pdb-search-around" title="" direction="right" canCollapsed={false}>
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
        onEdit={handleEditTabs}
      >
      </Tabs>
      <button className="btn-aside-toggle" onClick={() => {
        setSiderHidden(!siderHidden);
        (panelRef.current as any).setSiderHidden();
        if (!siderHidden) {
          closeSearchAround();
        } else {
          const tabIndex = Number(activeTab);
          openSearchAround(tabIndex);
          prevActiveTabIndex = activeTab;
        }
      }}>
        <i className={`spicon icon-${siderHidden ? "sousuo2" : "shuangjiantou-you"}`}></i>
      </button>
    </PdbPanel>
  )
}
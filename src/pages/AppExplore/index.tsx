import { getQueryResult, runPql, runQuery } from "@/actions/query";
import { NodeItemData, setCurrentGraphTab, setToolbarConfig } from "@/reducers/editor";
import { StoreState } from "@/store";
import { optionSymbolMap } from "@/utils/common";
import { convertResultData } from "@/utils/objectGraph";
import { ComboConfig, EdgeConfig } from "@antv/g6";
import { LoadingOutlined } from '@ant-design/icons';
import { Alert, DatePicker, Empty, message, notification, Popover, RefSelectProps, Select, SelectProps, Spin, Tabs, Tag, Tooltip } from "antd";
import _, { last } from "lodash";
import React from "react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import ExploreFilter from "./ExploreFilter";

import './index.less';

const { TabPane } = Tabs;
type TagRender = SelectProps['tagRender'];


export const typeLabelMap: any = {
  object: "对象实例",
  type: "对象类型",
  relation: "关系类型"
}

export default function AppExplore() {
  const dispatch = useDispatch();
  const routerParams = useParams();
  let searchRefArr: any = useRef<{ [key: number]: HTMLElement }>({});

  const types = useSelector((state: StoreState) => state.type.data),
    relations = useSelector((state: StoreState) => state.relation.data),
    iconMap = useSelector((state: StoreState) => state.editor.iconMap),
    showSearch = useSelector((state: StoreState) => state.editor.showSearch);
  const [exploreExpand, setExploreExpand] = useState(false),
    [dropdownOpen, setDropdownOpen] = useState(false),
    [filterPanelOpenKey, setFilterPanelOpenKey] = useState<any>(null),
    [graphDataMap, setGraphDataMap] = useState<any>({}),
    [filterLoading, setFilterLoading] = useState(false),
    [searchTags, setSearchTags] = useState<(string[])[]>([[]]),
    [searchTagMap, setSearchTagMap] = useState<any>([{}]),
    [searchLoading, setSearchLoading] = useState(false),
    [optionMap, setOptionMap] = useState<any>({}),
    [currentFocusIndex, setCurrentFocusIndex] = useState(-1),
    [currentSearchValue, setSearchValue] = useState<string>(''),
    [selectedSearchTab, setSearchTab] = useState('all');

  useEffect(() => {
    document.addEventListener('keydown', onFocusSearch);

    return () => {
      document.removeEventListener('keydown', onFocusSearch);
    }
  }, []);

  useEffect(() => {
    const searchRef: any = searchRefArr.current[currentFocusIndex];
    if (searchRef) {
      searchRef.focus();
    }
  }, [currentFocusIndex]);

  const onFocusSearch = function (event: any) {
    const searchRef: any = searchRefArr.current[searchTags.length - 1];
    if (searchRef && (event.ctrlKey || event.metaKey) && event.keyCode === 83) {
      event.preventDefault();
      event.stopPropagation();
      searchRef.focus();
    }
  }

  useEffect(() => {
    if (!dropdownOpen) setOptionMap({});
  }, [dropdownOpen]);

  // 选中 option，或 input 的 value 变化时，调用此函数
  const handleChange = (newValue: string[], index: number) => {
    if (searchLoading) {
      message.warning("正在搜索");
      return;
    }
    const newSearchTags = JSON.parse(JSON.stringify(searchTags));
    newSearchTags[index] = newValue;
    setSearchTags(newSearchTags);
    if (_.isEmpty(newValue)) {
      hanldeClear(index);
    } else {
      handleBlur(index, newValue);
    }
  };

  let timeout: ReturnType<typeof setTimeout> | null, currentValue: string;

  // 文本框值变化时回调	
  const handleSearch = function (value: any, index: number) {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    currentValue = value;
    setFilterLoading(true);
    if (value) {
      let prevSearchTagType = "";
      const currentTags = searchTags[index],
        currentTagLen = currentTags.length;

      if (currentTagLen === 5) {
        // 一层最多3个对象类型
        setOptionMap({});
        setFilterLoading(false);
        return;
      }
      if (currentTags.length > 0) {
        const prevSearchTag = _.get(searchTagMap[index], currentTags[currentTags.length - 1]);
        prevSearchTagType = _.get(prevSearchTag, 'type', "");
      }
      const searchTypes = value ? types.filter(val => val['x.type.label'].toLowerCase().indexOf(value.toLowerCase()) > -1) : [];
      const optionMap = {};
      let typeOptions: any[] = [], relationOptions: any[] = [], objectOptions: any[], allOptions: { label: string; key: string; options: any; }[] = [];
      // 对象类型
      if (searchTypes.length > 0 && (prevSearchTagType === 'relation' || _.isEmpty(prevSearchTagType))) {
        typeOptions = searchTypes.map((val, index: number) => ({
          label: val['x.type.label'],
          value: val['x.type.name'] + `-${currentTagLen}`,
          key: val['x.type.name'],
          type: 'type',
          data: val,
          prevSearchTagType
        }));
        const options = typeOptions.length > 3 ? typeOptions.slice(0, 3).concat({
          type: "divider",
          link: "type",
        }) : typeOptions;
        allOptions.push({
          label: "对象类型",
          key: "type",
          options
        });
      }

      // 关系类型 - 关系必须在类型后面
      if (searchTags[index].length > 0 && prevSearchTagType === 'type') {
        const searchRelations = value ? relations.filter(val => val['r.type.label'].toLowerCase().indexOf(value.toLowerCase()) > -1) : []
        if (searchRelations.length > 0) {
          relationOptions = searchRelations.map((val, index: number) => ({
            label: val['r.type.label'],
            value: val['r.type.name'] + `-${currentTagLen}`,
            key: val['r.type.name'],
            type: 'relation',
            data: val
          }));
          const options = relationOptions.length > 3 ? relationOptions.slice(0, 3).concat({
            type: "divider",
            link: "relation",
          }) : relationOptions;
          allOptions.push({
            label: "关系类型",
            key: "relation",
            options
          });
        }
      }

      // if (prevSearchTagType == "" || prevSearchTagType === 'object') {
      //   // 对象实例
      //   runQuery('x.name', { graphId: 50107, match: "allofterms", names: [value] }, (success: boolean, response: any) => {
      //     if (currentValue !== value) return;
      //     if (success && response.length > 0) {
      //       objectOptions = response.map((val: any, index: number) => ({ label: val['x.name'], value: val['uid'], type: 'object', data: val }));
      //       const options = objectOptions.length > 3 ? objectOptions.slice(0, 3).concat({
      //         type: "divider",
      //         link: "object",
      //       }) : objectOptions;
      //       allOptions.push({
      //         label: "对象实例",
      //         key: "object",
      //         options
      //       });
      //     }

      //     Object.assign(optionMap, {
      //       all: allOptions,
      //       type: typeOptions,
      //       relation: relationOptions,
      //       object: objectOptions
      //     });
      //     setOptionMap(optionMap);
      //     setFilterLoading(false);
      //   });
      // } else {
      Object.assign(optionMap, {
        all: allOptions,
        type: typeOptions,
        relation: relationOptions,
      });
      setOptionMap(optionMap);
      setFilterLoading(false);
      // }
    } else {
      setOptionMap({});
      setFilterLoading(false);
    }
    setSearchValue(value);
  }

  // 被选中时调用，参数为选中项的 value (或 key) 值
  const handleSelect = function (value: string, option: any, index: number) {
    if (searchLoading) return;
    const newSearchTagsMap = JSON.parse(JSON.stringify(searchTagMap));
    Object.assign(newSearchTagsMap[index], { [value]: option });
    setSearchTagMap(newSearchTagsMap);
    setDropdownOpen(false);
    setSearchValue("");
  }

  // 取消选中时调用
  const handleDeselect = function (value: string, index: number) {
    if (searchLoading) return;
    const newSearchTagsMap = JSON.parse(JSON.stringify(searchTagMap));
    delete newSearchTagsMap[index][value];
    setSearchTagMap(newSearchTagsMap);
  }

  // 清空搜索
  const hanldeClear = function (index: number, autoFocusIndex: number = -1) {
    let newSearchTags = JSON.parse(JSON.stringify(searchTags)),
      newSearchTagsMap = JSON.parse(JSON.stringify(searchTagMap));
    newSearchTags[index] = [];
    newSearchTagsMap[index] = {};

    if (newSearchTags.length === 0) {
      newSearchTags = [[]];
      newSearchTagsMap = [{}];
    }

    if (autoFocusIndex >= 0) {
      newSearchTags.splice(index, 1);
      newSearchTagsMap.splice(index, 1);
      setCurrentFocusIndex(autoFocusIndex);
    }

    setSearchTagMap(newSearchTagsMap);
    setSearchTags(newSearchTags);

    if (newSearchTags.length === 0 || (newSearchTags.length === 1 && _.isEmpty(newSearchTags[0]))) {
      const graph = (window as any).PDB_GRAPH;
      if (searchLoading) return;
      if (!graph || !graphDataMap['main']) return;
      dispatch(setCurrentGraphTab("main"));
      graph.data(graphDataMap['main']);
      graph.render();
      graph.zoom(1);
    }
  }

  // 搜索框获取到焦点时
  const hanldeFocus = function (index: number) {
    const graph = (window as any).PDB_GRAPH;
    setCurrentFocusIndex(index);
    if ((searchTags.length === 0 || (searchTags.length === 1 && _.isEmpty(searchTags[0]))) && graph) {
      setGraphDataMap({
        'main': graph.save()
      });
    }
  }


  const updateGraphData = function (data: any) {
    const graph = (window as any).PDB_GRAPH;

    if (!data || !graph) return;
    const nodes: NodeItemData[] = [], edges: EdgeConfig[] = [], combos: ComboConfig[] = [], edgeIdMap = {}, relationLines = {};
    convertResultData(data, null, nodes, edges, combos, edgeIdMap, iconMap, relationLines);
    dispatch(setCurrentGraphTab("explore"));
    dispatch(setToolbarConfig({
      key: "explore",
      config: { relationLines }
    }));
    graph.data({ nodes, edges, combos });
    graph.render();
    graph.zoom(1);
  }


  // 失去焦点
  const handleBlur = function (index: number, types?: string[]) {
    // let query = "";
    // searchTags[index].forEach(key => {
    //   if (query !== "") {
    //     query += " ";
    //   }
    //   if (searchTagMap[index][key]) {
    //     query += _.get(searchTagMap[index][key], 'label', "") + _.get(searchTagMap[index][key], 'config.key', "")
    //   }
    // });
    // searchPQL();
  }

  const searchPQL = function (_searchTagMap = searchTagMap) {
    const pql: any = [], relationNames: string[] = [];
    searchTags.forEach((item, index) => {
      if (!_.isEmpty(item)) {
        let pqlItem: any = [];
        item.forEach(val => {
          const detail = _searchTagMap[index][val];
          const type = detail.type === "type" ? "object" : detail.type;
          if (type === "relation") relationNames.push(detail.key);
          let option = {
            type,
            name: detail.label,
            conditionRaw: _.get(detail, "config.key", ""),
            conditions: _.get(detail, "config.conditions", []),
            id: detail.key
          }
          pqlItem.push(option);
        });
        pql.push(pqlItem);
      }
    });
    if (pql.length === 0) return;
    setSearchLoading(true);
    const graphId = routerParams.id;
    runPql({ graphId, pql }, (success: boolean, response: any) => {
      if (success) {
        getQueryResult({ uid: response, relationNames, graphId, depth: 5 }, (success: boolean, response: any) => {
          if (success) {
            updateGraphData(response);
          } else {
            notification.error({
              message: '搜索失败',
              description: response.message || response.msg
            });
          }
          setSearchLoading(false);
        });
      } else {
        setSearchLoading(false);
        notification.error({
          message: '搜索失败',
          description: response.message || response.msg
        });
      }
    });
  }

  const handleDropdownVisibleChange = function (visible: boolean) {
    if (visible && filterPanelOpenKey !== null) {
      setFilterPanelOpenKey(null);
    }
    setDropdownOpen(visible);
    setSearchValue("");
  }


  const showFilterPanel = function (key: string) {
    setDropdownOpen(false);
    setFilterPanelOpenKey(key);
  }

  const dropdownRender = function (originNode: ReactNode, index: number) {
    let tooltip = "", prevTagType = "";
    const _searchTags = searchTags[index];
    if (!_searchTags) return (<></>);
    const lastTag = _searchTags[_searchTags.length - 1];
    if (lastTag && searchTagMap[index][lastTag]) {
      prevTagType = searchTagMap[index][lastTag]["type"];
    }
    if (_searchTags.length === 5) {
      tooltip = "对象类型最多与2个对象类型关联。若想继续搜索对象类型，请回车换行。";
    } else if (prevTagType !== "relation") {
      tooltip = "当前关键词搜索结果包含：关系类型。";
      if (prevTagType === 'type') {
        tooltip += "若想搜索对象类型，请先回车换行。";
      }
    } else {
      tooltip = "当前关键词搜索结果包含：对象类型。";
    }
    return (
      <div className="pdb-explore-dropdown">
        {currentSearchValue &&
          <Tabs activeKey={selectedSearchTab} onChange={activeKey => setSearchTab(activeKey)}>
            <TabPane tab="综合" key="all">
            </TabPane>
            {(optionMap["all"] || []).map((opt: any) => (
              <TabPane tab={opt.label} key={opt.key}></TabPane>
            ))}
          </Tabs>
        }
        {currentSearchValue && originNode}
        <div className="pdb-explore-dropdown-footer">
          <i className="spicon icon-tishi" style={{ fontSize: 12, marginRight: 6 }}></i>
          <span>{tooltip}</span>
        </div>
      </div>
    );
  }

  const optionRender = function (option: any, info: { index: number }) {
    if (!option.label) {
      const link = _.get(option, 'data.link', ''),
        linkLabel = _.get(typeLabelMap, link, '');
      return (
        <span
          style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)', display: 'flex', alignItems: 'center' }}
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            setSearchTab(link);
          }}
        >
          <i className="spicon icon-sousuo2" style={{ marginRight: 3 }}></i>
          <span style={{ flex: 1 }}>在 <strong>{linkLabel}</strong> 中查找更多</span>
          <span><i className="spicon icon-jiantou-you1"></i></span>
        </span>)
    }
    const { label, data, value } = option;
    const optionType = _.get(data, "type"),
      findIndex = label.toLowerCase().indexOf(currentSearchValue.toLowerCase()),
      prevLabel = label.slice(0, findIndex),
      centerLabel = label.slice(findIndex, findIndex + currentSearchValue.length),
      lastLabel = label.slice(findIndex + currentSearchValue.length);
    return (
      <>
        <span className="pdb-explore-dropdown-label">
          <span>{prevLabel}</span>
          <span style={{ color: 'red' }}>{centerLabel}</span>
          <span>{lastLabel}</span>
        </span>
        {optionType && <i className="spicon icon-shaixuan" onClick={() => showFilterPanel(value)}></i>}
      </>
    )
  }

  const tagRender = function (props: any, index: number) {
    const { value, onClose } = props;
    let color = "default", icon = "";
    if (value === ",") {
      return (<span style={{ margin: "0 5px", fontSize: 16 }}>,</span>);
    }
    const tagType = _.get(searchTagMap[index][value], 'type'),
      label = _.get(searchTagMap[index][value], 'label'),
      filterLabel = _.get(searchTagMap[index][value], 'config.label');
    if (tagType === 'type') {
      color = "processing";
      icon = "iconfont icon-duixiangleixing";
    } else if (tagType === 'relation') {
      color = "gold";
      icon = "iconfont icon-guanxileixing";
    }
    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const tagItem = (
      <Tag
        className="pdb-explore-tag"
        color={color}
        icon={<i className={icon} style={{ fontSize: '1.2rem', marginRight: 3 }}></i>}
        onMouseDown={onPreventMouseDown}
        closable={true}
        onClick={() => showFilterPanel(value)}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        <span style={{ display: "inline-flex", maxWidth: "15rem" }}>
          <span>{label}</span>
          {!_.isEmpty(filterLabel) && <span> (</span>}
          {!_.isEmpty(filterLabel) && <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{filterLabel}</span>}
          {!_.isEmpty(filterLabel) && <span>)</span>}
        </span>
        {/* {tagType && <i className="spicon icon-shaixuan" onClick={showFilterPanel}></i>} */}
      </Tag>
    );
    return tagItem;
  }

  return (
    <div id="pdb-explore" className={`pdb-explore pdb-explore-${exploreExpand ? 'expand' : 'collapse'}`}>
      {showSearch &&
        <div className="pdb-explore-search-group">
          {searchTags.map((item, index) => (
            <Popover
              open={currentFocusIndex === index && filterPanelOpenKey !== null && !_.isEmpty(_.get(searchTagMap[index], filterPanelOpenKey))}
              rootClassName="pdb-explore-filter-popover"
              placement="bottomLeft"
              content={
                <ExploreFilter
                  originType={_.get(searchTagMap[index], filterPanelOpenKey)}
                  close={() => {
                    setFilterPanelOpenKey(null);
                  }}
                  saveConfig={(config: any) => {
                    const newSearchTagsMap = JSON.parse(JSON.stringify(searchTagMap));
                    Object.assign(newSearchTagsMap[index], { [filterPanelOpenKey]: { ...searchTagMap[index][filterPanelOpenKey], config } });
                    setSearchTagMap(newSearchTagsMap);
                    setFilterPanelOpenKey(null);
                    // searchPQL(newSearchTagsMap);
                  }}
                />
              }
              arrow={false}
              destroyTooltipOnHide
            >
              <Select
                ref={r => { searchRefArr.current[index] = r; }}
                className="pdb-explore-search"
                value={searchTags[index]}
                searchValue={currentFocusIndex === index ? currentSearchValue : ""}
                placeholder={index > 0 ? "" : "输入关键词搜索（Ctrl + S）"}
                mode="multiple"
                showSearch
                loading={filterLoading}
                suffixIcon={null}
                filterOption={false}
                options={(optionMap[selectedSearchTab] || []).map((d: any) => d)}
                notFoundContent={<Empty description="暂无相关结果" />}
                open={currentFocusIndex === index && dropdownOpen}
                // allowClear
                disabled={searchLoading}
                autoFocus={index > 0}
                getPopupContainer={(() => document.getElementById("pdb-explore") || document.body) as any}
                dropdownRender={(originNode) => dropdownRender(originNode, index)}
                popupClassName="pdb-explore-search-dropdown"
                optionRender={optionRender}
                tagRender={(props) => tagRender(props, index)}
                onChange={value => handleChange(value, index)}
                onSearch={value => handleSearch(value, index)}
                onSelect={(value, option) => handleSelect(value, option, index)}
                onDeselect={value => handleDeselect(value, index)}
                onDropdownVisibleChange={handleDropdownVisibleChange}
                onBlur={() => handleBlur(index)}
                onFocus={() => hanldeFocus(index)}
                onKeyDown={(event) => {
                  if (event.keyCode === 8 && _.isEmpty(currentSearchValue) && searchTags[currentFocusIndex].length === 0 && currentFocusIndex > 0) {
                    hanldeClear(currentFocusIndex, currentFocusIndex - 1);
                  } else if (event.keyCode === 13 && _.isEmpty(optionMap["all"]) && searchTags[searchTags.length - 1].length > 0) {
                    setDropdownOpen(false);
                    setSearchTagMap([...searchTagMap, {}]);
                    setSearchTags([...searchTags, []]);
                    setCurrentFocusIndex(searchTags.length);
                  }
                }}
                onClear={() => hanldeClear(index)}
              />
            </Popover>
          ))}
        </div>
      }
      {!searchLoading &&
        <i
          className="spicon icon-sousuo2"
          onClick={event => {
            event.stopPropagation();
            searchPQL();
          }}
        ></i>
      }
      <i
        className={`spicon ${exploreExpand ? "icon-shouqi" : "icon-open_detail"}`}
        onClick={event => {
          event.stopPropagation();
          setExploreExpand(!exploreExpand);
        }}
      ></i>
    </div>
  )
}
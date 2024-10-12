import { ComboConfig, EdgeConfig } from "@antv/g6";
import { EnterOutlined } from '@ant-design/icons';
import { Alert, Divider, Empty, message, notification, Popover, Segmented, Select, Tabs, Tag, Tooltip } from "antd";
import _, { last } from "lodash";
import React, { useCallback } from "react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";

import { RelationConfig } from "@/reducers/relation";
import { AttrConfig, TypeConfig } from "@/reducers/type";
import { NodeItemData, setCurrentEditModel, setCurrentGraphTab, setGraphDataMap, setGraphLoading, setToolbarConfig } from "@/reducers/editor";
import { api, getQueryResult, runPql } from "@/actions/query";
import { StoreState } from "@/store";
import { convertResultData } from "@/utils/objectGraph";
import ExploreFilter from "./ExploreFilter";
import NewRelation from "./NewRelation";

import './index.less';
import ExportApi from "@/components/ExportApi";
import { initialParams, setQueryParams } from "@/reducers/query";

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
    relationMap = useSelector((state: StoreState) => state.editor.relationMap),
    typeRelationMap = useSelector((state: StoreState) => state.editor.typeRelationMap),
    showSearch = useSelector((state: StoreState) => state.editor.showSearch),
    graphDataMap = useSelector((state: StoreState) => state.editor.graphDataMap),
    currentGraphTab = useSelector((state: StoreState) => state.editor.currentGraphTab);
  const [exploreExpand, setExploreExpand] = useState(false),
    [dropdownOpen, setDropdownOpen] = useState(false),
    [filterPanelOpenKey, setFilterPanelOpenKey] = useState<any>(null),
    [filterLoading, setFilterLoading] = useState(false),
    [searchTags, setSearchTags] = useState<(string[])[]>([[]]),
    [searchTagMap, setSearchTagMap] = useState<any>([{}]),
    [searchLoading, setSearchLoading] = useState(false),
    [optionMap, setOptionMap] = useState<any>({}),
    [currentFocusIndex, setCurrentFocusIndex] = useState(-1),
    [currentSearchValue, setSearchValue] = useState<string>(''),
    [searchTabs, setSearchTabs] = useState('all'), // 下拉框里显示的tab有哪些
    [currentSelectDropdownTab, setSelectDropdownTab] = useState('type');

  useEffect(() => {
    document.addEventListener('keydown', onFocusSearch);

    return () => {
      document.removeEventListener('keydown', onFocusSearch);
    }
  }, []);
  useEffect(() => {
    handleSearch(currentSearchValue, currentFocusIndex);
  }, [searchTags]);

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
    const newValLen = newValue.length;

    if (newValLen > 0) {
      if (
        newValue[newValLen - 1] === "__ENTER__" ||
        newValue[newValLen - 1] === "__TEMPORARY_RELATION__"
      ) return;

      if (newValue[newValLen - 1].startsWith("__TEMPORARY_RELATION__")) {
        let removeTag = "";
        setSearchTags((prevTags: any) => {
          const newTags = JSON.parse(JSON.stringify(prevTags));
          const newVal = JSON.parse(JSON.stringify(newValue));
          removeTag = newVal.pop();
          newTags[index] = newVal;
          return newTags;
        });
        setSearchTagMap((prevMap: any) => {
          const newMap = JSON.parse(JSON.stringify(prevMap));
          if (removeTag) delete newMap[index][removeTag];
          return newMap;
        });
        return;
      }
    }

    let _tags: string[] = [];
    // for (let i = 0; i < newValLen; i++) {
    //   if (i === 0 && newValue[0].split(".")[0] !== "Type") break;      // 首个tag必须为对象类型
    //   _tags.push(newValue[i]);
    //   // “当前tag为对象类型且下一个tag也为对象类型，当前tag为关系类型且下一个tag也为关系类型”这两种情况数据不符合条件。
    //   //必须对象类型-关系类型或 关系类型-对象类型
    //   if (i < newValLen - 1 && (newValue[i].split(".")[0] === "Type" && newValue[i + 1].split(".")[0] === "Type"
    //     || newValue[i].split(".")[0] !== "Type" && newValue[i + 1].split(".")[0] !== "Type")) {
    //     break;
    //   }
    // }

    // 删除操作
    if (newValLen < searchTags[index].length) {
      for (let i = 0; i < newValLen; i++) {
        // 当前两个tag都为对象类型，且不满足“位置在最后两个或者在倒数第三个和倒数第二个且倒数第一个为关系类型”时，不满足当前条件
        // 当前两个tag都不为对象类型，满足当前条件
        if (i < newValLen - 1 && (newValue[i].split(".")[0] !== "Type" && newValue[i + 1].split(".")[0] !== "Type" || (
          newValue[i].split(".")[0] === "Type" && newValue[i + 1].split(".")[0] === "Type"))) {
          return;
        }
      }
    }

    // 首个tag必须为对象类型
    if (newValLen > 0 && newValue[0].split(".")[0] === "Type") {
      _tags = JSON.parse(JSON.stringify(newValue));
    } else {
      return;
    }

    if (newValLen > 1 && _tags[newValLen - 1].split(".")[0] === "Type" && _tags[newValLen - 2].split(".")[0] === "Type") {
      // 判断最后两个类型是否为对象类型，如果是，则更新最后一个类型的prevSearchTagType
      setSearchTagMap((prevMap: any) => {
        const newMap = JSON.parse(JSON.stringify(prevMap));
        const lastTag = _tags[newValLen - 1];
        if (newMap[index] && newMap[index][lastTag]) {
          newMap[index][lastTag] = {
            ...newMap[index][lastTag],
            prevSearchTagType: 'type',
          };
        }
        return newMap;
      });
      setDropdownOpen(true);
    } else if (newValLen > 2 && _tags[newValLen - 1].split(".")[0] !== "Type" &&
      _tags[newValLen - 2].split(".")[0] === "Type" && _tags[newValLen - 3].split(".")[0] === "Type"
    ) {
      // 最后一个tag为关系时，判断前两个类型是否为对象类型，如果是，则将其关系插入两个对象类型中
      const lastRelation = _tags.pop();
      lastRelation && _tags.splice(newValLen - 2, 0, lastRelation);
      setSearchTagMap((prevMap: any) => {
        const newMap = JSON.parse(JSON.stringify(prevMap));
        const lastTag = _tags[newValLen - 1];
        if (newMap[index] && newMap[index][lastTag]) {
          newMap[index][lastTag] = {
            ...newMap[index][lastTag],
            prevSearchTagType: 'relation',
          };
        }
        return newMap;
      });
    }
    const newSearchTags = JSON.parse(JSON.stringify(searchTags));
    newSearchTags[index] = _tags;
    setSearchTags(newSearchTags);
    if (_.isEmpty(newValue)) {
      handleClear(index);
    }
  };

  // 文本框值变化时回调	
  const handleSearch = function (value: any, index: number) {
    if (index < 0 || !searchTags[index]) return;
    setFilterLoading(true);

    let prevSearchTag = null, prevSearchTagType = ""; // 前一个搜索tag信息
    const currentTags = searchTags[index],
      currentTagLen = currentTags.length;

    if (currentTagLen === 5) {
      // 一层最多3个对象类型
      setOptionMap({});
      setFilterLoading(false);
      return;
    }
    if (currentTags.length > 0) {
      prevSearchTag = _.get(searchTagMap[index], currentTags[currentTags.length - 1]);
      prevSearchTagType = _.get(prevSearchTag, 'type', "");
    }
    const searchTypes = value ? types.filter(val => val['x.type.label'].toLowerCase().indexOf(value.toLowerCase()) > -1) : types;
    const optionMap = {};
    let typeOptions: any[] = [], relationOptions: any[] = [];
    // const enterOption = {
    //   label: "回车换行",
    //   value: "__ENTER__"
    // };

    if (searchTypes.length > 0) {
      if (prevSearchTagType === 'relation') {
        // 前一个tag是关系类型，当前下拉框只包含对象类型列表typeOptions
        let _types: TypeConfig[] = JSON.parse(JSON.stringify(searchTypes));
        if (prevSearchTagType === 'relation') {
          // typeOptions.push(enterOption);
          const relationName = prevSearchTag['key'],
            relationsIsReverse = prevSearchTag['isReverse'], // isReverse: false，正向关系；true，反向关系。
            sourceType = _.get(_.get(searchTagMap[index], currentTags[currentTags.length - 2]), 'key', ""),
            targetTypeMap: any = {};

          if (sourceType && relationName !== "~e_x_parent" && relationName !== "e_x_parent" && !relationName.startsWith("__TEMPORARY_RELATION__")) {
            relationMap[relationName]['r.type.constraints']['r.binds'].forEach(bind => {
              if (!relationsIsReverse && bind.source === sourceType) {
                Object.assign(targetTypeMap, { [bind.target]: bind.target });
              } else if (relationsIsReverse && bind.target === sourceType) {
                Object.assign(targetTypeMap, { [bind.source]: bind.source });
              }
            });
            _types = _types.filter(type => targetTypeMap[type['x.type.name']]);
          }
        }
        typeOptions = typeOptions.concat(_types.map(val => ({
          label: val['x.type.label'],
          value: val['x.type.name'] + `-${currentTagLen}`,
          key: val['x.type.name'],
          type: 'type',
          data: val,
          prevSearchTagType
        })));
        setSearchTabs('type');
        setSelectDropdownTab('type');
      } else if (_.isEmpty(prevSearchTagType) || prevSearchTagType === 'type') {
        // 当前tag为第一个或者前一个tag为对象类型，当前下拉框包含对象类型列表和关系类型列表typeOptions + relationOptions
        // typeOptions为全量对象类型列表
        const searchTypes = value ? types.filter(val => val['x.type.label'].toLowerCase().indexOf(value.toLowerCase()) > -1) : types;
        typeOptions = searchTypes.map(val => ({
          label: val['x.type.label'],
          value: val['x.type.name'] + `-${currentTagLen}`,
          key: val['x.type.name'],
          type: 'type',
          data: val,
          prevSearchTagType
        }));

        // relationOptions根据前一个tag对象类型进行关系正向反向过滤
        if (!_.isEmpty(prevSearchTagType)) {
          const sourceRelations = _.get(_.get(typeRelationMap, prevSearchTag['key'], {}), 'source', []),
            targetRelations = _.get(_.get(typeRelationMap, prevSearchTag['key'], {}), 'target', []);
          // 正向关系数据
          const positiveRelations = Array.from(new Set(sourceRelations))
            .map((id: string) => relationMap[id]);
          const positiveSearchRelations = value ? positiveRelations.filter((val: RelationConfig) => val['r.type.label'].toLowerCase().indexOf(value.toLowerCase()) > -1) : positiveRelations;

          // 反向关系数据
          const reverseRelations = Array.from(new Set(targetRelations))
            .map((id: string) => relationMap[id]);
          const reverseSearchRelations = value ? reverseRelations.filter((val: RelationConfig) => val['r.type.label'].toLowerCase().indexOf(value.toLowerCase()) > -1) : reverseRelations;

          // relationOptions = [enterOption];
          if ("所属父级".indexOf(value) > -1) {
            relationOptions.push({
              label: "所属父级",
              value: "e_x_parent" + `-${currentTagLen}`,
              key: "e_x_parent",
              type: 'relation'
            });
          }
          if ("包含子级".indexOf(value) > -1) {
            relationOptions.push({
              label: "包含子级",
              value: "~e_x_parent" + `-${currentTagLen}`,
              key: "~e_x_parent",
              type: 'relation'
            });
          }
          if (positiveSearchRelations.length > 0) {
            if (relationOptions.length > 1) {
              relationOptions.push({
                type: "divider",
                disabled: true
              });
            }
            relationOptions.push({
              label: "正向关系",
              options: positiveSearchRelations.map((val: RelationConfig, index: number) => ({
                label: val['r.type.label'],
                value: val['r.type.name'] + `-${currentTagLen}`,
                key: val['r.type.name'],
                type: 'relation',
                isReverse: false,
                data: val
              }))
            });
          }

          if (reverseSearchRelations.length > 0) {
            if (relationOptions.length > 1) {
              relationOptions.push({
                type: "divider",
                disabled: true
              });
            }
            relationOptions.push({
              label: "反向关系",
              options: reverseSearchRelations.map((val: RelationConfig, index: number) => ({
                label: "~" + val['r.type.label'],
                value: val['r.type.name'] + `-${currentTagLen}`,
                key: val['r.type.name'],
                type: 'relation',
                isReverse: true,
                data: val
              }))
            });
          }
        }

        if (currentTags.length === 0) {
          setSearchTabs('type');
          setSelectDropdownTab('type');
        } else if (currentTags.length > 1) {
          // 前一个的前一个tag的类型
          const priorSearchTag = _.get(searchTagMap[index], currentTags[currentTags.length - 2]),
            priorSearchTagType = _.get(priorSearchTag, 'type', "");
          //如果都为对象类型，下拉框选择只显示关系类型列表
          if (priorSearchTag && priorSearchTagType === 'type' && priorSearchTagType === prevSearchTagType) {
            setSearchTabs('relation');
            setSelectDropdownTab('relation');
          } else {
            setSearchTabs('all');
            setSelectDropdownTab('relation');
          }
        } else {
          setSearchTabs('all');
          setSelectDropdownTab('relation');
        }
      }
    }

    relationOptions = relationOptions.concat([{
      type: "divider",
      disabled: true
    }, {
      value: "__TEMPORARY_RELATION__"
    }]);

    Object.assign(optionMap, {
      type: typeOptions,
      relation: relationOptions,
    });

    setOptionMap(optionMap);
    setFilterLoading(false);
    setSearchValue(value);
  }

  // 被选中时调用，参数为选中项的 value (或 key) 值
  const handleSelect = function (value: string, option: any, index: number) {
    if (searchLoading) return;
    // if (value === "__ENTER__") {
    //   setSearchTagMap([...searchTagMap, {}]);
    //   setSearchTags([...searchTags, []]);
    //   setCurrentFocusIndex(searchTags.length);
    //   return;
    // }
    if (value === "__TEMPORARY_RELATION__") {
      setDropdownOpen(false);
      setFilterPanelOpenKey("__TEMPORARY_RELATION__");
      return;
    }
    setSearchTagMap((prevMap: any) => {
      const newMap = JSON.parse(JSON.stringify(prevMap));
      newMap[index] = { ...newMap[index], [value]: option };

      const { type, data } = option;
      if (type === 'type' && data['x.type.attrs']) {
        const csv: { typeId: any; attrId: string; attrName: string; attrType: string; }[] = [],
          typeId = data['x.type.name'],
          typeLabel = data['x.type.label'];
        data['x.type.attrs'].forEach(function ({ display, name, type }: AttrConfig) {
          csv.push({
            typeId: typeId,
            attrId: name,
            attrName: display + '_' + typeLabel,
            attrType: type
          });
        });
        Object.assign(newMap[index][value], { csv });
      }

      return newMap;
    });
    setSearchValue("");
  }

  // 取消选中时调用
  const handleDeselect = function (value: string, index: number) {
    if (searchLoading) return;
    setFilterPanelOpenKey(null);
    setSearchTags((prevTags: any) => {
      const newTags = JSON.parse(JSON.stringify(prevTags));
      const tags = [];
      for (let i = 0; i < prevTags[index].length; i++) {
        if (prevTags[index][i] === value) break;
        tags.push(prevTags[index][i]);
      }
      if (tags.length > 0 && tags[tags.length - 1].startsWith("__TEMPORARY_RELATION__")) tags.pop();
      newTags[index] = tags;
      return newTags;
    });

    setSearchTagMap((prevMap: any) => {
      const newMap = JSON.parse(JSON.stringify(prevMap));
      delete newMap[index][value];
      return newMap;
    });
  }

  // 清空搜索
  const handleClear = function (index: number, autoFocusIndex: number = -1) {
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
    dispatch(setQueryParams(initialParams));


    if (newSearchTags.length === 0 || (newSearchTags.length === 1 && _.isEmpty(newSearchTags[0]))) {
      const graph = (window as any).PDB_GRAPH;
      if (searchLoading) return;
      if (!graph || !graphDataMap['main']) return;
      dispatch(setCurrentGraphTab("main"));
      graph.data(JSON.parse(JSON.stringify(graphDataMap['main'])));
      graph.render();
      graph.zoom(1);
    }
  }

  // 搜索框获取到焦点时
  const handleFocus = function (index: number) {
    const graph = (window as any).PDB_GRAPH;
    setCurrentFocusIndex(index);
    if ((searchTags.length === 0 || (searchTags.length === 1 && _.isEmpty(searchTags[0]))) && graph && currentGraphTab === "main") {
      dispatch(setGraphDataMap({
        ...graphDataMap,
        'main': graph.save()
      }));
    }
  }

  const updateGraphData = function (data: any) {
    const graph = (window as any).PDB_GRAPH;

    if (!data || !graph) return;
    const nodes: NodeItemData[] = [], edges: EdgeConfig[] = [], combos: ComboConfig[] = [], edgeIdMap = {}, relationLines = {};
    convertResultData(data, null, nodes, edges, combos, edgeIdMap, relationLines);
    dispatch(setCurrentGraphTab("explore"));
    dispatch(setToolbarConfig({
      key: "explore",
      config: { relationLines, showRelationLine: true, showRelationLabel: true }
    }));
    graph.data({ nodes, edges, combos });
    graph.render();
    graph.zoom(1);
  }

  const getPQL = function (_searchTagMap = searchTagMap) {
    const pql: any = [], relationNames: string[] = [], csv: any = [];
    searchTags.forEach((item, index) => {
      if (!_.isEmpty(item)) {
        let pqlItem: any[] = [], csvItem: any[] = [];
        item.forEach(val => {
          const detail = _searchTagMap[index][val];
          let name = _.get(detail, 'label', '');
          if (detail.isReverse) {
            name = name.slice(1);
          }
          let option = {
            name
          };
          if (detail.key === "e_x_parent" || detail.key === "~e_x_parent") {
            Object.assign(option, {
              type: "relation",
              id: detail.key,
            });
          } else {
            const type = detail.type === "type" ? "object" : detail.type;
            if (type === "relation") relationNames.push(detail.key.replace('.', '_'));
            Object.assign(option, {
              type,
              conditionRaw: _.get(detail, "config.key", ""),
              conditions: _.get(detail, "config.conditions", []),
              id: (detail.isReverse ? "~" : "") + detail.key
            });
            const objectCsvOpt = _.get(detail, 'csv');
            if (type === "object" && objectCsvOpt) {
              csvItem = csvItem.concat(objectCsvOpt);
            }
          }
          pqlItem.push(option);
        });
        pql.push(pqlItem);
        csv.push(csvItem);
      }
    });
    return { pql, csv, relationNames };
  }

  const searchPQL = function (_searchTagMap = searchTagMap) {
    const { pql, relationNames, csv } = getPQL(_searchTagMap);
    if (pql.length === 0) return;
    setSearchLoading(true);
    dispatch(setGraphLoading(true));
    dispatch(setCurrentEditModel(null));
    const graphId = routerParams.id || '';
    dispatch(setQueryParams({
      graphId, 
      pql, 
      csv: {
        header: csv
      }
    }));
    runPql({ graphId, pql }, (success: boolean, response: any) => {
      if (success) {
        getQueryResult({ vid: response, relationNames, graphId, depth: 5 }, (success: boolean, response: any) => {
          if (success) {
            updateGraphData(response);
          } else {
            notification.error({
              message: '搜索失败',
              description: response.message || response.msg
            });
          }
          setSearchLoading(false);
          dispatch(setGraphLoading(false));
        });
      } else {
        setSearchLoading(false);
        dispatch(setGraphLoading(false));
        notification.error({
          message: '搜索失败',
          description: response.message || response.msg
        });
      }
    });
  }

  const removeLastTypeTag = function (index: number) {
    // 判断当前搜索tags最后两项类型是否都是对象类型/关系类型，如果是的话，删除最后一项tag。
    setSearchTags((prevTags: any) => {
      const currentSearchTags = JSON.parse(JSON.stringify(prevTags[index])),
        currentSearchTagLen = currentSearchTags.length;
      const newSearchTags = JSON.parse(JSON.stringify(prevTags));
      if (currentSearchTagLen > 1 && (currentSearchTags[currentSearchTagLen - 2].split(".")[0] === "Type" && currentSearchTags[currentSearchTagLen - 1].split(".")[0] === "Type"
        || currentSearchTags[currentSearchTagLen - 2].split(".")[0] !== "Type" && currentSearchTags[currentSearchTagLen - 1].split(".")[0] !== "Type")) {
        currentSearchTags.pop();
        newSearchTags[index] = currentSearchTags;
      }
      return newSearchTags
    });
  }

  const handleDropdownVisibleChange = function (visible: boolean, index: number) {
    if (visible) {
      filterPanelOpenKey !== null && setFilterPanelOpenKey(null);
      handleSearch(currentSearchValue, index);
    }

    if (visible === false) {
      // 关系下拉框弹窗时，判断当前搜索tags最后两项类型是否都是对象类型/关系类型，如果是的话，删除最后一项tag。
      removeLastTypeTag(index);
    }

    setDropdownOpen(visible);
    setSearchValue("");
  }


  const showFilterPanel = function (key: string) {
    setDropdownOpen(false);
    setFilterPanelOpenKey(key);
  }

  const dropdownRender = function (originNode: ReactNode, index: number) {
    let tooltip = "";
    const _searchTags = searchTags[index];
    if (!_searchTags) return (<></>);
    if (_searchTags.length === 5) {
      tooltip = "对象类型最多与2个对象类型关联。";
    } else if (searchTabs === 'relation') {
      tooltip = "两个对象类型之间必须以关系类型连接，请选择关系类型。"
    }
    return (
      <div className="pdb-explore-dropdown">
        {tooltip &&
          <Alert
            message={tooltip}
            type="warning"
            showIcon
          />
        }
        {searchTabs === 'all' &&
          <Segmented
            value={currentSelectDropdownTab}
            options={[{
              label: '关系',
              value: 'relation'
            }, {
              label: '对象',
              value: 'type'
            }]}
            onChange={activeKey => { setSelectDropdownTab(activeKey); }}
            block
          />
        }
        {originNode}
      </div>
    );
  }

  const optionRender = function (option: any, info: { index: number }) {
    if (option.value === "__ENTER__") {
      return (
        <span className="pdb-explore-dropdown-enter">
          <span style={{ flex: 1 }}>回车换行</span>
          <EnterOutlined />
        </span>
      );
    }

    if (option.value === "__TEMPORARY_RELATION__") {
      return (
        <span className="pdb-explore-dropdown-add">
          <i className="spicon icon-add"></i>
          <span>使用临时关系</span>
        </span>
      );
    }

    if (_.get(option, "data.type") === "divider") {
      return (
        <Divider />
      );
    }

    const { label, data, value, key } = option;
    const _label = label.toString();
    const optionType = _.get(data, "type"),
      findIndex = _label.toLowerCase().indexOf(currentSearchValue.toLowerCase()),
      prevLabel = _label.slice(0, findIndex),
      centerLabel = _label.slice(findIndex, findIndex + currentSearchValue.length),
      lastLabel = _label.slice(findIndex + currentSearchValue.length);
    return (
      <>
        {key.startsWith("Relation") && <i className={`iconfont icon-${data.isReverse ? "fanxiangguanxi" : "zhengxiangguanxi"}`}></i>}
        <span className="pdb-explore-dropdown-label">
          <span>{prevLabel}</span>
          <span style={{ color: 'red' }}>{centerLabel}</span>
          <span>{lastLabel}</span>
        </span>
        {optionType && key !== "~e_x_parent" && key !== "e_x_parent" && <i className="spicon icon-shaixuan" onClick={() => showFilterPanel(value)}></i>}
      </>
    )
  }

  // 保存临时关系
  const handleSaveTemporayRelation = function (index: number, values: any, currTargetTag: any, prevTargetTag: any) {
    const tags = searchTags[index], tagsLen = tags.length;
    const newRelationId = values.key || "__TEMPORARY_RELATION__" + (tagsLen - 1);
    /**
     * 临时关系保存的搜索框数据的两种情况
     * 1. 对象类型 - 临时关系：prevTargetTag为空，需要存目标对象数据和临时关系数据
     * 2. 对象类型 - 对象类型 - 临时关系：需要保存临时关系数据，修改第二个对象类型的prevSearchTagType为relation，并在searchTags中将数据位置更改为"对象类型 - 临时关系 - 对象关系"
     */
    setSearchTagMap((prevMap: any) => {
      const newTagMap = JSON.parse(JSON.stringify(prevMap));
      const value = {
        ...values,
        value: newRelationId,
        key: newRelationId,
        type: 'relation',
        isReverse: false
      };
      Object.assign(newTagMap[index], { [newRelationId]: value });

      if (_.isEmpty(prevTargetTag)) {
        Object.assign(newTagMap[index], { [currTargetTag.value]: currTargetTag });
      }

      if (filterPanelOpenKey === "__TEMPORARY_RELATION__") {
        const lastTagId = tags[tagsLen - 1];
        Object.assign(newTagMap[index][lastTagId], { prevSearchTagType: 'relation' });
      }
      return newTagMap;
    });
    if (filterPanelOpenKey === "__TEMPORARY_RELATION__") {
      setSearchTags((prevTags: any) => {
        const newTags = JSON.parse(JSON.stringify(prevTags));
        if (_.isEmpty(prevTargetTag)) {
          newTags[index] = newTags[index].concat([newRelationId, currTargetTag.value])
        } else {
          newTags[index].splice(newTags[index].length - 1, 0, newRelationId);
        }
        return newTags;
      });
    }
  }

  const tagRender = function (props: any, index: number) {
    const { value, onClose } = props;
    let color = "default", icon = "";
    if (value === ",") {
      return (<span style={{ margin: "0 5px", fontSize: 16 }}>,</span>);
    }
    const currentSearchTag = searchTagMap[index][value],
      tagType = _.get(currentSearchTag, 'type'),
      key = _.get(currentSearchTag, 'key'),
      filterLabel = _.get(currentSearchTag, 'config.label'),
      prevTagType = _.get(currentSearchTag, 'prevSearchTagType');

    let label = _.get(currentSearchTag, 'label'), closable = true;

    if (tagType === 'type') {
      color = "processing";
      icon = "iconfont icon-duixiangleixing";
    } else if (tagType === 'relation') {
      color = "gold";
      icon = `iconfont icon-${currentSearchTag.isReverse ? "fanxiangguanxi" : "zhengxiangguanxi"}`;
    }
    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
    };

    if (value === "__TEMPORARY_RELATION__") {
      label = "临时关系";
      color = "gold";
      icon = "iconfont icon-zhengxiangguanxi";
      closable = false;
    }

    if (prevTagType === tagType) {
      closable = false;
    }
    const tagItem = (
      <Tag
        className={"pdb-explore-tag" + ((prevTagType === tagType || key.startsWith("__TEMPORARY_RELATION__")) ? ' pdb-explore-tag-dashed' : '')}
        color={color}
        icon={<i className={icon} style={{ fontSize: '1.2rem', marginRight: 3 }}></i>}
        onMouseDown={onPreventMouseDown}
        closable={closable}
        onClick={() => showFilterPanel(value)}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        <span style={{ display: "inline-flex" }}>
          <span style={{ textOverflow: "ellipsis", maxWidth: 120, overflow: "hidden" }}>{label}</span>
          {!_.isEmpty(filterLabel) && <span> (</span>}
          {!_.isEmpty(filterLabel) && <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>{filterLabel}</span>}
          {!_.isEmpty(filterLabel) && <span>)</span>}
        </span>
      </Tag>
    );
    return tagItem;
  }

  const handleClearSearch = function (event: any) {
    event.stopPropagation();
    setSearchTags([[]]);
    setSearchTagMap([{}]);
    setCurrentFocusIndex(0);
    const graph = (window as any).PDB_GRAPH;
    if (!graph || !graphDataMap['main']) return;
    dispatch(setCurrentGraphTab("main"));
    graph.data(JSON.parse(JSON.stringify(graphDataMap['main'])));
    graph.render();
    graph.zoom(1);
    dispatch(setQueryParams(initialParams));
  }

  return (
    <div id="pdb-explore" className={`pdb-explore pdb-explore-${exploreExpand ? 'expand' : 'collapse'}`}>
      {showSearch &&
        <div className="pdb-explore-search-group">
          {searchTags.map((item, index) => (
            <Popover
              open={currentFocusIndex === index && filterPanelOpenKey !== null && (
                !_.isEmpty(_.get(searchTagMap[index], filterPanelOpenKey)) ||
                (searchTags[index] && searchTags[index].length > 0 && filterPanelOpenKey.startsWith("__TEMPORARY_RELATION__"))
              ) && !filterPanelOpenKey.startsWith("~e_x_parent-") && !filterPanelOpenKey.startsWith("e_x_parent-")
              }
              rootClassName="pdb-explore-setting-popover"
              placement="bottomLeft"
              content={() => {
                const tags = searchTags[index], tagsLen = tags.length;

                if (filterPanelOpenKey.startsWith("__TEMPORARY_RELATION__")) {
                  let sourceTag = {}, targetTag = {};
                  const initialValue = _.get(searchTagMap[index], filterPanelOpenKey, {});

                  if (!_.isEmpty(initialValue)) {
                    // 临时关系修改
                    const tagIndex = tags.findIndex(val => val === filterPanelOpenKey);
                    sourceTag = _.get(searchTagMap[index], tags[tagIndex - 1], {});
                    targetTag = _.get(searchTagMap[index], tags[tagIndex + 1], {});
                  } else {
                    sourceTag = searchTagMap[index][tags[tagsLen - 2]] || {};
                    targetTag = searchTagMap[index][tags[tagsLen - 1]] || {};

                    /**
                     * 临时关系创建的搜索框数据的两种情况
                     * 1. 对象类型 - 临时关系：需要在弹窗中指定目标对象
                     * 2. 对象类型 - 对象类型 -临时关系：源对象和目标对象已指定
                     */
                    if (!(sourceTag && targetTag && _.get(sourceTag, 'type') === 'type' && _.get(sourceTag, 'type') === _.get(targetTag, 'type'))) {
                      // 当最后两个不同时为对象类型时
                      sourceTag = targetTag;
                      targetTag = {};
                    }
                    Object.assign(initialValue, {
                      "data": {
                        "r.type.constraints": {
                          "r.binds": {
                            "source": _.get(sourceTag, "key", ""),
                            "target": _.get(targetTag, "key", "")
                          }
                        },
                        "group": "inner"
                      }
                    });
                  }
                  return (
                    <NewRelation
                      tagsLen={tagsLen}
                      sourceTag={sourceTag}
                      targetTag={targetTag}
                      initialValue={initialValue}
                      close={() => {
                        setFilterPanelOpenKey(null);
                        removeLastTypeTag(index);
                      }}
                      saveConfig={(values: any, currentTargetTag: any) => handleSaveTemporayRelation(index, values, currentTargetTag, targetTag)}
                    />
                  );
                }
                return (
                  <ExploreFilter
                    isLastTag={tags && tagsLen > 0 ? tags[tagsLen - 1] === filterPanelOpenKey : false}
                    originType={_.get(searchTagMap[index], filterPanelOpenKey)}
                    close={() => {
                      setFilterPanelOpenKey(null);
                    }}
                    saveConfig={(config: any, csv: any) => {
                      const newSearchTagsMap = JSON.parse(JSON.stringify(searchTagMap));
                      Object.assign(newSearchTagsMap[index], { [filterPanelOpenKey]: { ...searchTagMap[index][filterPanelOpenKey], config, csv } });
                      setSearchTagMap(newSearchTagsMap);
                      setFilterPanelOpenKey(null);
                    }}
                  />
                );
              }}
              arrow={false}
              trigger="click"
              destroyTooltipOnHide
            >
              <Select
                ref={r => { searchRefArr.current[index] = r; }}
                className="pdb-explore-search"
                value={filterPanelOpenKey === "__TEMPORARY_RELATION__" ? [...searchTags[index], "__TEMPORARY_RELATION__"] : searchTags[index]}
                searchValue={currentFocusIndex === index ? currentSearchValue : ""}
                placeholder={index > 0 ? "" : "输入类型搜索（Ctrl + S）"}
                mode="multiple"
                showSearch
                loading={filterLoading}
                suffixIcon={null}
                filterOption={false}
                options={(optionMap[currentSelectDropdownTab] || []).map((d: any) => d)}
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
                onDropdownVisibleChange={open => handleDropdownVisibleChange(open, index)}
                onFocus={() => handleFocus(index)}
                onKeyDown={(event) => {
                  if (event.keyCode === 8 && _.isEmpty(currentSearchValue) && searchTags[currentFocusIndex].length === 0 && currentFocusIndex > 0) {
                    // backspace删除键
                    handleClear(currentFocusIndex, currentFocusIndex - 1);
                  }
                }}
                onClear={() => handleClear(index)}
              />
            </Popover>
          ))}
        </div>
      }
      {!searchLoading &&
        <Tooltip title="搜索">
          <i
            className="spicon icon-sousuo2"
            onClick={event => {
              event.stopPropagation();
              searchPQL();
            }}
          ></i>
        </Tooltip>
      }
      {/* <Tooltip title="展开">
        <i
          className={`spicon ${exploreExpand ? "icon-shouqi" : "icon-open_detail"}`}
          onClick={event => {
            event.stopPropagation();
            setExploreExpand(!exploreExpand);
          }}
        ></i>
      </Tooltip> */}
      {/* <ExportApi
        clickCopy={() => searchTags.map((tags, index) => tags.map((tag: any) => {
          const tagType = tag.startsWith("Type.") ? "type" : "relation";
          let attrs = JSON.parse(JSON.stringify(_.get(searchTagMap[index][tag]["data"], (tagType === "type" ? "x.type.attrs" : "r.type.constraints"), [])));
          if (tagType === "relation" && !_.isEmpty(attrs)) {
            delete attrs["r.binds"];
            delete attrs["r.constraints"];
            attrs = Object.values(attrs);
          }
          return {
            value: tag,
            label: _.get(searchTagMap[index][tag], "label", ""),
            type: tagType,
            attrs: attrs || []
          }
        }))}
        getParams={(csv: any) => {
          const { pql } = getPQL();
          const graphId = routerParams.id;
          return { api: api.pql, params: { pql, graphId, csv } }
        }}
      /> */}
      <Tooltip title="清空">
        <i
          className="spicon icon-shibai"
          onClick={handleClearSearch}
        ></i>
      </Tooltip>
    </div>
  )
}
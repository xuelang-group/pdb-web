import { Button, Collapse, Empty, Form, Popover, Select, Switch, Tooltip, InputNumber, notification, Upload, message, Modal } from "antd";
import { labelThemeStyle } from "@/g6/type/edge";
import G6, { Item } from "@antv/g6";
import _ from "lodash";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as XLSX from 'xlsx';

import { ObjectRelationConig, RelationsConfig, setCurrentGraphTab, setGraphLoading, setToolbarConfig, setTypeLoading } from "@/reducers/editor";
import store, { StoreState } from "@/store";
import { Parent, setObjects } from "@/reducers/object";
import { addObject, getChildren } from "@/actions/object";
import { clearGraphData } from "@/actions/graph";
import { covertToGraphData } from "@/utils/objectGraph";
import { useLocation, useParams } from "react-router";
import { nodeColorList, typeLabelMap, uuid } from "@/utils/common";
import { addRelationByGraphId, deleteRelationByGraphId } from "@/actions/relation";
import { RelationConfig, setRelations } from "@/reducers/relation";
import { addType, deleteType, resetSchema } from "@/actions/type";
import { setTypes, TypeConfig } from "@/reducers/type";
import "./index.less";
import { getFile, putFile } from "@/actions/minioOperate";

const templateExampleData = {
  "类型表": { "!ref": "A1:C12", "A1": { "t": "s", "v": "名称（唯一标识）", "r": "<t>名称（唯一标识）</t>", "h": "名称（唯一标识）", "w": "名称（唯一标识）" }, "B1": { "t": "s", "v": "类型（默认对象类型）", "r": "<t>类型（默认对象类型）</t>", "h": "类型（默认对象类型）", "w": "类型（默认对象类型）" }, "C1": { "t": "s", "v": "是否开启版本管理（TRUE / FALSE，默认FALSE）", "r": "<t>是否开启版本管理（TRUE / FALSE，默认FALSE）</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "是否开启版本管理（TRUE / FALSE，默认FALSE）", "w": "是否开启版本管理（TRUE / FALSE，默认FALSE）" }, "A2": { "t": "s", "v": "航司", "r": "<t>航司</t>", "h": "航司", "w": "航司" }, "B2": { "t": "s", "v": "对象类型", "r": "<t>对象类型</t>", "h": "对象类型", "w": "对象类型" }, "C2": { "t": "b", "v": true, "w": "TRUE" }, "A3": { "t": "s", "v": "飞机", "r": "<t>飞机</t>", "h": "飞机", "w": "飞机" }, "B3": { "t": "s", "v": "对象类型", "r": "<t>对象类型</t>", "h": "对象类型", "w": "对象类型" }, "A4": { "t": "s", "v": "交付", "r": "<t>交付</t>", "h": "交付", "w": "交付" }, "B4": { "t": "s", "v": "关系类型", "r": "<t>关系类型</t>", "h": "关系类型", "w": "关系类型" }, "!margins": { "left": 0.7, "right": 0.7, "top": 0.75, "bottom": 0.75, "header": 0.3, "footer": 0.3 } },
  "类型属性表": { "!ref": "A1:F7", "A1": { "t": "s", "v": "类型名称（唯一标识）", "r": "<t>类型名称（唯一标识）</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "类型名称（唯一标识）", "w": "类型名称（唯一标识）" }, "B1": { "t": "s", "v": "属性名称（唯一标识）", "r": "<t>属性名称（唯一标识）</t>", "h": "属性名称（唯一标识）", "w": "属性名称（唯一标识）" }, "C1": { "t": "s", "v": "属性展示名称", "r": "<t>属性展示名称</t>", "h": "属性展示名称", "w": "属性展示名称" }, "D1": { "t": "s", "v": "属性类型", "r": "<t>属性类型</t>", "h": "属性类型", "w": "属性类型" }, "E1": { "t": "s", "v": "默认值", "r": "<t>默认值</t>", "h": "默认值", "w": "默认值" }, "F1": { "t": "s", "v": "日期类型格式（默认YYYY-MM-DD）", "r": "<t>日期类型格式（默认YYYY-MM-DD）</t>", "h": "日期类型格式（默认YYYY-MM-DD）", "w": "日期类型格式（默认YYYY-MM-DD）" }, "A2": { "t": "s", "v": "航司", "r": "<t>航司</t>", "h": "航司", "w": "航司" }, "B2": { "t": "s", "v": "serialNo", "r": "<t>serialNo</t>", "h": "serialNo", "w": "serialNo" }, "C2": { "t": "s", "v": "序号", "r": "<t>序号</t>", "h": "序号", "w": "序号" }, "D2": { "t": "s", "v": "整数", "r": "<t>整数</t>", "h": "整数", "w": "整数" }, "A3": { "t": "s", "v": "航司", "r": "<t>航司</t>", "h": "航司", "w": "航司" }, "B3": { "t": "s", "v": "standardName", "r": "<t>standardName</t>", "h": "standardName", "w": "standardName" }, "C3": { "t": "s", "v": "标准名称", "r": "<t>标准名称</t>", "h": "标准名称", "w": "标准名称" }, "D3": { "t": "s", "v": "单行文本", "r": "<t>单行文本</t>", "h": "单行文本", "w": "单行文本" }, "A4": { "t": "s", "v": "航司", "r": "<t>航司</t>", "h": "航司", "w": "航司" }, "B4": { "t": "s", "v": "airlineThreeCode", "r": "<t>airlineThreeCode</t>", "h": "airlineThreeCode", "w": "airlineThreeCode" }, "C4": { "t": "s", "v": "三字码", "r": "<t>三字码</t>", "h": "三字码", "w": "三字码" }, "D4": { "t": "s", "v": "单行文本", "r": "<t>单行文本</t>", "h": "单行文本", "w": "单行文本" }, "A5": { "t": "s", "v": "飞机", "r": "<t>飞机</t>", "h": "飞机", "w": "飞机" }, "B5": { "t": "s", "v": "id", "r": "<t>id</t>", "h": "id", "w": "id" }, "C5": { "t": "s", "v": "序号", "r": "<t>序号</t>", "h": "序号", "w": "序号" }, "D5": { "t": "s", "v": "整数", "r": "<t>整数</t>", "h": "整数", "w": "整数" }, "A6": { "t": "s", "v": "飞机", "r": "<t>飞机</t>", "h": "飞机", "w": "飞机" }, "B6": { "t": "s", "v": "planeType", "r": "<t>planeType</t>", "h": "planeType", "w": "planeType" }, "C6": { "t": "s", "v": "机型", "r": "<t>机型</t>", "h": "机型", "w": "机型" }, "D6": { "t": "s", "v": "单行文本", "r": "<t>单行文本</t>", "h": "单行文本", "w": "单行文本" }, "A7": { "t": "s", "v": "飞机", "r": "<t>飞机</t>", "h": "飞机", "w": "飞机" }, "B7": { "t": "s", "v": "flightNumber", "r": "<t>flightNumber</t>", "h": "flightNumber", "w": "flightNumber" }, "C7": { "t": "s", "v": "飞机序列号", "r": "<t>飞机序列号</t>", "h": "飞机序列号", "w": "飞机序列号" }, "D7": { "t": "s", "v": "单行文本", "r": "<t>单行文本</t>", "h": "单行文本", "w": "单行文本" }, "!margins": { "left": 0.7, "right": 0.7, "top": 0.75, "bottom": 0.75, "header": 0.3, "footer": 0.3 } },
  "连接对象表（仅关系类型）": { "!ref": "A1:C2", "A1": { "t": "s", "v": "类型名称（唯一标识）", "r": "<t>类型名称（唯一标识）</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "类型名称（唯一标识）", "w": "类型名称（唯一标识）" }, "B1": { "t": "s", "v": "关系类型连接对象（源对象类型）", "r": "<t>关系类型连接对象（源对象类型）</t>", "h": "关系类型连接对象（源对象类型）", "w": "关系类型连接对象（源对象类型）" }, "C1": { "t": "s", "v": "关系类型连接对象（目标对象类型）", "r": "<t>关系类型连接对象（目标对象类型）</t>", "h": "关系类型连接对象（目标对象类型）", "w": "关系类型连接对象（目标对象类型）" }, "A2": { "t": "s", "v": "交付", "r": "<t>交付</t>", "h": "交付", "w": "交付" }, "B2": { "t": "s", "v": "飞机", "r": "<t>飞机</t>", "h": "飞机", "w": "飞机" }, "C2": { "t": "s", "v": "航司", "r": "<t>航司</t>", "h": "航司", "w": "航司" }, "!margins": { "left": 0.7, "right": 0.7, "top": 0.75, "bottom": 0.75, "header": 0.3, "footer": 0.3 } }
}
const objectExampleData = {
  "对象实例表": { "!ref": "A1:E9", "A1": { "t": "s", "v": "对象实例uid（数值，不能为1）", "r": "<t>对象实例uid（数值，不能为1）</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "对象实例uid（数值，不能为1）", "w": "对象实例uid（数值，不能为1）" }, "B1": { "t": "s", "v": "对象实例名称", "r": "<t>对象实例名称</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "对象实例名称", "w": "对象实例名称" }, "C1": { "t": "s", "v": "对象类型uid", "r": "<t>对象类型uid</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "对象类型uid", "w": "对象类型uid" }, "D1": { "t": "s", "v": "属性值", "r": "<t>属性值</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "属性值", "w": "属性值" }, "E1": { "t": "s", "v": "父级实例uid(默认1，root节点)", "r": "<t>父级实例uid(默认1，root节点)</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "父级实例uid(默认1，root节点)", "w": "父级实例uid(默认1，root节点)" }, "A2": { "t": "n", "v": 2, "w": "2" }, "B2": { "t": "s", "v": "航司", "r": "<t>航司</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "航司", "w": "航司" }, "C2": { "t": "s", "v": "Type.SzBshHVVSNMabliAMuv1718246350557", "r": "<t>Type.SzBshHVVSNMabliAMuv1718246350557</t>", "h": "Type.SzBshHVVSNMabliAMuv1718246350557", "w": "Type.SzBshHVVSNMabliAMuv1718246350557" }, "D2": { "t": "s", "v": "{\"serialNo\": 1, \"standardName\": \"test\"}", "r": "<t>{\"serialNo\": 1, \"standardName\": \"test\"}</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "{&quot;serialNo&quot;: 1, &quot;standardName&quot;: &quot;test&quot;}", "w": "{\"serialNo\": 1, \"standardName\": \"test\"}" }, "A3": { "t": "n", "v": 3, "w": "3" }, "B3": { "t": "s", "v": "航司1", "r": "<t>航司1</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "航司1", "w": "航司1" }, "C3": { "t": "s", "v": "Type.SzBshHVVSNMabliAMuv1718246350557", "r": "<t>Type.SzBshHVVSNMabliAMuv1718246350557</t>", "h": "Type.SzBshHVVSNMabliAMuv1718246350557", "w": "Type.SzBshHVVSNMabliAMuv1718246350557" }, "D3": { "t": "s", "v": "{\"serialNo\": 2, \"standardName\": \"test\"}", "r": "<t>{\"serialNo\": 2, \"standardName\": \"test\"}</t>", "h": "{&quot;serialNo&quot;: 2, &quot;standardName&quot;: &quot;test&quot;}", "w": "{\"serialNo\": 2, \"standardName\": \"test\"}" }, "E3": { "t": "n", "v": 2, "w": "2" }, "A4": { "t": "n", "v": 4, "w": "4" }, "B4": { "t": "s", "v": "航司2", "r": "<t>航司2</t>", "h": "航司2", "w": "航司2" }, "C4": { "t": "s", "v": "Type.SzBshHVVSNMabliAMuv1718246350557", "r": "<t>Type.SzBshHVVSNMabliAMuv1718246350557</t>", "h": "Type.SzBshHVVSNMabliAMuv1718246350557", "w": "Type.SzBshHVVSNMabliAMuv1718246350557" }, "D4": { "t": "s", "v": "{\"serialNo\": 3, \"standardName\": \"test\"}", "r": "<t>{\"serialNo\": 3, \"standardName\": \"test\"}</t>", "h": "{&quot;serialNo&quot;: 3, &quot;standardName&quot;: &quot;test&quot;}", "w": "{\"serialNo\": 3, \"standardName\": \"test\"}" }, "E4": { "t": "n", "v": 2, "w": "2" }, "A5": { "t": "n", "v": 5, "w": "5" }, "B5": { "t": "s", "v": "航司3", "r": "<t>航司3</t>", "h": "航司3", "w": "航司3" }, "C5": { "t": "s", "v": "Type.SzBshHVVSNMabliAMuv1718246350557", "r": "<t>Type.SzBshHVVSNMabliAMuv1718246350557</t>", "h": "Type.SzBshHVVSNMabliAMuv1718246350557", "w": "Type.SzBshHVVSNMabliAMuv1718246350557" }, "D5": { "t": "s", "v": "{\"serialNo\": 4, \"standardName\": \"test\"}", "r": "<t>{\"serialNo\": 4, \"standardName\": \"test\"}</t>", "h": "{&quot;serialNo&quot;: 4, &quot;standardName&quot;: &quot;test&quot;}", "w": "{\"serialNo\": 4, \"standardName\": \"test\"}" }, "E5": { "t": "n", "v": 2, "w": "2" }, "A6": { "t": "n", "v": 6, "w": "6" }, "B6": { "t": "s", "v": "飞机", "r": "<t>飞机</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "飞机", "w": "飞机" }, "C6": { "t": "s", "v": "Type.Sgm8zhEuihdax7q8LCI1718246350557", "r": "<t>Type.Sgm8zhEuihdax7q8LCI1718246350557</t>", "h": "Type.Sgm8zhEuihdax7q8LCI1718246350557", "w": "Type.Sgm8zhEuihdax7q8LCI1718246350557" }, "D6": { "t": "s", "v": "{\"id\":1}", "r": "<t>{\"id\":1}</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "{&quot;id&quot;:1}", "w": "{\"id\":1}" }, "A7": { "t": "n", "v": 7, "w": "7" }, "B7": { "t": "s", "v": "飞机1", "r": "<t>飞机1</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "飞机1", "w": "飞机1" }, "C7": { "t": "s", "v": "Type.Sgm8zhEuihdax7q8LCI1718246350557", "r": "<t>Type.Sgm8zhEuihdax7q8LCI1718246350557</t>", "h": "Type.Sgm8zhEuihdax7q8LCI1718246350557", "w": "Type.Sgm8zhEuihdax7q8LCI1718246350557" }, "D7": { "t": "s", "v": "{\"id\":2}", "r": "<t>{\"id\":2}</t>", "h": "{&quot;id&quot;:2}", "w": "{\"id\":2}" }, "E7": { "t": "n", "v": 6, "w": "6" }, "A8": { "t": "n", "v": 8, "w": "8" }, "B8": { "t": "s", "v": "飞机2", "r": "<t>飞机2</t>", "h": "飞机2", "w": "飞机2" }, "C8": { "t": "s", "v": "Type.Sgm8zhEuihdax7q8LCI1718246350557", "r": "<t>Type.Sgm8zhEuihdax7q8LCI1718246350557</t>", "h": "Type.Sgm8zhEuihdax7q8LCI1718246350557", "w": "Type.Sgm8zhEuihdax7q8LCI1718246350557" }, "D8": { "t": "s", "v": "{\"id\":3}", "r": "<t>{\"id\":3}</t>", "h": "{&quot;id&quot;:3}", "w": "{\"id\":3}" }, "E8": { "t": "n", "v": 6, "w": "6" }, "A9": { "t": "n", "v": 9, "w": "9" }, "B9": { "t": "s", "v": "飞机3", "r": "<t>飞机3</t>", "h": "飞机3", "w": "飞机3" }, "C9": { "t": "s", "v": "Type.Sgm8zhEuihdax7q8LCI1718246350557", "r": "<t>Type.Sgm8zhEuihdax7q8LCI1718246350557</t>", "h": "Type.Sgm8zhEuihdax7q8LCI1718246350557", "w": "Type.Sgm8zhEuihdax7q8LCI1718246350557" }, "D9": { "t": "s", "v": "{\"id\":4}", "r": "<t>{\"id\":4}</t>", "h": "{&quot;id&quot;:4}", "w": "{\"id\":4}" }, "E9": { "t": "n", "v": 6, "w": "6" }, "!margins": { "left": 0.7, "right": 0.7, "top": 0.75, "bottom": 0.75, "header": 0.3, "footer": 0.3 } },
  "实例关系表": { "!ref": "A1:D5", "A1": { "t": "s", "v": "源实例uid", "r": "<t>源实例uid</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "源实例uid", "w": "源实例uid" }, "B1": { "t": "s", "v": "目标实例uid", "r": "<t>目标实例uid</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "目标实例uid", "w": "目标实例uid" }, "C1": { "t": "s", "v": "关系类型uid", "r": "<t>关系类型uid</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "关系类型uid", "w": "关系类型uid" }, "D1": { "t": "s", "v": "关系类型属性值", "r": "<t>关系类型属性值</t><phoneticPr fontId=\"1\" type=\"noConversion\"/>", "h": "关系类型属性值", "w": "关系类型属性值" }, "A2": { "t": "n", "v": 7, "w": "7" }, "B2": { "t": "n", "v": 3, "w": "3" }, "C2": { "t": "s", "v": "Relation.VEjBBV2LAwggg9KcH6d1718246350557", "r": "<t>Relation.VEjBBV2LAwggg9KcH6d1718246350557</t>", "h": "Relation.VEjBBV2LAwggg9KcH6d1718246350557", "w": "Relation.VEjBBV2LAwggg9KcH6d1718246350557" }, "A3": { "t": "n", "v": 7, "w": "7" }, "B3": { "t": "n", "v": 4, "w": "4" }, "C3": { "t": "s", "v": "Relation.VEjBBV2LAwggg9KcH6d1718246350557", "r": "<t>Relation.VEjBBV2LAwggg9KcH6d1718246350557</t>", "h": "Relation.VEjBBV2LAwggg9KcH6d1718246350557", "w": "Relation.VEjBBV2LAwggg9KcH6d1718246350557" }, "A4": { "t": "n", "v": 8, "w": "8" }, "B4": { "t": "n", "v": 4, "w": "4" }, "C4": { "t": "s", "v": "Relation.VEjBBV2LAwggg9KcH6d1718246350557", "r": "<t>Relation.VEjBBV2LAwggg9KcH6d1718246350557</t>", "h": "Relation.VEjBBV2LAwggg9KcH6d1718246350557", "w": "Relation.VEjBBV2LAwggg9KcH6d1718246350557" }, "A5": { "t": "n", "v": 9, "w": "9" }, "B5": { "t": "n", "v": 5, "w": "5" }, "C5": { "t": "s", "v": "Relation.VEjBBV2LAwggg9KcH6d1718246350557", "r": "<t>Relation.VEjBBV2LAwggg9KcH6d1718246350557</t>", "h": "Relation.VEjBBV2LAwggg9KcH6d1718246350557", "w": "Relation.VEjBBV2LAwggg9KcH6d1718246350557" }, "!margins": { "left": 0.7, "right": 0.7, "top": 0.75, "bottom": 0.75, "header": 0.3, "footer": 0.3 } }
}

const { Panel } = Collapse;
const getRelationLabelCfg = (labelColor: string, showLabel: boolean, theme: string) => ({
  autoRotate: true,
  style: {
    fill: labelColor,
    fontSize: 12,
    lineHeight: 12,
    background: {
      fill: showLabel ? labelThemeStyle[theme].background : 'transparent',
      padding: [0, 0, 0, 0],
    }
  }
});

interface GraphToolbarProps {
  theme: string
}

export default function GraphToolbar(props: GraphToolbarProps) {
  const dispatch = useDispatch(),
    location = useLocation(),
    routerParams = useParams();
  const [modal, contextHolder] = Modal.useModal();
  const graphData = useSelector((state: StoreState) => state.object.graphData),
    rootId = useSelector((state: StoreState) => state.editor.rootNode?.uid),   // sroot节点uid
    allObjects = useSelector((state: StoreState) => state.object.data),  // 所有节点数据
    relationMap = useSelector((state: StoreState) => state.editor.relationMap),  // 所有的关系列表 {'r.type.id': xxxx},根据关系唯一键能够快速获取关系详细数据
    toolbarConfig = useSelector((state: StoreState) => state.editor.toolbarConfig),
    currentGraphTab = useSelector((state: StoreState) => state.editor.currentGraphTab),
    graphDataMap = useSelector((state: StoreState) => state.editor.graphDataMap),
    systemInfo = useSelector((state: StoreState) => state.app.systemInfo),
    indicatorCheckId = useSelector((state: StoreState) => state.indicator.checkId), // 指标查看id
    indicatorEditId = useSelector((state: StoreState) => state.indicator.editId), // 指标编辑id
    typeList = useSelector((state: StoreState) => state.type.data), // 画布工具栏 - 支持的对象类型列表
    relationList = useSelector((state: StoreState) => state.relation.data); // 画布工具栏 - 支持的关系类型列表
  const [relationLines, setRelationLines] = useState<RelationsConfig>({}),   // 画布中所有关系边 {[uid]: [{ target: {uid, x_name}, relation }]}
    [showRelationLine, setShowRelationLine] = useState(false),  // 画布工具栏 - 画布是否展示关系边 
    [showRelationLabel, setShowRelationLable] = useState(false),   // 画布工具栏 - 边是否展示关系名称
    [pageSize, setPageSize] = useState<number | undefined>(2),
    [selectedTab, setSelectedTab] = useState({} as any),  // 画布工具栏 - 当前选中项
    [filterMap, setFilterMap] = useState({ type: {}, relation: {} }),  // 画布工具栏 - 视图过滤数据 {'relation': {[r.type.id]: ...}, 'type': {[x.type.id]: ...}}
    [uploading, setUploading] = useState(false), // 上传xlsx文件中
    [operateDisabled, setOperateDisabled] = useState(false); // 重置按钮灰化
  const [filterForm] = Form.useForm();
  let uploadCofirm: any;

  const tabs = [{
    key: 'setting',
    label: '全局设置',
    icon: 'icon-shezhi',
    popover: true
  }, {
    key: 'filter',
    label: '视图过滤',
    icon: 'icon-shaixuan',
    popover: true
  }, {
    key: 'reset',
    label: '重置画布',
    icon: 'icon-zhongzhi1',
    onClick: () => {
      const graph = (window as any).PDB_GRAPH;
      if (!graph || !graphDataMap['main']) return;
      dispatch(setCurrentGraphTab("main"));
      graph.data(JSON.parse(JSON.stringify(graphDataMap['main'])));
      graph.render();
      graph.zoom(1);
    }
  }];

  useEffect(() => {
    setOperateDisabled(Boolean(indicatorCheckId || indicatorEditId));
  }, [indicatorCheckId, indicatorEditId]);

  useEffect(() => {
    filterForm.resetFields();
    if (!toolbarConfig[currentGraphTab]) return;
    const { relationLines, showRelationLabel, showRelationLine, filters } = toolbarConfig[currentGraphTab];
    setRelationLines(relationLines);
    setShowRelationLable(showRelationLabel);
    setShowRelationLine(showRelationLine);
    filterForm.setFieldValue('filter', filters);
  }, [currentGraphTab]);

  useEffect(() => {
    if (!toolbarConfig[currentGraphTab]) return;
    const _relationLines = toolbarConfig[currentGraphTab].relationLines,
      _showRelationLine = toolbarConfig[currentGraphTab].showRelationLine,
      _showRelationLabel = toolbarConfig[currentGraphTab].showRelationLabel,
      _pageSize = _.get(toolbarConfig[currentGraphTab], "pageSize");
    if (JSON.stringify(relationLines) !== JSON.stringify(_relationLines)) {
      setRelationLines(_relationLines);
    } if (currentGraphTab !== "main" && _showRelationLine) {
      showRelationLines(_showRelationLabel);
    }

    if (_showRelationLine !== showRelationLine) {
      setShowRelationLine(_showRelationLine);
    }

    if (_showRelationLabel !== showRelationLabel) {
      setShowRelationLable(_showRelationLabel);
    }

    if (_pageSize !== undefined && _pageSize !== pageSize) {
      setPageSize(_pageSize);
    }
  }, [toolbarConfig]);

  useEffect(() => {
    if (!(window as any).PDB_GRAPH) return;
    const graph = (window as any).PDB_GRAPH;
    const nodeLen = graph.getNodes().length,
      edgeLen = graph.getEdges().length;
    let currentMode = 'default';
    if ((nodeLen + edgeLen) > 1000) {
      currentMode = 'maxData';
    }
    if (currentMode !== graph.getCurrentMode()) {
      graph.setMode(currentMode);
    }
    showRelationLine ? showRelationLines() : hideRelationLines();
  }, [allObjects]);

  useEffect(() => {
    if (showRelationLine) showRelationLines();
  }, [relationLines]);

  useEffect(() => {
    const { userId, appId, nodeId } = systemInfo;
    if (userId && appId && nodeId) {
      const path = `studio/${userId}/pdb/${appId}/${nodeId}/config`;
      getFile(path).then(data => {
        const { showRelationLabel, showRelationLine, pageSize } = data;
        if (currentGraphTab === "main") {
          setShowRelationLable(showRelationLabel);
          setShowRelationLine(showRelationLine);
          setPageSize(pageSize);
        }
        dispatch(setToolbarConfig({
          key: "main",
          config: {
            showRelationLabel,
            showRelationLine,
            pageSize
          }
        }));
      }).catch(err => {
        saveSettingConfig({ pageSize });
      });
    }
  }, [systemInfo]);

  function saveSettingConfig(config: any) {
    const { userId, appId, nodeId } = systemInfo;
    const path = `studio/${userId}/pdb/${appId}/${nodeId}/config`;
    putFile(path, JSON.stringify({ showRelationLine, showRelationLabel, pageSize, ...config })).then(res => {
      console.log(res)
    }, err => {
      console.log(err)
    });
  }

  // 显示关系边
  const showRelationLines = function (_showRelationLabel = showRelationLabel) {
    const graph = (window as any).PDB_GRAPH;
    if (!graph) return;
    let addEdge = false;
    Object.keys(relationLines).forEach((objectUid: string) => {
      const relations = relationLines[objectUid];
      relations && relations.forEach((item: ObjectRelationConig) => {
        const { relation, target, attrValue } = item;
        if (!relation || !target) return;
        const edgeKey = `${objectUid}-${target.uid}`;
        const edgeId = `${edgeKey}-${relation}`;
        let edgeItem = graph.findById(edgeId);
        const sourceItem = graph.findById(objectUid),
          targetItem = graph.findById(target.uid);
        if (!sourceItem || !targetItem) return;
        const sourceIsVisible = sourceItem.isVisible(),
          targetIsVisible = targetItem.isVisible();
        if (!sourceIsVisible || !targetIsVisible) return;
        if (edgeItem) {
          // 当前边已存在且隐藏，则显示出来
          !edgeItem.isVisible() && edgeItem.show();
        } else if (targetItem && sourceItem) {
          // 当前边不存在，sourc和target节点存在，则创建该边
          const sourceItemModel = sourceItem.get('model');
          const targetItemModel = targetItem.get('model');
          let lineColor = 'l(0) 0:rgba(255,173,114,0.2) 1:#FFAD72', labelColor = labelThemeStyle[props.theme].fill; // 亮化颜色
          if (!_.isEmpty(filterMap.relation) && !_.get(filterMap.relation, relation)) {
            // 有过滤配置，且不在过滤项里的，灰化处理
            lineColor = '#EAECEF';
            labelColor = '#DCDEE1';
          }

          // 默认边类型
          let edgeType = 'tree-relation-line';
          const sourceIsRoot = sourceItemModel.parent === rootId,
            targetIsRoot = targetItemModel.parent === rootId,
            sourceWidth = sourceItemModel.width,
            targetWidth = targetItemModel.width;

          // 同棵树间连线或根节点间连线，边类型为自定义“same-tree-relation-line”
          if (targetItemModel.uid === sourceItemModel.uid) {
            edgeType = "loop";
          } else if (targetItemModel.xid.split('.')[1] === sourceItemModel.xid.split('.')[1]) {
            edgeType = 'same-tree-relation-line';
            if (sourceItemModel.y > targetItemModel.y) {
              lineColor = 'l(0) 0:#FFAD72 1:rgba(255,173,114,0.2)';
            }
          } else if (sourceIsRoot && targetIsRoot) {
            edgeType = "all-root-relation-line";
            if (targetItemModel.xid.split('.')[1] < sourceItemModel.xid.split('.')[1]) {
              lineColor = 'l(0) 0:#FFAD72 1:rgba(255,173,114,0.2)';
            }
          } else if (targetItemModel.xid.split('.')[1] < sourceItemModel.xid.split('.')[1]) {
            lineColor = 'l(0) 0:#FFAD72 1:rgba(255,173,114,0.2)';
          }

          const edgeOption = {
            id: edgeId,
            source: objectUid,
            target: target.uid.toString(),
            relationName: relation,
            name: relationMap[relation]['r.type.name'],
            data: {
              ...relationMap[relation],
              ...attrValue
            },
            type: edgeType,
            sourceIsRoot,
            sourceWidth,
            targetIsRoot,
            targetWidth,
            style: {
              stroke: lineColor,
              lineWidth: 1.5,
              endArrow: {
                path: G6.Arrow.triangle(5, 5, 1),
                fill: '#FFAD72',
                stroke: '#FFAD72',
              },
              cursor: 'pointer'
            },
            stateStyles: {
              'active': {
                lineWidth: 2.5,
                stroke: '#2EA1FF',
                endArrow: {
                  path: G6.Arrow.triangle(5, 5, 1),
                  fill: '#2EA1FF',
                  stroke: '#2EA1FF',
                },
              },
              'selected': {
                lineWidth: 2.5,
                stroke: '#2EA1FF',
                endArrow: {
                  path: G6.Arrow.triangle(5, 5, 1),
                  fill: '#2EA1FF',
                  stroke: '#2EA1FF',
                },
              },
              'highlight': {
                lineWidth: 2.5,
                stroke: '#2EA1FF',
                endArrow: {
                  path: G6.Arrow.triangle(5, 5, 1),
                  fill: '#2EA1FF',
                  stroke: '#2EA1FF',
                },
              }
            },
            labelCfg: getRelationLabelCfg(labelColor, _showRelationLabel, props.theme)
          };

          if (objectUid === target.uid && edgeType !== "loop") {
            Object.assign(edgeOption.labelCfg.style, {
              x: sourceItemModel.x,
              y: sourceItemModel.y
            })
          }
          if (_showRelationLabel && relationMap[relation]) Object.assign(edgeOption, { label: relationMap[relation]['r.type.name'] });
          edgeItem = graph.addItem('edge', edgeOption);
          addEdge = true;
        }

        if (edgeItem && (_.isEmpty(filterMap.relation) || _.get(filterMap.relation, relation))) {
          edgeItem.toFront();
        }
      });
    });

    if (!addEdge) return;
  }

  // 隐藏关系连线
  const hideRelationLines = function () {
    const graph = (window as any).PDB_GRAPH;
    if (!graph) return;
    graph.findAll('edge', function (edge: Item) {
      if (edge.isVisible() && edge.get('model').type !== 'step-line') {
        edge.hide();
        return true;
      }
      return false;
    });
  }

  // 显示/隐藏关系边
  const handleShowRelationLine = function (checked: boolean) {
    setShowRelationLine(checked);
    if (currentGraphTab === 'main') saveSettingConfig({ showRelationLine: checked });
    dispatch(setToolbarConfig({
      key: currentGraphTab,
      config: {
        showRelationLine: checked
      }
    }));
    checked ? showRelationLines() : hideRelationLines();
  }

  // 显示/隐藏关系边名称
  const handleShowRelationName = function (checked: boolean) {
    const graph = (window as any).PDB_GRAPH;
    if (!graph) return;
    graph.findAll('edge', function (edge: Item) {
      const edgeModel = edge.get('model');
      if (edgeModel.type !== 'step-line') {
        let labelColor = labelThemeStyle[props.theme].fill;
        if (!_.isEmpty(filterMap.relation) && !_.get(filterMap.relation, edgeModel.relationName)) {
          labelColor = '#DCDEE1';
        }
        graph.updateItem(edge, {
          label: checked && relationMap[edgeModel.relationName] ? relationMap[edgeModel.relationName]['r.type.name'] : '',
          labelCfg: getRelationLabelCfg(labelColor, checked, props.theme)
        });
        return true;
      }
      return false;
    });
    setShowRelationLable(checked);
    if (currentGraphTab === 'main') saveSettingConfig({ showRelationLabel: checked });
    dispatch(setToolbarConfig({
      key: currentGraphTab,
      config: {
        showRelationLabel: checked
      }
    }));
  }

  function getRootsData() {
    const graph = (window as any).PDB_GRAPH;

    if (!rootId || !graph) return;
    dispatch(setGraphLoading(true));
    getChildren({ vid: rootId }, (success: boolean, data: any) => {
      let newData = [];
      if (success) {
        const relationLines = {};
        newData = data.map((value: any, index: number) => {
          const infoIndex = _.get(value, 'tags.0.name') === 'v_node' ? 0 : 1,
            attrIndex = infoIndex === 0 ? 1 : 0;
          const newValue = JSON.parse(JSON.stringify(value)),
            parents = newValue['e_x_parent'],
            currentParent = parents.filter((val: Parent) => val.dst?.toString() === rootId)[0],
            defaultInfo = _.get(newValue.tags[infoIndex], 'props', {}),
            attrValue = _.get(newValue.tags[attrIndex], 'props', {}),
            uid = newValue['vid'].toString();

          // 获取对象关系列表数据
          const relations: any[] = [];
          Object.keys(newValue).forEach((key: string) => {
            if (key.startsWith("Relation_")) {
              const relationKey = key.replace('_', '.');
              if (_.isArray(newValue[key])) {
                newValue[key].forEach((target: any) => {
                  relations.push({
                    relation: relationKey,
                    target: {
                      uid: _.get(target, 'dst', '').toString()
                    },
                    attrValue: _.get(target, 'props', {})
                  });
                });
              } else {
                relations.push({
                  relation: relationKey,
                  target: {
                    uid: _.get(newValue[key], 'dst', '').toString()
                  },
                  attrValue: _.get(newValue[key], 'props', {})
                });
              }
            }
          });
          Object.assign(relationLines, {
            [uid]: relations
          });

          return {
            ...defaultInfo,
            'x_attr_value': { ...attrValue },
            'e_x_parent': parents,
            'x_children': _.get(newValue, 'x_children', 0),
            currentParent: {
              ...(_.get(currentParent, 'props', {})),
              uid: currentParent.dst.toString(),
              id: rootId,
            },
            'x_id': rootId + '.' + index,
            id: uid,
            uid: uid
          };
        });
        let graphData: any = {};
        if (newData) {
          graphData = covertToGraphData(newData, rootId, _.get(toolbarConfig[currentGraphTab], 'filterMap.type'));
        }
        graph.data(JSON.parse(JSON.stringify(graphData)));
        graph.render();
        graph.zoom(1);
        dispatch(setToolbarConfig({ config: { relationLines }, key: 'main' }));
        dispatch(setObjects(newData));
      } else {
        notification.error({
          message: '获取对象实例失败',
          description: data.message || data.msg
        });
      }
      dispatch(setGraphLoading(false));
    });
  }
  const handleChangePageSize = function (event: any) {
    const { value } = event.target;
    setPageSize(value);
    if (currentGraphTab === 'main') saveSettingConfig({ pageSize: value });
    dispatch(setToolbarConfig({
      key: currentGraphTab,
      config: {
        pageSize: value
      }
    }));
    getRootsData();
  }

  const filters = Form.useWatch('filter', filterForm);
  // 监听过滤条件
  useEffect(() => {
    if (!filters) return;
    const filterMap: any = {
      relation: {},
      type: {}
    }
    filters.forEach((item: any) => {
      const { typeName, target } = item;
      Object.assign(filterMap[target], { [typeName]: item });
    });
    setFilterMap(filterMap);
    filterForm.validateFields().then(() => {
      const graph = (window as any).PDB_GRAPH;
      if (!graph) return;
      graph.findAll('edge', function (edge: Item) {
        const edgeModel = edge.get('model');
        if (edgeModel.type === 'step-line') return;
        let lineColor = '#EAECEF', labelColor = '#DCDEE1';// 灰化
        if (!_.isEmpty(filterMap.relation) && _.get(filterMap.relation, edgeModel.relationName) || filters.length === 0) {
          // 高亮
          lineColor = 'l(0) 0:#FFEDE1 1:#FFAD72';
          labelColor = labelThemeStyle[props.theme].fill;
        }
        graph.updateItem(edge, {
          style: {
            stroke: lineColor,
            endArrow: {
              path: G6.Arrow.triangle(5, 5, 1),
              fill: lineColor,
              stroke: lineColor,
            },
          },
          labelCfg: getRelationLabelCfg(labelColor, showRelationLabel, props.theme)
        });
        if (!_.isEmpty(filterMap.relation) && _.get(filterMap.relation, edgeModel.relationName)) {
          edge.toFront();
        }
        return false;
      });

      const shouldSelectedNodes: Item[] = [];
      graph.findAll('node', function (node: Item) {
        const nodeModel = node.get('model'),
          nodeModelData = _.get(nodeModel, 'data'),
          isDisabled = (_.isEmpty(filterMap.type) || !_.get(filterMap.type, nodeModelData['x_type_name'] || '')) && filters.length > 0;
        graph.updateItem(node, { isDisabled });
        if (!isDisabled && !_.isEmpty(filterMap.type)) shouldSelectedNodes.push(node);
        node.setState('selected', !isDisabled && !_.isEmpty(filterMap.type));
      });
      graph.emit('nodeselectchange', {
        selectedItems: {
          nodes: shouldSelectedNodes,
          edges: [],
          combos: [],
        },
        select: true,
      });
    }).catch(err => { });

    dispatch(setToolbarConfig({
      key: currentGraphTab,
      config: { filters, filterMap }
    }));
  }, [filters]);


  function clearFilter() {
    filterForm.setFieldValue('filter', []);
  }

  const renderFilterPanel = function () {
    return (
      <div className="pdb-graph-toolbar-panel-container">
        <Form form={filterForm} autoComplete="off">
          <Form.List name="filter">
            {(fields, { add, remove }) => (
              <>
                <Form.Item style={{ marginBottom: '1.6rem' }}>
                  <Button className='btn-default add-filter-btn' type="primary" onClick={() => add({ target: 'relation' })} block>
                    <i className="spicon icon-plus"></i>
                    添加过滤条件
                  </Button>
                </Form.Item>
                {fields && fields.length > 0 ?
                  fields.map((field, index) => (
                    <div key={field.key}>
                      <Collapse className="filter-item" collapsible="header" defaultActiveKey={[index]}
                        expandIcon={panelProps => (<i className={`spicon ${panelProps.isActive ? 'icon-kuhei-jiantou-xia-zhihui' : 'icon-jiantou-you'}`}></i>)}>
                        <Panel
                          key={index}
                          header={"过滤条件" + (index + 1)}
                          extra={<i className="operation-icon spicon icon-shanchu2" onClick={() => remove(field.name)}></i>}
                          style={{ marginBottom: '1.6rem' }}
                        >
                          <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) =>
                              prevValues.area !== curValues.area || prevValues.sights !== curValues.sights
                            }
                          >
                            {({ getFieldValue, setFieldValue }) => (
                              <Form.Item
                                {...field}
                                label="目标"
                                name={[field.name, 'target']}
                                rules={[{ required: true }]}
                              >
                                <Select onChange={() => setFieldValue(['filter', field.name, 'typeName'], '')}>
                                  <Select.Option value="relation">关系类型</Select.Option>
                                  <Select.Option value="type">对象类型</Select.Option>
                                </Select>
                              </Form.Item>
                            )}
                          </Form.Item>
                          <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, curValues) => _.get(prevValues[field.name], 'target') !== _.get(curValues[field.name], 'target')}
                          >
                            {({ getFieldValue }) => {
                              const target = getFieldValue(['filter', field.name, 'target']);
                              return (
                                <Form.Item
                                  {...field}
                                  label="类型"
                                  name={[field.name, 'typeName']}
                                  rules={[{ required: true, message: '请选择类型' }]}
                                >
                                  <Select
                                    showSearch
                                    filterOption={(input, option) =>
                                    ((option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase()) ||
                                      (option?.value ?? '').toString() === input)
                                    }
                                  >
                                    {target === 'relation' && relationList.map((info: RelationConfig) => (
                                      <Select.Option value={info['r.type.id']} disabled={_.get(filterMap.relation, info['r.type.id'])}>{info['r.type.name']}</Select.Option>
                                    ))}
                                    {target === 'type' && typeList.map((info: TypeConfig) => (
                                      <Select.Option value={info['x.type.id']} disabled={_.get(filterMap.type, info['x.type.id'])}>{info['x.type.name']}</Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                              )
                            }}
                          </Form.Item>
                        </Panel>
                      </Collapse>
                    </div>
                  )) :
                  <Empty image={require('@/assets/images/search_empty.png')} />
                }
              </>
            )}
          </Form.List>
        </Form>
      </div>
    )
  }

  const renderSettingPanel = function () {
    return (
      <div className="pdb-graph-toolbar-setting">
        <div className="pdb-setting-header">全局设置</div>
        <div className="pdb-setting-item">
          <span>展示关系连线：</span>
          <Switch checked={showRelationLine} onChange={handleShowRelationLine} size="small" />
        </div>
        {showRelationLine &&
          <div className="pdb-setting-item">
            <span>展示关系名称：</span>
            <Switch checked={showRelationLabel} onChange={handleShowRelationName} size="small" />
          </div>
        }
        {currentGraphTab === "main" &&
          <div className="pdb-setting-item pdb-setting-pageSize">
            <span>每层级显示节点数<Tooltip title="超过节点数，则显示分页按钮；不设置，则为全量数据。"><i className="spicon icon-tishi"></i></Tooltip>：</span>
            <InputNumber min={0} step={1} value={pageSize} onBlur={handleChangePageSize} onPressEnter={handleChangePageSize} />
            <span>（更改后，画布将重新渲染）</span>
          </div>
        }
      </div>
    )
  }

  async function postRelations(relationTypes: any, _relationList: any[]) {
    if (!store.getState().editor.typeLoading) setTypeLoading(true);
    const _relationTypes = Object.values(relationTypes);
    const chunkSize = 100, totalChunks = Math.ceil(_relationTypes.length / chunkSize);
    let newRelations = JSON.parse(JSON.stringify(_relationList)), isAllSuccess = true, error: any = {};
    for (let i = 0; i < totalChunks; i++) {
      const chunk = _relationTypes.slice(i * chunkSize, (i + 1) * chunkSize);
      await (() => {
        return new Promise((resolve: any, reject: any) => {
          addRelationByGraphId(graphData?.id, chunk, (success: boolean, response: any) => {
            if (success) {
              newRelations = newRelations.concat(response);
            } else {
              isAllSuccess = false;
              error = response;
            }
            resolve();
          });
        })
      })();
      if (!isAllSuccess) break;
    }

    message.destroy("upload");
    dispatch(setRelations(newRelations));
    setUploading(false);
    dispatch(setTypeLoading(false));
    resetSchema(routerParams.id, () => { });

    if (isAllSuccess) {
      notification.success({
        message: '导入成功'
      });
    } else {
      notification.error({
        message: '导入失败，请重新刷新页面',
        description: error.message || error.msg
      });
    }
  }

  async function postTypes(objectTypes: {}, relationTypes: {}, _typelList: any[], _relationList: any[]) {
    const _objectTypes = Object.values(objectTypes);
    const chunkSize = 100, totalChunks = Math.ceil(_objectTypes.length / chunkSize);
    let newTypes = JSON.parse(JSON.stringify(_typelList)), isAllSuccess = true, error: any = {};
    for (let i = 0; i < totalChunks; i++) {
      const chunk = _objectTypes.slice(i * chunkSize, (i + 1) * chunkSize);
      await (() => {
        return new Promise((resolve: any, reject: any) => {
          addType(graphData?.id, chunk, (success: boolean, response: any) => {
            if (success) {
              newTypes = newTypes.concat(response);
            } else {
              isAllSuccess = false;
              error = response;
            }
            resolve();
          })
        })
      })();
      if (!isAllSuccess) break;
    }
    dispatch(setTypes(newTypes));
    if (isAllSuccess) {
      if (Object.keys(relationTypes).length > 0) {
        postRelations(relationTypes, _relationList);
      } else {
        message.destroy("upload");
        setUploading(false);
        dispatch(setTypeLoading(false));
        notification.success({
          message: '导入成功',
        });
        resetSchema(routerParams.id, () => { });
      }
    } else {
      resetSchema(routerParams.id, () => { });
      message.destroy("upload");
      setUploading(false);
      error && notification.error({
        message: '导入失败，请重新刷新页面',
        description: error.message || error.msg
      });
      dispatch(setTypeLoading(false));
    }
  }

  function createModelData(objectTypes: {}, relationTypes: {}, _typelList: any[], _relationList: any[]) {
    if (Object.keys(objectTypes).length > 0) {
      dispatch(setTypeLoading(true));
      postTypes(objectTypes, relationTypes, _typelList, _relationList);
    } else if (Object.keys(relationTypes).length > 0) {
      postRelations(relationTypes, _relationList);
    } else {
      message.destroy("upload");
      setUploading(false);
    }
  }

  function removeTypes(objectTypes: {}, relationTypes: {}) {
    deleteType(graphData?.id, typeList.map(val => val['x.type.id']), (success: boolean, response: any) => {
      if (success) {
        dispatch(setTypes([]));
        createModelData(objectTypes, relationTypes, [], []);
      } else {
        message.destroy("upload");
        notification.error({
          message: '导入失败，请重新刷新页面',
          description: response.message || response.msg
        });
        setUploading(false);
      }
    });
  }

  /**
   * 上传类型数据
   * @param typeData 类型数据 
   * @param override 是否覆盖
   */
  function uploadTypes(typeData: any[], typeAttrData: any[], relationTypeBindData: any[], override: boolean) {
    const objectTypes: any = {}, objectTypeMap: any = {}, relationTypes: any = {};
    const HEADERS = 1; // 标题行数
    const colors = Object.keys(nodeColorList);

    function getRowAttr(row: any) {
      const attrName = row[1];
      const attrType = typeLabelMap[row[3] || '单行文本'] || 'string';
      let newAttr = {
        name: attrName,
        display: row[2] || attrName,
        type: attrType,
        required: false
      };
      // 默认值
      if (row[5] !== undefined) {
        let defaultVal = row[4];
        if (attrType === 'int' || attrType === 'float') {
          defaultVal = Number(row[4]);
        } else if (attrType === 'boolean') {
          defaultVal = Boolean(row[4]);
        }
        Object.assign(newAttr, { default: defaultVal });
      }

      if (attrType === 'date') {
        Object.assign(newAttr, { datetimeFormat: row[5] || 'YYYY-MM-DD' });
      }

      return newAttr;
    }

    // process the rest of the rows
    let colorIndex = 0;
    for (let R = HEADERS; R < typeData.length; ++R) {
      const row = typeData[R];
      // 类型名称是否为空
      if (row[0] !== undefined) {
        const _label = row[0].toString();
        if (row[1] === undefined || row[1] === '对象类型') {
          const _uuid = 'Type.' + uuid();
          Object.assign(objectTypeMap, { [_label]: _uuid });
          Object.assign(objectTypes, {
            [_label]: {
              'x.type.id': _uuid,
              'x.type.name': _label,
              'x.type.prototype': [],
              'x.type.metadata': JSON.stringify({ color: colors[colorIndex] }),
              'x.type.version': row[2] === undefined || row[2] === 'FALSE' ? false : true,
              'x.type.attrs': []
            }
          });
          colorIndex++;
          if (colorIndex === colors.length) colorIndex = 0;
        } else {
          const _uuid = 'Relation.' + uuid();
          Object.assign(relationTypes, {
            [_label]: {
              'r.type.id': _uuid,
              'r.type.name': _label,
              'r.type.prototype': [],
              'r.type.binds': []
            }
          });
        }
      }
    }

    for (let R = HEADERS; R < typeAttrData.length; ++R) {
      const row = typeAttrData[R];

      // 类型名称是否为空
      if (row[0] !== undefined) {
        const _label = row[0].toString();
        if (objectTypes[_label]) {
          // 属性名称是否为空
          if (row[1] !== undefined) {
            const newAttr = getRowAttr(row);
            const _objectType = objectTypes[_label];
            _objectType['x.type.attrs'].push(newAttr);
            Object.assign(objectTypes, { [_label]: _objectType });
          }
        } else if (relationTypes[_label]) {
          const _relationType = relationTypes[_label];

          if (row[1] !== undefined) {
            const newAttr = getRowAttr(row);
            _relationType['r.type.attrs'].push(newAttr);
            Object.assign(relationTypes, { [_label]: _relationType });
          }
        }
      }
    }

    for (let R = HEADERS; R < relationTypeBindData.length; ++R) {
      const row = relationTypeBindData[R];

      // 类型名称是否为空
      if (row[0] !== undefined) {
        const _label = row[0].toString();
        if (relationTypes[_label]) {
          const _relationType = relationTypes[_label];

          if (row[1] && row[2]) {
            const _binds = JSON.parse(JSON.stringify(_relationType['r.type.binds'] || []));
            _binds.push({
              source: row[1],
              target: row[2]
            });
            Object.assign(_relationType, { 'r.type.binds': _binds });
            Object.assign(relationTypes, { [_label]: _relationType });
          }
        }
      }
    }

    Object.values(relationTypes).forEach(function (type: any) {
      console.log(type)
      const binds = type['r.type.binds'].filter(function (bind: { source: string; target: string; }) {
        const { source, target } = bind;
        if (objectTypeMap[source] && objectTypeMap[target]) {
          Object.assign(bind, { source: objectTypeMap[source], target: objectTypeMap[target] })
          return true;
        }
        return false;
      });
      Object.assign(type, {
        'r.type.binds': binds
      });
    });

    if (override && (relationList.length > 0 || typeList.length > 0)) {
      if (relationList.length > 0) {
        deleteRelationByGraphId(graphData?.id, relationList.map(val => val['r.type.id']), (success: any, response: any) => {
          if (success) {
            dispatch(setRelations([]));
            if (typeList.length > 0) {
              removeTypes(objectTypes, relationTypes);
            } else {
              createModelData(objectTypes, relationTypes, [], []);
            }
          } else {
            message.destroy("upload");
            notification.error({
              message: '导入失败，请重新刷新页面',
              description: response.message || response.msg
            });
            setUploading(false);
          }
        });
      } else if (typeList.length > 0) {
        removeTypes(objectTypes, relationTypes);
      }
    } else {
      createModelData(objectTypes, relationTypes, typeList, relationList);
    }
  }

  function numToHex(num: string | number) {
    return '0x' + Number(num).toString(16);
  }

  async function postObject(objects: any[]) {
    const chunkSize = 8000, totalChunks = Math.ceil(objects.length / chunkSize);
    let isAllSuccess = true, error: any = {};
    for (let i = 0; i < totalChunks; i++) {
      const chunk = objects.slice(i * chunkSize, (i + 1) * chunkSize);
      await (() => {
        return new Promise((resolve: any, reject: any) => {
          addObject(chunk, (success: boolean, response: any) => {
            if (!success) {
              isAllSuccess = false;
              error = response;
            }
            resolve();
          });
        })
      })();
      if (!isAllSuccess) break;
    }

    getRootsData();
    if (!isAllSuccess) {
      notification.error({
        message: '导入对象实例失败',
        description: error.message || error.msg
      });
    }
    message.destroy("upload");
    setUploading(false);
  }

  // 上传实例数据
  function uploadObjects(data: any[], relationData: any[], override: boolean) {
    if (!rootId) return;
    const HEADERS = 1; // 标题行数
    const objectRelationMap: any = {};
    if (relationData.length > 0) {
      for (let R = HEADERS; R < relationData.length; ++R) {
        const row = relationData[R];
        if (row[0] === undefined || row[0] === null || row[1] === undefined || row[1] === null || row[2] === undefined || row[2] === null) continue;
        const sourceUid = numToHex(row[0]),
          targetUid = numToHex(row[1]),
          relationUid = row[2].replace(".", "_"),
          relationAttrs = {};
        try {
          const attrValues = JSON.parse(row[3]);
          Object.keys(attrValues).forEach(function (key) {
            Object.assign(relationAttrs, { [`${relationUid}|${key}`]: attrValues[key] });
          });
        } catch (err) { }
        const info = { vid: targetUid, ...relationAttrs };
        if (!objectRelationMap[sourceUid]) {
          Object.assign(objectRelationMap, { [sourceUid]: { [relationUid]: [info] } });
        } else if (!objectRelationMap[sourceUid][relationUid]) {
          Object.assign(objectRelationMap[sourceUid], { [relationUid]: [info] });
        } else {
          objectRelationMap[sourceUid][relationUid].push(info);
        }
      }
    }
    const graph = (window as any).PDB_GRAPH;
    let nextRootNodeIndex = 1;
    if (graph && !override) {
      const rootCombo = graph.findById(rootId + "-combo");
      if (rootCombo && rootCombo.getChildren().nodes.length > 0) {
        const lastRootNode = rootCombo.getChildren().nodes.slice(-1)[0];
        nextRootNodeIndex = Math.floor(lastRootNode.getModel().data.currentParent['x_index'] / 1024) + 1;
      }
    }
    const objects: {
      vid: string;
      'x_name': any;
      'x_type_name': any;
      'e_x_parent': { vid: string; 'x_index': any; }[];
    }[] = [],
      parentIndexMap: any = {};

    for (let R = HEADERS; R < data.length; ++R) {
      const row = data[R];
      if (row[0] === undefined || row[0] === null || row[1] === undefined || row[1] === null || row[2] === undefined || row[2] === null) continue;
      const uid = numToHex(row[0]),
        parentUid: any = row[4] ? numToHex(row[4]) : rootId,
        attrs = {};
      try {
        Object.assign(attrs, JSON.parse(row[3]));
      } catch (err) { }
      let index;
      if (!parentIndexMap[parentUid]) {
        if (parentUid === rootId) {
          index = nextRootNodeIndex;
        } else {
          index = 1;
        }
        Object.assign(parentIndexMap, { [parentUid]: index + 1 });
      } else {
        index = parentIndexMap[parentUid];
        Object.assign(parentIndexMap, { [parentUid]: index + 1 });
      }
      const parentInfo = { vid: parentUid, 'x_index': index * 1024 };
      let objectInfo = {
        vid: uid,
        'x_name': row[1].toString(),
        'x_type_name': row[2],
        'e_x_parent': [parentInfo],
        ...attrs
      };
      if (objectRelationMap[uid]) Object.assign(objectInfo, objectRelationMap[uid]);
      objects.push(objectInfo);
    }
    if (override && graphData?.id) {
      clearGraphData(graphData?.id, (success: boolean, response: any) => {
        if (success) {
          postObject(objects);
        } else {
          getRootsData();
          notification.error({
            message: '覆盖对象实例失败',
            description: response.message || response.msg
          });
          message.destroy("upload");
          setUploading(false);
        }
      });
    } else {
      postObject(objects);
    }
  }

  // 读取 XLSX 文件并获取数据
  function readXlsxData(file: any, override: boolean) {
    const reader = new FileReader();
    reader.onload = (event: any) => {
      const workbook = XLSX.read(event.target.result, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet: any = workbook.Sheets[sheetName];
      const data: any = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (data.length > 100000) {
        message.error({
          key: "upload",
          content: "单表件支持最大数据量100000条。该文件数据量已超过最大数据量，请分多个文件上传！",
          duration: 3
        });
        setUploading(false);
        return;
      }

      if (location.pathname.endsWith("/template")) {
        /**
         * sheetName 类型数据
         * sheetName2 类型属性数据
         * sheetName3 关系类型连接对象数据
         * */
        const sheetName2 = workbook.SheetNames[1];
        const worksheet2: any = workbook.Sheets[sheetName2];
        if (worksheet2.length > 100000) {
          message.error({
            key: "upload",
            content: "单表支持最大数据量100000条。类型属性表数据量已超过最大数据量，请分多个文件上传！",
            duration: 3
          });
          setUploading(false);
          return;
        }
        const sheetName3 = workbook.SheetNames[2];
        const worksheet3: any = workbook.Sheets[sheetName3];
        if (worksheet3.length > 100000) {
          message.error({
            key: "upload",
            content: "单表支持最大数据量100000条。关系类型连接对象表数据量已超过最大数据量，请分多个文件上传！",
            duration: 3
          });
          setUploading(false);
          return;
        }

        const typeAttrData: any = XLSX.utils.sheet_to_json(worksheet2, { header: 1 });
        const relationTypeBindData: any = XLSX.utils.sheet_to_json(worksheet3, { header: 1 });

        uploadTypes(data, typeAttrData, relationTypeBindData, override);
      } else {
        /**
         * sheetName 对象实例数据
         * sheetName2 对象实例关系数据表
         * */
        const sheetName2 = workbook.SheetNames[1];
        const worksheet2: any = workbook.Sheets[sheetName2];
        const relationData: any = XLSX.utils.sheet_to_json(worksheet2, { header: 1 });
        if (worksheet2.length > 100000) {
          message.error({
            key: "upload",
            content: "单表支持最大数据量100000条。实例关系表数据量已超过最大数据量，请分多个文件上传！",
            duration: 3
          });
          setUploading(false);
          return;
        }
        uploadObjects(data, relationData, override);
      }
    };
    reader.readAsBinaryString(file);
  }

  const uploadProps = (override = false) => ({
    fileList: [],
    accept: ".xlsx",
    beforeUpload: (file: any) => {
      if (!file || !file.name) return false;
      if (!file.name.endsWith(".xlsx")) {
        message.warning("上传文件类型错误，请上传xlsx文件！");
        return false;
      }

      message.loading({
        key: "upload",
        content: "导入中",
        duration: 0
      });
      setUploading(true);
      uploadCofirm && uploadCofirm.destroy();
      readXlsxData(file, override);
      return false;
    },
  });

  const handleUploadConfirm = function () {
    let title = "当前已存在对象实例，上传数据无法覆盖当前模板数据，只能新增，是否继续上传？";
    let footer = [
      <Button
        style={{ marginLeft: !location.pathname.endsWith("/template") || allObjects.length === 0 ? "16rem" : "23.2rem" }}
        onClick={() => { uploadCofirm && uploadCofirm.destroy(); }}
      >取消</Button>,
      <Upload {...uploadProps()}><Button type="primary">新增</Button></Upload>
    ]
    if (!location.pathname.endsWith("/template")) {
      title = "当前已存在实例数据，上传数据是否覆盖当前实例数据？";
      footer.push(<Upload {...uploadProps(true)} ><Button type="primary">覆盖</Button></Upload>);
    } else if (allObjects.length === 0) {
      title = "当前已存在模板数据，上传数据是否覆盖当前模板数据？";
      footer.push(<Upload {...uploadProps(true)} ><Button type="primary">覆盖</Button></Upload>);
    }
    uploadCofirm = modal.confirm({
      className: "pdb-upload-confirm",
      title,
      footer
    });
  }

  const handleDownload = function () {
    // 创建工作簿
    const workbook = XLSX.utils.book_new();

    // 创建工作表
    const exampleData: any = location.pathname.endsWith("/template") ? templateExampleData : objectExampleData;
    Object.keys(exampleData).forEach(function (sheetName) {
      const worksheet = XLSX.utils.json_to_sheet([]);
      Object.assign(worksheet, exampleData[sheetName]);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // 导出为XLSX文件
    XLSX.writeFile(workbook, '示例数据.xlsx');
  }

  return (
    <>
      <div className='pdb-graph-toolbar'>
        {!location.pathname.endsWith("/template") && tabs.map((tab) => (
          <Popover
            visible={tab.key === _.get(selectedTab, 'key', '') && tab.popover}
            placement="right"
            trigger="click"
            content={
              _.get(tab, 'key', '') === 'setting' ?
                renderSettingPanel() :
                renderFilterPanel()
            }
            title={_.get(tab, 'key', '') === 'filter' ? (
              <>
                <span>视图过滤</span>
                <span>
                  <Tooltip title="清空">
                    <i
                      className="operation-icon spicon icon-qingkonghuabu"
                      style={{ marginRight: 5 }}
                      onClick={clearFilter}
                    />
                  </Tooltip>
                  <i className="operation-icon spicon icon-guanbi" onClick={() => setSelectedTab(null)} />
                </span>
              </>
            ) : ''}
            rootClassName={_.get(tab, 'key', '') === 'filter' ? 'pdb-graph-toolbar-panel edit_tools pdb-param-editor' : ''}
            getPopupContainer={() => document.getElementsByClassName('pdb-object-graph-content')[0] as HTMLElement}
            arrow={false}
            onVisibleChange={(visible: boolean) => {
              if (!visible) setSelectedTab(null);
            }}
          >
            <Tooltip title={tab.label} placement="right">
              <div
                className={`pdb-graph-toolbar-item ${_.get(selectedTab, 'key', '') === tab.key ? 'selected' : ''} ${tab.key === 'reset' && (currentGraphTab === 'main' || operateDisabled) ? 'disabled' : ''}`}
                onClick={() => {
                  if (tab.key === 'reset' && currentGraphTab === 'main') return;
                  if (tab.popover) {
                    setSelectedTab(_.get(selectedTab, 'key', '') === tab.key ? null : tab);
                  }
                  tab.onClick && tab.onClick();
                }}
              >
                <div className="pdb-graph-toolbar-icon">
                  <i className={`operation-icon spicon ${tab.icon}`}></i>
                </div>
              </div>
            </Tooltip>
          </Popover>
        ))}
        <Tooltip
          title={
            <span>导入xlsx{location.pathname.endsWith("/template") ? "模板" : "实例"}数据 <a onClick={handleDownload}>示例数据</a></span>
          }
          placement="right"
        >
          {(location.pathname.endsWith("/template") ? typeList.length === 0 && relationList.length === 0 : allObjects.length === 0) ?
            <Upload {...uploadProps()} disabled={(uploading || operateDisabled)}>
              <div className={"pdb-graph-toolbar-item" + ((uploading || operateDisabled) ? " disabled" : "")} >
                <div className="pdb-graph-toolbar-icon">
                  <i className="operation-icon spicon icon-shangchuan"></i>
                </div>
              </div>
            </Upload> :
            <div className={"pdb-graph-toolbar-item" + ((uploading || operateDisabled) ? " disabled" : "")} onClick={handleUploadConfirm}>
              <div className="pdb-graph-toolbar-icon">
                <i className="operation-icon spicon icon-shangchuan"></i>
              </div>
            </div>
          }
        </Tooltip>
      </div>
      {contextHolder}
    </>
  )
}
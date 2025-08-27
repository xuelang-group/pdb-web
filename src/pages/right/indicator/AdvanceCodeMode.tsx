import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Col, Flex, message, Modal, Row, Space, Typography } from "antd";
import { ExclamationCircleFilled, ExclamationCircleOutlined } from "@ant-design/icons";
import { find, findLast, forEach, isArray, map } from "lodash";
import { INode } from "@antv/g6";
import { setCodeMode, setGraphData, setMetricParams, updateColumnConfig } from "@/reducers/indicatorAdvance";
import { StoreState } from "@/store";
import { inidcatorSymbolMap } from "@/utils/common";
import { MetricItem } from "@/reducers/indicatorSimple";
import './advanceCodeMode.less';

interface CodeItem {key: string; id: string; type: string; name: string; data?: {[key:string]: any};}

export default function AdvanceCodeMode() {
  const dispatch = useDispatch();
  const codeRef = useRef<HTMLDivElement | null>(null)
  const allIndicators = useSelector((state: StoreState) => state.indicator.list);
  const codeMode = useSelector((state: StoreState) => state.indicatorAdvance.codeMode);

  const [open, setOpen] = useState(false)
  const [code, setCode] = useState<CodeItem[]>([])
  const [content, setContent] = useState<string>('')
  const [insertIndex, setInsertIndex] = useState(-1)
  const [source, setSource] = useState<Array<any>>([])
  const [selectedMetrics, setSelectedMetrics] = useState<{[id: string | number]: string | number}>({})

  useEffect(() => {
    setOpen(codeMode)
    if (codeMode) {
      parseGraph2Code()
    }
  }, [codeMode]) 

  useEffect(() => {
    const contents = map(code, (item, index) => `<span class="${item.type}" data-index="${item.key}" contenteditable="${false}">${item.type === "symbol" ? inidcatorSymbolMap[item.name] : item.name}</span>`).join('').trim();

    setContent(contents)
  }, [code])

  useLayoutEffect(() => {
    const _range = window.getSelection()?.getRangeAt(0)
    if (codeRef.current && insertIndex > -1 && insertIndex !== _range?.startOffset) {
      const range = document.createRange()
      const sel = window.getSelection()
      if (sel) {
        range.selectNodeContents(codeRef.current)
        range.setStart(codeRef.current, insertIndex)
        range.collapse(true)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
  }, [content])

  // 根据嵌套的数组source数据获得展开的数组code数据
  const getCode = (data: Array<any>, parentKey?: string) => {
    const arr: any[] = []
    forEach(data, (item, index) => {
      const key = parentKey ? `${parentKey}-${index}` : `${index}`
      if (isArray(item)) {
        const children = getCode(item, key)
        arr.push({id: `${key}-l`, key, name: '(', type: 'kuo'})
        arr.push(...children)
        arr.push({id: `${key}-r`, key, name: ')', type: 'kuo'})
      } else {
        arr.push({id: item.id, key, name: item.label, type: item.type, data: item.data})
      }
    })
    return arr
  }

  // 根据graph的节点，向上游查询，获得Source数据
  const getSource = (node: INode) => {
    const inEdges = node.getInEdges()
    const nodeModel = node.getModel()
    const arr: any[] = []
    inEdges.forEach(edg => {
      const model = edg.getModel()
      const source = edg.getSource()
      const sourceModel = source.getModel()
      if (sourceModel.type === 'symbol') {
        const prevArr = getSource(source)
        model.end ? arr.unshift(prevArr) : arr.push(prevArr)
      } else {
        const item = {id: sourceModel.id, label: sourceModel.label, type: sourceModel.type, data: sourceModel.data}
        model.end ? arr.unshift(item) : arr.push(item)
      }
    })
    arr.splice(1, 0, {
      id: nodeModel.id,
      type: nodeModel.type,
      label: nodeModel.label,
      data: nodeModel.type === 'indicator' ? nodeModel.data : undefined})
    return arr
  }

  // 将graph数据解析为公式的code
  const parseGraph2Code = () => {
    const graph = (window as any).INDICATOR_GRAPH;
    if (!graph) return
    const endNode = graph.findById('end')
    if (endNode) {
      const symbol = endNode.getNeighbors('source')[0]        
      const data = symbol ? getSource(symbol) : []
      const _code = getCode(data)
      const metrics: {[id: string | number]: string | number} = {}
      forEach(_code, item => {
        if (item.data) {
          const { id, ori_id } = item.data
          metrics[id] = ori_id
        }
      })
      setSelectedMetrics(metrics)
      setCode(_code)
      setSource(data)
    }
  }

  const handleCancel = () => {
    dispatch(setCodeMode(false))
  }

  // 将展开的数组code数据转换为嵌套的Soure
  const parseCode2Source = () => {
    const arr: any[] = []
    let parent = arr
    let parentKeys = []  // 记录当前层级
    for (let i=0; i < code.length; i++) {
      const item = code[i]
      if (item.type === 'kuo') {
        if (item.name === '(') {
          const len = parent.length
          parent.push([])
          parent = parent[len]
          parentKeys.push(len)
        } else if (item.name === ')') {
          parentKeys.pop()
          parent = arr
          parentKeys.forEach((key: number) => {
            parent = parent[key]
          })
        }
      } else if (item.type === 'symbol') {
        parent.push({id: item.id, label: item.name, type: item.type})
      } else if (item.type === 'indicator') {
        parent.push({id: item.id, label: item.name, type: item.type, data: item.data})
      }
    }
    return arr
  }

  // 根据source获得画布中的nodes和edges
  const parseSource2GraphData = (arr: any[]) => {
    const nodes: any[] = []
    const edges: any[] = []
    arr.forEach((item, index: number) => {
      if (isArray(item)) {
        const children = parseSource2GraphData(item)
        nodes.push(...children.nodes)
        edges.push(...children.edges)
      } else {
        nodes.push(item)
      }
      if (index) {
        const prevSibling = arr[index - 1]
        const prevId = isArray(prevSibling) ? findLast(prevSibling, {type: 'symbol'})?.id : prevSibling.id
        if (item.type === 'symbol') {
          const edge = find(edges, {source: prevId})
          const source = edge ? edge.target : prevId
          const edg: {source: string; target: string; end?: boolean} = { source: source, target: item.id }
          if (['minus', 'divide'].includes(item.label)) edg.end = true
          edges.push(edg)
        } else {
          const id = isArray(item) ? findLast(item, {type: 'symbol'})?.id : item.id
          edges.push({source: id, target: prevId})
        }
      }
    })
    return {nodes, edges}
  }

  const handleOk = () => {
    // 验证括号
    const kuoLeft = [];
    const kuoRight = [];
    forEach(code, (item, index) => {
      if (item.type === 'kuo') {
        if (item.name === '(') {
          kuoLeft.unshift(index)
        } else {
          kuoRight.push(index)
        }
      }
    })
    if(kuoLeft.length !== kuoRight.length) {
      message.error('请检查括号！')
      return
    }
    const arr = parseCode2Source()
    const { nodes, edges } = parseSource2GraphData(arr)
    if (nodes.length) {
      nodes.push({id: 'end', label: '计算结果'})
      const lastSymbol = findLast(arr, {type: 'symbol'}) || findLast(nodes, {type: 'symbol'})
      if (lastSymbol) {
        edges.push({source: lastSymbol.id, target: 'end'})
      }
    } else {
      dispatch(updateColumnConfig([]))
      dispatch(setMetricParams())
    }
    dispatch(setGraphData({nodes, edges}))
    handleCancel()
  }

  const handleClick = (type: string, name: string, data?: {[key: string]: any}) => {
    const len = code.length || 0
    const index = (insertIndex < 0 || insertIndex > len) ? len : insertIndex
    const _code = JSON.parse(JSON.stringify(code))
    let id = `${Date.now()}`
    if (type === 'kuo') {
      const dir = name === '(' ? 'l' : 'r'
      id += `-${dir}`
    }
    const item: CodeItem = {key: '', id, type, name, data }
    _code.splice(index, 0, item)
    setCode(_code)
    setInsertIndex(index+1)
    if (type === 'indicator' && data) {
      setSelectedMetrics({...selectedMetrics, [data.id]: data.ori_id})
    }
  }

  const handleReset = () => {
    const _code = getCode(source)
    const metrics: {[id: string | number]: string | number} = {}
    forEach(_code, item => {
      if (item.data) {
        const { id, ori_id } = item.data
        metrics[id] = ori_id
      }
    })
    setSelectedMetrics(metrics)
    setCode(_code)
  }

  const handleClear = () => {
    setCode([])
    setSelectedMetrics({})
  }

  const handleInsert = () => {
    if (content === codeRef.current?.innerHTML) {
      const range = window.getSelection()?.getRangeAt(0)
      range && setInsertIndex(range?.startOffset)
    }
  }
  
  const handleKeydown = (e: any) => {
    if ((e.key === "Backspace" || e.key === "Delete")) {
      if (!!code.length && content === codeRef.current?.innerHTML) {
        e.preventDefault() 
        const _code = JSON.parse(JSON.stringify(code))
        const index = e.key === "Backspace" ? insertIndex - 1 : insertIndex
        const [removedItem] = _code.splice(index, 1)
        setCode(_code)
        setInsertIndex(index)
        if (removedItem.type === 'indicator') {
          const { id } = removedItem.data
          const selected = JSON.parse(JSON.stringify(selectedMetrics))
          delete selected[id]
          setSelectedMetrics(selected)
        }
      }
    } else if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)) {
      handleInsert()
    } else {
      e.preventDefault()
      console.log('--- key down: ', e.key)
      message.warning('请从下面列表中点选指标和运算符')
    }
  }
  console.log('insertIndex: ', insertIndex)
  
  return (
    <Modal
      title="编辑公式"
      forceRender
      open={open}
      width={800}
      onCancel={handleCancel}
      onOk={handleOk}
    >
      <Card
        title={
          <React.Fragment>
            <ExclamationCircleFilled />
            <span>
              请在下面的列表中点击选择“指标”和“运算符”及括号，不要直接输入！
            </span>
          </React.Fragment>
        }
        size="small"
        className="pdb-indicator-codemode"
        extra={
          <Space>
            <Button size="small" onClick={handleReset}>
              重置
            </Button>
            <Button size="small" onClick={handleClear}>
              清理
            </Button>
          </Space>
        }
      >
        <div
          className="code-wrap"
          ref={codeRef}
          contentEditable
          onBlur={handleInsert}
          onKeyDown={handleKeydown}
          onMouseUp={handleInsert}
          suppressContentEditableWarning={true}
          dangerouslySetInnerHTML={{ __html: content }}
        >
          {/* {map(code, (item, index) => (
            <span
              key={item.id}
              className={item.type}
              data-index={item.key}
              contentEditable={false}
            >
              {item.type === "symbol"
                ? inidcatorSymbolMap[item.name]
                : item.name}
            </span>
          ))} */}
        </div>
      </Card>
      <Row gutter={8} style={{ marginTop: 8 }}>
        <Col span={16}>
          <Card
            title="选择指标"
            size="small"
            className="pdb-indicator-codemode"
          >
            <ul className="list list-indicator">
              {map(allIndicators, (item: MetricItem) => {
                const curr = item.id && selectedMetrics[item.id];
                const ori = item.ori_id && selectedMetrics[item.ori_id];
                return (
                  <li
                    key={item.id}
                    className={curr || ori ? "item selected" : "item"}
                    onClick={() =>
                      handleClick("indicator", item.name_cn, {
                        id: item.id,
                        name: item.name,
                        name_cn: item.name_cn,
                        type: item.type,
                        ori_id: item.ori_id,
                      })
                    }
                  >
                    {item.type !== 2 ? (
                      <i className="item-icon iconfont icon-zhibiao"></i>
                    ) : (
                      <svg className="svg-icon" aria-hidden="true">
                        <use xlinkHref="#icon-gaojizhibiao"></use>
                      </svg>
                    )}
                    <span className="item-label">{item.name_cn}</span>
                    <span className="item-label2">{item.name}</span>
                    {/* {!curr && ori && <Tag style={{float: 'right'}}>历史版本</Tag>} */}
                  </li>
                );
              })}
            </ul>
          </Card>
        </Col>
        <Col span={8}>
          <Row gutter={8} style={{ marginBottom: 8 }}>
            <Col span={12}>
              <Button block onClick={() => handleClick("kuo", "(")}>
                （
              </Button>
            </Col>
            <Col span={12}>
              <Button block onClick={() => handleClick("kuo", ")")}>
                ）
              </Button>
            </Col>
          </Row>
          <Card title="运算符" size="small" className="pdb-indicator-codemode">
            <ul className="list list-symbol">
              {Object.keys(inidcatorSymbolMap).map((item) => (
                <li
                  className="item"
                  key={item}
                  onClick={() => handleClick("symbol", item)}
                >
                  <i className={"item-icon iconfont icon-yunsuanfu"}></i>
                  <span className="item-label">
                    运算符[ {inidcatorSymbolMap[item]} ]
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </Col>
      </Row>
    </Modal>
  );
}
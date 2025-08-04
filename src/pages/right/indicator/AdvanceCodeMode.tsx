import { Fragment, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Col, message, Modal, Row, Space } from "antd";
import { compact, filter, forEach, isArray, map, sortBy, values } from "lodash";
import { INode } from "@antv/g6";
import { setCodeMode } from "@/reducers/indicatorAdvance";
import { StoreState } from "@/store";
import { inidcatorSymbolMap } from "@/utils/common";
import { MetricItem } from "@/reducers/indicatorSimple";
import './advanceCodeMode.less';

export default function AdvanceCodeMode() {
  const dispatch = useDispatch();
  const codeRef = useRef<HTMLDivElement | null>(null)
  const allIndicators = useSelector((state: StoreState) => state.indicator.list);
  const codeMode = useSelector((state: StoreState) => state.indicatorAdvance.codeMode);

  const [open, setOpen] = useState(false)
  const [code, setCode] = useState<{key: string; name: string; type?: string; [prop: string]: any}[]>([])
  const [insertIndex, setInsertIndex] = useState(-1)
  const [source, setSource] = useState<Array<any>>([])
  const [selectedMetrics, setSelectedMetrics] = useState<{[id: string | number]: string | number}>({})

  useEffect(() => {
    setOpen(codeMode)
    if (codeMode) {
      parseGraph2Code()
    }
  }, [codeMode]) 

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
        const name = item.type === 'symbol' ? inidcatorSymbolMap[item.data.name] : item.data.name;
        arr.push({id: item.id, key, metricId: item.data.id, name, type: item.type})
      }
    })
    return arr
  }

  const getInArray = (node: INode) => {
    const inEdges = node.getInEdges()
    const nodeModel = node.getModel()
    const arr: any[] = []
    inEdges.forEach(edg => {
      const model = edg.getModel()
      const source = edg.getSource()
      const sourceModel = source.getModel()
      if (sourceModel.type === 'symbol') {
        const prevArr = getInArray(source)
        model.end ? arr.unshift(prevArr) : arr.push(prevArr)
      } else {
        const item = {id: sourceModel.id, type: sourceModel.type, data: sourceModel.data}
        model.end ? arr.unshift(item) : arr.push(item)
      }
    })
    arr.splice(1, 0, {id: nodeModel.id, type: nodeModel.type, data: nodeModel.type === 'indicator' ? nodeModel.data : {name: nodeModel.label}})
    return arr
  }

  const parseGraph2Code = () => {
    const graph = (window as any).INDICATOR_GRAPH;
    const endNode = graph.findById('end')
    if (!endNode) {
      message.warning('数据中缺少“计算结果”')
      return
    }
    const nodes = map(graph.getNodes(), item => {
      const model = item.getModel()
      if (model.type === 'indicator') return model.data
      return undefined
    })
    const symbol = endNode.getNeighbors('source')[0]
    const data = getInArray(symbol)
    const _code = getCode(data)
    const metrics: {[id: string | number]: string | number} = {}
    forEach(compact(nodes), item => {
      metrics[item.id] = item.ori_id
    })
    setSelectedMetrics(metrics)
    setCode(_code)
    setSource(data)
  }

  const handleCancel = () => {
    dispatch(setCodeMode(false))
  }

  const parseCode2Source = () => {
    const arr = []
    console.log('--- code: ', code)
    forEach(code, (item, index) => {
      if (item.type === 'kuo') {
        if (item.name === '(') {
          arr.push([])
        }
      }
    })}

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
  }

  const handleClick = ({type, name, metricId}: any) => {
    const children = codeRef.current?.childNodes
    const len = children?.length ? children?.length : 0
    const index = (insertIndex < 0 || insertIndex > len) ? len : insertIndex
    const _code = JSON.parse(JSON.stringify(code))
    const item: {id: string; type: string; name: string; [prop: string]: any} = {id: `${Date.now()}`, type, name }
    if (metricId) item.metricId = metricId
    _code.splice(index, 0, item)
    setCode(_code)
    setInsertIndex(index+1)
  }

  const handleClear = () => {
    console.log('--- handleChange: ', code)
  }

  const handleBlur = () => {
    const range = window.getSelection()?.getRangeAt(0)
    range && setInsertIndex(range?.startOffset)
    console.log('--- handleBlur: ', range?.startOffset)
  }
  
  const handleKeydown = (e: any) => {
    if ((e.key === "Backspace" || e.key === "Delete") && !!code.length) {
      e.preventDefault()
      const _code = JSON.parse(JSON.stringify(code))
      const index = e.key === "Backspace" ? insertIndex - 1 : insertIndex
      _code.splice(index, 1)
      setCode(_code)
      setInsertIndex(index)
    } else if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)) {
      handleBlur()
    } else {
      e.preventDefault()
      message.warning('请从下面列表中点选指标和运算符')
    }

  }

  const renderCode = (data: Array<any>, parentIndex:number) => {
    return map(data, (item, index) => {
      if (isArray(item)) {
        const arr: any[] = renderCode(item, parentIndex)
        return (
          <Fragment key={`${parentIndex}-${index}`}>
          <span className="kuo" id={`${parentIndex}-${index}-l`} contentEditable={false}>(</span>
            {arr}
          <span className="kuo"id={`${parentIndex}-${index}-r`} contentEditable={false}>)</span>
          </Fragment>
        )
      } else {
        const name = item.type === 'symbol' ? inidcatorSymbolMap[item.data.name] : item.data.name;
        return <span key={item.id} className={item.type} id={item.id} data-index={`${parentIndex}-${index}`} contentEditable={false}>{name}</span>
      }
    })
  }
  
  return (
    <Modal
      className="pdb-indicator-modal"
      title="编辑公式" forceRender
      open={open} width={800}
      onCancel={handleCancel}
      onOk={handleOk}
    >
      <Card title="计算结果 =" size="small" className="pdb-indicator-codemode" extra={<Button size="small" onClick={handleClear}>清理</Button>}>
        {/* <Input value={code} /> */}
        <div
          className="code-wrap"
          ref={codeRef}
          contentEditable
          onBlur={handleBlur}
          onKeyDown={handleKeydown}
          suppressContentEditableWarning={true}
          // dangerouslySetInnerHTML={{ __html: value }}
        >
          { map(code, (item, index) => (<span key={item.id} className={item.type} data-index={item.key} contentEditable={false}>{item.name}</span>)) }
          {/* {open && renderCode(source, 0)} */}
        </div>
      </Card>
      <Row gutter={8} style={{marginTop: 8}}>
        <Col span={16}>
          <Card title="选择指标" size="small" className="pdb-indicator-codemode">
            <ul className="list list-indicator">
              {
                map(allIndicators, (item: MetricItem) => {
                  const curr = item.id && selectedMetrics[item.id]
                  const ori = item.ori_id && selectedMetrics[item.ori_id]
                  return (
                    <li key={item.id} className={curr || ori ? 'selected' : ''}
                      onClick={() => handleClick({type: 'indicator', name: item.name, metricId: item.id})}
                    >
                      {
                        item.type !== 2 ? <i className="item-icon iconfont icon-zhibiao"></i> :
                        <svg className="svg-icon" aria-hidden="true">
                          <use xlinkHref="#icon-gaojizhibiao">
                          </use>
                        </svg>
                      }
                      <span className='item-label'>{item.name}</span>
                      <span className='item-label2'>{item.name_cn}</span>
                      {/* {!curr && ori && <Tag style={{float: 'right'}}>历史版本</Tag>} */}
                    </li>
                  )
                })
              }
            </ul>
          </Card>
        </Col>
        <Col span={8}>
          <Row gutter={8} style={{marginBottom: 8}}>
            <Col span={12}>
              <Button block onClick={() => handleClick({type: 'kuo', name: '('})}>（</Button>
            </Col>
            <Col span={12}>
              <Button block onClick={() => handleClick({type: 'kuo', name: ')'})}>）</Button>
            </Col>
          </Row>
          <Card title="运算符" size="small" className="pdb-indicator-codemode">
            <ul className="list list-symbol">
            {
              Object.keys(inidcatorSymbolMap).map(item => (
                <li key={item}
                  onClick={() => handleClick({type: 'symbol', name: inidcatorSymbolMap[item]})}
                >
                  <i className={'item-icon iconfont icon-yunsuanfu'}></i>
                  <span className='item-label'>运算符[ {inidcatorSymbolMap[item]} ]</span>
                </li>)
              )
            }
            </ul>
          </Card>
        </Col>
      </Row>
    </Modal>
  )
}
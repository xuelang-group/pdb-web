import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Col, Input, message, Modal, Row } from "antd";
import { compact, forEach, isArray, map } from "lodash";
import { INode } from "@antv/g6";
import { setCodeMode } from "@/reducers/indicatorAdvance";
import { StoreState } from "@/store";
import { inidcatorSymbolMap } from "@/utils/common";
import { MetricItem } from "@/reducers/indicatorSimple";
import './advanceCodeMode.less';

export default function AdvanceCodeMode() {
  const dispatch = useDispatch();
  const allIndicators = useSelector((state: StoreState) => state.indicator.list);
  const codeMode = useSelector((state: StoreState) => state.indicatorAdvance.codeMode);

  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [source, setSource] = useState<Array<any>>([])
  const [selectedMetrics, setSelectedMetrics] = useState<{[id: string | number]: string | number}>({})

  useEffect(() => {
    setOpen(codeMode)
    if (codeMode) {
      parseGraph2Code()
    }
  }, [codeMode]) 

  const getCode = (data: Array<any>) => {
    const arr: string[] = []
    forEach(data, item => {
      if (isArray(item)) {
        const str = getCode(item)
        arr.push(`( ${str} )`)
      } else {
        const name = item.type === 'symbol' ? inidcatorSymbolMap[item.data.name] : item.data.name;
        arr.push(name)
      }
    })
    return arr.join(' ')
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

  const handleOk = () => {

  }

  const handleClick = (item: any) => {

  }

  const handleChange = (e: any) => {
    console.log('--- handleChange: ', e.target)
  }
  
  const handleKeydown = (e: any) => {
    console.log('--- key down: ', e)
    const regex = /^[a-z0-9]+$/;
    if (regex.test(e.key) && !(e.ctrlKey && e.key === 'z')) {
      e.preventDefault()
      message.warning('请从下面列表中点选指标和运算符')
    }
    // if (e.key === ')' || e.key === '(') {
      
    // }
    // // 32: 空格; 37: 向左; 39: 向右; 40: 向下; 38: 向上
    // // 8: "Backspace"; 46: "Delete"; 
    // // 16: Shift; 17: Control; 18: Alt; 
    // if (![32, 37, 39, 38, 40, 8, 46].includes(e.keyCode) && !(e.ctrlKey && e.key === 'z')) {

    // }
  }

  const renderCode = (data: Array<any>, parentId?:number | string) => {
    return map(data, (item, index) => {
      if (isArray(item)) {
        const arr: any[] = renderCode(item, parentId)
        return (
          <>
          <span className="kuo" id={`${parentId}-${index}-l`}>(</span>
            {arr}
          <span className="kuo"id={`${parentId}-${index}-r`}>)</span>
          </>
        )
      } else {
        const name = item.type === 'symbol' ? inidcatorSymbolMap[item.data.name] : item.data.name;
        return <span className={item.type} id={item.id} contentEditable={false}>{name}</span>
      }
    })
  }
  
  return (
    <Modal
      className="pdb-indicator-modal"
      title="编辑公式"
      open={open} width={800}
      onCancel={handleCancel}
      onOk={handleOk}
    >
      <Card title="计算结果 =" size="small" className="pdb-indicator-codemode">
        {/* <Input value={code} /> */}
        <div className="code-wrap" contentEditable onKeyDown={handleKeydown} onChange={handleChange}>
          {renderCode(source)}
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
                    <li key={item.id} className={curr || ori ? 'selected' : ''}>
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
          <Card title="运算符" size="small" className="pdb-indicator-codemode">
            <ul className="list list-symbol">
            {
              Object.keys(inidcatorSymbolMap).map(item => (
                <li key={item}
                  onClick={() => handleClick({type: 'symbol', label: item})}
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
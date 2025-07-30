import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Col, Modal, Row, Space, Typography } from "antd";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { compact, filter, find, forEach, isEmpty, keys, map } from "lodash";
import { ColumnConfig, setCodeMode, updateColumnConfig } from "@/reducers/indicatorAdvance";
import { CsvHeaderState } from "@/reducers/query";
import { StoreState } from "@/store";
import { inidcatorSymbolMap } from "@/utils/common";
import { MetricItem } from "@/reducers/indicatorSimple";
import './advanceCodeMode.less'

export default function AdvanceCodeMode() {
  const dispatch = useDispatch();
  const allIndicators = useSelector((state: StoreState) => state.indicator.list);
  const codeMode = useSelector((state: StoreState) => state.indicatorAdvance.codeMode);

  const [open, setOpen] = useState(false)

  const parseGraph2Code = () => {
    const graph = (window as any).INDICATOR_GRAPH;
    const { nodes, edges } = graph.save();
    const arr = []
    const lastEdges = filter(edges, {target: 'end'})
    forEach(lastEdges, (edg) => {
      const node = find(nodes, {id: edg.source})
      const data = node.type === 'indicator' && node.data
      if (edg.end)
      arr.unshift({id: node.id, type: node.type, data})
    })
  }

  useEffect(() => {
    setOpen(codeMode)
    if (codeMode) {
    }
  }, [codeMode])

  const handleCancel = () => {
    dispatch(setCodeMode(false))
  }

  const handleOk = () => {

  }

  const handleClick = (item: any) => {

  }
  
  return (
    <Modal
      className="pdb-indicator-modal"
      title="编辑公式"
      open={open} width={800}
      onCancel={handleCancel}
      onOk={handleOk}
    >
      <Card title="计算结果 =" size="small" className="pdb-indicator-codemode"></Card>
      <Row gutter={8} style={{marginTop: 8}}>
        <Col span={16}>
          <Card title="选择指标" size="small" className="pdb-indicator-codemode">
            <ul className="list list-indicator">
              {
                map(allIndicators, (item: MetricItem) => (
                  <li key={item.id}>
                    {
                      item.type !== 2 ? <i className="item-icon iconfont icon-zhibiao"></i> :
                      <svg className="svg-icon" aria-hidden="true">
                        <use xlinkHref="#icon-gaojizhibiao">
                        </use>
                      </svg>
                    }
                    <span className='item-label'>{item.name}</span>
                    <span className='item-label2'>{item.name_cn}</span>
                  </li>
                ))
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
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, Space, Typography } from "antd";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { compact, filter, isEmpty, keys, map } from "lodash";
import { ColumnConfig, updateColumnConfig } from "@/reducers/indicatorAdvance";
import { CsvHeaderState } from "@/reducers/query";
import { StoreState } from "@/store";
import { typeIconMap } from "@/utils/common";

interface CfgModalProps {
  visible: boolean;
  columnsMap: {
    [metricId: string]: {
      id: string;
      name: string;
      name_cn: string;
      type: number;
      columns: CsvHeaderState[];
      [key: string]: any;
    }
  };
  onCancel: Function;
}


export default function ColumnConfigModal({visible, columnsMap, onCancel}: CfgModalProps) {
  const dispatch = useDispatch();
  const column_config = useSelector(
    (state: StoreState) => state.indicatorAdvance.column_config
  );
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([]); // 维度对齐配置
  const [focusCell, setFocusCell] = useState<[number, number]>()
  
  useEffect(() => {
    if (visible) {
      const cfg = isEmpty(column_config) ? [{
        cols: [],
        conditions: [],
        name: '',
        id: `${Date.now()}`
      }] : column_config
      setColumnConfig(cfg)
    }
  }, [visible]);
  
  // 维度对齐- 增加一行
  const handleAddColCfg = (index: number) => {
    const cfg = JSON.parse(JSON.stringify(columnConfig))
    cfg.splice(index+1, 0, {
      cols: [],
      conditions: [],
      name: '',
      id: `${Date.now()}`
    })
    setColumnConfig(cfg)
  }

  // 维度对齐- 删除一行
  const handleDelColCfg = (index: number) => {
    const cfg = JSON.parse(JSON.stringify(columnConfig))
    cfg.splice(index, 1)
    setColumnConfig(cfg)
    if (focusCell && focusCell[1] == index) {
      setFocusCell(undefined)
    }
  }

  // id: 子节点指标id； header: 双击选择的维度
  const handleDblClick = (metric: {id: string; name: string; name_cn: string;}, header: CsvHeaderState) => {
    // 双击子节点指标维度，完成对齐
    if (!focusCell) return
    const cfg = JSON.parse(JSON.stringify(columnConfig))
    const [colIndex, rowIndex] = focusCell
    cfg[rowIndex].cols[colIndex] = { ...header, metric }
    setColumnConfig(cfg)
  }

  // 维度对齐- 确认
  const handleOk = () => {
    const cfg = map(filter(columnConfig, item => !isEmpty(item.cols)), item => ({...item, type: compact(item.cols)[0].attrType}))
    dispatch(updateColumnConfig(cfg))
    handleCancel()
  }

  const handleCancel = () => {
    setColumnConfig([{
      cols: [],
      conditions: [],
      name: '',
      id: `${Date.now()}`
    }])
    setFocusCell(undefined)
    onCancel()
  }
    console.log('--- columnConfig', columnConfig)

  return (
      <Modal
        className="pdb-indicator-modal"
        title="维度对齐"
        open={visible} width={800}
        onCancel={handleCancel}
        onOk={handleOk}
      >
        <div className="pdb-indicator-align">
          <div className="pdb-indicator-align-fix">
            <div className="th"></div>            
            { map(columnConfig, (item, index) => (
              <div className="td " key={item.id}>
                <Typography.Text>{index + 1}</Typography.Text>
                <div className="operator">
                  <Space>
                    <MinusCircleOutlined  className="icon-del" onClick={() => handleDelColCfg(index)} />
                    <PlusCircleOutlined className="icon-add" onClick={() => handleAddColCfg(index)} />
                  </Space>
                </div>
              </div>
              )) }
            <div className="td">
              {/* <Button size="small" shape="circle" icon={<PlusOutlined />} /> */}
            </div>
          </div>
          {
            keys(columnsMap).map((id: string, colIndex: number) => (
              <div className="col" key={id}>
                <div className="th">
                  {
                    columnsMap[id].type !== 2 ? <i className="iconfont icon-zhibiao" /> :
                    <svg className="svg-icon" aria-hidden="true">
                      <use xlinkHref="#icon-gaojizhibiao">
                      </use>
                    </svg>
                  }
                  <b>{columnsMap[id].name}</b>
                </div>
                { map(columnConfig, (item, rowIndex) => {
                  const attrs = filter(item.cols, item => item?.metric.id === id)
                  const focus = focusCell?.[0] === colIndex && focusCell?.[1] == rowIndex
                  return (
                    <div className="td" key={item.id}>
                      <div className={`cell ${focus ? 'focus' : ''}`} onClick={() => setFocusCell(focus ? undefined : [colIndex, rowIndex])}>
                      { isEmpty(attrs) ? null : attrs.map(attr => (<span key={attr.attrId}>{attr.attrName}</span>)) }
                      </div>
                    </div>
                  )
                }) }
                <ul className={focusCell?.[0] === colIndex ? 'list' : 'list disabled'}>
                  {
                    map(columnsMap[id]['columns'], (item: CsvHeaderState) => {
                      const cols = compact(focusCell ? columnConfig[focusCell?.[1]]?.cols : [])
                      const type = cols[0]?.attrType
                      const disabled = focusCell?.[0] !== colIndex || type && typeIconMap[type] !== typeIconMap[item?.attrType]
                      return (
                        <li key={item.attrId} className={disabled ? 'disabled' : ''} onClick={() => !disabled && handleDblClick({id, name: columnsMap[id].name, name_cn: columnsMap[id].name_cn}, item)}>
                          <i className={`iconfont icon-${typeIconMap[item.attrType]}`} />
                          {item.attrName}
                        </li>
                      )
                    })
                  }
                </ul>
              </div>
            ))
          }
        </div>
      </Modal>
    )
}
import { Descriptions, Table, Typography } from "antd";
import { useSelector } from 'react-redux';
import type { StoreState } from '@/store';
import { AttrConfig } from "@/reducers/type";
import { clone, get } from "lodash";
import { useEffect, useRef, useState } from "react";

interface DiffProps {
  maxHeight: number;
  attrs: Array<AttrConfig>;
  deletedNames: string[];
  createdNames: string[];
  modifyNames: {[key:string]: string[]};
  expandedRowKeys: string[];
  changeExpandedKeys: Function;
}

export default function DiffAttrTable(props: DiffProps) {
  const tableRef = useRef(null)
  const typesMap = useSelector((state: StoreState) => state.editor.typeMap);
  const [scroll, setScroll] = useState<{y?: number}>()

  const updateScroll = () => {
    if (tableRef.current) {
      const tb:any = tableRef.current
      const h = tb?.offsetHeight
      if (h > props.maxHeight) {
        setScroll({y: props.maxHeight})
      } else {
        setScroll(undefined)
      }
      console.log(h, props.maxHeight)
    }
  }

  useEffect(() => { 
    updateScroll()
  }, [props.maxHeight, props.expandedRowKeys])

  const getClassNames = (name: string, key: string) => {
    if (props.createdNames.includes(name)) return 'pdb-diff-new'
    if (props.deletedNames.includes(name)) return 'pdb-diff-del'
    if (props.modifyNames[name] && props.modifyNames[name].includes(key)) return 'pdb-diff-mod'
    return ''
  }

  const columns = [{
    dataIndex: 'name',
    key: 'name',
    title: <>名称<Typography.Text type="secondary" className="pdb-diff-title-small">(唯一标识)</Typography.Text></>,
    render: (text: string) => <span className={getClassNames(text, 'name')}>{text}</span>
  }, {
    dataIndex: 'display',
    key: 'display',
    title: '展示名称',
    render: (text: string, record: AttrConfig) => <span className={getClassNames(record.name, 'display')}>{text}</span>
  }, {
    dataIndex: 'type',
    key: 'type',
    title: '类型',
    render: (text: string, record: AttrConfig) => <span className={getClassNames(record.name, 'type')}>{text}</span>
  }]

  const AttrLabel = {
    "default": "默认值",
    "required": "是否必填",
    "datetimeFormat": "日期时间格式",
    "frontType": "前端自定义类型",
    "override": "继承类型",
  }
  
  const getChildren = (key: string, value: any) => {
    switch (key) {
      case 'required':
        return value ? '是' : '否'
      case 'override':
        return typesMap[value] ? typesMap[value]["x.type.name"] : <Typography.Text ellipsis>{value}</Typography.Text>
      default:
        return value || '--'
    }
  }

  const expandedRowRender = (record: AttrConfig) => {
    const items = Object.keys(record)
                  .filter(key => !['name', 'display', 'type'].includes(key))
                  .map((key) => ({
                    label: get(AttrLabel, key, ''),
                    span: 2,
                    children: getChildren(key, get(record, key, ''))
                  }));
    return (
      <Descriptions style={{margin: '0 4px'}}
        size="small"
        items={items}
      />
    )
  }

  const handleExpand = (expanded: boolean, record: AttrConfig) => {
    const index = props.expandedRowKeys.indexOf(record.name);
    if (expanded && index == -1) {
      props.changeExpandedKeys([...props.expandedRowKeys, record.name])
    }
    if (!expanded && index > -1) {
      const keys = clone(props.expandedRowKeys);
      keys.splice(index, 1)
      props.changeExpandedKeys(keys)
    }
  }

  return (
    <Table rowKey="name" className="pdb-table-scroll pdb-diff-table"
      ref={tableRef}
      rowHoverable={false}
      size="small" bordered
      columns={columns}
      dataSource={props.attrs}
      expandable={{
        expandedRowRender: expandedRowRender,
        expandedRowKeys: props.expandedRowKeys,
        columnWidth: 34,
        onExpand: handleExpand
      }}
      pagination={false}
      scroll={scroll}
    />
  )
}
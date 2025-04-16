import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input, notification, Modal, Tabs, Typography, Col, Row, Card, Checkbox, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons'
import { isEmpty } from 'lodash';
import { StoreState } from '@/store';
import { setObjectDetail, setVersionControl } from '@/reducers/object';
import { setControl } from '@/actions/object';

export default function VersionControlModal() {
  const dispatch = useDispatch();
  const { open, data, id } = useSelector((state: StoreState) => state.object.versionControl);
  const typesMap = useSelector((state: StoreState) => state.editor.typeMap);
  
  const [selectedAttrs, setSelectedAttrs] = useState<string[]>([])
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false)

  const getSelectedAttrs = () => {
    if (!data || isEmpty(selectedAttrs)) return []
    const type = typesMap[data['x.type.id']]
    const attrs = type['x.type.version.attrs'] || []
    return attrs.filter((at) => selectedAttrs?.includes(at.name))
  }
  const onRemoveAttr = (val: string) => {
    const index = selectedAttrs.indexOf(val)
    if (index > -1) {
      const attrs = [...selectedAttrs]
      attrs.splice(index, 1)
      setSelectedAttrs(attrs)
    }
  }

  const handleConfirm = () => {
    if(!data) return
    setConfirmLoading(true)
    const xId = data['x.object.id']
    const version = data['x.object.version']
    const options = {
      'x.object.version': !version,
      'x.object.version.control': {
        'x.object.version.control.value.change': true,
        'x.object.version.control.value.attrlist': selectedAttrs
      },
    }
    setControl({
      'x.object.id': xId,
      ...options,
    }, (success: boolean, response: any) => {
      setConfirmLoading(false)
      if (success) {
        // 更新 setObjectDetail、画布中对应node的data、current
        dispatch(setVersionControl())
        dispatch(setObjectDetail({id: xId, options}))
        const graph = (window as any).PDB_GRAPH        
        const node = graph.findById(id)
        if (node) {
          node.update({
            data: {
              ...data,
              ...options
            }
          })
          graph.emit('node:click', {
            item: node,
            shape: node.get('keyShape')
          });
        }
      } else {
        notification.error({
          message: '设置对象版本控制失败',
          description: response.message || response.msg
        });
      }
    })
  }

  const handleCancel = () => {
    dispatch(setVersionControl())
  }

  useEffect(() => {
    const versionControl = data?.['x.object.version.control']
    if (data && !isEmpty(versionControl)) {
      const attrlist = versionControl['x.object.version.control.value.attrlist'] || []
      setSelectedAttrs(attrlist)
    } else {
      setSelectedAttrs([])
    }
  }, [data])

  const renderAttrs = () => {
    if (!data) return null
    const type = typesMap[data['x.type.id']]
    const attrs = type['x.type.version.attrs']
    return (
      <>
        <Typography.Text >请勾选可触发实例版本更新的属性：</Typography.Text>
        <Row gutter={12} style={{marginTop: 12 }}>
          <Col span={12}>
            <Card
              title="属性列表"
              type="inner"
              size='small'
              extra={<Typography.Text >{selectedAttrs.length}/{attrs?.length} 项</Typography.Text>}
            >
              <div className='pdb-version-search-wrapper'>
                <Input allowClear placeholder='搜索...'
                  suffix={
                    <a className='pdb-version-search-icon'><i className="spicon icon-sousuo2"></i></a>
                  }
                />
              </div>
              <Checkbox.Group
                className='pdb-version-checkbox-group'
                value={selectedAttrs}
                onChange={(values) => setSelectedAttrs(values)}
              >
                  {attrs?.map(at => (
                      <Checkbox key={at.name} value={at.name}>
                        <Space><span>{at.display}</span>
                        <Typography.Text type='secondary'>{at.name}</Typography.Text>
                        </Space>
                      </Checkbox>
                  ))}
              </Checkbox.Group>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="已选属性" type="inner" size='small' extra={<Typography.Text >{selectedAttrs.length} 项</Typography.Text>}>
              <div className='pdb-version-search-wrapper'>
                <Input allowClear placeholder='搜索...'
                  suffix={
                    <a className='pdb-version-search-icon'><i className="spicon icon-sousuo2"></i></a>
                  }
                />
              </div>
              <div className='pdb-version-attrs-wrapper'>
                <ul className='pdb-version-attrs'>
                  {getSelectedAttrs().map(at => (
                    <li key={at.name}>
                      <Space>
                        <span>{at.display}</span>
                        <Typography.Text type='secondary'>{at.name}</Typography.Text>
                      </Space>
                      <a className='pdb-version-attrs-icon' onClick={() => onRemoveAttr(at.name)}><DeleteOutlined /></a>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </Col>
        </Row>
      </>
    )
  }

  const renderTimes = () => {
    return `暂无`
  }

  return (
    <Modal
      open={open}
      title="配置实例版本控制"
      width={900}
      destroyOnClose
      confirmLoading={confirmLoading}
      onOk={handleConfirm}
      onCancel={handleCancel}
    >
      <Tabs type="card" className='pdb-tabs-version'
        items={[
          {
            key: 'attrs',
            label: '依据属性值变化',
            children: renderAttrs()
          }, {
            key: 'times',
            label: '依据时间周期',
            children: renderTimes()
          }
        ]}
      />
    </Modal>
  )
}
import G6 from '@antv/g6';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Dropdown, Flex, Form, Input, message, Modal, notification, Radio, Space, Typography } from 'antd';
import { DownOutlined, RollbackOutlined, SaveOutlined, ExclamationCircleFilled } from '@ant-design/icons'

import type { StoreState } from '@/store';
import type { ObjectConfig } from '@/reducers/object';
import { nodeStateStyle } from '@/g6/node';
import { labelThemeStyle } from '@/g6/edge';
import { find, findIndex, map, set } from 'lodash';
import { setCurrentVersion, setDiffModalOpen, setDiffVersion, setTypes, setVersionList, TypeConfig, TypeVersionConfig } from '@/reducers/type';
import { setCurrentEditModel, setIsEditing, setTypeMap } from '@/reducers/editor';
import DiffVersionPane from './DiffVersionPane';
import DiffVersionModal from './DiffVersionModal';
import './index.less';
import { changeTypeVerison, checkChildrenObject, checkObject, checkReferLock, getTypeInfo, getTypeVerisonList } from '@/actions/type';

let graph: any;

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 17 },
};

export default function Editor(props: any) {
  const dispatch = useDispatch();
  const graphRef = useRef(null);
  const graphData = useSelector((state: StoreState) => state.object.graphData);
  const currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel);
  const typeMap = useSelector((state: StoreState) => state.editor.typeMap);
  const currentVersion = useSelector((state: StoreState) => state.type.currentVersion);
  const diffVersion = useSelector((state: StoreState) => state.type.diffVersion);
  const versionList = useSelector((state: StoreState) => state.type.versionList);
  const types = useSelector((state: StoreState) => state.type.data);
  
  const [form] = Form.useForm();
  const changeMethod = Form.useWatch('changeMethod', form);
  const [startOpen, setStartOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [currentEditDefaultData, setCurrentEditDefaultData] = useState()
  const [referLock, setReferLock] = useState()
  const [hasObject, setHasObject] = useState()
  const [hasReferObject, setHasReferObject] = useState()

  useEffect(() => {
    const container: any = graphRef.current;
    if (!container || !container.clientWidth || !container.clientHeight || !graph) return;
    graph.changeSize(container.clientWidth, container.clientHeight);
    graph.paint();
    graph.fitCenter();
  }, [currentEditModel?.id]);

  useEffect(() => {
    const currentEditDefaultData = JSON.parse(JSON.stringify(currentEditModel?.data || {}));
    setCurrentEditDefaultData(currentEditDefaultData)
    if (currentEditDefaultData["x.type.id"]) {
      const typeId = currentEditDefaultData["x.type.id"]
      checkObject(graphData.id, typeId, (success: boolean, response: any) => {   
        if (success) setHasObject(response)
      })   
      checkChildrenObject(graphData.id, typeId, (success: boolean, response: any) => {
        if (success) setHasReferObject(response)
      })
      checkReferLock(graphData.id, typeId, (success: boolean, response: any) => {
        if (success) setReferLock(response)
      })
    }
  }, [currentEditModel])

  function initLayout(data: Array<ObjectConfig>) {
    const container: any = graphRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight || 500;
    graph = new G6.Graph({
      container,
      width,
      height,
      modes: {
        default: ['drag-canvas', 'zoom-canvas', 'drag-node']
      },
      defaultNode: {
        type: 'circle-node',
        style: nodeStateStyle.default,
        labelCfg: {
          style: {
            fontSize: 14,
            fill: '#1C2126'
          }
        }
      },
      defaultEdge: {
        type: 'quadratic',
        style: {
          stroke: '#F77234',
          lineWidth: 2,
          endArrow: true,
          cursor: 'pointer'
        },
        labelCfg: {
          autoRotate: true,
          style: {
            background: {
              fill: labelThemeStyle[props.theme].background,
              padding: [2, 2, 2, 2],
            },
          },
        },
      },
      linkCenter: true
    });
    graph.get('canvas').set('localRefresh', false);
    graph.render();
    if (typeof window !== 'undefined') {
      window.onresize = () => {
        setTimeout(function () {
          if (!graph || graph.get('destroyed')) return;
          const container: any = graphRef.current;
          if (!container || !container.clientWidth || !container.clientHeight) return;
          graph.changeSize(container.clientWidth, container.clientHeight);
        }, 0);
      };
    }

    (window as any).PDB_GRAPH = graph;
  }

  const backToLatest = () => {
    dispatch(setCurrentVersion(undefined))
  }

  const handleDiffVersion = () => {
    dispatch(setDiffModalOpen(true))
  }

  const handleSelectVersion = ({ key }: {key: string}) => {
    const version = find(versionList, {'x.type.version.id': key})
    dispatch(setCurrentVersion(version))
  }

  useEffect(() => {
    initLayout([]);

    return () => {
      graph?.destroy();
      graph = null;
      (window as any).PDB_GRAPH = null;
    }
  }, []);

  useEffect(() => {
    dispatch(setIsEditing(!currentVersion))
  }, [currentVersion])

  const handleChangeVersion = (values: {[key:string]: any}, objectSyncMethod=0) => {    
    currentVersion ? changeTypeVerison({
      graphId: graphData.id,
      "x.type.version.id": currentVersion['x.type.version.id'],
      "x.type.version.name": currentVersion['x.type.version.name'],
      objectSyncMethod,
      ...values
    }, (success: boolean, response: any) => {
      setStartLoading(false)
      if (success) {
        setStartOpen(false)
        message.success('启用历史版本成功');
        const typeId = currentEditDefaultData?.['x.type.id']
        if (!typeId) return
        // 更新当前对象
        getTypeInfo(graphData?.id, [typeId], (success: boolean, response: any) => {
          if (success) {
            const type = response[0]
            const newTypes: TypeConfig[] = JSON.parse(JSON.stringify(types));
            const index = findIndex(newTypes, tp => tp['x.type.id'] == typeId);
            newTypes[index] = type
            dispatch(setCurrentEditModel(Object.assign({}, currentEditModel, {data: type})))
            dispatch(setTypes(newTypes));
          }
        })
        // 并更新版本列表
        getTypeVerisonList(graphData.id, {'x.type.id': typeId}, (success: boolean, response: any) => {
          if (success) {
            dispatch(setVersionList(response.list))
          }
        })
      } else {
        notification.error({
          message: '启用历史版本失败',
          description: response.message || response.msg
        })
      }
    }): notification.error({
      message: '启用历史版本失败',
      description: '尚未选择版本'
    })
  }

  const handleConfirm = (objectSyncMethod: number) => {
    form.validateFields().then((values: { [key: string]: any; }) => {
      setStartLoading(true)
      handleChangeVersion(values, objectSyncMethod)
    }).catch(err => {})
  }

  const handleStartOk = () => {
    if (!!changeMethod && (hasObject || hasReferObject)) {
      setStartOpen(false)
      setConfirmOpen(true)
    } else {
      form.validateFields().then((values: { [key: string]: any; }) => {
        setStartLoading(true)
        handleChangeVersion(values)
      }).catch(err => {})
    }
  }
  const handleStartCancel = () => {
    setStartOpen(false)
  }

  const handleClickStart = () => {
    setStartOpen(true)
    form.setFieldValue('changeMethod', 0)
  }

  const renderVersions = () => {
    if (diffVersion) {
      return (
        <div className='pdb-type-version'>
          <Flex justify="space-between" align="center">
            <Typography.Text strong>版本对比</Typography.Text>
            <Button type="primary" icon={<RollbackOutlined />} onClick={() => dispatch(setDiffVersion(undefined))}>退出版本对比</Button>
          </Flex>
        </div>
      )
    }
    const items = map(versionList, (v: TypeVersionConfig) => ({ key: v["x.type.version.id"], label: v["x.type.version.name"] ? `V${v["x.type.version.name"]}` : '--'}));
    let latestVersionName
    let latestVersionId
    if (currentEditDefaultData) {
      const typeId = currentEditDefaultData['x.type.id']
      const type = typeMap[typeId]
      latestVersionId = type['x.type.version.id']
      const versionName = type['x.type.version.name']
      latestVersionName = versionName ? `V${versionName}` : ''
    }
    const id = currentVersion ? currentVersion["x.type.version.id"] : '';
    const name = currentVersion ? currentVersion["x.type.version.name"] : '';
    const hisVerName = name ? ` V${name} ` : ''
    return (
      <div className='pdb-type-version'>
        <Flex wrap justify="space-between" align="center">
          <Space>
            <Typography.Text strong>历史版本：</Typography.Text>
            <Dropdown
              placement="bottom"
              arrow
              menu={{ items, selectable: true, defaultSelectedKeys: [id], onClick: handleSelectVersion }}
              overlayStyle={{width: 120}}
            >
              <Space>
                <Typography.Text strong>{ name ? `V${name}` : '--' }</Typography.Text>
                <DownOutlined />
              </Space>
            </Dropdown>
          </Space>
          <Space size={12}>
            <Button onClick={handleDiffVersion}>版本对比</Button>
            <Button icon={<RollbackOutlined />} onClick={backToLatest}>回到最新版本</Button>
            <Button type="primary" icon={<SaveOutlined />}
              onClick={handleClickStart} disabled={latestVersionId == id}
            >启用此版本</Button>
          </Space>
        </Flex>        
        <Modal
          title="启用历史版本"
          open={startOpen}
          okText="启用"
          cancelText="取消"
          confirmLoading={startLoading}
          onOk={handleStartOk}
          onCancel={handleStartCancel}
          wrapClassName="pdb-state-modal"
        >
          { !!changeMethod &&
            <Alert
              className="pdb-state-alert"
              showIcon type="warning"
              message={<>
                该操作将删除高于该历史版本 {hisVerName} 的所有版本记录，请谨慎操作。
                { referLock && `当前最新版本 ${latestVersionName} 已被引用，若启用历史版本，系统将自动复制 ${latestVersionName} 为对象类型副本，并迁移所有引用的子对象至该副本。`}
              </>}
            />
          }
          { !changeMethod && referLock && <Alert className="pdb-state-alert" showIcon type="warning" message={`当前最新版本 ${latestVersionName} 已被引用，若启用历史版本，系统将自动复制 ${latestVersionName} 为对象类型副本，并迁移所有引用的子对象至该副本。`} />}
          <Form {...layout} form={form}>
            <Form.Item label="启用方式" name="changeMethod" initialValue={{changeMethod: 0}}>
              <Radio.Group>
                <Radio value={0}>保存为新版本</Radio>
                <Radio value={1}>直接回退</Radio>
              </Radio.Group>
            </Form.Item>
            {
              !changeMethod &&
              <Form.Item
                style={{marginBottom: 0}}
                label="新版本号"
                name="x.type.version.name"
                rules={[{required: true, message: '版本号不能为空'}]}
                tooltip={ <>格式 X.X.X，仅允许使用数字和 . 作为分隔符，不支持字母、特殊字符等。<br />不允许前导零，如 00.01.02 是无效的，应改为 0.1.2 。</> }
              >
                <Input addonBefore="V" placeholder={`请输入更高的版本号（当前版本号：${latestVersionName}）`} />
              </Form.Item>
            }
          </Form>
        </Modal>
        <Modal
          open={confirmOpen} width={416}
          footer={null}
          onCancel={() => setConfirmOpen(false)}
        >
          <div className="pdb-state-confirm">
            <ExclamationCircleFilled className="pdb-state-confirm-icon" />
            <Typography.Title style={{marginTop: 0}} level={5}>是否同步更新属性到实例？</Typography.Title>
            <Typography.Text>检测到该对象或其继承对象已创建类型实例，同步属性可能造成数据冲突或丢失，请谨慎操作。</Typography.Text>
            <Flex justify="end" gap="small" style={{marginTop: 12}}>
              <Button onClick={() => setConfirmOpen(false)}>取消</Button>
              <Button onClick={() => handleConfirm(1)}>迁移实例到类型副本</Button>
              <Button onClick={() => handleConfirm(2)}>直接同步</Button>
            </Flex>
          </div>
        </Modal>
      </div>
    )
  }
  return (
    <div className="pdb-graph">
      { currentVersion && renderVersions() }
      <div ref={graphRef} className="graph" id="type-graph"></div>
      { diffVersion && <DiffVersionPane />}
      <DiffVersionModal />
    </div>
  );
}
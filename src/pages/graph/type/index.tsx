import G6 from '@antv/g6';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Dropdown, Flex, Form, Input, Modal, Radio, Space, Typography } from 'antd';
import { DownOutlined, RollbackOutlined, SaveOutlined } from '@ant-design/icons'

import type { StoreState } from '@/store';
import type { ObjectConfig } from '@/reducers/object';
import { nodeStateStyle } from '@/g6/node';
import { labelThemeStyle } from '@/g6/edge';
import { find, map } from 'lodash';
import { setCurrentVersion, setDiffModalOpen, setDiffVersion, TypeVersionConfig } from '@/reducers/type';
import { setCurrentEditModel, setIsEditing } from '@/reducers/editor';
import DiffVersionPane from './DiffVersionPane';
import DiffVersionModal from './DiffVersionModal';
import './index.less';

let graph: any;

const layout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 18 },
};

export default function Editor(props: any) {
  const dispatch = useDispatch();
  const graphRef = useRef(null);
  const currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel);
  const currentVersion = useSelector((state: StoreState) => state.type.currentVersion);
  const diffVersion = useSelector((state: StoreState) => state.type.diffVersion);
  const versionList = useSelector((state: StoreState) => state.type.versionList);
  
  const [form] = Form.useForm();
  const changeMethod = Form.useWatch('changeMethod', form);
  const [startOpen, setStartOpen] = useState(false);
  const [startLoading, setStartLoading] = useState(false);

  useEffect(() => {
    // console.log('currentEditModel: ', currentEditModel)
    const container: any = graphRef.current;
    if (!container || !container.clientWidth || !container.clientHeight || !graph) return;
    graph.changeSize(container.clientWidth, container.clientHeight);
    graph.paint();
    graph.fitCenter();
  }, [currentEditModel?.id]);

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

  const renderTypeNode = () => {
    if (currentEditModel?.id) {
      graph.addItem('node', currentEditModel)
    }
  }

  const backToLatest = () => {
    dispatch(setCurrentVersion(undefined))
  }

  const handleDiffVersion = () => {
    dispatch(setDiffModalOpen(true))
  }

  const handleSelectVersion = ({ key }: {key: string}) => {
    const version = find(versionList, {'x.type.version.id': key})
    console.log('handleSelectVersion: ', version)
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

  const handleStartOk = () => {}
  const handleStartCancel = () => {}

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
    const id = currentVersion ? currentVersion["x.type.version.id"] : '';
    const name = currentVersion ? currentVersion["x.type.version.name"] : '';
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
            <Button type="primary" icon={<SaveOutlined />} onClick={() => setStartOpen(true)}>启用此版本</Button>
          </Space>
        </Flex>
      </div>
    )
  }

  return (
    <div className="pdb-graph">
      { currentVersion && renderVersions() }
      <div ref={graphRef} className="graph" id="type-graph"></div>
      { diffVersion && <DiffVersionPane />}
      <DiffVersionModal />    
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
        <Alert className="pdb-state-alert" showIcon type="warning" message={`当前最新版本 V2.3.0 已被引用，若启用历史版本，系统将自动复制 V2.3.0 为对象类型副本，并迁移所有引用的子对象至该副本。`} />
        <Form {...layout} form={form}>
          <Form.Item label="启用方式" name="changeMethod" initialValue={{changeMethod: 0}}>
            <Radio.Group>
              <Radio value={0}>保存为新版本</Radio>
              <Radio value={1}>直接回退</Radio>
            </Radio.Group>
          </Form.Item>
          {!changeMethod && <Form.Item label="新版本号" name="x.type.version.name" rules={[{required: true, message: '版本号不能为空'}]}>
            <Input addonBefore="V" placeholder={'仅允许数字，以 . 作为分隔符，例：1.0.0'} />
          </Form.Item>}
        </Form>
      </Modal>
    </div>
  );
}
import G6 from '@antv/g6';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useRef } from 'react';
import { Button, Dropdown, Flex, Space, Typography } from 'antd';
import { DownOutlined, RollbackOutlined, SaveOutlined } from '@ant-design/icons'

import type { StoreState } from '@/store';
import type { ObjectConfig } from '@/reducers/object';
import { nodeStateStyle } from '@/g6/node';
import { labelThemeStyle } from '@/g6/edge';
import './index.less';
import { map } from 'lodash';
import { setCurrentVersion, TypeVersionConfig } from '@/reducers/type';
import { setIsEditing } from '@/reducers/editor';

let graph: any;

export default function Editor(props: any) {
  const dispatch = useDispatch();
  const graphRef = useRef(null);
  const currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel);
  const currentVersion = useSelector((state: StoreState) => state.type.currentVersion);
  const versionList = useSelector((state: StoreState) => state.type.versionList);

  useEffect(() => {
    const container: any = graphRef.current;
    if (!container || !container.clientWidth || !container.clientHeight || !graph) return;
    graph.changeSize(container.clientWidth, container.clientHeight);
    graph.paint();
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

  const backToLatest = () => {
    dispatch(setCurrentVersion(undefined))
  }

  useEffect(() => {
    dispatch(setIsEditing(!currentVersion))
  }, [currentVersion])

  useEffect(() => {
    initLayout([]);

    dispatch(setIsEditing(!currentVersion))
    return () => {
      graph?.destroy();
      graph = null;
      (window as any).PDB_GRAPH = null;
    }
  }, []);

  const renderVersions = () => {
    const items = map(versionList, (v: TypeVersionConfig) => ({ key: v["x.type.version.id"], label: 'V' + v["x.type.version.name"]}));
    const id = currentVersion ? currentVersion["x.type.version.id"] : '';
    const name = currentVersion ? currentVersion["x.type.version.name"] : '';
    return (
      <div className='pdb-type-version'>
        <Flex justify="space-between" align="center">
          <Space>
            <Typography.Text strong>历史版本：</Typography.Text>
            <Dropdown placement="bottom" arrow menu={{ items, selectable: true, defaultSelectedKeys: [id] }} overlayStyle={{width: 120}}>
              <Space>
                <Typography.Text strong>V{ name }</Typography.Text>
                <DownOutlined />
              </Space>
            </Dropdown>
          </Space>
          <Space size={12}>
            <Button>版本对比</Button>
            <Button icon={<RollbackOutlined />} onClick={backToLatest}>回到最新版本</Button>
            <Button type="primary" icon={<SaveOutlined />}>启用此版本</Button>
          </Space>
        </Flex>
      </div>
    )
  }

  return (
    <div className="pdb-graph">
      { currentVersion && renderVersions() }
      <div ref={graphRef} className="graph" id="type-graph"></div>
    </div>
  );
}
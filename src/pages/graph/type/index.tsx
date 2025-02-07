import G6 from '@antv/g6';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useRef } from 'react';
import { Button, Dropdown, Flex, Space, Typography } from 'antd';
import { DownOutlined, RollbackOutlined, SaveOutlined } from '@ant-design/icons'

import type { StoreState } from '@/store';
import type { ObjectConfig } from '@/reducers/object';
import { nodeStateStyle } from '@/g6/node';
import { labelThemeStyle } from '@/g6/edge';
import { map } from 'lodash';
import { setCurrentVersion, setDiffVersion, TypeVersionConfig } from '@/reducers/type';
import { setIsEditing } from '@/reducers/editor';
import DiffVersionPane from './DiffVersionPane';
import './index.less';

let graph: any;

export default function Editor(props: any) {
  const dispatch = useDispatch();
  const graphRef = useRef(null);
  const currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel);
  const currentVersion = useSelector((state: StoreState) => state.type.currentVersion);
  const diffVersion = useSelector((state: StoreState) => state.type.diffVersion);
  const versionList = useSelector((state: StoreState) => state.type.versionList);

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
    dispatch(setDiffVersion({
        "x.type.version.id": "1879708844238573568",
        "x.type.version.name": "1.0.0",
        "x.type.version.created": 1736992486425,
        "x.type.version.updated": 1736992486425,
        "x.tpye.version.state": 0,
        "x.type.version.description": '',
        "x.type.version.editor": '',
        "x.type.version.attrs": [
            {
                "name": "fullname",
                "display": "全称",
                "type": "string",
                "default": null,
                "required": false,
                "override": "Type_sNJsjRPKvwo8hiOyA8O1736934737063"
            },
            {
                "name": "count",
                "display": "飞机数量",
                "type": "int",
                "default": null,
                "required": false,
                "override": "Type_sNJsjRPKvwo8hiOyA8O1736934737063"
            },
            {
                "name": "seets",
                "display": "座位数",
                "type": "int",
                "default": null,
                "required": false
            }
        ],
        "x.type.version.prototype": {
            "x.type.id": "Type_sNJsjRPKvwo8hiOyA8O1736934737063",
            "x.type.version.id": "1879466624117903360"
        }
    }))
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

  // useEffect(() => {
  //   if (diffVersion && graph) {
  //     graph?.destroy();
  //     graph = null;
  //     (window as any).PDB_GRAPH = null;
  //   } else if (!diffVersion && !graph) {
  //     initLayout([])
  //     renderTypeNode()
  //   }
  // }, [diffVersion])

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
            <Button onClick={handleDiffVersion}>版本对比</Button>
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
      { diffVersion && <DiffVersionPane />}
    </div>
  );
}
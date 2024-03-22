import G6 from '@antv/g6';
import { useSelector } from 'react-redux';
import { useEffect, useRef } from 'react';

import type { StoreState } from '@/store';
import type { ObjectConfig } from '@/reducers/object';
import { initG6 } from '@/g6';
import { nodeStateStyle } from '@/g6/type/node';
import { labelThemeStyle } from '@/g6/type/edge';
import './index.less';

let graph: any;

export default function Editor(props: any) {
  const graphRef = useRef(null);
  const currentEditModel = useSelector((state: StoreState) => state.editor.currentEditModel);

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
    (window as any).PDR_GRAPH = graph
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

  useEffect(() => {
    initLayout([]);
    initG6('type');

    return () => {
      graph?.destroy();
      graph = null;
      (window as any).PDB_GRAPH = null;
    }
  }, []);

  return (
    <div className="pdb-graph">
      <div ref={graphRef} className="graph" id="type-graph"></div>
    </div>
  );
}
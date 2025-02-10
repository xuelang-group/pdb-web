import { Divider, Typography } from "antd";
import NodeIconPicker from '@/components/NodeIconPicker';
import NodeColorPicker from '@/components/NodeColorPicker';
import { defaultNodeColor } from "@/utils/common";

interface DiffMetaProps {
  typeName: any;
  metadata: string;
  modified: boolean;
}

export default function DiffMetadata(props: DiffMetaProps) {
  const { typeName, metadata='{}', modified } = props
  const { icon='', color=defaultNodeColor.fill, borderColor=defaultNodeColor.border} = metadata ? JSON.parse(metadata) : {}
  return (
    <div className="pdb-diff-metadata">
      <div className="pdb-diff-metadata-head">
        <div className="cell">对象名称</div>
        <div className="cell">
          图标
          <Divider type="vertical" className="divider" orientationMargin={8} />
          颜色
        </div>
      </div>
      <div className="pdb-diff-metadata-body">
        <div className="cell">{typeName}</div>
        <div className="cell">
          <div className={modified ? 'pdb-node-metadata modified' : 'pdb-node-metadata'}>
            <NodeIconPicker
              disabled={true}
              currentIcon={icon}
            />
            <Divider type='vertical' />
            <NodeColorPicker key={'fill'}
              type='fill'
              disabled={true}
              currentColor={color}
            />
            <NodeColorPicker key={'border'}
              type='border'
              disabled={true}
              currentColor={borderColor}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
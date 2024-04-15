import { Modal, Select, Tag, Tooltip, Transfer, TreeDataNode } from "antd";
import _ from "lodash";
import { useEffect, useState } from "react";
import "./index.less";
import { TreeTransfer, TreeTransferProps } from "./TreeTransfer";

interface ExportApiProps {
  // options: string[][]
  clickCopy: () => { value: string, label: string }[][]
}
export default function ExportApi(props: ExportApiProps) {
  const { clickCopy } = props;
  const [modalOpen, setModalOpen] = useState(false),
    [options, setOptions] = useState([] as any),
    [selectedCondition, setSelectedCondition] = useState([]),
    [attrTreeData, setAttrTreeData] = useState<TreeDataNode[]>([]),
    [targetKeys, setTargetKeys] = useState<TreeTransferProps['targetKeys']>([]),
    [columnDisplayMap, setColDisplayMap] = useState({});

  useEffect(() => {
    const treeData: TreeDataNode[] = [];
    selectedCondition.forEach(function (data: any) {
      const { label, attrs, value } = data;
      const children: any[] = [];
      attrs && attrs.forEach(function (attr: { name: string; display: string; }) {
        children.push({
          key: `${value}|${label}|${attr.name}|${attr.display}`,
          title: attr.display,
        });
      });
      treeData.push({
        key: value,
        title: label,
        checkable: false,
        selectable: false,
        children
      });
    });
    setAttrTreeData(treeData);
  }, [selectedCondition]);

  const renderSelectItem = function (value: string) {
    const types = JSON.parse(value);
    return (
      <div>
        {types.map((data: { value: string, label: string, type: string }) => {
          const { label, type } = data;
          let color, icon;
          if (type === "type") {
            color = "processing";
            icon = "iconfont icon-duixiangleixing";
          } else {
            color = "gold";
            icon = "iconfont icon-guanxileixing";
          }
          return (
            <Tag
              color={color}
              icon={<i className={icon} style={{ fontSize: '1.2rem', marginRight: 3 }}></i>}
            >{label}</Tag>
          );
        })}
      </div>
    )
  }

  const onChange: TreeTransferProps['onChange'] = (keys) => {
    setTargetKeys(keys);
    const displayMap = {};
    keys.forEach(function (key) {
      const data = key.split("|");
      Object.assign(displayMap, { [key]: _.get(columnDisplayMap, key, data[3]) })
    });
    setColDisplayMap(displayMap);
  };

  const renderModalContent = function () {
    return (
      <div className="pdb-export-api-modal-content">
        <div className="pdb-export-api-condition">
          <span>过滤条件：</span>
          <Select
            options={options.map((opt: any) => ({ value: JSON.stringify(opt), label: JSON.stringify(opt) }))}
            optionRender={(option: any) => option.value && renderSelectItem(option.value)}
            labelRender={(label: any) => renderSelectItem(label.value)}
            onSelect={value => setSelectedCondition(JSON.parse(value))}
          ></Select>
        </div>
        <div>
          <div>字段选择：</div>
          <TreeTransfer
            dataSource={attrTreeData}
            targetKeys={targetKeys}
            colDisplayMap={columnDisplayMap}
            onChange={onChange}
            onChangeDisplay={(data: any) => setColDisplayMap(data)}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <Tooltip title="复制接口">
        <i className="spicon icon-fuzhi" onClick={() => {
          setOptions(clickCopy());
          setModalOpen(true);
        }} ></i>
      </Tooltip>
      <Modal open={modalOpen} title="复制接口" width={800} onCancel={() => setModalOpen(false)} destroyOnClose>
        {renderModalContent()}
      </Modal>
    </>

  )
}
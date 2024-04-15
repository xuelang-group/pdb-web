import { Button, Modal, Select, Switch, Tag, Tooltip, Transfer, TreeDataNode } from "antd";
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
    [columnDisplayMap, setColDisplayMap] = useState({}),
    [showDisplayName, setShowDisplayName] = useState(false),
    [showAttrType, setShowAttrType] = useState(false);

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

  const onPreview = function() {
    
  }

  const renderModalContent = function () {
    return (
      <div className="pdb-export-api-modal-content">
        <div className="pdb-export-api-condition">
          <span>过滤条件：</span>
          <Select
            value={JSON.stringify(selectedCondition)}
            options={options.map((opt: any) => ({ value: JSON.stringify(opt), label: JSON.stringify(opt) }))}
            optionRender={(option: any) => option.value && renderSelectItem(option.value)}
            labelRender={(label: any) => renderSelectItem(label.value)}
            onChange={value => {
              setSelectedCondition(JSON.parse(value));
              setAttrTreeData([]);
              setTargetKeys([]);
              setColDisplayMap({});
            }}
          ></Select>
        </div>
        <div className="pdb-export-api-condition" style={{ flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ marginBottom: 5 }}>字段选择：</span>
          <TreeTransfer
            dataSource={attrTreeData}
            targetKeys={targetKeys}
            colDisplayMap={columnDisplayMap}
            onChange={onChange}
            onChangeDisplay={(data: any) => setColDisplayMap(data)}
          />
        </div>
        <div className="pdb-export-api-condition">
          <span>包含显示名称<Tooltip title="返回数据中第一行为显示名称"><i className="spicon icon-tishi"></i></Tooltip>：</span>
          <Switch checkedChildren="开启" unCheckedChildren="关闭" defaultChecked />
        </div>
        <div className="pdb-export-api-condition">
          <span>包含属性类型<Tooltip title="若包含显示名称，返回数据中第二行为属性类型；否则，第一行为属性类型"><i className="spicon icon-tishi"></i></Tooltip>：</span>
          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
        </div>
      </div>
    )
  }

  const onModalCancel = function () {
    setModalOpen(false);
    setAttrTreeData([]);
    setOptions([]);
    setSelectedCondition([]);
    setTargetKeys([]);
    setColDisplayMap({});
  }

  return (
    <>
      <Tooltip title="复制接口">
        <i className="spicon icon-fuzhi" onClick={() => {
          const options = clickCopy();
          setOptions(options);
          setModalOpen(true);
          if (options.length > 0 && !_.isEmpty(options[0])) setSelectedCondition(options[0] as any);
        }} ></i>
      </Tooltip>
      <Modal
        title="复制接口"
        open={modalOpen}
        width={800}
        footer={[
          <Button onClick={onModalCancel}>关闭</Button>,
          <Button onClick={onPreview}>预览</Button>,
          <Button type="primary">复制接口</Button>
        ]}
        onCancel={onModalCancel}
        destroyOnClose
      >
        {renderModalContent()}
      </Modal>
    </>

  )
}
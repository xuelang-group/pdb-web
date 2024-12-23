import { StoreState } from "@/store";
import { Form, Modal, notification, Radio, Select, Tooltip } from "antd";
import { QuestionCircleFilled } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import _ from "lodash";
import { setObject } from "@/actions/object";

interface ModalProps {
  updateItem: any;
  close: Function;
}

export default function UpdateDisplayNameModal(props: ModalProps) {
  const { updateItem } = props;
  const typeMap = useSelector((state: StoreState) => state.editor.typeMap);
  const [form] = Form.useForm();
  const defaultOptions = [{
    label: "名称",
    options: [
      { label: "实例名称", value: "x_name" },
    ],
  },]
  const [selectOptions, setSelectOptions] = useState(defaultOptions);

  useEffect(() => {
    console.log(updateItem)
    if (updateItem !== null) {
      const updateItemData = updateItem.data || {};
      const updateItemMetadata = JSON.parse(updateItemData["x_metadata"] || "{}");
      const attrOptions: { label: string; value: string; }[] = [];
      _.get(typeMap[updateItemData["x_type_name"]], "x.type.attrs", []).forEach((val: any) => {
        attrOptions.push({
          label: val.display,
          value: `attr_${val.name}`
        });
      });
      if (attrOptions.length > 0) {
        setSelectOptions(defaultOptions.concat([{
          label: "属性",
          options: attrOptions
        }]));
      }
      form.setFieldsValue({
        "labelKey": _.get(updateItemMetadata, "nodeLabelKey", "x_name"),
        "apply": "single"
      });
    } else {
      setSelectOptions(defaultOptions);
    }
  }, [updateItem]);

  const handleOk = function () {
    form.validateFields().then(values => {
      console.log(values);
      const { labelKey, apply } = values;
      if (apply === "single") {
        const updateItemData = updateItem.data || {},
          metadata = JSON.parse(updateItemData["x_metadata"] || "{}");
        Object.assign(metadata, { "nodeLabelKey": labelKey });
        setObject({
          "set": [{
            "vid": updateItem.uid,
            "x_metadata": JSON.stringify(metadata)
          }]
        }, (success: boolean, response: any) => {
          if (success) {
            const graph = (window as any).PDB_GRAPH;
            graph?.updateItem(updateItem.id, {
              data: {
                ...updateItemData,
                "x_metadata": JSON.stringify(metadata)
              },
            });
          } else {
            notification.error({
              message: '修改实例节点文字展示失败：',
              description: response.message || response.msg
            });
          }
        });
      } else {

      }
    });
  }

  const handleClose = function () {
    props.close();
  }

  return (
    <Modal
      title="实例节点文字展示"
      open={updateItem !== null}
      onOk={handleOk}
      onCancel={handleClose}
    >
      <Form form={form}>
        <Form.Item name="labelKey" label="展示为">
          <Select options={selectOptions}></Select>
        </Form.Item>
        <Form.Item name="apply" label="应用于">
          <Radio.Group>
            <Radio value="single">此实例</Radio>
            <Radio value="all">
              <span>所有此对象类型</span>
              <Tooltip title="批量修改全画布中所有此对象类型实例节点的展示文字为所选项。">
                <QuestionCircleFilled style={{ color: "#C2C7CC", fontSize: "1.4rem", marginLeft: 4 }} />
              </Tooltip>
            </Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  )
}
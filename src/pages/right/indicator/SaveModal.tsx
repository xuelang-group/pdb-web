import { Modal, Form, Input, Spin, message, TreeSelect, Select } from "antd";
import { StoreState } from "@/store";
import { useSelector } from "react-redux";
import { getProcessTree, getBuzProcess } from "@/actions/adapter";
import { checkVersion, getMetricDetail2 } from "@/actions/indicator";
import { useEffect, useState } from "react";
import { findIndex, get, isEmpty } from "lodash";
import { getTreeData } from "@/utils/common";

export default function SaveModal(props: any) {
  const { editId, xTypeNames, advance = false } = props;
  const [infoForm] = Form.useForm();
  const [processOptions, setProcessOptions] = useState<any[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<{
    id: string | number;
    name: string;
  }>();
  const [buzProcessArr, setBuzProcessArr] = useState([]);
  const allIndicators = useSelector(
    (state: StoreState) => state.indicator.list,
  );
  const requestId = useSelector(
    (state: StoreState) => state.indicator.requestId,
  );
  const currentBuzProcess = useSelector(
    (state: StoreState) => state.indicator.currentBuzProcess,
  );

  useEffect(() => {
    if (!advance && requestId && !isEmpty(xTypeNames)) {
      getBuzProcess(
        { requestId: requestId, xTypeNames },
        (success: boolean, res: any) => {
          if (success) {
            setBuzProcessArr(res.data || []);
            setProcessOptions(
              (res.data || []).map((item: any) => ({
                label: item?.name || item?.id || item,
                value: item?.id || item,
              })),
            );
          }
        },
      );
    }
  }, [requestId, xTypeNames]);

  useEffect(() => {
    advance &&
      getProcessTree()
        .then(({ data }) => {
          if (!data.code) {
            const treeData = getTreeData(data.data);
            setProcessOptions(treeData);
          }
        })
        .catch((err) => {
          message.error(err.message);
        });
    if (editId) {
      const indicator =
        allIndicators.find((item: any) => item.id === editId) || {};
      const { name, name_cn, unit, desc } = indicator;
      infoForm.setFieldsValue({ name, name_cn, unit, desc });
      if (!advance) {
        currentBuzProcess &&
          infoForm.setFieldValue("buzProcess", currentBuzProcess.id);
      } else {
        const buzProcess = indicator.buzProcess || currentBuzProcess;
        infoForm.setFieldValue("buzProcess", buzProcess.id);
        setSelectedProcess(buzProcess);
      }
    }
  }, [editId]);

  const onOk = () => {
    infoForm
      .validateFields()
      .then((values) => {
        if (values.buzProcess) {
          if (!advance) {
            const buzProcess = buzProcessArr.find(
              (item: any) => item.id === values.buzProcess,
            );
            if (buzProcess) {
              values.buzProcess = buzProcess;
            }
          } else {
            values.buzProcess = selectedProcess;
          }
        }
        if (requestId) {
          values.requestId = requestId;
        }
        props.onOk(values);
      })
      .catch((err) => {});
  };

  const onCancel = () => {
    infoForm.resetFields();
    props.onCancel();
  };

  return (
    <Modal
      open={props.visible}
      title={editId ? "编辑指标" : "保存指标"}
      onOk={onOk}
      onCancel={onCancel}
      okText="保存"
      cancelText="取消"
      okButtonProps={{
        loading: props.modalLoading,
      }}
    >
      <Spin spinning={props.modalLoading}>
        <Form
          form={infoForm}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          initialValues={{ version: "1.0.0" }}
        >
          <Form.Item
            label="中文名称"
            rules={[
              { required: true, message: "请输入中文名称" },
              {
                validator(rule, value, callback) {
                  if (
                    value &&
                    findIndex(
                      allIndicators,
                      (item) => item.name_cn === value && item.id !== editId,
                    ) > -1
                  ) {
                    callback("不能重名");
                  } else {
                    callback();
                  }
                },
              },
            ]}
            name={"name_cn"}
          >
            <Input placeholder="请输入中文名称" />
          </Form.Item>
          <Form.Item
            label="英文名称"
            rules={[
              { required: true, message: "请输入英文名称" },
              {
                validator(rule, value, callback) {
                  if (
                    value &&
                    findIndex(
                      allIndicators,
                      (item) => item.name === value && item.id !== editId,
                    ) > -1
                  ) {
                    callback("不能重名");
                  } else {
                    callback();
                  }
                },
              },
            ]}
            name={"name"}
          >
            <Input placeholder="请输入英文名称" />
          </Form.Item>
          <Form.Item label="单位" name={"unit"}>
            <Input placeholder="请输入单位" />
          </Form.Item>
          <Form.Item label="指标描述" name={"desc"}>
            <Input.TextArea placeholder="请输入指标描述" rows={3} />
          </Form.Item>
          <Form.Item
            label="版本号"
            name={"version"}
            rules={[
              { required: true, message: "请输入版本号" },
              // {
              //   pattern: /^(0|[1-9]\d*)(\.(0|[1-9]\d*)){2}$/,
              //   message: '版本号格式不正确，应该是 X.X.X 的格式，且不允许有前导零',
              // },
              {
                validateTrigger: "onBlur",
                validator: async (_, value) => {
                  if (editId) {
                    const resD = await getMetricDetail2({ id: editId });
                    if (resD.data) {
                      const res = await checkVersion({
                        new_version: value,
                        ori_id: resD.data?.ori_id,
                      });
                      if (res.data?.success) {
                        return Promise.resolve();
                      } else {
                        return Promise.reject(new Error(res.data?.message));
                      }
                    } else {
                      return Promise.reject(new Error(resD.data?.message));
                    }
                  } else {
                    const res = await checkVersion({ new_version: value });
                    if (res.data?.success) {
                      return Promise.resolve();
                    } else {
                      return Promise.reject(new Error(res.data?.message));
                    }
                  }
                },
              },
            ]}
            tooltip="1.格式X.X.X，仅允许使用数字和.作为分隔符，不支持字母、特殊字符等。
              2.不允许前导l零，如00.01.02是无效的，应改为0.1.2。"
          >
            <Input
              addonBefore="V"
              placeholder="仅允许数字以.为分隔符，例:1.0.0"
            />
          </Form.Item>
          <Form.Item
            label="所属业务过程"
            name={"buzProcess"}
            rules={[{ required: true, message: "请选择所属业务过程" }]}
          >
            {advance ? (
              <TreeSelect
                placeholder="请选择所属业务过程"
                treeData={processOptions}
                fieldNames={{
                  label: "tagNmZh",
                  value: "id",
                  children: "children",
                }}
                onSelect={(value, node) => {
                  setSelectedProcess({
                    id: value,
                    name: get(node, "tagNmZh", ""),
                  });
                }}
                disabled={!!editId}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              />
            ) : (
              <Select
                placeholder="请选择所属业务过程"
                options={processOptions}
                disabled={!!editId}
              />
            )}
          </Form.Item>
          <Form.Item label="相关业务过程">---</Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}

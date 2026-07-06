import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Form, Modal, Radio } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { isEmpty } from "lodash";
import { StoreState } from "@/store";
import { setShowSearch } from "@/reducers/editor";
import "./index.less";

export default function Indicator(props: any) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const routerParams = useParams();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const allIndicators = useSelector((state: StoreState) => state.indicator.list);
  const requestId = useSelector((state: StoreState) => state.indicator.requestId);
  const params = useSelector((state: StoreState) => state.query.params);
  
  const onCreate = (mode: string) => {
    if (mode == 'indicator' && isEmpty(params.pql[0])) {
      dispatch(setShowSearch(true));
    }
    navigate(`/${routerParams.id}/${mode}${requestId ? ('?requestId=' + requestId) : ''}`)
    setOpen(false)
  }

  return (
    <div className="pdb-indicator">
      <div className="pdb-indicator-index">
        <Button className="btn-create" icon={<PlusOutlined />} onClick={() => setOpen(true)}>初级指标</Button>
        <Button className="btn-create" icon={<PlusOutlined />} disabled={isEmpty(allIndicators)} onClick={() => onCreate('indicator/advance')}>高级指标</Button>
      </div>
      <Modal
        open={open}
        title='创建初级指标'
        onCancel={() => setOpen(false)}
        maskClosable={false}
        okButtonProps={{ autoFocus: true, htmlType: 'submit' }}
        modalRender={(dom) => (
          <Form
            form={form}
            initialValues={{ mode: 'indicator/simple' }}
            labelCol={{span: 6}}
            wrapperCol={{span: 16, offset: 1}}
            clearOnDestroy
            onFinish={(values) => onCreate(values.mode)}
          >
            {dom}
          </Form>
        )}
      >
        <Form.Item label="选择创建模式" name='mode' rules={[ { required: true, message: '请选择创建模式' } ]}>
          <Radio.Group
            options={[{value: 'indicator/simple', label: '简洁模式'}, {value: 'indicator', label: '专业模式', disabled: isEmpty(allIndicators)}]}
          />
        </Form.Item>
      </Modal>
    </div>
  );
}

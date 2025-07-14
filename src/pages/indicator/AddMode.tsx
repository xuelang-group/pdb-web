import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Form, Modal, Radio, Typography } from "antd";
import { LeftOutlined, PlusOutlined } from "@ant-design/icons";
import { isEmpty } from "lodash";
import { StoreState } from "@/store";
import AddAdvance from './addAdvance'
import AddSimple from './addSimple'
import "./index.less";

export default function Indicator(props: any) {
  const navigate = useNavigate();
  const routerParams = useParams();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const query = useSelector((state: StoreState) => state.query.params);
  const allIndicators = useSelector((state: StoreState) => state.indicator.list);
  
  const handleBack = () => {
    navigate(`/${routerParams.id}/indicator/index`)
  }

  useEffect(() => {
    console.log('routerParams: ', routerParams)
  }, []);

  return (
    <>
      <div className="pdb-indicator-title">
        <Button className="pdb-indicator-back" type="text" size="small" icon={<LeftOutlined />} onClick={handleBack} />
        <Typography.Text>{routerParams.type == '1' ? '初级指标创建' : '高级指标创建'}</Typography.Text>
      </div>
      { routerParams.type == '3' ? <AddAdvance /> : <AddSimple />}
    </>
  );
}

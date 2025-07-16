import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Form, Modal, Radio, Typography } from "antd";
import { LeftOutlined, PlusOutlined } from "@ant-design/icons";
import { isEmpty } from "lodash";
import { StoreState } from "@/store";
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
  }, []);

  return (
    <div className="pdb-indicator">
      <h2>高级指标</h2>
    </div>
  );
}

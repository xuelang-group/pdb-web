import { StoreState } from "@/store";
import { Button, Modal, notification, Space, Tooltip } from "antd";
import { BorderOutlined, CloseSquareOutlined, MinusSquareOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setObject, setTypeObjectMetadata } from "@/actions/object";
import { setCurrentEditModel, setGraphLoading } from "@/reducers/editor";
import './llmStream.less';
import { toggle } from "@/reducers/llmStream";

interface ModalProps {
}

export default function LLMStream(props: ModalProps) {
  const dispatch = useDispatch();
  const open = useSelector((state: StoreState) => state.llmStream.open);
  const relationMap = useSelector((state: StoreState) => state.editor.relationMap);

  const [collapsed, setCollapsed] = useState(false)

  const renderBody = () => {
    return (
      <div className={`pdb-llm-output-body ${collapsed ? 'fade-out-down' : 'fade-in-up'}`}></div>
    )
  }

  return open ? (
    <div className="pdb-llm-output">
      <div className="pdb-llm-output-header">
        <span className="pdb-llm-output-btn" onClick={() => setCollapsed(!collapsed)}>{ collapsed ? <BorderOutlined /> : <MinusSquareOutlined /> }</span>
        <span className="pdb-llm-output-btn" onClick={() => dispatch(toggle(false))}><CloseSquareOutlined /></span>
      </div>
      { renderBody() }
    </div>
  ) : null
}
import { Divider } from "antd";
import _ from "lodash";
import "moment/locale/zh-cn";
import { useDispatch } from "react-redux";
import { useParams, useNavigate } from 'react-router-dom';

import { resetSchema } from "@/actions/type";
import { setCurrentEditModel } from "@/reducers/editor";
import './index.less';

interface HeaderProps {
  route: string
  headerEXtraWidth?: number
}

export default function EditHeader(props: HeaderProps) {
  const routerParams = useParams(),
    dispatch = useDispatch();
  const { headerEXtraWidth } = props;
  const navigate = useNavigate();

  function exit() {
    navigate(`/${routerParams.id}`);
    resetSchema(routerParams.id, () => { });
    dispatch(setCurrentEditModel(null));
  }

  return (
    <div className='pdb-header pdb-header-edit'>
      <div className="pdb-header-info">
        <h2 className="pdb-header-title">
          类型管理
        </h2>
      </div>
      <div className="pdb-header-right" style={{ marginRight: headerEXtraWidth || 0 }}>
        <a
          className="pdb-header-button"
          onClick={exit}
        >
          退出
        </a>
        {Number(headerEXtraWidth) > 0 && <Divider />}
      </div>
    </div>
  )
}
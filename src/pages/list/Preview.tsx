import { Empty, Spin } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import _ from "lodash";
import moment from "moment";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";

import previewEmptyDark from '@/assets/images/preview-empty-dark.png'
import previewEmpty from '@/assets/images/preview-empty.png';
import appDefaultScreenshotPath from '@/assets/images/no_image_xly.png';
import { setCollapsed } from "@/reducers/app";
interface PreviewProps {
  activeItem: any
  theme: string
  appLabel: string
  route: string
}

export default function Preview(props: PreviewProps) {
  const { theme, activeItem, appLabel, route } = props;
  const dispatch = useDispatch(),
    location = useLocation(),
    navigate = useNavigate();

  if (!_.isEmpty(activeItem)) {
    const localTime = moment.utc(activeItem.gmt_create).toDate();
    const createTime = moment(localTime).format('YYYY-MM-DD HH:mm');
    const parentsLabels = activeItem.parents.map((val: any) => val.label).join(' / ');

    const handleOpen = function () {
      dispatch(setCollapsed(true));
      const pathname = `/${activeItem.id}`;
      if (location.pathname !== pathname) navigate(pathname, { replace: true });
    }

    return (
      <div className="pdb-list-preview">
        <div className="pdb-list-preview-header">{activeItem.name}</div>
        <div className="pdb-list-preview-body">
          <div className="pdb-list-preview-name">
            <span className="pdb-list-preview-bread">{parentsLabels + ' / ' + activeItem.name}</span>
            <a onClick={handleOpen}>打开 <ArrowRightOutlined /></a>
          </div>
          <Spin wrapperClassName="pdb-list-preview-img" spinning={false}>
            <img
              src={appDefaultScreenshotPath}
              onError={(event: any) => {
                if (event.target.src !== appDefaultScreenshotPath) {
                  event.target.src = appDefaultScreenshotPath;
                  event.target.onerror = null;
                }
              }}
            />
          </Spin>
          <ul className="pdb-list-preview-list">
            <li className="pdb-list-preview-item">
              <span className="label">{appLabel}ID：</span>
              <span className="value">{activeItem.id}</span>
            </li>
            {route === 'object' &&
              <li className="pdb-list-preview-item">
                <span className="label">模板ID：</span>
                <span className="value">{_.get(activeItem, 'data.templateId') || '--'}</span>
              </li>
            }
            <li className="pdb-list-preview-item">
              <span className="label">{appLabel}描述：</span>
              <span className="value">{activeItem.description || '--'}</span>
            </li>
            <li className="pdb-list-preview-item">
              <span className="label">创建时间：</span>
              <span className="value">{createTime}</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="pdb-list-preview" style={{ justifyContent: 'center' }}>
      <Empty image={theme === 'dark' ? previewEmptyDark : previewEmpty} description="请选择一个模板预览" />
    </div>
  );
} 
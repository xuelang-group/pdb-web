import { Result, Space, Typography } from 'antd';

import './index.less';

function ErrorPage() {

  return (
    <div className="pdb-error-page">
      <Result
        status="warning"
        title="缺少必要参数"
        subTitle={
          <Typography.Paragraph>请从尚数通进入本功能</Typography.Paragraph>
        }
      />
    </div>
  );
}

export default ErrorPage;

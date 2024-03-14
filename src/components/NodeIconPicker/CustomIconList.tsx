import ossOperate from "@/actions/ossOperate";
import { setIconMap } from "@/reducers/editor";
import { StoreState } from "@/store";
import { Dropdown, message, notification, Spin } from "antd";
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NodeIconPickerProps } from ".";

export async function getIconUrl(iconKey: string) {
  return new Promise((resolve, reject) => {
    ossOperate().url(iconKey).then(function (res: any) {
      resolve(res.data)
    }).catch(() => {
      resolve('');
    });
  });
}

export default function CustomIconList(props: NodeIconPickerProps) {
  const { currentIcon, changeIcon } = props;
  const uploadRef = useRef(null);
  const dispatch = useDispatch();
  const iconMap = useSelector((state: StoreState) => state.editor.iconMap),
    userId = useSelector((state: StoreState) => state.app.systemInfo.userId);
  const [iconKeys, setIconKeys] = useState([] as any),
    [customIconLoading, setCustomIconLoading] = useState(false);

  useEffect(() => {
    setIconKeys(Object.keys(iconMap));
  }, [iconMap]);

  let files, i: number;

  const handleUpload = function (file: any) {
    i++;
    // if (file.size > 80 * 1024) {
    //   setTimeout(function () {
    //     message.error('上传失败，图片大于80K');
    //   }, 0)
    // } else {
    const path = 'studio/' + userId + '/pdb/icons/',
      iconKey = path + file.name;
    ossOperate().upload(iconKey, file,
      (res: any) => {
        console.log(res)
      },
      () => { message.error(file.name + '上传失败'); },
      () => {
        getIconUrl(iconKey).then(url => {
          if (url) {
            message.success(file.name + '上传成功');
            dispatch(setIconMap({ ...iconMap, [iconKey]: url }));
          }
        });
      }
    );
    // }
  };
  const uploadIcon = function (e: any) {
    files = _.values(e.target.files);
    i = 0;
    handleUpload(files[i]);
    e.target.value = '';
  }

  const iconMenuItems = [{
    label: '删除',
    key: 'remove',
  }];

  const handleClickMenu = function (operation: string, index: number) {
    if (operation === 'remove') {
      const iconKey = iconKeys[index];
      ossOperate().remove(iconKey).then(() => {
        const newIconMap = JSON.parse(JSON.stringify(iconMap));
        delete newIconMap[iconKey];
        dispatch(setIconMap(newIconMap));
      }).catch((error: any) => {
        notification.error({
          message: '删除图标失败',
          description: error.message || error.msg
        });
      });
    }
  }

  return (
    <div className='pdb-iconpicker-list'>
      {customIconLoading && <Spin />}
      <div className={'pdb-iconpicker-item pdb-custom-icon-add first-row-item' + (iconKeys.length === 0 ? ' icon-last-item' : '')}>
        <i className="spicon icon-add"></i>
        <input ref={uploadRef} className="pdb-iconpicker-input" type="file" accept="image/*" multiple onChange={uploadIcon} />
      </div>
      {['', ...iconKeys].map((iconKey: string, index: number) => {
        if (index !== 0) {
          return (
            <Dropdown menu={{ items: iconMenuItems, className: 'pdb-custom-icon-menu', onClick: (event: any) => handleClickMenu(event.key, index - 1) }} trigger={['contextMenu']}>
              <div
                className={'pdb-iconpicker-item' + (index < 5 ? ' first-row-item' : '') +
                  ((index + 1) % 5 === 0 ? ' row-last-item' : ((index + 1) === (iconKeys.length + 1) ? ' icon-last-item' : '')) +
                  (currentIcon === iconKey ? ' selected' : '')
                }
                onClick={() => changeIcon(iconKeys[index - 1])}
              >
                <img className="pdb-icon-custom-item" src={iconMap[iconKey]} />
              </div>
            </Dropdown>
          )
        }
      })}
    </div>
  );
}
import { Button, Checkbox, Dropdown, Empty, Input, MenuProps, Modal, message, Spin, Tabs, Tree } from "antd";
import { DownOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import React, { Key, useEffect, useRef, useState } from "react";
import { ResizableBox } from "react-resizable";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import _ from "lodash";

import { addTemplate, deleteTemplate, deleteTemplates, getTemplateList, updateTemplateInfo } from "@/actions/template";
import { removeObject, getObjectList, removeObjects, createObject, updateObjectInfo } from "@/actions/object";
import searchEmpty from '@/assets/images/search_empty.png';
import FolderOffSvg from '@/assets/images/folder-collpased.svg';
import FolderOnSvg from '@/assets/images/folder-expand.svg';

import { StoreState } from "@/store";
import { setCatalog, setCollapsed } from "@/reducers/app";
import { routeLabelMap, routeIconMap, operation, myDirId, removeCatalog, moveCatalog, getNewFolderId } from "@/utils/common";

import Preview from "./Preview";
import ModalForm from "./ModalForm";
import "./index.less";
import { putFile } from "@/actions/minioOperate";

const { Search } = Input;
const { DirectoryTree, TreeNode } = Tree;
const { confirm } = Modal;

interface ListProps {
  route: string
  theme: string
}

const routeActionMap: any = {
  template: {
    get: getTemplateList,
    create: addTemplate,
    remove: deleteTemplate,
    update: updateTemplateInfo,
    batchRemove: deleteTemplates
  },
  object: {
    get: getObjectList,
    create: createObject,
    remove: removeObject,
    update: updateObjectInfo,
    batchRemove: removeObjects
  }
};

export default function List(props: ListProps) {
  const { route, theme } = props;

  const folderMenuItems: MenuProps["items"] = Object.keys(operation(route)['folder']).map(key => ({ key, label: _.get(operation(route)['folder'], key, '') })),
    leafMenuItems: MenuProps["items"] = Object.keys(operation(route)['leaf']).map(key => ({ key, label: _.get(operation(route)['leaf'], key, '') }));

  const [dragWidth, setDragWidth] = useState(800),
    [searchKeyword, setSearchKeyword] = useState(""),
    [isSearched, setSearchedStatus] = useState(false),
    [dataList, setDataList] = useState([]),
    [treeLoading, setTreeLoading] = useState(false),
    [treeSelectedKeys, setTreeSelectedKeys] = useState<Key[]>([]),
    [treeData, setTreeData] = useState([]),
    [treeVirtual, setTreeVirtual] = useState(true),
    [treeExpandKeys, setTreeExpandKeys] = useState<Key[]>(['2']),
    [treeHeight, setTreeHeight] = useState(0),
    [activeItem, setActiveItem] = useState({}),
    [operate, setOperate] = useState<any>(null),
    [modalOpen, setModalOpen] = useState(false),
    [modalConfirmLoading, setModalConfirmLoading] = useState(false),
    [formInitialValue, setFormInitialValue] = useState<any>({});

  const collapsed = useSelector((state: StoreState) => state.app.collapsed),
    catalog = useSelector((state: StoreState) => state.app.catalog),
    systemInfo = useSelector((state: StoreState) => state.app.systemInfo);

  const leftRef: React.Ref<any> = useRef(null),
    treeRef: React.Ref<any> = useRef(null),
    iframeRef: React.Ref<any> = useRef(null),
    formRef: React.Ref<any> = useRef(null);

  const dispatch = useDispatch(),
    routerParams = useParams(),
    location = useLocation(),
    navigate = useNavigate();

  useEffect(() => {
    dispatch(setCollapsed(Boolean(routerParams.id)));
    routerParams.id && setTreeSelectedKeys([routerParams.id]);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.onresize = updateTreeHeight;
    }
  }, []);

  useEffect(() => {
    updateTreeHeight();
    treeRef.current && routerParams.id && treeRef.current.scrollTo({ key: routerParams.id });
  }, [treeRef.current]);

  const updateTreeHeight = function () {
    const leftHeight = leftRef.current.clientHeight;
    if (leftHeight && treeHeight !== leftHeight - 105) {
      setTreeHeight(leftHeight - 105);
    }
  }

  useEffect(() => {
    setTreeLoading(true);
    routeActionMap[route].get(function (success: boolean, response: any) {
      if (success) {
        setDataList(response);
      } else {
        message.error('获取列表数据失败：' + response.message || response.msg);
      }
      setTreeLoading(false);
    });
  }, [route]);

  useEffect(() => {
    getTreeData(catalog, dataList, treeSelectedKeys[0], searchKeyword);
  }, [dataList, catalog])

  // 搜索
  const handleSearch = function (value: string) {
    setSearchKeyword(value);
    getTreeData(catalog, dataList, treeSelectedKeys[0], value);
  }

  // 树 - 图标
  const getIcon = (iconProps: any) => {
    const { isLeaf, expanded } = iconProps;
    if (isLeaf) {
      const icon = routeIconMap[route];
      return <i className={icon} />;
    }
    let SvgHref = expanded ? FolderOnSvg : FolderOffSvg;
    if (SvgHref.startsWith("./")) {
      SvgHref = _.get(window, 'pdbConfig.basePath', '') + SvgHref.replace("./", "/");
    }
    return <img src={SvgHref} style={{ marginTop: 2 }} />;
  }

  // 树 - 拖拽开始
  const handleDragStart = ({ event }: any) => {
    event.stopPropagation();
    setTimeout(() => {
      setTreeVirtual(false);
    }, 0);
  }

  /**
   * 树 - 拖拽结束
   * 之所以动态改变虚拟节点，是为了拖动时可滚动，解决Antd 开启虚拟模式后拖拽时无法向上向下滚动
   */
  const handleDragEnd = () => {
    setTreeVirtual(true);
  }

  // 树 - 单击选中
  const handleSelectTree = function (keys: React.Key[], { node }: any) {
    if (keys[0] != treeSelectedKeys[0] && node.isLeaf) {
      setTreeSelectedKeys(keys);
      setActiveItem(node.data);
    }
  }

  // 树 - 双击
  const handeDoubleClick = function (event: any, node: any) {
    event.stopPropagation();
    if (!node.isLeaf) return;
    handleSelectTree([node.key], { node });
    dispatch(setCollapsed(true));
    const pathname = `/${node.key}`;
    if (location.pathname !== pathname) navigate(pathname, { replace: true });
  }

  // 树 - 右击
  const handleRightClick = function ({ event, node }: any) {
    event.stopPropagation();
    // event.preventDefault();
    if (!node.isLeaf) return;
    handleSelectTree([node.key], { node });
  }

  // 获取树数据
  const getTreeData = function (floders: any, list: any, activeId: Key | undefined, _keyword: string = '') {
    let _list = _.cloneDeep(list),
      activeApp: any, expandedKeys: any = JSON.parse(JSON.stringify(treeExpandKeys));
    const keyword = _.toLower(_keyword);
    // if (_keyword !== _key) expandedKeys = [];
    const loop = (floders: any) => {
      return floders.map((folder: any) => {
        const parents = folder.parents ? folder.parents.concat([{ id: `${folder.id}`, label: folder.label }]) : [{ id: `${folder.id}`, label: folder.label }];
        let children = _.map(_.remove(_list, (item: any = {}) => item.dir === folder.id), (item) => ({ ...item, parents, label: item.name }));
        if (folder.id == myDirId) {
          const dirNull = _.map(_.remove(_list, (item: any) => !item.dir), (item) => ({ ...item, parents, label: item.name }));
          children = [...children, ...dirNull];
        }
        if (!activeApp && children.length) {
          activeApp = _.find(children, ({ id }) => `${id}` == activeId);
          if (activeApp) {
            expandedKeys = expandedKeys.concat(_.map(parents, 'id'));
          }
        }
        const noParentSearched = folder.parents ?
          folder.parents.findIndex((val: any) => _.toLower(val.label).indexOf(keyword) > -1) == -1 : true;
        if (!_.isEmpty(keyword) && _.toLower(folder.label).indexOf(keyword) == -1) {
          children = children.filter((item) => {
            if (!_.isEmpty(item)) {
              const name = _.toLower(item.name);
              const desc = _.toLower(item.description);
              const hasIn = name.indexOf(keyword) > -1 || desc.indexOf(keyword) > -1 || item.id == keyword;
              if (hasIn) expandedKeys = expandedKeys.concat(_.map(item.parents, 'id'));
              return hasIn;
            }
            return false;
          });
        }
        if (!_.isEmpty(folder.children)) {
          const _children = folder.children.map((dir: any) => ({ ...dir, parents }));
          let childrenFolder = loop(_children);
          childrenFolder = _.compact(childrenFolder);
          children = [...childrenFolder, ...children];
        }
        if (!_.isEmpty(keyword)) {
          if (_.toLower(folder.label).indexOf(keyword) == -1) {
            if (_.isEmpty(children) && folder.id > myDirId) {
              return;
            } else {
              return {
                ...folder,
                children,
              };
            }
          } else {
            if (!_.isEmpty(folder.parents)) {
              expandedKeys = expandedKeys.concat(_.map(folder.parents, 'id'));
            }
            expandedKeys = [...expandedKeys, folder.id.toString()];
          }
        }
        return {
          ...folder,
          children,
        };
      });
    };
    let data = _.isEmpty(_list) ? floders : loop(floders);
    if (!_.isEmpty(keyword)) {
      if (_.isEmpty(data[0].children) && !_.isEmpty(data[1].children)) {
        data.splice(0, 1);
      } else if (!_.isEmpty(data[0].children) && _.isEmpty(data[1].children)) {
        data.splice(1);
      } else if (_.isEmpty(data[0].children) && _.isEmpty(data[1].children)) {
        data = [];
      }
    }
    if (!_.isEmpty(_list)) {
      _list = _list.map((item: any) => ({ ...item, label: item.name, parents: [{ id: `${myDirId}`, label: floders[1].label }] }));
      if (!activeApp) {
        activeApp = _.find(_list, ({ id }) => `${id}` == activeId);
        if (activeApp) {
          expandedKeys = [`${myDirId}`];
        }
      }
      if (!_.isEmpty(keyword)) {
        _list = _list.filter((item: any) => {
          const name = _.toLower(item.name);
          const desc = _.toLower(item.description);
          return name.indexOf(keyword) > -1 || desc.indexOf(keyword) > -1 || item.id == keyword;
        });
      }
      data = data.map((item: any) => {
        if (item.id == myDirId) {
          return {
            ...item,
            children: [...item.children, ..._list],
          };
        }
        return item;
      });
    }
    if (_.isEmpty(expandedKeys)) {
      expandedKeys = [];
    } else {
      expandedKeys.sort();
      expandedKeys = _.sortedUniq(expandedKeys);
    }

    setTreeData(data);
    setTreeExpandKeys(expandedKeys);
    setActiveItem(activeApp);
  }

  // 弹窗 - 关闭
  const handleModalCancel = function () {
    formRef && formRef.current && formRef.current.resetFields();
    setModalOpen(false);
    setOperate(null);
    setFormInitialValue({});
    setModalConfirmLoading(false);
  }

  // 创建
  const handleCreate = function (params: any) {
    const { name } = params;
    routeActionMap[route].create(params, (success: boolean, response: any) => {
      if (success) {
        const newDataList = JSON.parse(JSON.stringify(dataList));
        newDataList.push(response);
        setDataList(newDataList);
        message.success(`创建${routeLabelMap[route]}“${name}”成功`);
        setTreeSelectedKeys([response.id.toString()]);
      } else {
        message.error(`创建${routeLabelMap[route]}“${name}”失败：${response.message || response.msg}`);
      }
      handleModalCancel();
    });
  }

  // 创建文件夹
  const handleCreateFolder = function (parentDir: number, name: string) {
    const newCatalog = JSON.parse(JSON.stringify(catalog));
    const newFolderId = getNewFolderId(newCatalog);
    moveCatalog(newCatalog, parentDir, [{ id: newFolderId, label: name, folder: true, children: [] }]);
    saveCatalog(newCatalog, () => {
      handleModalCancel();
    });
  }

  const saveCatalog = function (catalog: any, callback?: Function) {
    const { userId } = systemInfo;
    const path = `studio/${userId}/pdbConfig`;
    putFile(path, JSON.stringify({ catalog })).then(() => {
      dispatch(setCatalog(catalog));
      callback && callback();
    }, () => {
      callback && callback();
    });
  }

  // 重命名
  const handleRename = function (newName: string, oldName: string) {
    const { targetType, id } = formInitialValue;
    setModalConfirmLoading(true);
    if (targetType === 'folder') {
      handleModalCancel();
    } else {
      let params = {};
      if (route === 'object') {
        Object.assign(params, { graphId: id, name: newName });
      } else {
        Object.assign(params, { tid: id, name: newName });
      }
      routeActionMap[route].update(params, (success: boolean, response: any) => {
        if (success) {
          const newDataList: any = JSON.parse(JSON.stringify(dataList));
          for (let data of newDataList) {
            if (data.id === id) {
              Object.assign(data, { name: newName });
              break;
            }
          }
          setDataList(newDataList);
          message.success(`重命名${routeLabelMap[route]}“${newName}”成功`);
        } else {
          message.error(`重命名${routeLabelMap[route]}“${oldName}”失败：${response.message || response.msg}`);
        }
        handleModalCancel();
      });
    }
  }

  // 弹窗 - 确定
  const handleModalOk = function () {
    formRef.current.validateFields().then((values: any) => {
      setModalConfirmLoading(true);
      const { name, dir, description } = values;
      let params: any;
      switch (operate.key) {
        case 'create':
          params = { ...formInitialValue, name };
          if (dir) Object.assign(params, { dir });
          if (description) Object.assign(params, { description });
          handleCreate(params);
          break;
        case 'createFolder':
          params = { ...formInitialValue, name };
          if (dir) Object.assign(params, { dir });
          handleCreateFolder(params.dir, name);
          break;
        case 'rename':
          if (formInitialValue.name === name) {
            handleModalCancel();
          } else {
            handleRename(name, formInitialValue.name);
          }
          break;
      }
    }).catch((errorInfo: any) => {
      console.log(errorInfo);
    });
  }

  const removeCheckboxRef = useRef(null);
  const handleRemove = function (targetItem: any) {
    const { label, folder, children, id } = targetItem;
    const routeLabel = routeLabelMap[route];
    if (folder) {
      const folderChildren: any = [], leafChildren: any = [];
      children.forEach((val: any) => val.folder ? folderChildren.push(val) : leafChildren.push(val));
      let content: any = `是否删除“${label}”?`;
      if (folderChildren.length > 0 || leafChildren.length > 0) {
        content = (
          <>
            <div className='pdb-confirm-info'>这个操作无法进行复原，确认要删除“{label}”文件夹吗？</div>
            <div className='pdb-confirm-info-checkbox' style={{ alignItems: 'flex-start' }}>
              <Checkbox ref={removeCheckboxRef}></Checkbox>
              <span>
                同时删除文件夹中的
                {folderChildren.length > 0 && leafChildren.length > 0 ?
                  (`${folderChildren.length}个子文件夹和${leafChildren.length}个项目`) :
                  (folderChildren.length > 0 ? `${folderChildren.length}个子文件夹` : `${leafChildren.length}个项目`)
                }
                <br />
                *若不勾选，文件夹中的子文件夹/项目将移动至“我的项目”
              </span>
            </div>
          </>
        )
      }
      confirm({
        icon: <ExclamationCircleOutlined />,
        title: "删除文件夹",
        content,
        okText: "确认删除",
        okButtonProps: { danger: true },
        onOk: function () {
          const removeAll = _.get(removeCheckboxRef.current, 'input.checked');
          const idKey = route === 'template' ? 'tid' : 'graphId', idsMap = {};
          const ids = leafChildren.map((val: any) => {
            if (removeAll) {
              Object.assign(idsMap, { [val.id]: val.id });
            }
            return removeAll ? { [idKey]: val.id } : { [idKey]: val.id, dir: 2 };
          });
          // 删除项目/模板
          if (ids.length > 0) {
            routeActionMap[route].batchRemove(ids, (success: boolean, response: any) => {
              if (success) {
                const newDataList = dataList.filter(val => idsMap[_.get(val, 'id')]);
                setDataList(newDataList);
              } else {
                message.error(`删除${routeLabel}失败：${response.message || response.msg}`);
              }
            });
          }
          // 删除文件夹
          let newCatalog = JSON.parse(JSON.stringify(catalog));
          removeCatalog(newCatalog, id);
          if (!removeAll) {
            moveCatalog(newCatalog, myDirId, folderChildren);
          }
          saveCatalog(newCatalog);
        }
      });
    } else {
      confirm({
        icon: <ExclamationCircleOutlined />,
        title: `删除${routeLabel}`,
        content: `是否删除“${label}”?`,
        okText: "确认删除",
        okButtonProps: { danger: true },
        onOk: function () {
          routeActionMap[route].remove(id, (success: boolean, response: any) => {
            if (success) {
              const newDataList = dataList.filter(val => _.get(val, 'id') !== id);
              setDataList(newDataList);
              message.success(`删除${routeLabel}“${label}成功`);
            } else {
              message.error(`删除${routeLabel}“${label}”失败：${response.message || response.msg}`);
            }
          });
        }
      });
    }
  }

  const handleClickOperate = function (operate: { key: string, targetType: string, targetItem?: any }, event: any) {
    event.stopPropagation();
    const { key, targetType, targetItem } = operate;
    if (key === 'remove') {
      handleRemove(targetItem);
    } else {
      let initialValue = {};
      if (targetItem) {
        const { id } = targetItem;
        if (key.startsWith('create')) {
          Object.assign(initialValue, { dir: id || myDirId });
        } else {
          if (targetType === 'folder') {
            const { parents, label } = targetItem;
            const dir = Number(_.get(parents.slice(-1)[0], 'id', myDirId));
            Object.assign(initialValue, { dir, name: label });
          } else {
            const { dir, label } = targetItem;
            Object.assign(initialValue, { dir, name: label });
          }
          if (key === 'rename' || key === 'remove') Object.assign(initialValue, { id, targetType });
        }
      }
      setFormInitialValue(initialValue);
      setOperate(operate);
      setModalOpen(true);
    }
  }

  const renderTreeNodes = function () {
    const loop = (_data: any, className = '', parentId = '') => _data.map((item: any) => {
      if (!item) return null
      const isFolder = item.folder || item.isFolder;
      const name = item.label || item.name;
      const index = _.toLower(name).indexOf(_.toLower(searchKeyword));
      let title = <span className='pdb-app-title'>{name}</span>;
      if (!_.isEmpty(searchKeyword) && index > -1) {
        const beforeStr = name.substr(0, index);
        const equalStr = name.substr(index, searchKeyword.length);
        const afterStr = name.substr(index + searchKeyword.length);
        title = (<span className='pdb-app-title'>
          {beforeStr}
          <span className='text-equal'>{equalStr}</span>
          {afterStr}
        </span>);
      }
      let items = isFolder ? folderMenuItems : leafMenuItems;
      if (item.id === myDirId) {
        items = [{
          key: "create",
          label: `新建${routeLabelMap[route]}`
        }, {
          key: "createFolder",
          label: "新建文件夹"
        }];
      }
      title = (
        <Dropdown
          menu={{
            items,
            style: { width: '16rem' },
            onClick: info => handleClickOperate({ key: info.key, targetType: isFolder ? 'folder' : 'leaf', targetItem: item }, info.domEvent)
          }}
          trigger={['contextMenu']}
          destroyPopupOnHide
        >{title}</Dropdown>
      );
      let data;
      if (isFolder) {
        data = { ...item, dir: parentId };
      } else {
        data = item;
      }
      if (!_.isEmpty(item.children)) {
        return (
          <TreeNode key={`${item.id}`} className={className} title={title} icon={getIcon} selectable={false} data={data}>
            {loop(item.children, 'notranslate', item.id)}
          </TreeNode>
        );
      }

      return <TreeNode className={isFolder ? 'folder' : 'leaf'} key={`${item.id}`} data={data} title={title} isLeaf={!isFolder} icon={getIcon} />;
    });
    if (_.isEmpty(treeData)) {
      if (searchKeyword) {
        return (
          <Empty className='suanpan-empty' image={(<img src={searchEmpty} />)} imageStyle={{ width: 160, marginBottom: 0 }} description="搜索结果为空" />
        )
      }
      return null;
    }

    return (
      <DirectoryTree
        ref={treeRef}
        height={treeHeight}
        expandedKeys={treeExpandKeys}
        selectedKeys={treeSelectedKeys}
        virtual={treeVirtual}
        draggable={{
          icon: false,
          nodeDraggable: node => _.get(node, 'data.state') !== "locked"
        }}
        showIcon
        blockNode
        onExpand={(expandKeys: Key[]) => setTreeExpandKeys(expandKeys)}
        onRightClick={handleRightClick}
        onSelect={handleSelectTree}
        onDoubleClick={handeDoubleClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      // onDrop={this.handleDrop}
      >
        {loop(treeData)}
      </DirectoryTree>
    );
  }

  const renderTabChildren = function () {
    return (
      <div className="pdb-list-container">
        <ResizableBox
          width={dragWidth}
          axis="x"
          resizeHandles={["e"]}
        >
          <div className="pdb-list-content" ref={leftRef}>
            <iframe
              title=""
              id="reszie_iframe"
              ref={iframeRef}
            />
            <div className="pdb-list-action">
              <div className="pdb-search">
                <Search
                  className="pdb-search-input"
                  placeholder={`搜索${routeLabelMap[route]}名称或ID`}
                  allowClear={true}
                  enterButton={<i className="spicon icon-sousuo2"></i>}
                  onChange={(event: any) => {
                    if (!isSearched) {
                      setSearchedStatus(true);
                    } else if (!event.target.value) {
                      setSearchedStatus(false);
                      handleSearch("");
                    }
                  }}
                  onPressEnter={(event: any) => handleSearch(event.target.value)}
                />
              </div>
              <Dropdown
                menu={{
                  className: 'pdb-list-dropdown-menu',
                  items: [{
                    key: "create",
                    label: `新建${routeLabelMap[route]}`
                  }, {
                    key: "createFolder",
                    label: "新建文件夹"
                  }],
                  onClick: info => handleClickOperate({ key: info.key, targetType: 'folder' }, info.domEvent)
                }}
                placement="bottomRight"
              >
                <Button type="primary">
                  <span>新建</span>
                  <DownOutlined />
                </Button>
              </Dropdown>
            </div>
            <div className="pdb-list-tree">
              <Spin spinning={treeLoading}>
                {renderTreeNodes()}
              </Spin>
            </div>
          </div>
        </ResizableBox>
        <Preview activeItem={activeItem} theme={theme} route={route} appLabel={routeLabelMap[route]} />
      </div>
    )
  }

  return (
    <div className="pdb-list" style={{ zIndex: collapsed ? -1 : 99 }}>
      <Tabs
        className="pdb-list"
        items={[{
          key: route,
          label: "我的" + routeLabelMap[route],
          children: renderTabChildren()
        }]}
      />
      <Modal
        open={modalOpen}
        title={_.isEmpty(operate) ? '' : _.get(_.get(operation(route), operate.targetType), operate.key)}
        confirmLoading={modalConfirmLoading}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
      >
        <ModalForm formRef={formRef} operate={operate} route={route} initialValue={formInitialValue} />
      </Modal>
    </div>
  );
}
import { Item } from 'ant-design-vue/es/menu';
import { ItemData } from '../store/editor'

interface nodeItemConfig {
  id: string
  label: string
  parent?: string
  children?: nodeItemConfig[]
}

function findChildren(data: Array<ItemData>, parent: string, edges: any, nodes: any) {
  const children: any[] = [];
  for (const item of data) {
    const { uid, name, ...other } = item;
    if (item.parent === parent) {
      const node = {
        ...other,
        id: uid,
        label: name,
        parent
      };
      nodes.push(node);
      const nestedChildren = findChildren(data, uid, edges, nodes);
      if (nestedChildren.length > 0) {
        if (nestedChildren.length === 1 && (!nestedChildren[0].children || nestedChildren[0].children.length === 0)) {
          Object.assign(nestedChildren[0], { onlyChild: true });
        }
        Object.assign(node, { children: nestedChildren});
        edges.push({ source: node.id, target: nestedChildren[0].id});
      }

      children.push(node);
    }
  }

  children.forEach(function(value, index) {
    if (index > 0) {
      edges.push({ source: children[index - 1].id, target: value.id});
    }
  });

  return children;
}

export function buildTree(data: {[key: string]: Array<ItemData>}) {
  const edges:any[] = [], nodes:any[] = [];
  Object.keys(data).forEach(function(key) {
    const allData = data[key];
    const rootNodes: any[] = [];
    const parentNode = {
      id: key,
      label: key,
    };
    nodes.push(parentNode);
    rootNodes.push(parentNode);
    for (const item of allData) {
      const { uid, name, parent, children, ...other } = item;
      const node = {
        id: uid,
        label: name,
        parent: key,
        ...other
      };
      if (!parent) {
        nodes.push(node);
        const nestedChildren = findChildren(allData, uid, edges, nodes);
        if (nestedChildren.length > 0) {
          if (nestedChildren.length === 1 && (!nestedChildren[0].children || nestedChildren[0].children.length === 0)) {
            Object.assign(nestedChildren[0], { onlyChild: true });
          }
          Object.assign(node, { children: nestedChildren});
          edges.push({ source: node.id, target: nestedChildren[0].id});
        }
        rootNodes.push(node);
      }
    }

    rootNodes.forEach(function(value, index) {
      if (index > 0) {
        edges.push({ source: rootNodes[index - 1].id, target: value.id});
      }
    });
  })
  return {
    nodes,
    edges
  };
}


// export function buildTree(data: {[key: string]: Array<ItemData>}) {
//   const rootNodes: any[] = [], edges:any[] = [], nodes:any[] = [];
//   Object.keys(data).forEach(function(key) {
//     const children = data[key]
//     const parentNode = {
//       id: key,
//       label: key,
//     }
//     nodes.push(parentNode)
//     rootNodes.push(parentNode)
//     for (const item of children) {
//       const node = {
//         id: item.uid,
//         label: item.name,
//         parent: key
//       };
//       // if (!item.parent) {
//       //   const nestedChildren = findChildren(children, item.uid, edges);
//       //   if (nestedChildren.length > 0) {
//       //     Object.assign(node, { children: nestedChildren});
//       //     edges.push({ source: node.id, target: nestedChildren[0].id})
//       //   }
//       //   rootNodes.push(node);
//       // }
//       if (item.parent) Object.assign(node, { parent: item.parent })
//       nodes.push(node)
//       if (!item.parent) edges.push({ source: key, target: item.uid })
//       if (item.children) {
//         item.children.forEach(function(val) {
//           edges.push({ source: item.uid, target: val })
//         })
//         Object.assign(node, { children: item.children })
//       }
//     }

//     rootNodes.forEach(function(value, index) {
//       if (index > 0) {
//         edges.push({ source: rootNodes[index - 1].id, target: value.id})
//       }
//     });
//   })
//   return {
//     nodes,
//     edges
//   };
// }

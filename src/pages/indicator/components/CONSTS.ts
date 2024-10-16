import React from 'react';
import { register, Group, Text, Rect, Checkbox } from '@visactor/react-vtable'
import { TYPES, CustomLayout } from '@visactor/vtable'
import { typeMap } from '@/utils/common'

export const ICONS = typeMap.type;

export function getIconSvg(name: string, disabled = false): string {
  const fillColor = disabled ? '#DCDEE1' : '#0084FF'
  switch (name) {
    case 'string':
      return `<svg t="1727659643740" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2961" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M971.072 516.928a5.0944 5.0944 0 0 0 6.5664-3.0336c0.256-0.512 0.256-1.1392 0.256-1.7664v-73.6128a4.8896 4.8896 0 0 0-3.5328-4.8c-7.5776-2.2656-21.7216-3.7888-34.3424-3.7888-41.5488 0-77.9136 21.0944-92.8 52.0192v-36.096a10.1248 10.1248 0 0 0-10.112-10.112h-66.2784a10.1248 10.1248 0 0 0-10.112 10.112v340.1344c0 5.5552 4.5568 10.112 10.112 10.112h69.184c5.5552 0 10.112-4.5568 10.112-10.112V588.6464c0-45.7088 32.9472-76.0192 82.1888-76.0192 13.1328 0.128 33.5872 2.2784 38.7584 4.3008z m-678.016-51.136l-69.0688-15.9104c-77.2736-17.92-110.7328-43.9424-110.7328-89.2672 0-56.32 49.3696-92.8 122.3424-92.8 66.6624 0 115.4048 33.4592 126.1312 86.9888h88.384c-8.96-95.8336-95.1936-162.2528-214.144-162.2528-130.4192 0-215.8976 70.08-215.8976 175.5136 0 86.6176 48.7296 138.2528 154.2912 162.24l77.7728 18.048c80.3072 18.816 115.6608 46.848 115.6608 94.8352 0 55.68-54.912 94.9504-129.408 94.9504-76.5312 0-131.9552-34.3424-142.4384-89.0112H5.6704c9.088 100.8768 95.4624 164.6336 226.1376 164.6336 141.6704 0 228.416-70.4512 228.416-183.9616 0-88.6272-48.7424-136.9856-167.168-164.0064z m634.3296 320.192a45.4528 45.4528 0 1 0 90.9184 0 45.4528 45.4528 0 0 0-90.9184 0zM690.0096 443.5712h-64.896v-78.0416a10.1248 10.1248 0 0 0-10.0992-10.0992h-69.0688a10.1248 10.1248 0 0 0-10.0992 10.112v78.0288h-45.3248a10.1248 10.1248 0 0 0-10.112 10.0992v53.4016c0 5.5552 4.5568 10.112 10.112 10.112h45.3248v186.24c0 70.9504 34.5984 100.2368 117.5552 100.2368 14.7712 0 29.7984-1.5104 42.6752-3.904a4.9024 4.9024 0 0 0 4.0448-4.928v-62.2464a5.0688 5.0688 0 0 0-5.056-5.056h-0.512c-6.1824 0.64-7.8208 0.768-10.4704 1.024-5.184 0.3712-9.856 0.6144-15.9104 0.6144-30.4256 0-43.0592-13.0048-43.0592-44.9408v-167.04h64.896c5.5552 0 10.112-4.5568 10.112-10.112v-53.4016a10.1376 10.1376 0 0 0-10.112-10.112z" fill="${fillColor}" p-id="2962"></path></svg>`
    case 'datetime':
      return `<svg t="1727660734561" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3378" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M880 184H712v-64A8.0256 8.0256 0 0 0 704 112h-56a8.0256 8.0256 0 0 0-8 8v64H384v-64a8.0256 8.0256 0 0 0-8-8H320a8.0256 8.0256 0 0 0-8 8v64H144a31.9616 31.9616 0 0 0-32 32V880c0 17.7024 14.2976 32 32 32h736c17.7024 0 32-14.2976 32-32V216c0-17.7024-14.2976-32-32-32z m-40 656h-656V459.9936h656v380.0064z m-656-448V256h128v48c0 4.4032 3.5968 8 8 8h56A8.0256 8.0256 0 0 0 384 304V256h256v48c0 4.4032 3.5968 8 8 8H704a8.0256 8.0256 0 0 0 8-8V256h128v136h-656z" fill="${fillColor}" p-id="3379"></path></svg>`
    case "boolean":
      return `<svg t="1727660727442" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3239" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M807.1424 203.7376L210.88 894.144a14.0416 14.0416 0 0 1-19.712 1.4208l-45.376-39.0656a13.9776 13.9776 0 0 1-1.4208-19.84l596.1856-690.4704a13.952 13.952 0 0 1 19.776-1.3568l45.44 39.1424c5.8496 5.0688 6.4384 13.9136 1.3696 19.7632h0.064-0.064z m103.1168 264.2176v82.7008H710.656v92.1344h199.6032v79.4496H710.656v164.48h-85.952V467.968H910.336h-0.064zM456.64 125.0048v79.1168H328.2304v360h-89.0752V204.1216H113.5488V125.0048h343.0912z" fill="${fillColor}" p-id="3240"></path></svg>`
    case "int":
    case "float":
      return `<svg t="1727660719239" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3100" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M872 393.9968a8.0256 8.0256 0 0 0 8-8V326.016a8.0256 8.0256 0 0 0-8-8H707.9936V152a8.0256 8.0256 0 0 0-7.9872-8h-64a8.0256 8.0256 0 0 0-8.0128 8v166.0032H400V152a8.0256 8.0256 0 0 0-8-8h-64a8.0256 8.0256 0 0 0-8 8v166.0032H152a8.0256 8.0256 0 0 0-8 8v59.9936c0 4.4032 3.5968 8 8 8H320V630.016H152a8.0256 8.0256 0 0 0-8 8v59.9936c0 4.4032 3.5968 8 8 8H320v166.0032c0 4.4032 3.5968 8 8 8h64a8.0256 8.0256 0 0 0 8-8V705.9968h228.0064v166.0032c0 4.4032 3.584 8 7.9872 8h64a8.0256 8.0256 0 0 0 8.0128-8V705.9968h163.9936a8.0256 8.0256 0 0 0 8-8v-59.9936a8.0256 8.0256 0 0 0-8-8H707.9936V393.984h164.0064zM627.9936 630.016H400V393.984h228.0064V630.016z" fill="${fillColor}" p-id="3101"></path></svg>`
    default:
      return ''
  }
}

const padding = [8, 15];
const iconSize = 18;

Object.keys(ICONS).forEach(name => {
  register.icon(name, {
    name: name,
    type: 'svg',
    marginRight: 4,
    positionType: TYPES.IconPosition.left,
    width: iconSize,
    height: iconSize,
    svg: getIconSvg(name),
    hover: {
      // 热区大小
      width: iconSize + 8,
      height: iconSize + 8,
      bgColor: 'rgba(22,44,66,0.1)'
    },
    tooltip: {
      style: {
        arrowMark: false,
        padding: [2, 4],
        bgColor: 'rgba(0,0,0,0.4)',
        color: 'white',
        fontSize: 12
      },
      // 气泡框，按钮的的解释信息
      title: ICONS[name],
      placement: TYPES.Placement.left
    },
    cursor: 'pointer'
  })

  register.icon(`${name}Disabled`, {
    name: `${name}Disabled`,
    type: 'svg',
    marginRight: 4,
    positionType: TYPES.IconPosition.left,
    width: 18,
    height: 18,
    svg: getIconSvg(name, true),
  })
});

// register.icon('dropdownIcon', {
//   name: 'dropdownIcon',
//   type: 'svg',
//   positionType: TYPES.IconPosition.right,
//   funcType: TYPES.IconFuncTypeEnum.dropDown,
//   width: 16,
//   height: 16,
//   svg: '<svg t="1728526714477" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="61549" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M561.339 711.843c-10.558 10.557-24.886 20.361-38.46 17.344-13.575 2.263-26.395-8.295-36.952-17.344L159.39 383.799c-16.59-16.59-16.59-43.74 0-60.33s43.74-16.59 60.33 0l303.912 312.207L828.299 323.47c16.59-16.59 43.739-16.59 60.33 0s16.59 43.74 0 60.33l-327.29 328.044z" p-id="61550" fill="#4C5A67"></path></svg>',
//   marginLeft: 4,
//   visibleTime: 'mouseenter_cell',
// });

export type Col = {
  field: string;
  type: string;
  disabled?: boolean;
  checked?: boolean;
  mergeCell?: boolean;
  fieldFormat?: (record: any) => any;
}
export function getColumns(cols: Col[]) {
  if (!cols.length) return [];
  return cols.map(({ field, type, disabled, checked, mergeCell, fieldFormat }) => ({
    "field": field,
    "title": field,
    "dimensionKey": field,
    "mergeCell": mergeCell,
    "disableSelect": !checked,
    "disableHeaderSelect": !checked,
    "style": disabled ? {
      "bgColor": "#F4F6F9",
      "color": "#C2C7CC",
    } : {},
    "fieldFormat": fieldFormat,
    // 只有一行的表头
    // "headerStyle": disabled ? {
    //   "bgColor": "#F4F6F9",
    //   "color": "#C2C7CC",
    // } : {},
    // "headerIcon": disabled ? `${type}Disabled` : type,
    // "headerCustomRender": (args: TYPES.CustomRenderFunctionArg) => {
    //   const { rect } = args;
    //   const width = rect?.width || 150;
    //   const height = rect?.height || 46;
    //   const elements: TYPES.ICustomRenderElements = []
    //   if (checked) {
    //     elements.push({
    //       type: 'rect',
    //       x: width - 52 - padding[1],
    //       y: (height - 24) / 2,
    //       width: 52,
    //       height: 24,
    //       radius: 1,
    //       fill: '#E8F8FF',
    //       stroke: '#8BD3FF'
    //     })
    //     elements.push({
    //       type: 'text',
    //       x: width - 52/2 - padding[1],
    //       y: height / 2 + 1,
    //       fill: '#0084FF',
    //       fontSize: 12,
    //       fontWeight: 400,
    //       fontFamily: 'PingFang SC',
    //       textAlign: 'center',
    //       textBaseline: 'middle',
    //       text: '度量列',
    //     })
    //   }
    //   return {
    //     elements,
    //     expectedHeight: width,
    //     expectedWidth: height,
    //     renderDefault: true,
    //   }
    // },
    // 两行的表头
    "headerCustomRender": (args: TYPES.CustomRenderFunctionArg) => {
      const { dataValue, rect, table, row } = args;
      const width = rect?.width || 180;
      const height = rect?.height || 92;
      const rowHeight = height / 2;
      const elements: TYPES.ICustomRenderElements = [
        {
          type: 'rect',
          x: 0.5,
          y: 0.5,
          width: checked ? (width - 1) : width,
          height: checked ? height : (rowHeight),
          fill: checked ? '#F1F8FF' : disabled ? '#F4F6F9' : '#FFF',
          stroke: checked ? '#8BD3FF' : '#DCDEE1',
        }, {
          type: 'icon',
          x: padding[1],
          y: (rowHeight - iconSize) / 2,
          width: iconSize,
          height: iconSize,
          svg: getIconSvg(type, disabled),
        }, {
          type: 'text',
          x: padding[1] + iconSize + 5,
          y: rowHeight / 2 + 1,
          fill: disabled ? '#C2C7CC' : '#1C2126',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'PingFang SC',
          textBaseline: 'middle',
          text: typeMap.type[type],
        }, {
          type: 'line',
          points: [{ x: 1, y: rowHeight + 0.5 }, { x: width, y: rowHeight + 0.5 }],
          lineWidth: 1,
          stroke: '#DCDEE1'
        }, {
          type: 'text',
          fill: disabled ? '#C2C7CC' : '#1C2126',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'PingFang SC',
          textBaseline: 'middle',
          text: dataValue,
          x: padding[1],
          y: rowHeight + rowHeight / 2 + 1,
        }
      ];
      if (checked) {
        elements.push({
          type: 'rect',
          x: width - 52 - padding[1],
          y: (rowHeight - 24) / 2,
          width: 52,
          height: 24,
          radius: 1,
          fill: '#E8F8FF',
          stroke: '#8BD3FF'
        })
        elements.push({
          type: 'text',
          x: width - 52 / 2 - padding[1],
          y: rowHeight / 2 + 1,
          fill: '#0084FF',
          fontSize: 12,
          fontWeight: 400,
          fontFamily: 'PingFang SC',
          textAlign: 'center',
          textBaseline: 'middle',
          text: '度量列',
        })
      }
      return {
        elements,
        expectedHeight: width,
        expectedWidth: height,
        renderDefault: false,
      }
    },
    // customLayout表头
    // "headerCustomLayout": (args: TYPES.CustomRenderFunctionArg) => {
    //   const { dataValue, rect, table, col, row } = args;
    //   const width = rect?.width || 180;
    //   const height = rect?.height || 92;
    //   const rowHeight = height / 2;

    //   const container = new CustomLayout.Group({
    //     height,
    //     width,
    //   });
    //   const typeIcon = new CustomLayout.Icon({
    //     x: padding[1],
    //     y: (rowHeight - iconSize) / 2,
    //     width: iconSize,
    //     height: iconSize,
    //     svg: getIconSvg(type, disabled),
    //   })
    //   const typeText = new CustomLayout.Text({
    //     x: padding[1] + iconSize + 5,
    //     y: (rowHeight - 12) / 2,
    //     text: typeMap.type[type],
    //     fontSize: 14,
    //     fontWeight: 600,
    //     fontFamily: 'PingFang SC',
    //     fill: disabled ? '#C2C7CC' : '#1C2126',
    //   });
    //   const line = new CustomLayout.Line({
    //     points: [{ x: 1, y: rowHeight + 0.5 }, { x: width, y: rowHeight + 0.5 }],
    //     lineWidth: 1,
    //     stroke: '#DCDEE1'
    //   })
    //   const title = new CustomLayout.Text({
    //     x: padding[1],
    //     y: rowHeight + (rowHeight - 14) / 2,
    //     text: dataValue,
    //     fontSize: 14,
    //     fontWeight: 600,
    //     fontFamily: 'PingFang SC',
    //     fill: disabled ? '#C2C7CC' : '#1C2126',
    //   });
    //   container.add(typeIcon)
    //   container.add(typeText)
    //   container.add(line)
    //   container.add(title)
    //   if (checked) {
    //     const dlBg = new CustomLayout.Rect({
    //       x: width - 52 - padding[1],
    //       y: (rowHeight - 24) / 2,
    //       width: 52,
    //       height: 24,
    //       cornerRadius: 1,
    //       fill: '#E8F8FF',
    //       stroke: '#8BD3FF'
    //     })
    //     const dlTxt = new CustomLayout.Text({
    //       x: width - 52 / 2 - padding[1],
    //       y: rowHeight / 2 + 1,
    //       fill: '#0084FF',
    //       fontSize: 12,
    //       fontWeight: 400,
    //       fontFamily: 'PingFang SC',
    //       textAlign: 'center',
    //       textBaseline: 'middle',
    //       text: '度量列',
    //     })
    //     container.add(dlBg)
    //     container.add(dlTxt)
    //   }
    //   // if (disabled) {
    //   //   const checkbox = new CustomLayout.Rect({
    //   //     x: width - 16 - padding[1],
    //   //     y: rowHeight + (rowHeight - 16) / 2,
    //   //     width: 16,
    //   //     height: 16,
    //   //     cornerRadius: 2,
    //   //     fill: '#fff',
    //   //     stroke: '#DCDEE1',
    //   //     cursor: 'pointer'
    //   //   })
    //   //   container.add(checkbox)
    //   // }
    //   return {
    //     rootContainer: container,
    //     renderDefault: false
    //   }
    // },
    "customLayout": checked ? (args: TYPES.CustomRenderFunctionArg) => {
      const { rect, table, col, row } = args;
      const width = rect?.width || 150;
      const height = rect?.height || 46;
      const container = new CustomLayout.Group({
        height,
        width,
      });
      const box = new CustomLayout.Rect({
        x: 0.5,
        y: 0,
        height: height + 4,
        width: width - 1,
        fill: 'rgba(139, 211, 255, 0.1)', 
        stroke: '#8BD3FF',
        lineWidth: 1.4,
      });
      container.add(box)
      return {
        rootContainer: container,
        renderDefault: true
      }
    } : undefined
  }))
}

export const columns = [{
  "title": "单行文本",
  "field": "Project Name",
  "dimensionKey": "Project Name",
  "columns": [{
    "field": "Project Name",
    "title": "Project Name",
    "dimensionKey": "Project Name",
    "mergeCell": true,
  }],
  "headerStyle": {
    "bgColor": "#FFF",
  },
  "headerIcon": "String"
}, {
  "title": "单行文本",
  "field": "Task Name",
  "dimensionKey": "Task Name",
  "columns": [{
    "field": "Task Name",
    "title": "Task Name",
    "dimensionKey": "Task Name",
  }],
  "headerStyle": {
    "bgColor": "#FFF",
  },
  "headerIcon": "String"
}, {
  "title": "单行文本",
  "field": "Assigned to",
  "dimensionKey": "Assigned to",
  "columns": [{
    "field": "Assigned To",
    "title": "Assigned to",
    "dimensionKey": "Assigned to",
  }],
  "headerStyle": {
    "bgColor": "#FFF",
  },
  "headerIcon": "String"
}, {
  "title": "日期/时间",
  "field": "Start Date",
  "dimensionKey": "Start Date",
  "columns": [{
    "field": "Start Date",
    "title": "Start Date",
    "dimensionKey": "Start Date",
    "mergeCell": true,
    "disableSelect": true,
    "disableHeaderSelect": true,
    "style": {
      "bgColor": "#F4F6F9",
      "color": "#C2C7CC",
    },
    "headerStyle": {
      "bgColor": "#F4F6F9",
      "color": "#C2C7CC",
      "fontWeight": 500
    },
  }],
  "headerStyle": {
    "bgColor": "#F4F6F9",
    "color": "#C2C7CC",
    "fontWeight": 500
  },
  "headerIcon": "DateDisabled"
}, {
  "title": "整数",
  "field": "Days Required",
  "dimensionKey": "Days Required",
  "columns": [{
    "field": "Days Required",
    "title": "Days Required",
    "dimensionKey": "Days Required",
  }],
  "headerStyle": {
    "bgColor": "#FFF",
  },
  "headerIcon": "Number"
}, {
  "title": "日期/时间",
  "field": "End Date",
  "dimensionKey": "End Date",
  "columns": [{
    "field": "End Date",
    "title": "End Date",
    "dimensionKey": "End Date",
  }],
  "headerStyle": {
    "bgColor": "#FFF",
  },
  "headerIcon": "Date"
}, {
  "title": "浮点数",
  "field": "Progress",
  "dimensionKey": "Progress",
  "columns": [{
    "field": "Progress",
    "title": "Progress",
    "dimensionKey": "Progress",
    "fieldFormat": (record: { Progress: number; }) => `${Math.round(record.Progress * 100)}%`,
  }],
  "headerStyle": {
    "bgColor": "#FFF",
  },
  "headerIcon": "Number"
}]
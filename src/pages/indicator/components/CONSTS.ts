import { TYPES } from '@visactor/vtable'
import { typeMap } from '@/utils/common'

export const ICONS = Object.keys(typeMap.type);

export function getIconSvg(name: string, disabled=false): string {
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

export const DLSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="none" version="1.1" width="52" height="24" viewBox="0 0 52 24"><g><rect x="0" y="0" width="52" height="24" rx="2" fill="#E8F8FF" fill-opacity="1"/><rect x="0.5" y="0.5" width="51" height="23" rx="1.5" fill-opacity="0" stroke-opacity="1" stroke="#8BD3FF" fill="none" stroke-width="1"/><g><path d="M11.132,12.796L11.132,13.54L11.864,13.54C12.416,14.296,13.148,14.956,14.036,15.508C12.956,15.964,11.708,16.288,10.315999999999999,16.492L10.688,17.247999999999998C12.272,16.984,13.676,16.552,14.888,15.976C16.028,16.552,17.432000000000002,16.972,19.088,17.247999999999998L19.46,16.503999999999998C18.032,16.311999999999998,16.784,15.988,15.704,15.532C16.676000000000002,14.956,17.492,14.248,18.164,13.432L18.164,12.796L11.132,12.796ZM12.776,13.54L17.036,13.54C16.412,14.152,15.68,14.68,14.84,15.124C14.012,14.692,13.328,14.164,12.776,13.54ZM10.436,10.108L12.452,10.108L12.452,11.98L17.311999999999998,11.98L17.311999999999998,10.108L19.16,10.108L19.16,9.315999999999999L17.311999999999998,9.315999999999999L17.311999999999998,8.332L16.472,8.332L16.472,9.315999999999999L13.292,9.315999999999999L13.292,8.344000000000001L12.452,8.344000000000001L12.452,9.315999999999999L10.436,9.315999999999999L10.436,7.948L19.183999999999997,7.948L19.183999999999997,7.132L15.068,7.132C14.936,6.772,14.792,6.436,14.648,6.136L13.736,6.28C13.904,6.544,14.048,6.82,14.192,7.132L9.572,7.132L9.572,11.044C9.548,13.408,9.188,15.256,8.492,16.588L9.14,17.164C9.956,15.628,10.388,13.588,10.436,11.044L10.436,10.108ZM13.292,10.108L16.472,10.108L16.472,11.248L13.292,11.248L13.292,10.108ZM21.836,11.224L21.836,14.284L25.556,14.284L25.556,14.956L21.536,14.956L21.536,15.532L25.556,15.532L25.556,16.240000000000002L20.636,16.240000000000002L20.636,16.912L31.364,16.912L31.364,16.240000000000002L26.42,16.240000000000002L26.42,15.532L30.488,15.532L30.488,14.956L26.42,14.956L26.42,14.284L30.188,14.284L30.188,11.224L21.836,11.224ZM29.36,13.744L26.42,13.744L26.42,13.012L29.36,13.012L29.36,13.744ZM25.556,13.744L22.664,13.744L22.664,13.012L25.556,13.012L25.556,13.744ZM22.664,12.508L22.664,11.764L25.556,11.764L25.556,12.508L22.664,12.508ZM26.42,11.764L29.36,11.764L29.36,12.508L26.42,12.508L26.42,11.764ZM22.1,6.388L22.1,9.352L29.936,9.352L29.936,6.388L22.1,6.388ZM29.096,8.836L22.939999999999998,8.836L22.939999999999998,8.128L29.096,8.128L29.096,8.836ZM22.939999999999998,7.612L22.939999999999998,6.916L29.096,6.916L29.096,7.612L22.939999999999998,7.612ZM20.624000000000002,9.975999999999999L20.624000000000002,10.624L31.376,10.624L31.376,9.975999999999999L20.624000000000002,9.975999999999999ZM41.768,17.092C42.584,17.092,42.992,16.66,42.992,15.82L42.992,6.28L42.128,6.28L42.128,15.616C42.128,16.084,41.9,16.323999999999998,41.468,16.323999999999998C40.988,16.323999999999998,40.472,16.3,39.944,16.264L40.136,17.092L41.768,17.092ZM39.572,7.192L39.572,14.776L40.412,14.776L40.412,7.192L39.572,7.192ZM32.864000000000004,6.712L32.864000000000004,7.552L34.724000000000004,7.552C34.472,9.52,33.751999999999995,11.056,32.576,12.184L32.984,12.988C33.308,12.688,33.608000000000004,12.352,33.884,11.992C34.676,12.424,35.372,12.892,35.984,13.396C35.216,14.644,34.147999999999996,15.616,32.792,16.311999999999998L33.212,17.08C35.876000000000005,15.724,37.507999999999996,13.348,38.096000000000004,9.964L38.096000000000004,9.196L35.239999999999995,9.196C35.384,8.68,35.492000000000004,8.128,35.576,7.552L38.684,7.552L38.684,6.712L32.864000000000004,6.712ZM34.316,11.332C34.556,10.924,34.772,10.492,34.964,10.012L37.268,10.012C37.076,10.984,36.775999999999996,11.872,36.379999999999995,12.676C35.78,12.208,35.096000000000004,11.764,34.316,11.332Z" fill="#0084FF" fill-opacity="1"/></g></g></svg>
`;

const padding = [8, 15];
const iconSize = 18;
type Col = {
  field: string;
  type: string;
}
export function getColumns(cols: Col[]) {
  return cols.map(({field, type}) => ({
    // "headerType": "text",
    // "cellType": "text",
    "field": field,
    "title": field,
    "dimensionKey": field,
    "fieldFormat": (record: { Progress: number; }) => `${Math.round(record.Progress * 100)}%`,
    "headerCustomRender": (args: TYPES.CustomRenderFunctionArg) => {
      const { dataValue, rect } = args;
      const width = rect?.width || 180;
      const height = rect?.height || 92;
      // console.log('width: ', rect?.width)
      // console.log('height: ', rect?.height)
      const rowHeight = height / 2
      const elements: TYPES.ICustomRenderElements = [];
      elements.push({
        type: 'icon',
        x: padding[1],
        y: (rowHeight - iconSize) / 2,
        width: iconSize,
        height: iconSize,
        svg: getIconSvg(type),
      })
      elements.push({
        type: 'text',
        x: padding[1] + iconSize + 4,
        y: rowHeight / 2 + 1,
        fill: '#1C2126',
        fontSize: 14,
        fontWeight: 600,
        textBaseline: 'middle',
        text: typeMap.type[type],
      })
      elements.push({
        type: 'line',
        points: [{x: 1, y: rowHeight + 0.5}, {x: width, y: rowHeight + 0.5}],
        lineWidth: 1,
        stroke: '#DCDEE1'
      })
      elements.push({
        type: 'rect',
        x: 1,
        y: rowHeight + 1,
        width: width - 2,
        height: rowHeight - 2,
        fill: '#F9FBFC',
      })
      elements.push({
        type: 'text',
        fill: '#1C2126',
        fontSize: 14,
        fontWeight: 600,
        textBaseline: 'middle',
        text: dataValue,
        x: padding[1],
        y: rowHeight + rowHeight / 2,
      })
      return {
        elements,
        expectedHeight: width,
        expectedWidth: height,
        renderDefault: false,
      }
    },
  }))
}

const columns = [{
  "title": "单行文本",
  "field": "Project Name",
  "dimensionKey": "Project Name",
  "columns":[{
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
  "columns":[{
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
  "columns":[{
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
  "columns":[{
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
  "columns":[{
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
  "columns":[{
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
  "columns":[{
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
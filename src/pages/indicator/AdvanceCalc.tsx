import { useSelector } from "react-redux";
import { useEffect, useRef } from 'react'
import { Button, Flex, Modal, Space, Typography } from "antd";
import { ListTable } from '@visactor/react-vtable'
import { CustomLayout } from '@visactor/vtable'
import { IOption } from "@visactor/react-vtable/es/tables/base-table";
import { StoreState } from "@/store";
import { isEmpty } from "lodash";
import { Col } from "./components/CONSTS";

const getColumns = (cols: Col[]) => {
  return cols.map(({ field, mergeCell }) => ({
    "field": field,
    "title": field,
    "dimensionKey": field,
    "mergeCell": mergeCell,
    "defaultStyle": {
      bgColor: "#8BD3FF"
    }
  }))
}

export default function AdvanceCalc(props: {open: boolean; onClose: Function;}) {
  const vtable = useRef<any>(null);
  const calc = useSelector((state: StoreState) => state.indicatorAdvance.calc);

  const option: IOption = {
    widthMode: 'autoWidth',
    autoFillWidth: true,
    autoWrapText: true,
    defaultRowHeight: 42,
    defaultColWidth: 165,
    rightFrozenColCount: 1,
    select: {
      disableSelect: true,
    },
    hover: {
      highlightMode: 'row'
    },
    theme: {
      underlayBackgroundColor: 'transparent',
      // 冻结列效果
      // frozenColumnLine: {
      //   shadow: {
      //     width: 3,
      //     startColor: 'rgba(0, 29, 77, 0.12)',
      //     endColor: 'rgba(0, 29, 77, 0)'
      //   }
      // },
      frameStyle: {
        borderColor: '#DCDEE1',
        borderLineWidth: 0.2,
        cornerRadius: 3,
      },
      defaultStyle: {
        color: '#4C5A67',
        fontSize: 14,
        borderColor: '#DCDEE1',
        padding: [8, 15],
        autoWrapText: true,
        hover:{
          cellBgColor: '#F1F8FF',
          inlineRowBgColor: 'rgba(0,0,0,0.02)',
          inlineColumnBgColor: 'rgba(0,0,0,0.02)',
        },
      },
      headerStyle: {
        color: '#1C2126',
        bgColor: '#F9FBFC',
        fontWeight: 600,
      },
      // scrollStyle: {
      //   visible: 'always',
      //   scrollSliderColor: 'rgba(0,0,0,0.2)',
      //   scrollRailColor: 'rgba(0,0,0,0)',
      //   // barToSide: true,
      // },
      // selectionStyle: {
      //   cellBgColor: 'rgba(139, 211, 255, 0.1)',
      //   cellBorderColor: '#8BD3FF',
      //   cellBorderLineWidth: 1,
      // },
    },
    columns: calc ? getColumns(calc?.columns) : [],
    customMergeCell: (col: any, row: any, table: any) => {
      if (!isEmpty(calc?.mergeCell.row) && calc?.mergeCell.row.includes(row)) {
        const item = calc?.records[row-1];
        if (col >= item.merge-1 && col < table.colCount) {
          const key = calc?.groupBy[item.merge-1];
          const name = item[key];
          const colWidth = table.getColWidth(calc?.columns.length-1)
          return {
            text: '小计 |',
            range: {
              start: {
                col: item.merge - 1,
                row: row
              },
              end: {
                col: table.colCount - 1,
                row: row
              }
            },
            style: {
              fontWeight: 600,
              fontSize: 12,
              color: '#1C2126',
              bgColor: '#F9FBFC'
            },
            customLayout: (args: any) => {
              const { width, height } = args.rect;
              const container = new CustomLayout.Group({
                height,
                width: width,
              });
              const text = new CustomLayout.Text({
                x: width - colWidth + 14,
                y: height / 2 + 1,
                text: item[calc.dimension],
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'PingFang SC',
                fill: '#1C2126',
                textBaseline: 'middle',
              });
              const fieldName = new CustomLayout.Text({
                x: 54,
                y: height / 2 + 1,
                text: name,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'PingFang SC',
                fill: '#1C2126',
                textBaseline: 'middle',
              })
              container.add(fieldName)
              container.add(text)
              return {
                rootContainer: container,
                renderDefault: true,
              }
            }
          };
        }
      }
    },
  }

  const onReady = (tableInstance: any, isFirst: Boolean) => {
    if (isFirst) {
      vtable.current = tableInstance
    }
  }
  
  useEffect(() => {
    if (vtable.current && calc) {
      vtable.current.updateOption({
        ...option,
        columns: getColumns(calc?.columns),
      });
    }
  }, [calc])

  return (
    <Modal
      title="计算结果"
      width={800}
      open={props.open}
      onCancel={() => props.onClose()}
      footer={<Flex justify="space-between" align="center">
        <Space>
          <Typography.Text strong>合计：</Typography.Text>
          <Typography.Title level={5} style={{margin: 0}}>{calc?.value}</Typography.Title>
        </Space>
        <Button type="primary" onClick={() => props.onClose()}>确定</Button>
      </Flex>}
    >
      { calc ? (
        <div className="pdb-indicator-advcalc">
          <ListTable
            option={option}
            records={calc?.records}
            onReady={onReady}
          />
        </div>
      ) : null }
    </Modal>
  )
}

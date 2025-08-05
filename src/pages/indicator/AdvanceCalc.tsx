import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from 'react'
import { Modal } from "antd";
import { ListTable } from '@visactor/react-vtable'
import { IOption } from "@visactor/react-vtable/es/tables/base-table";
import { StoreState } from "@/store";
import { map } from "lodash";

export default function AdvanceCalc(props: {open: boolean; onClose: Function;}) {
  const vtable = useRef<any>(null);
  const calc = useSelector((state: StoreState) => state.indicatorAdvance.calc);

  const option: IOption = {
    widthMode: 'autoWidth',
    autoFillWidth: true,
    autoWrapText: true,
    defaultRowHeight: 42,
    defaultColWidth: 165,
    select: {
      disableSelect: true,
    },
    hover: {
      highlightMode: 'row'
    },
    theme: {
      underlayBackgroundColor: 'transparent',
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
          // cellBgColor: '#F1F8FF',
          cellBgColor: 'rgba(0,0,0,0.02)',
          inlineRowBgColor: 'rgba(0,0,0,0.02)',
          inlineColumnBgColor: 'rgba(0,0,0,0.02)',
        },
      },
      headerStyle: {
        color: '#1C2126',
        bgColor: '#F9FBFC',
        fontWeight: 600,
      },
      scrollStyle: {
        visible: 'always',
        scrollSliderColor: 'rgba(0,0,0,0.2)',
        scrollRailColor: 'rgba(0,0,0,0)',
        // barToSide: true,
      },
      selectionStyle: {
        cellBgColor: 'rgba(139, 211, 255, 0.1)',
        cellBorderColor: '#8BD3FF',
        cellBorderLineWidth: 1,
      },
    },
    columns: map(calc?.result[0], item => ({field: item, title: item, mergeCell: ['product', 'batch'].includes(item)})),
    records: map(calc?.result.slice(1), row => {
      const item: {
        [key: string]: any;
      } = {}
      calc?.result[0].forEach((col, i) => {
        item[col] = row[i]
      })
      return item
    }),
  }

  const onReady = (tableInstance: any, isFirst: Boolean) => {
    if (isFirst) {
      vtable.current = tableInstance
    }
  }
  
  useEffect(() => {
    if (vtable.current && calc?.result) {
      vtable.current.updateOption({
        ...option,
        columns: map(calc?.result[0], item => ({field: item, title: item, mergeCell: ['product', 'batch'].includes(item)})),
        records: map(calc?.result.slice(1), row => {
          const item: {
            [key: string]: any;
          } = {}
          calc?.result[0].forEach((col, i) => {
            item[col] = row[i]
          })
          return item
        }),
      });
    }
  }, [calc])

  return (
    <Modal
      title="计算结果"
      width={800}
      open={props.open}
      onCancel={() => props.onClose()}
      onOk={() => props.onClose()}
    >
      { calc?.result ? (
        <div className="pdb-indicator-advcalc">
          <ListTable
            option={option}
            onReady={onReady}
          />
        </div>
      ) : null }
    </Modal>
  )
}
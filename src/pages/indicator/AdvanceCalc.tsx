import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from 'react'
import { message, Space, Empty, Typography, Spin } from "antd";
import { ListTable } from '@visactor/react-vtable'
import { CustomLayout } from '@visactor/vtable'
import { IOption } from "@visactor/react-vtable/es/tables/base-table";

export default function AdvanceCalc(props: any) {
  const dispatch = useDispatch()
  const vtable = useRef<any>(null);


  return (
    <div className="pdb-indicator-advcalc">

    </div>
  )
}
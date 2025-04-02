import { notification, Spin } from "antd";
import { BorderOutlined, CloseSquareOutlined, MinusSquareOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';// 划线、表、任务列表和直接url等的语法扩展
import rehypeRaw from 'rehype-raw'// 解析标签，支持html语法
import { fetchEventSource } from "@microsoft/fetch-event-source";
import Draggable from 'react-draggable';
import { get } from "lodash";
import { StoreState } from "@/store";
import { setParams, toggle } from "@/reducers/llmStream";
import './llmStream.less';

export default function LLMStream() {
  const dispatch = useDispatch();
  const open = useSelector((state: StoreState) => state.llmStream.open);
  const params = useSelector((state: StoreState) => state.llmStream.params);
 
  const [collapsed, setCollapsed] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [message, setMessage] = useState<string>('')

  const handleClose = () => {
    dispatch(toggle(false))
    dispatch(setParams(undefined))
  }

  const handlePlay = () => {
    setFetching(true)
    // console.log('params: ', params)
    const ctrl = new AbortController()
    const base = get(window, 'pdbConfig.basePath', '')
    const eventSource = fetchEventSource(`${base}/llm/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: ctrl.signal,
      openWhenHidden: true,
      async onopen(response) {
        if (response.ok) {
          setMessage(() => '')
        } else {
          // throw new Error('连接失败')
          console.error('连接失败')
          notification.error({
            message: 'summary 连接失败',
            description: `${response.status}: ${response.statusText}`
          })
          return
        }
      },
      onmessage(msg) {
        setMessage((prev) => `${prev}${msg.data.replaceAll('898989', '\n')}`)
      },
      onclose() {
        console.log('onclose: ')
        setFetching(false)
      },
      onerror(error) {
        console.log('onerror: ')
        setFetching(false)
        throw error
      }
    })
  }

  useEffect(() => {
    if (open && params) {
      handlePlay()
    } else {
      setFetching(false)
      setMessage('')
    }
  }, [open, params])

  const renderBody = () => {
    return (
      <div className={`pdb-llm-output-body ${collapsed ? 'fade-out-down' : 'fade-in-up'}`}>
        <Markdown
          className='markdown-body'
          remarkPlugins={[[remarkGfm, {singleTilde: false}]]}
          rehypePlugins={[
            rehypeRaw,
            // rehypeHighlight
          ]}
        >{ message }</Markdown>
        {
          fetching && <Spin size="small" />
        }
      </div>
    )
  }

  return open ? (
    <Draggable handle=".pdb-llm-output-header">
      <div className="pdb-llm-output">
        <div className="pdb-llm-output-header">
          <span className="pdb-llm-output-btn" onClick={() => setCollapsed(!collapsed)}>{ collapsed ? <BorderOutlined /> : <MinusSquareOutlined /> }</span>
          <span className="pdb-llm-output-btn" onClick={handleClose}><CloseSquareOutlined /></span>
        </div>
        { renderBody() }
      </div>
    </Draggable>
  ) : null
}
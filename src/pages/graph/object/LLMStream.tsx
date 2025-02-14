import { StoreState } from "@/store";
import { Spin } from "antd";
import { BorderOutlined, CloseSquareOutlined, MinusSquareOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';// 划线、表、任务列表和直接url等的语法扩展
import rehypeRaw from 'rehype-raw'// 解析标签，支持html语法
import { toggle } from "@/reducers/llmStream";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { get } from "lodash";
import './llmStream.less';

export default function LLMStream() {
  const dispatch = useDispatch();
  const open = useSelector((state: StoreState) => state.llmStream.open);
  const params = useSelector((state: StoreState) => state.llmStream.params);

  const [collapsed, setCollapsed] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [message, setMessage] = useState<string>('')

  const handlePlay = () => {
    if (!params) return
    setFetching(true)
    let retryCount = 0
    const ctrl = new AbortController()
    const base = get(window, 'pdbConfig.basePath', '')
    const eventSource = fetchEventSource(`${base}/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: ctrl.signal,
      async onopen(response) {
        console.log('open: ', response)
      },
      onmessage(msg) {
        setMessage((prev) => `${prev}${msg.data.replaceAll('898989', '\n')}`)
      },
      onclose() {
        console.log('onclose: ')
        setFetching(false)
      },
      onerror(error) {
        if (retryCount) {
          setFetching(false)
          throw error
        } else {
          retryCount++
        }
      }
    })
    console.log('eventSource: ', eventSource)
  }

  useEffect(() => {
    if (open && !fetching) {
      handlePlay()
    }
  }, [open])

  const renderBody = () => {
    // console.log(message)
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
    <div className="pdb-llm-output">
      <div className="pdb-llm-output-header">
        {/* <Button onClick={handlePlay}>测试</Button> */}
        <span className="pdb-llm-output-btn" onClick={() => setCollapsed(!collapsed)}>{ collapsed ? <BorderOutlined /> : <MinusSquareOutlined /> }</span>
        <span className="pdb-llm-output-btn" onClick={() => dispatch(toggle(false))}><CloseSquareOutlined /></span>
      </div>
      { renderBody() }
    </div>
  ) : null
}
/* eslint-disable no-undef */
/*
 * Copyright 2022 Sony Semiconductor Solutions Corp. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useState, useEffect } from 'react'
import router from 'next/router'
import axios from 'axios'
import styles from '../styles/deviceRelation.module.css'
import { API_TIME_OUT } from '../common/config'
import { OverlaySpinner } from '../hooks/OverlaySpinner'
//import { useSpinner } from '../hooks/useSpinner'

export default function DeviceRelation () {
  //const { openSpinner, closeSpinner } = useSpinner()
  const [deviceList, setDeviceList] = useState<string[]>([])
  const [drawerList, setDrawerList] = useState<drawers[]>([])
  const [deviceRelationList, setDeviceRelationList] = useState<deviceRelation[]>([])
  const [nowDrawer, setNowDrawer] = useState<drawers>({ shelfName: '', drawerList: [] })
  const [nowRelation, setNowRelation] = useState<deviceRelation>({ deviceName: '', drawer: [] })
  const [isloading, setIsLoading] = useState(false);

  useEffect(() => {
    const get = async () => {
      setIsLoading(true)
      try {
        const response = await axios.get('/api/getDeviceData', { timeout: API_TIME_OUT })
        if (response.data) {
          setDeviceList(response.data)
        }
      } catch (error) {
        console.error(error)
      }
      setIsLoading(false)
    }
    get()
  }, [])
  
  useEffect(() => {
    const get = async () => {
      try {
        const response = await axios.get('/api/getDrawerList', { timeout: API_TIME_OUT })
        if (response.data) {
          setDrawerList(response.data)
          setNowDrawer(response.data[0])
        }
      } catch (error) {
        console.error(error)
      }
    }
    get()
  }, [])

  useEffect(() => {
    const get = async () => {
      try {
        const response = await axios.get('/api/getDeviceRelationList', { timeout: API_TIME_OUT })
        if (response.data) {
          setDeviceRelationList(response.data)
          setNowRelation(response.data[0])
        }
      } catch (error) {
        console.error(error)
      }
    }
    get()
  }, [])

  const addDeviceRelation = () => {
    const deviceName = (document.getElementById('deviceList') as HTMLSelectElement).value
    const shelfName = (document.getElementById('shelfList') as HTMLSelectElement).value
    const drawerName = (document.getElementById('drawerList') as HTMLSelectElement).value
    const newList = [...deviceRelationList]

    let targetRelation = newList.find(elm => elm.deviceName === deviceName)
    if (targetRelation === undefined) {
      targetRelation = { deviceName, drawer: [{ shelfName, drawerName }] }
      newList.push(targetRelation)
      newList.sort((elm1, elm2) => {
        if (elm1.deviceName < elm2.deviceName) {
          return -1
        }
        if (elm1.deviceName > elm2.deviceName) {
          return 1
        }
        return 0
      })
    } else {
      targetRelation.drawer.push({ shelfName, drawerName })
      targetRelation.drawer.sort((elm1, elm2) => {
        if (elm1.shelfName < elm2.shelfName) {
          return -1
        }
        if (elm1.shelfName > elm2.shelfName) {
          return 1
        }
        if (elm1.drawerName < elm2.drawerName) {
          return -1
        }
        if (elm1.drawerName > elm2.drawerName) {
          return 1
        }
        return 0
      })
    }
    setDeviceRelationList(newList)
    setNowRelation(targetRelation)
  }

  const deleteDeviceRelation = () => {
    const deviceName = (document.getElementById('deviceList') as HTMLSelectElement).value
    const selectedIndex = (document.getElementById('relationList') as HTMLSelectElement).selectedIndex

    if (selectedIndex < 0) {
      return
    }

    const newList = [...deviceRelationList]
    const targetRelation = newList.find(elm => elm.deviceName === deviceName)
    targetRelation.drawer.splice(selectedIndex, 1)
    setDeviceRelationList(newList)
    setNowRelation(targetRelation)
  }

  const saveDeviceRelation = () => {
    const put = async () => {
      try {
        await axios.put('/api/putDeviceRelationList', deviceRelationList, { timeout: API_TIME_OUT })
      } catch (error) {
        console.log(error)
      }
    }
    put()
  }

  const changeDeviceList = (e) => {
    const deviceName = e.target.value
    const nowObj = deviceRelationList.find(elm => elm.deviceName === deviceName)
    if (nowObj) {
      setNowRelation(nowObj)
    } else {
      setNowRelation({ deviceName, drawer: [] })
    }
  }

  const changeShelfList = (e) => {
    const shelfName = e.target.value
    const nowObj = drawerList.find(elm => elm.shelfName === shelfName)
    if (nowObj) {
      setNowDrawer(nowObj)
    }
  }

  return (
    <div>
      {isloading && <OverlaySpinner />}
      <h1 className='title'>デバイス登録</h1>
      <div className={styles.shelfTable}>
        <div className={styles.deviceDiv}>
          <div><a>デバイス</a></div>
          <div>
            <select id='deviceList' className={styles.deviceList} onChange={(e) => changeDeviceList(e)}>
              {
                deviceList.map((item) => {
                  return (
                    <option value={item} key={item}>{item}</option>
                  )
                })
              }
            </select>
          </div>
        </div>
        <div className={styles.shelfDiv}>
          <div><a>棚一覧</a></div>
          <div>
            <select id='shelfList' className={styles.shelfList} onChange={(e) => changeShelfList(e)}>
              {
                drawerList.map((item: drawers) => {
                  return (
                    <option value={item.shelfName} key={item.shelfName}>{item.shelfName}</option>
                  )
                })
              }
            </select>
          </div>
        </div>
        <div className={styles.drawerDiv}>
          <div><a>棚段一覧</a></div>
          <div>
              <select id='drawerList' className={styles.drawerList}>
              {
                nowDrawer.drawerList.map((item) => {
                  return (
                      <option value={item} key={item}>{item}</option>
                  )
                })
              }
              </select>
          </div>
        </div>
        <div className={styles.buttonDiv}>
          <div className={styles.button}><button onClick={() => addDeviceRelation()}>追加</button></div>
          <div className={styles.button}><button onClick={() => deleteDeviceRelation()}>削除</button></div>
          <div className={styles.button}><button onClick={() => saveDeviceRelation()}>保存</button></div>
        </div>
        <div className={styles.relationDiv}>
          <div><a>デバイス登録</a></div>
            <div>
              <select id='relationList' className={styles.relationList} size={10}>
                {
                  nowRelation.drawer.map((item) => {
                    return (
                      <option value={item.shelfName + ',' + item.drawerName} key={item.shelfName + ',' + item.drawerName}>{item.shelfName.padEnd(15, '　') + '|' + item.drawerName}</option>
                    )
                  })
                }
              </select>
          </div>
        </div>
      </div>
      <div className={styles.footter}>
        <button className={styles.footerButton} onClick={() => router.push('./topPage')}>戻る</button>
      </div>
    </div>
  )
}

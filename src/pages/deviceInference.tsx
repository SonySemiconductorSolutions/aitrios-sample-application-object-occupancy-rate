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
import paper from 'paper'
import useInterval from '../hooks/useInterval'
import deserialize from '../util/deserialize'
import analyzeInference from '../util/analyzeInference'
import { API_TIME_OUT } from '../common/config'
import { OverlaySpinner } from '../hooks/OverlaySpinner'

import styles from '../styles/deviceInference.module.css'

export default function DeviceInference () {
  const [deviceList, setDeviceList] = useState<string[]>([])
  const [shelfList, setShelfList] = useState<string[]>([])
  const [drawerList, setDrawerList] = useState<string[]>([])
  const [nowDevice, setNowDevice] = useState<string>('')
  const [nowShelf, setNowShelf] = useState<string>('')
  const [nowDrawer, setNowDrawer] = useState<string>('')
  const [deviceRangeList, setDeviceRangeList] = useState<deviceRange[]>([])
  const [base64Image, setBase64Image] = useState<string>('')
  const [deviceOccupancy, setDeviceOccupancy] = useState<oneDeviceOccupancy[]>([])
  const [shelfOccypancy, setShelfOccupancy] = useState<oneDeviceOccupancy[]>([])
  const [drawerOccypancy, setDrawerOccupancy] = useState<oneDeviceOccupancy>()
  const [oldPath, setOldPath] = useState<paper.Path[]>([])
  const [isPolling, setIsPolling] = useState<boolean>(false)
  const [occupancySettings, setOccupancySettings] = useState<OccupancySettings>()
  const [isloading, setIsLoading] = useState(false);

  useEffect(() => {
    const get = async () => {
      try {
        const response = await axios.get('/api/getInferenceSettings', { timeout: API_TIME_OUT })
        if (response.data) {
          const settings: OccupancySettings = response.data
          setOccupancySettings(response.data)
          setIsPolling(true)

          const canvas = document.getElementById('canvas') as HTMLCanvasElement
          // paperのセットアップ前にcanvasのサイズを指定しておく
          canvas.width = settings.imageWidth
          canvas.height = settings.imageHeight
          paper.setup(canvas)

          const raster = new paper.Raster('image')
          raster.position = paper.view.center
        }
      } catch (error) {
        console.error(error)
      }
    }
    get()
  }, [])

  useEffect(() => {
    if (occupancySettings) {
      const get = async () => {
        try {
          const response = await axios.get('/api/getDeviceRange', { timeout: API_TIME_OUT })
          if (response.data) {
            const rangeList: deviceRange[] = response.data
            setDeviceRangeList(rangeList)
          }
        } catch (error) {
          console.error(error)
        }
      }
      get()
    }
  }, [occupancySettings])

  useEffect(() => {
    updateDeviceList()
  }, [deviceRangeList])

  useEffect(() => {
    updateDrawerList()
  }, [nowShelf, shelfList])

  useEffect(() => {
    if (nowDevice) {
      updateShelfList()
      getLatestImage(nowDevice)
    }
  }, [nowDevice])

  useEffect(() => {
    if (nowShelf && deviceOccupancy) {
      const tmpShelfOccypancyList: oneDeviceOccupancy[] = []
      for (const item of deviceOccupancy) {
        if (item.shelfName === nowShelf) {
          tmpShelfOccypancyList.push(item)
        }
      }
      setShelfOccupancy(tmpShelfOccypancyList)
    }
  }, [nowShelf, deviceOccupancy])

  useEffect(() => {
    if (shelfOccypancy && nowDrawer) {
      const tmpOccupancy = shelfOccypancy.find(item => item.drawerName === nowDrawer)
      if (tmpOccupancy) {
        setDrawerOccupancy(tmpOccupancy)
      } else {
        setDrawerOccupancy(undefined)
      }
    }
  }, [nowDrawer, shelfOccypancy])

  useEffect(() => {
    drawImage(base64Image)
    getDevice(nowDevice)
  }, [base64Image])

  useEffect(() => {
    drawInference()
  }, [drawerOccypancy])

  useInterval(() => {
    updateLatestData()
  }, isPolling ? occupancySettings.pollingInterval : null)

  const updateDeviceList = () => {
    if (deviceRangeList) {
      let tmpDeviceList: string[] = []
      for (const item of deviceRangeList) {
        tmpDeviceList.push(item.deviceName)
      }
      tmpDeviceList = Array.from(new Set(tmpDeviceList))
      setDeviceList(tmpDeviceList)
      setNowDevice(tmpDeviceList[0])
    }
  }

  const updateShelfList = () => {
    let tmpShelfList: string[] = []
    for (const item of deviceRangeList) {
      if (item.deviceName === nowDevice) {
        tmpShelfList.push(item.drawer.shelfName)
      }
    }
    tmpShelfList = Array.from(new Set(tmpShelfList))
    setShelfList(tmpShelfList)
    if (tmpShelfList.length > 0) {
      setNowShelf(tmpShelfList[0])
    } else {
      setNowShelf('')
    }
  }

  const updateDrawerList = () => {
    let tmpDrawerList: string[] = []
    for (const item of deviceRangeList) {
      if ((item.deviceName === nowDevice) && (item.drawer.shelfName === nowShelf)) {
        tmpDrawerList.push(item.drawer.drawerName)
      }
    }
    tmpDrawerList = Array.from(new Set(tmpDrawerList))
    setDrawerList(tmpDrawerList)
    if (tmpDrawerList.length > 0) {
      setNowDrawer(tmpDrawerList[0])
    } else {
      setNowDrawer('')
    }
  }

  const getDevice = (deviceId: string) => {
    async function getInference () {
      const deserializedInferenceData = await getDeviceInference(deviceId)
      if (deserializedInferenceData) {
        const data = analyzeInference([deserializedInferenceData], deviceRangeList, occupancySettings)
        setDeviceOccupancy(data)
      } else {
        setDeviceOccupancy([])
      }
    }
    getInference()
  }

  const getDeviceInference = async (deviceId: string) => {
    let deserializedInferenceData: outputResult
    const get = async () => {
      setIsLoading(true)
      try {
        const response = await axios.get('/api/getDeviceInference', {
          params: {
            deviceId
          },
          timeout: API_TIME_OUT
        })
        deserializedInferenceData = deserialize(response.data.Inference)
      } catch (error) {
        console.error(error)
      }
      setIsLoading(false)
    }
    await get()
    return { deviceName: deviceId, result: deserializedInferenceData }
  }

  const getLatestImage = (deviceId: string) => {
    const get = async () => {
      setIsLoading(true)
      try {
        const response = await axios.get('/api/getDeviceImage', {
          params: {
            deviceId
          },
          timeout: API_TIME_OUT
        })
        setBase64Image(response.data.image)
      } catch (error) {
        console.error(error)
      }
      setIsLoading(false)
    }
    get()
  }

  const drawImage = (image: string) => { // Imgタグのsrcにbase64Imgを設定すれば更新されるようになれば不要になる
    const img = document.getElementById('image') as HTMLImageElement
    img.src = image
    if (image.length > 0) {
      img.onload = () => {
        const tmpcanvas = document.getElementById('canvas') as HTMLCanvasElement
        tmpcanvas.width = img.width
        tmpcanvas.height = img.height
        // 背景画像を再設定
        const raster = new paper.Raster('image')
        raster.size = new paper.Size(img.width, img.height)
        raster.position = paper.view.center
      }
    }
    if (image.length === 0) {
      const tmpcanvas = document.getElementById('canvas') as HTMLCanvasElement
      tmpcanvas.width = img.width
      tmpcanvas.height = img.height
    }
  }

  const drawInference = () => {
    const tmpPathList = [...oldPath]

    if (tmpPathList.length > 0) {
      for (const item of tmpPathList) {
        item.remove()
      }
      tmpPathList.length = 0
    }
    if (drawerOccypancy) {
      const rangeStartPoint = new paper.Point(drawerOccypancy.rangeRect.left, drawerOccypancy.rangeRect.top)
      const rangeEndPoint = new paper.Point(drawerOccypancy.rangeRect.right, drawerOccypancy.rangeRect.bottom)
      const tmpRangePath = new paper.Path.Rectangle(rangeStartPoint, rangeEndPoint)
      tmpRangePath.strokeColor = new paper.Color(0, 1, 0)
      tmpRangePath.fillColor = new paper.Color(0, 1, 0, 0.3)
      tmpRangePath.strokeWidth = 2
      tmpPathList.push(tmpRangePath)

      for (const item of drawerOccypancy.rectData) {
        const startPoint = new paper.Point(item.left, item.top)
        const endPoint = new paper.Point(item.right, item.bottom)
        const tmpPath = new paper.Path.Rectangle(startPoint, endPoint)
        tmpPath.strokeColor = new paper.Color(1, 0, 0)
        tmpPath.fillColor = new paper.Color(1, 0, 0, 0.5)
        tmpPath.strokeWidth = 2
        tmpPathList.push(tmpPath)
      }
    }
    setOldPath(tmpPathList)
  }

  const updateLatestData = () => {
    getLatestImage(nowDevice)
  }

  const changeDeviceList = () => {
    const deviceName = (document.getElementById('deviceList') as HTMLSelectElement).value

    setNowDevice(deviceName)
  }

  const changeShelfList = () => {
    const shelfName = (document.getElementById('shelfList') as HTMLSelectElement).value

    setNowShelf(shelfName)
  }

  const changeDrawerList = () => {
    const drawerName = (document.getElementById('drawerList') as HTMLSelectElement).value

    setNowDrawer(drawerName)
  }

  const getLatestData = () => {
    updateLatestData()
  }

  return (
        <div>
          {isloading && <OverlaySpinner />}
            <h1 className='title'>推論結果確認</h1>
            <div className={styles.shelfTable}>
                <div className={styles.deviceDiv}>
                    <div><a>デバイス</a></div>
                    <div>
                        <select id='deviceList' className={styles.deviceList} value={nowDevice} onChange={() => changeDeviceList()}>
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
                    <select id='shelfList' className={styles.shelfList} value={nowShelf} onChange={() => changeShelfList()}>
                        {
                            shelfList.map((item) => {
                              return (
                                  <option value={item} key={item}>{item}</option>
                              )
                            })
                        }
                    </select>
                    </div>
                </div>
                <div className={styles.drawerDiv}>
                    <div><a>棚段一覧</a></div>
                    <div>
                        <select id='drawerList' className={styles.drawerList} value={nowDrawer} onChange={() => changeDrawerList()}>
                        {
                            drawerList.map((item) => {
                              return (
                                    <option value={item} key={item}>{item}</option>
                              )
                            })
                        }
                        </select>
                    </div>
                </div>
                <div className={styles.pictureDiv}>
                    <img className={styles.img} id='image'></img>
                    <canvas className={styles.canvas} id='canvas'>
                    </canvas>
                </div>
                <div className={styles.buttonDiv}>
                    <button className={styles.button} onClick={() => getLatestData()}>最新の推論情報を取得</button>
                </div>
            </div>
            <div className={styles.footter}>
              <button className={styles.footerButton} onClick={() => router.push('./topPage')}>戻る</button>
            </div>
        </div>
  )
}

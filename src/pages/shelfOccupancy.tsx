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
import { useState, useEffect } from 'react'
import router from 'next/router'
import axios from 'axios'
import paper from 'paper'
import deserialize from '../util/deserialize'
import analyzeInference, { calcDecimalPoint } from '../util/analyzeInference'
import styles from '../styles/shelfOccupancy.module.css'
import { API_TIME_OUT } from '../common/config'
import { OverlaySpinner } from '../hooks/OverlaySpinner'

const RECT_HEIGHT = 100
const RECT_WIDTH = 400
const INNER_RECT_CORRECT = 3

export default function ShelfOccupancy () {
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 150 })
  const [shelfList, setShelfList] = useState<string[]>([''])
  const [deviceList, setDeviceList] = useState<string[]>([])
  const [deviceRangeList, setDeviceRangeList] = useState<deviceRange[]>([])
  const [drawerOccupancyList, setDrawerOccupancyList] = useState<drawerOccupancy[]>([])
  const [canvas, setCanvas] = useState<HTMLCanvasElement>()
  const [oldPath, setOldPath] = useState<paper.Path | null>(null)
  const [occupancySettings, setOccupancySettings] = useState<OccupancySettings>()
  const [isloading, setIsLoading] = useState(false)

  useEffect(() => {
    const get = async () => {
      try {
        const response = await axios.get('/api/getInferenceSettings', { timeout: API_TIME_OUT })
        if (response.data) {
          setOccupancySettings(response.data)
        }
      } catch (error) {
        console.error(error)
      }
    }
    get()
  }, [])

  useEffect(() => {
    let obj: { shelfName: any; list: any }
    async function get () {
      obj = await getDeviceRange()
      updateDeviceList(obj.shelfName, obj.list)

      const canvas = document.getElementById('canvas') as HTMLCanvasElement
      const canvasContext = canvas.getContext('2d')
      if (canvasContext) {
        setCanvas(canvas)
      }
      paper.setup(canvas)
    }
    if (occupancySettings) {
      get()
    }
  }, [occupancySettings])

  useEffect(() => {
    getDevice()
  }, [deviceList])

  useEffect(() => {
    showOccupancyPicture()
  }, [drawerOccupancyList])
  /*
  useInterval(() => {
    getDevice()
  }, isPolling ? occupancySettings.pollingInterval : null)
*/
  const getDeviceRange = async () => {
    let shelfName: string = ''
    let rangeList: deviceRange[] = []
    try {
      const response = await axios.get('/api/getDeviceRange', { timeout: API_TIME_OUT })
      if (response.data) {
        rangeList = response.data
        setDeviceRangeList(rangeList)
        const tmpShelfList: string[] = []
        rangeList.forEach(item => {
          tmpShelfList.push(item.drawer.shelfName)
        })
        const tmpList = Array.from(new Set(tmpShelfList))
        shelfName = tmpList[0]
        setShelfList(tmpList)
      }
    } catch (error) {
      console.error(error)
    }
    return { shelfName, list: rangeList }
  }

  const getDeviceInference = async (deviceId: string) => {
    let deserializedInferenceData: outputResult
    setIsLoading(true)
    await axios.get('/api/getDeviceInference', {
      params: {
        deviceId
      },
      timeout: API_TIME_OUT
    })
      .then(
        response => {
          deserializedInferenceData = deserialize(response.data.Inference)
        }
      )
      .catch(
        error => {
          console.error(error)
        }
      )
    setIsLoading(false)
    return { deviceName: deviceId, result: deserializedInferenceData }
  }

  const getDevice = () => {
    const promiseList: any[] = []

    deviceList.map((elm) => {
      return promiseList.push(getDeviceInference(elm))
    })
    Promise.all(promiseList)
      .then(
        (response) => {
          const data = analyzeInference(response, deviceRangeList, occupancySettings)
          if (data) {
            const nowList = updateOccupancy(data)
            createShowOccupancyData(nowList)
          } else {
            updateOccupancy([])
          }
        }
      )
  }

  const updateOccupancy = (list: oneDeviceOccupancy[]) => {
    const nowList: oneDeviceOccupancy[] = []
    const newList = (nowList) ? [...nowList] : []
    for (const item of list) {
      let occupancy = (nowList) ? nowList.find(elm => (elm.deviceName === item.deviceName) && (elm.shelfName === item.shelfName) && (elm.drawerName === item.drawerName)) : undefined

      if (occupancy) {
        occupancy = item
      } else {
        newList.push(item)
      }
    }
    return newList
  }

  const createShowOccupancyData = (list: oneDeviceOccupancy[]) => {
    if (!occupancySettings) {
      return
    }

    const DECIMAL_POINT = calcDecimalPoint(occupancySettings.decimalPoint)
    const DECIMAL_MAGNIFICATION = 100 * calcDecimalPoint(occupancySettings.decimalPoint)
    const newList: drawerOccupancy[] = []
    const shelfName = (document.getElementById('shelfList') as HTMLSelectElement).value

    const showTargetList = list.filter(tmp => tmp.shelfName === shelfName)

    if (showTargetList && occupancySettings) {
      for (const item of showTargetList) {
        const joinData = (newList) ? newList.find(elm => ((elm.shelfName === item.shelfName) && (elm.drawerName === item.drawerName))) : undefined

        if (joinData) {
          let tmpValidArea = 0
          let tmpAllArea = 0
          joinData.occupancyList.push(item.occupancy)
          for (const occupancy of joinData.occupancyList) {
            tmpValidArea += occupancy.height * occupancy.width * (occupancy.occupancy / 100)
            tmpAllArea += occupancy.height * occupancy.width
          }
          joinData.occupancy = Math.floor(tmpValidArea / tmpAllArea * DECIMAL_MAGNIFICATION) / DECIMAL_POINT

          // 人を検知した
          if (item.detectPerson) {
            joinData.detectPerson = true
          }
        } else {
          const newData: drawerOccupancy = { shelfName: item.shelfName, drawerName: item.drawerName, occupancyList: [item.occupancy], occupancy: item.occupancy.occupancy, bgcolor: '', detectPerson: item.detectPerson }
          newList.push(newData)
        }
      }
    }
    newList.sort((elm1, elm2) => {
      if (elm1.drawerName < elm2.drawerName) {
        return -1
      }
      if (elm1.drawerName > elm2.drawerName) {
        return 1
      }
      return 0
    })
    setDrawerOccupancyList(newList)
  }

  const updateDeviceList = (shelfName: string, list: deviceRange[]) => {
    const targetRange = list.filter(elm => elm.drawer.shelfName === shelfName)

    let tmpDeviceList: string[] = []
    if (targetRange) {
      const tmpList: string[] = []
      for (const item of targetRange) {
        tmpList.push(item.deviceName)
      }
      tmpDeviceList = Array.from(new Set(tmpList))
    }
    setDeviceList(tmpDeviceList)
  }

  const changeShelfList = () => {
    const shelfName = (document.getElementById('shelfList') as HTMLSelectElement).value

    updateDeviceList(shelfName, deviceRangeList)
  }

  const showOccupancyPicture = () => {
    if (!canvas) {
      return
    }
    if (oldPath) {
      oldPath.remove()
    }
    canvas.height = drawerOccupancyList.length * RECT_HEIGHT
    canvas.width = RECT_WIDTH
    setCanvasSize({ width: canvas.width, height: canvas.height })

    let tmpPath: React.SetStateAction<paper.Path>
    // draw an outline
    for (let i = 0; i < drawerOccupancyList.length; i++) {
      const startPos = new paper.Point(0, i * RECT_HEIGHT)
      const endPos = new paper.Point(RECT_WIDTH, (i + 1) * RECT_HEIGHT)
      tmpPath = new paper.Path.Rectangle(startPos, endPos)
      tmpPath.strokeColor = new paper.Color(0, 0, 0)
      tmpPath.fillColor = new paper.Color(255, 255, 255, 1.0)
      tmpPath.strokeWidth = 4
    }

    for (let i = 0; i < drawerOccupancyList.length; i++) {
      const startPos = new paper.Point(INNER_RECT_CORRECT, i * RECT_HEIGHT + INNER_RECT_CORRECT)
      const endPos = new paper.Point(RECT_WIDTH + INNER_RECT_CORRECT, ((i + 1) * RECT_HEIGHT) - INNER_RECT_CORRECT)
      tmpPath = new paper.Path.Rectangle(startPos, endPos)
      // color setting by occupancy
      // Specify the color with "Specify each color" / 255
      let colorIndex = 0
      if (drawerOccupancyList[i].occupancy < occupancySettings.threshList[0].threshhold) {
        colorIndex = 0
      } else if (drawerOccupancyList[i].occupancy < occupancySettings.threshList[1].threshhold) {
        colorIndex = 1
      } else if (drawerOccupancyList[i].occupancy < occupancySettings.threshList[2].threshhold) {
        colorIndex = 2
      } else {
        colorIndex = 3
      }
      tmpPath.strokeColor = new paper.Color(occupancySettings.threshList[colorIndex].color_red / 255, occupancySettings.threshList[colorIndex].color_green / 255, occupancySettings.threshList[colorIndex].color_blue / 255)
      tmpPath.fillColor = new paper.Color(occupancySettings.threshList[colorIndex].color_red / 255, occupancySettings.threshList[colorIndex].color_green / 255, occupancySettings.threshList[colorIndex].color_blue / 255, 0.5)
      tmpPath.strokeWidth = 2

      // draw text drawername and occupancy
      const startTextPos = new paper.Point(10, (i * RECT_HEIGHT) + 20)
      const text = new paper.PointText(startTextPos)
      text.justification = 'left'
      text.fillColor = new paper.Color(0, 0, 0)
      if (drawerOccupancyList[i].occupancy < 0) {
        text.content = '棚段名: ' + drawerOccupancyList[i].drawerName + ' 占有率: ' + '-' + ' %'
      } else {
        text.content = '棚段名: ' + drawerOccupancyList[i].drawerName + ' 占有率: ' + drawerOccupancyList[i].occupancy + ' %'
      }
      if (drawerOccupancyList[i].detectPerson) {
        text.content += ' 人を検知しています'
      }
    }

    setOldPath(tmpPath)
  }

  return (
        <div>
            {isloading && <OverlaySpinner />}
            <h1 className='title'>占有率(棚)</h1>
            <div className={styles.shelfTable}>
                <div className={styles.shelfDiv}>
                    <div><a>棚一覧</a></div>
                    <div>
                    <select id='shelfList' className={styles.shelfList} onChange={() => changeShelfList()}>
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
                <div className={styles.occupancyDiv}>
                    <table className={styles.occupancyTable}>
                        <thead>
                            <tr>
                                <td className={styles.occupancyDrawerNameTd}>棚段名</td>
                                <td className={styles.occupancyTd}>占有率</td>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                drawerOccupancyList.map((item) => {
                                  return (
                                        <tr key={item.drawerName}>
                                            <td className={styles.occupancyDrawerNameTd}>{item.drawerName}</td>
                                            <td className={styles.occupancyTd}>{item.occupancy}</td>
                                        </tr>
                                  )
                                })
                            }
                        </tbody>
                    </table>
                </div>
                <div className={styles.pictureDiv}>
                    <canvas className={styles.canvas} id='canvas' style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}>
                    </canvas>
                </div>
            </div>
            <div className={styles.footter}>
              <button className={styles.footerButton} onClick={() => router.push('./topPage')}>戻る</button>
            </div>
        </div>
  )
}

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
import useInterval from '../hooks/useInterval'
import deserialize from '../util/deserialize'
import analyzeInference, { calcDecimalPoint } from '../util/analyzeInference'
import styles from '../styles/allOccupancy.module.css'
import { API_TIME_OUT } from '../common/config'
import { OverlaySpinner } from '../hooks/OverlaySpinner'

export default function AllOccupancy () {
  const [deviceList, setDeviceList] = useState<string[]>([])
  const [deviceRangeList, setDeviceRangeList] = useState<deviceRange[]>([])
  const [drawerOccupancyList, setDrawerOccupancyList] = useState<drawerOccupancy[]>([])
  const [isPolling, setIsPolling] = useState<boolean>(false)
  const [occupancySettings, setOccupancySettings] = useState<OccupancySettings>()
  const [isloading, setIsLoading] = useState(false)

  useEffect(() => {
    const get = async () => {
      try {
        const response = await axios.get('/api/getInferenceSettings', { timeout: API_TIME_OUT })
        if (response.data) {
          setOccupancySettings(response.data)
          setIsPolling(true)
        }
      } catch (error) {
        console.error(error)
      }
    }
    get()
  }, [])

  useEffect(() => {
    getDeviceRange()
  }, [occupancySettings])

  useEffect(() => {
    updateDeviceList()
  }, [deviceRangeList])

  useEffect(() => {
    getDevice()
  }, [deviceList])

  useInterval(() => {
    getDevice()
  }, isPolling ? occupancySettings.pollingInterval : null)

  const getDeviceRange = async () => {
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

  const updateDeviceList = () => {
    let tmpDeviceList: string[] = []
    if (deviceRangeList) {
      const tmpList: string[] = []
      for (const item of deviceRangeList) {
        tmpList.push(item.deviceName)
      }
      tmpDeviceList = Array.from(new Set(tmpList))
    }
    setDeviceList(tmpDeviceList)
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

  const getDevice = () => {
    const promiseList: any[] = []

    for (const elm of deviceList) {
      promiseList.push(getDeviceInference(elm))
    }
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

  // create show data
  const createShowOccupancyData = (list: oneDeviceOccupancy[]) => {
    if (!occupancySettings) {
      return
    }

    const DECIMAL_POINT = calcDecimalPoint(occupancySettings.decimalPoint)
    const DECIMAL_MAGNIFICATION = 100 * calcDecimalPoint(occupancySettings.decimalPoint)
    const newList: drawerOccupancy[] = []

    if (list) {
      for (const item of list) {
        const joinData = (newList) ? newList.find(elm => (elm.shelfName === item.shelfName)) : undefined

        if (joinData) {
          let tmpValidArea = 0
          let tmpAllArea = 0
          joinData.occupancyList.push(item.occupancy)
          if ((joinData.shelfName === item.shelfName) && (joinData.drawerName === item.drawerName)) {
            joinData.occupancyList = joinData.occupancyList.filter((x, i, arr) => arr.findIndex(y => y.deviceName === x.deviceName) === i)
          }

          let invalidOccupancy = false

          for (const occupancy of joinData.occupancyList) {
            if (occupancy.occupancy < 0) {
              joinData.occupancy = -1
              joinData.bgcolor = getColor(joinData.occupancy)
              invalidOccupancy = true
              break
            }
            tmpValidArea += occupancy.height * occupancy.width * (occupancy.occupancy / 100)
            tmpAllArea += occupancy.height * occupancy.width
          }

          if (!invalidOccupancy) {
            joinData.occupancy = Math.floor(tmpValidArea / tmpAllArea * DECIMAL_MAGNIFICATION) / DECIMAL_POINT
            joinData.bgcolor = getColor(joinData.occupancy)
          } else {
            (joinData as any).occupancy = '-'
          }

          if (item.detectPerson) {
            joinData.detectPerson = true
          }
        } else {
          const newData: drawerOccupancy = { shelfName: item.shelfName, drawerName: item.drawerName, occupancyList: [item.occupancy], occupancy: item.occupancy.occupancy, bgcolor: getColor(item.occupancy.occupancy), detectPerson: item.detectPerson }
          newList.push(newData)
        }
      }
    }
    newList.sort((elm1, elm2) => {
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
    setDrawerOccupancyList(newList)
    //        console.log(newList)
  }

  // get color code
  const getColor = (occupancy: number) => {
    let color = '#'
    if (occupancySettings) {
      if (occupancy < occupancySettings.threshList[0].threshhold) {
        color += occupancySettings.threshList[0].color_red.toString(16).padEnd(2, '0')
        color += occupancySettings.threshList[0].color_green.toString(16).padEnd(2, '0')
        color += occupancySettings.threshList[0].color_blue.toString(16).padEnd(2, '0')
      } else if (occupancy < occupancySettings.threshList[1].threshhold) {
        color += occupancySettings.threshList[1].color_red.toString(16).padEnd(2, '0')
        color += occupancySettings.threshList[1].color_green.toString(16).padEnd(2, '0')
        color += occupancySettings.threshList[1].color_blue.toString(16).padEnd(2, '0')
      } else if (occupancy < occupancySettings.threshList[2].threshhold) {
        color += occupancySettings.threshList[2].color_red.toString(16).padEnd(2, '0')
        color += occupancySettings.threshList[2].color_green.toString(16).padEnd(2, '0')
        color += occupancySettings.threshList[2].color_blue.toString(16).padEnd(2, '0')
      } else {
        color += occupancySettings.threshList[3].color_red.toString(16).padEnd(2, '0')
        color += occupancySettings.threshList[3].color_green.toString(16).padEnd(2, '0')
        color += occupancySettings.threshList[3].color_blue.toString(16).padEnd(2, '0')
      }
    } else {
      color = '#000000'
    }
    return color
  }

  return (
        <div>
            {isloading && <OverlaySpinner />}
            <h1 className='title'>占有率(全体)</h1>
            <div className={styles.shelfTable}>
                <div className={styles.occupancyDiv}>
                    <table className={styles.occupancyTable}>
                        <thead>
                            <tr>
                                <td className={styles.occupancyDrawerNameTd}>棚名</td>
                                <td className={styles.occupancyTd}>占有率</td>
                                <td className={styles.occupancyTd}>人検知</td>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                drawerOccupancyList.map((item) => {
                                  return (
                                        <tr id={item.drawerName} key={item.drawerName} style={{ backgroundColor: item.bgcolor }}>
                                            <td className={styles.occupancyShelfNameTd}>{item.shelfName}</td>
                                            <td className={styles.occupancyTd}>{item.occupancy}</td>
                                            <td className={styles.occupancyTd}>{(item.detectPerson ? 'あり' : 'なし')}</td>
                                        </tr>
                                  )
                                })
                            }
                        </tbody>
                    </table>
                </div>
            </div>
            <div className={styles.footter}>
              <button className={styles.footerButton} onClick={() => router.push('./topPage')}>戻る</button>
            </div>
        </div>
  )
}

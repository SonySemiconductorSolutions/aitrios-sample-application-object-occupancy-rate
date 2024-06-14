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
import styles from '../styles/deviceRange.module.css'
import { API_TIME_OUT } from '../common/config'
import { OverlaySpinner } from '../hooks/OverlaySpinner'

const INITIAL_DEVICE_RANGE: rectDeviceRange = { top: 0, left: 0, bottom: 0, right: 0 }

export default function DeviceRange () {
  const [deviceRelationList, setDeviceRelationList] = useState<deviceRelation[]>([])
  const [nowRelation, setNowRelation] = useState<deviceRelation>({ deviceName: '', drawer: [] })
  const [base64Image, setBase64Image] = useState<string>('')
  const [startPoint, setStartPoint] = useState<paper.Point | null>(null)
  const [endPoint, setEndPoint] = useState<paper.Point | null>(null)
  const [oldPath, setOldPath] = useState<paper.Path | null>(null)
  const [deviceRangeList, setDeviceRangeList] = useState<deviceRange[]>([])
  const [nowDrawer, setNowDrawer] = useState<oneDrawer>({ shelfName: '', drawerName: '' })
  const [tmpDeviceRange, setTmpDeviceRange] = useState<rectDeviceRange>(INITIAL_DEVICE_RANGE)
  const [isloading, setIsLoading] = useState(false);
  //    const [startRect, setStartRect] = useState<boolean>(false)  // onMouseUpでtrueの判断がされないため一時的に変更
  let startRect: boolean = false

  useEffect(() => {
    const get = async () => {
      try {
        // 選択エリアに初期値を入力
        const text = document.getElementById('DeviceRangeText') as HTMLTextAreaElement
        text.value = JSON.stringify(tmpDeviceRange)

        const response = await axios.get('/api/getInferenceSettings', { timeout: API_TIME_OUT })
        if (response.data) {  
          // paperのセットアップ前にcanvasのサイズを指定しておく
          // これがないと、paperで表示している範囲指定が上手く表示されない
          const canvas = document.getElementById('canvas') as HTMLCanvasElement
          const settings: OccupancySettings = response.data
          canvas.width = settings.imageWidth
          canvas.height = settings.imageHeight
          paper.setup(canvas)
          const raster = new paper.Raster('image')
          raster.position = paper.view.center

          paper.view.onMouseDown = (ev: any) => {
            setEndPoint(null)
            setStartPoint(ev.point)
            //setStartRect(true)
            startRect = true
          }

          paper.view.onMouseMove = (ev: any) => {
            if (startRect) {
              setEndPoint(ev.point);
              //drawRect();
            }
          };

          paper.view.onMouseUp = (ev: any) => {
            if (startRect) {
              setEndPoint(ev.point)
              startRect = false
            }
          }
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
          const obj: deviceRelation[] = response.data
          //初期状態ではリスト一番上のデバイスを表示
          const deviceName = obj[0].deviceName
          const tmpDrawer = obj[0].drawer[0]
          getLatestImage(deviceName)
          setDeviceRelationList(obj)
          setNowRelation(obj[0])
          setNowDrawer(obj[0].drawer[0])
          getDeviceRange(deviceName, tmpDrawer)
        }
      } catch (error) {
        console.error(error)
      }
    }
    get()
  }, [])


  useEffect(() => {
    drawImage(base64Image)
  }, [base64Image])

  useEffect(() => {
    drawRect()
  }, [startPoint, endPoint])

  useEffect(()=>{
    updateSelectArea()
  },[tmpDeviceRange])

  const getLatestImage = (deviceId: string) => {
    const get = async () => {
      try {
        setIsLoading(true)
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

  const getDeviceRange = (deviceId: string, drawer: oneDrawer | null) => {
    const get = async () => {
      try {
        const response = await axios.get('api/getDeviceRange', { timeout: API_TIME_OUT })
        if (response.data) {
          const obj: deviceRange[] = response.data
          setDeviceRangeList(obj)
          reloadDeviceRange(obj, drawer || nowRelation.drawer[0], deviceId)
          initializeSelectArea(deviceId)
        }
      } catch (error) {
        console.error(error)
      }
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
        
        // 背景画像を再設定すると四角形が削除されるため、背景画像設定後四角形を再描画する
          drawRect();
      }
    }
    if (image.length === 0) {
      const tmpcanvas = document.getElementById('canvas') as HTMLCanvasElement
      tmpcanvas.width = img.width
      tmpcanvas.height = img.height
    }
  }

  const drawRect = () => {
    if (startPoint && endPoint) {
      if (oldPath) {
        oldPath.remove()
      }

      const tmpPath = new paper.Path.Rectangle(startPoint, endPoint)
      tmpPath.strokeColor = new paper.Color(1, 0, 0)
      tmpPath.fillColor = new paper.Color(1, 0, 0, 0.5)
      tmpPath.strokeWidth = 2

      //const text = document.getElementById('DeviceRangeText') as HTMLTextAreaElement

      let top: number, left: number, bottom: number, right: number

      if (startPoint.y < endPoint.y) {
        top = startPoint.y
        bottom = endPoint.y
      } else {
        top = endPoint.y
        bottom = startPoint.y
      }
      if (startPoint.x < endPoint.x) {
        left = startPoint.x
        right = endPoint.x
      } else {
        left = endPoint.x
        right = startPoint.x
      }

      //text.value = JSON.stringify({ top, left, bottom, right })
      setTmpDeviceRange({ top, left, bottom, right })
      setOldPath(tmpPath)
    }
  }

  const updateSelectArea =() =>{
    let updateAreaText=tmpDeviceRange
    const text = document.getElementById('DeviceRangeText') as HTMLTextAreaElement
    text.value = JSON.stringify(updateAreaText)

  }

  const initializeSelectArea =(device_id) =>{
    let updateAreaText
    const selectArea=deviceRangeList.find((elm) => elm.deviceName === device_id)
    if(selectArea){
      updateAreaText=selectArea.rect
    }else{
      updateAreaText=INITIAL_DEVICE_RANGE
    }
    const text = document.getElementById('DeviceRangeText') as HTMLTextAreaElement
    text.value = JSON.stringify(updateAreaText)

  }

  const changeDeviceList = (device_id) => {
    const selectRelation = deviceRelationList.find((elm) => elm.deviceName === device_id)
    setNowRelation(selectRelation)
    setNowDrawer(selectRelation.drawer[0])
    reloadDeviceRange(deviceRangeList, selectRelation.drawer[0], device_id)
    getLatestImage(device_id)
    initializeSelectArea(device_id)
  }

  const changeDrawerList = () => {
    const drawerIndex = (document.getElementById('relationList') as HTMLSelectElement).selectedIndex

    setNowDrawer(nowRelation.drawer[drawerIndex])
    reloadDeviceRange(deviceRangeList, nowRelation.drawer[drawerIndex], nowRelation.deviceName)
  }

  const reloadDeviceRange = (range: deviceRange[], drawer: oneDrawer, deviceName: string) => {
    const tmpRange = range.find(elm => (elm.deviceName === deviceName) && (elm.drawer.shelfName === drawer.shelfName) && (elm.drawer.drawerName === drawer.drawerName))
    if (tmpRange && tmpRange.rect) {
      setTmpDeviceRange(tmpRange.rect)
      if (oldPath) {
        oldPath.remove()
      }
      setStartPoint(new paper.Point(tmpRange.rect.left, tmpRange.rect.top))
      setEndPoint(new paper.Point(tmpRange.rect.right, tmpRange.rect.bottom))
    } else {
      resetDeviceRange()
    }
  }

  const resetDeviceRange = () => {
    setTmpDeviceRange(INITIAL_DEVICE_RANGE)
    const text = document.getElementById('DeviceRangeText') as HTMLTextAreaElement // tmpDeviceRangeが変化したら再描画してほしいがされない・・・
    text.value = JSON.stringify(INITIAL_DEVICE_RANGE)
    if (oldPath) {
      oldPath.remove()
    }
    setStartPoint(null)
    setEndPoint(null)
  }

  const addDeviceRange = () => {
    const newRange = [...deviceRangeList]

    let oneRange = newRange.find(elm => (elm.deviceName === nowRelation.deviceName) && (elm.drawer.shelfName === nowDrawer.shelfName) && (elm.drawer.drawerName === nowDrawer.drawerName))

    if (oneRange) {
      oneRange.rect = tmpDeviceRange
    } else {
      oneRange = { deviceName: nowRelation.deviceName, drawer: nowDrawer, rect: tmpDeviceRange }
      newRange.push(oneRange)
      newRange.sort((elm1, elm2) => {
        if (elm1.deviceName < elm2.deviceName) {
          return -1
        }
        if (elm1.deviceName > elm2.deviceName) {
          return 1
        }
        if (elm1.drawer.shelfName < elm2.drawer.shelfName) {
          return -1
        }
        if (elm1.drawer.shelfName > elm2.drawer.shelfName) {
          return 1
        }
        if (elm1.drawer.drawerName < elm2.drawer.drawerName) {
          return -1
        }
        if (elm1.drawer.drawerName > elm2.drawer.drawerName) {
          return 1
        }
        return 0
      })
    }
    setDeviceRangeList(newRange)
  }

  const deleteDeviceRange = () => {
    const newRange = [...deviceRangeList]

    const index = newRange.findIndex(elm => (elm.deviceName === nowRelation.deviceName) && (elm.drawer.shelfName === nowDrawer.shelfName) && (elm.drawer.drawerName === nowDrawer.drawerName))

    if (index >= 0) {
      newRange.splice(index, 1)
    }
    setDeviceRangeList(newRange)
    resetDeviceRange()
  }

  const saveDeviceRange = () => {
    const put = async () => {
      try {
        await axios.put('/api/putDeviceRange', deviceRangeList, { timeout: API_TIME_OUT })
      } catch (error) {
        console.log(error)
      }
    }
    put()
  }

  return (
        <div>
          {isloading && <OverlaySpinner />}
            <h1 className='title'>カメラ範囲登録</h1>
            <div className={styles.shelfTable}>
                <div className={styles.deviceDiv}>
                    <div><a>デバイス</a></div>
                    <div>
                    <select id='deviceList' className={styles.deviceList} onChange={(event) => {changeDeviceList(event.target.value);}}>
                        {
                        deviceRelationList.map((item) => {
                          return (
                            <option value={item.deviceName} key={item.deviceName}>{item.deviceName}</option>
                          )
                        })
                        }
                    </select>
                    </div>
                </div>
                <div className={styles.relationDiv}>
                    <div><a>棚段一覧</a></div>
                    <div>
                        <select id='relationList' className={styles.relationList} onChange={() => changeDrawerList()}>
                        {
                            nowRelation.drawer.map((item) => {
                              return (
                                <option value={item.shelfName + ',' + item.drawerName} key={item.shelfName + ',' + item.drawerName}>{item.shelfName.padEnd(15, '　') + '|' + item.drawerName}</option>
                              )
                            })
                        }
                        </select>
                    </div>
                    <div>
                        <p>選択エリア</p>
                        <textarea id='DeviceRangeText' className={styles.DeviceRangeText} readOnly></textarea>
                    </div>
                </div>
                <div className={styles.pictureDiv}>
                    <img className={styles.img} id='image'></img>
                    <canvas className={styles.canvas} id='canvas'>
                    </canvas>
                </div>
                <div className={styles.buttonDiv}>
                    <button className={styles.button} onClick={() => getLatestImage(nowRelation.deviceName)}>最新の画像を取得</button>
                    <button className={styles.button} onClick={() => addDeviceRange()}>座標を登録</button>
                    <button className={styles.button} onClick={() => deleteDeviceRange()}>座標を削除</button>
                    <button className={styles.button} onClick={() => saveDeviceRange()}>保存</button>
                </div>
            </div>
            <div className={styles.footter}>
              <button className={styles.footerButton} onClick={() => router.push('./topPage')}>戻る</button>
            </div>
        </div>
  )
}

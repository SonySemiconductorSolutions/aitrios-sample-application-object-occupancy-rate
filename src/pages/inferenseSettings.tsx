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
import styles from '../styles/inferenceSettings.module.css'
import ToggleSwitchButton from '../hooks/ToggleSwitchButton'
import { API_TIME_OUT } from '../common/config'

export default function InferenceSettings () {
  // true:local mode  false: aitrios mode
  const [isLocalMode, setisLocalMode] = useState(true)
  const [occupancySettings, setOccupancySettings] = useState<OccupancySettings>({
    isLocalMode: true,
    pollingInterval: 60000,
    imageHeight: 300,
    imageWidth: 300,
    resolution: 1,
    decimalPoint: 1,
    threshList: [
      { threshhold: 50, color_red: 128, color_green: 174, color_blue: 219 },
      { threshhold: 90, color_red: 116, color_green: 207, color_blue: 116 },
      { threshhold: 100, color_red: 218, color_green: 185, color_blue: 104 },
      { threshhold: 999, color_red: 238, color_green: 124, color_blue: 124 }
    ]
  }
  )
  const ChangeToggleButton = () => {
    setisLocalMode(!isLocalMode)
  }

  useEffect(() => {
    const get = async () => {
      try {
        const response = await axios.get('/api/getInferenceSettings', { timeout: API_TIME_OUT })
        if (response.data) {
          setOccupancySettings(response.data)
          if (!response.data.isLocalMode) {
            ChangeToggleButton()
          }
        }
      } catch (error) {
        console.error(error)
      }
    }
    get()
  }, [])

  useEffect(() => {
    const tmpSettings = { ...occupancySettings }
    tmpSettings.isLocalMode = isLocalMode
    setOccupancySettings(tmpSettings)
  }, [isLocalMode])

  const saveSettings = () => {
    const put = async () => {
      try {
        await axios.put('/api/putInferenceSettings', occupancySettings, { timeout: API_TIME_OUT })
      } catch (error) {
        console.log(error)
      }
    }
    put()
  }

  const getColorPickerValue = (item: ThreshSetting) => {
    let colorValue = '#'
    colorValue += item.color_red.toString(16).padEnd(2, '0')
    colorValue += item.color_green.toString(16).padEnd(2, '0')
    colorValue += item.color_blue.toString(16).padEnd(2, '0')

    return colorValue
  }

  const getColor = (color: string) => {
    const red = color.substring(1, 3)
    const green = color.substring(3, 5)
    const blue = color.substring(5, 7)

    return { red: parseInt(red, 16), green: parseInt(green, 16), blue: parseInt(blue, 16) }
  }

  const changeSetting = (e) => {
    const tmpSettings = { ...occupancySettings }
    tmpSettings.pollingInterval = Number((document.getElementById('pollingInterval') as HTMLInputElement).value)
    tmpSettings.imageHeight = Number((document.getElementById('imageHeight') as HTMLInputElement).value)
    tmpSettings.imageWidth = Number((document.getElementById('imageWidth') as HTMLInputElement).value)
    tmpSettings.resolution = Number((document.getElementById('resolution') as HTMLInputElement).value)
    tmpSettings.decimalPoint = Number((document.getElementById('decimalPoint') as HTMLInputElement).value)
    setOccupancySettings(tmpSettings)
  }

  const changeThreshSetting = (index: number) => {
    const tmpSettings = { ...occupancySettings }
    tmpSettings.threshList[index].threshhold = Number((document.getElementById('threshhold' + index) as HTMLInputElement).value)
    setOccupancySettings(tmpSettings)
  }

  const changePickerSetting = (index: number) => {
    const tmpSettings = { ...occupancySettings }
    const colorString = (document.getElementById('color' + index) as HTMLInputElement).value

    const color = getColor(colorString)
    tmpSettings.threshList[index].color_red = color.red
    tmpSettings.threshList[index].color_green = color.green
    tmpSettings.threshList[index].color_blue = color.blue

    setOccupancySettings(tmpSettings)
  }

  const changeColorSetting = (index: number) => {
    const tmpSettings = { ...occupancySettings }
    tmpSettings.threshList[index].color_red = Number((document.getElementById('color_red' + index) as HTMLInputElement).value)
    tmpSettings.threshList[index].color_green = Number((document.getElementById('color_green' + index) as HTMLInputElement).value)
    tmpSettings.threshList[index].color_blue = Number((document.getElementById('color_blue' + index) as HTMLInputElement).value)
    setOccupancySettings(tmpSettings)
  }

  return (
    <div>
      <h1 className='title'>各種設定</h1>
      <div className={styles.inferenceSettingDiv}>
        <div className={styles.pollingDiv}>
            <a className={styles.subTitle}>ポーリング間隔</a>
            <input className={styles.subValue} id='pollingInterval' type={'number'} value={occupancySettings.pollingInterval} onChange={() => changeSetting(this)}></input>
            <a className={styles.subTitleUnit}>ms</a>
        </div>
        <div className={styles.imageSizeDiv}>
          <a className={styles.subTitle}>画像サイズ：縦</a>
          <input className={styles.subValue} id='imageHeight' type={'number'} value={occupancySettings.imageHeight} onChange={() => changeSetting(this)}></input>
          <a className={styles.subTitleUnit}>px</a>
        </div>
        <div className={styles.imageSizeDiv}>
          <a className={styles.subTitle}>画像サイズ：横</a>
          <input className={styles.subValue} id='imageWidth' type={'number'} value={occupancySettings.imageWidth} onChange={() => changeSetting(this)}></input>
          <a className={styles.subTitleUnit}>px</a>
        </div>
        <div className={styles.imageResolutionDiv}>
          <a className={styles.subTitle}>占有率解像度</a>
          <input className={styles.subValue} id='resolution' type={'number'} value={occupancySettings.resolution} onChange={() => changeSetting(this)}></input>
          <a className={styles.subTitleUnit}>px</a>
        </div>
        <div className={styles.decimalPointDiv}>
          <a className={styles.subTitle}>占有率小数点以下桁数</a>
          <input className={styles.subValue} id='decimalPoint' type={'number'} value={occupancySettings.decimalPoint} onChange={() => changeSetting(this)}></input>
          <a className={styles.subTitleUnit}>桁</a>
        </div>
        {
          occupancySettings.threshList.map((item, index) => {
            return (
              <div key={'inferenceRangeDiv' + index} className={styles.inferenceRangeDiv}>
                <div className={styles.occupancyRateDiv}>
                  <a className={styles.subTitleShortLeft}>占有率</a>
                  <input key={'threshhold' + index} id={'threshhold' + index} className={styles.subValueShort} type={'number'} value={item.threshhold} onChange={() => changeThreshSetting(index)}></input>
                  <a >%未満</a>
                </div>
                <div className={styles.occupancyColorDiv}>
                  <a className={styles.subTitleShort}>色</a>
                  <input key={'color' + index} id={'color' + index} className={styles.subValueShort} type={'color'} value={getColorPickerValue(item)} onChange={() => changePickerSetting(index)}></input>
                  <a className={styles.subTitleShort}>色(赤)</a>
                  <input key={'color_red' + index} id={'color_red' + index} className={styles.subValueShort} type={'number'} value={item.color_red} onChange={() => changeColorSetting(index)}></input>
                  <a className={styles.subTitleShort}>色(緑)</a>
                  <input key={'color_green' + index} id={'color_green' + index} className={styles.subValueShort} type={'number'} value={item.color_green} onChange={() => changeColorSetting(index)}></input>
                  <a className={styles.subTitleShort}>色(青)</a>
                  <input key={'color_blue' + index} id={'color_blue' + index} className={styles.subValueShortRight} type={'number'} value={item.color_blue} onChange={() => changeColorSetting(index)}></input>
                </div>
              </div>
            )
          })
        }
        <br/>
        <div className="toggle">
          <ToggleSwitchButton
            option1Text="Local Simulate Mode 　"
            option2Text="AITRIOS Connect Mode"
            isLocalMode={isLocalMode}
            onChange={ChangeToggleButton}
          />
        </div>
        <div className={styles.buttonDiv}>
          <button className={styles.saveButton} onClick={e => saveSettings()}>保存</button>
          <button className={styles.backButton} onClick={() => router.push('./topPage')}>戻る</button>
        </div>
      </div>
    </div>
  )
}

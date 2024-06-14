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
import styles from '../styles/shelfMng.module.css'
import { API_TIME_OUT } from '../common/config'

export default function ShelfMng () {
  const [shelfList, setShelfList] = useState<string[]>([])

  useEffect(() => {
    const get = async () => {
      try {
        const response = await axios.get('/api/getShelfList', { timeout: API_TIME_OUT })
        if (response.data) {
          setShelfList(response.data)
        }
      } catch (error) {
        console.error(error)
      }
    }
    get()
  }, [])

  const addShelf = () => {
    const shelfName = (document.getElementById('shelfText') as HTMLInputElement).value
    const newList: Array<string> = [...shelfList, shelfName]

    if (shelfName === '') {
      return
    }
    setShelfList(newList)
  }

  const deleteShelf = () => {
    const selectedIndex = (document.getElementById('shelfList') as HTMLSelectElement).selectedIndex

    if (selectedIndex === -1) {
      return
    }

    const newList: Array<string> = [...shelfList]
    newList.splice(selectedIndex, 1)
    setShelfList(newList)
  }

  const saveShelf = () => {
    const put = async () => {
      try {
        await axios.put('/api/putShelfList', shelfList, { timeout: API_TIME_OUT })
      } catch (error) {
        console.log(error)
      }
    }
    put()
  }

  return (
    <div>
      <h1 className='title'>棚登録</h1>
      <div className={styles.shelfTable}>
        <div className={styles.shelfDivLeft}>
          <div><a>棚名</a></div>
          <div><input type='text' id='shelfText' name='shelfText'></input></div>
        </div>
        <div className={styles.shelfDivRight}>
          <div><a>棚一覧</a></div>
          <div>
            <select id='shelfList' className={styles.shelfList} size={10}>
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
      </div>
      <div className={styles.footter}>
        <div><button className={styles.footerButton} onClick={e => addShelf()}>登録</button></div>
        <div><button className={styles.footerButton} onClick={e => deleteShelf()}>削除</button></div>
        <div><button className={styles.footerButton} onClick={e => saveShelf()}>保存</button></div>
        <div><button className={styles.footerButton} onClick={() => router.push('./topPage')}>戻る</button></div>
      </div>
    </div>
  )
}
